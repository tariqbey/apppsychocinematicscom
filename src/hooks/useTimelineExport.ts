import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { TimelineClip, TimelineTrack } from "@/hooks/useTimelineEditor";

export interface ExportProgress {
  stage: "preparing" | "rendering" | "encoding" | "uploading" | "complete" | "error";
  progress: number;
  message: string;
}

export interface ExportResult {
  url: string;
  blob: Blob;
  mimeType: string;
  fileExt: "mp4" | "webm";
}

interface AudioClipState {
  element: HTMLAudioElement;
  sourceNode: MediaElementAudioSourceNode;
  gainNode: GainNode;
  clip: TimelineClip;
  track: TimelineTrack;
}

let ffmpegSingleton: any | null = null;
let ffmpegLoadPromise: Promise<any> | null = null;

async function getFFmpeg() {
  if (ffmpegSingleton) return ffmpegSingleton;
  if (ffmpegLoadPromise) return ffmpegLoadPromise;

  ffmpegLoadPromise = (async () => {
    const [{ FFmpeg }, { toBlobURL, fetchFile }] = await Promise.all([
      import("@ffmpeg/ffmpeg"),
      import("@ffmpeg/util"),
    ]);

    const ffmpeg = new FFmpeg();

    // Keep versions in the 0.12 line to match @ffmpeg/ffmpeg 0.12.x
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    // Attach helper for fetchFile so we can reuse it.
    (ffmpeg as any).__fetchFile = fetchFile;

    ffmpegSingleton = ffmpeg;
    return ffmpeg;
  })();

  return ffmpegLoadPromise;
}

function inferVideoExtFromMime(mime: string): "mp4" | "webm" {
  if (mime.toLowerCase().includes("mp4")) return "mp4";
  return "webm";
}

async function transcodeToMp4Cfr(
  inputBlob: Blob,
  fps: number,
  resolution: "720p" | "1080p" | "4K",
  onProgress?: (p: number) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  const fetchFile = (ffmpeg as any).__fetchFile as (data: Blob) => Promise<Uint8Array>;

  const inputName = `input-${Date.now()}.bin`;
  const outputName = `output-${Date.now()}.mp4`;

  const crf = resolution === "4K" ? "30" : resolution === "1080p" ? "28" : "27";

  // Track progress if supported by ffmpeg instance.
  try {
    ffmpeg.off?.("progress");
  } catch {
    // ignore
  }

  try {
    ffmpeg.on?.("progress", ({ progress }: { progress: number }) => {
      if (typeof onProgress === "function") onProgress(Math.max(0, Math.min(1, progress || 0)));
    });
  } catch {
    // ignore
  }

  await ffmpeg.writeFile(inputName, await fetchFile(inputBlob));

  const commandVariants: string[][] = [
    // Best: H.264 + AAC, constant frame rate, faststart
    [
      "-hide_banner",
      "-y",
      "-i",
      inputName,
      "-r",
      String(fps),
      "-vsync",
      "cfr",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "veryfast",
      "-crf",
      crf,
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      outputName,
    ],
    // Fallback: OpenH264
    [
      "-hide_banner",
      "-y",
      "-i",
      inputName,
      "-r",
      String(fps),
      "-vsync",
      "cfr",
      "-c:v",
      "libopenh264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "veryfast",
      "-crf",
      crf,
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      outputName,
    ],
    // Fallback: MPEG-4 Part 2 (widely supported, less efficient)
    [
      "-hide_banner",
      "-y",
      "-i",
      inputName,
      "-r",
      String(fps),
      "-vsync",
      "cfr",
      "-c:v",
      "mpeg4",
      "-q:v",
      "6",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      outputName,
    ],
  ];

  let lastErr: unknown = null;
  for (const args of commandVariants) {
    try {
      await ffmpeg.exec(args);
      const out = await ffmpeg.readFile(outputName);
      // Cleanup files
      await Promise.allSettled([
        ffmpeg.deleteFile(inputName),
        ffmpeg.deleteFile(outputName),
      ]);

      const mp4Blob = new Blob([out], { type: "video/mp4" });
      return mp4Blob;
    } catch (err) {
      lastErr = err;
    }
  }

  // Cleanup input file if it exists
  await Promise.allSettled([ffmpeg.deleteFile(inputName)]);

  throw lastErr instanceof Error ? lastErr : new Error("MP4 transcode failed");
}

export function useTimelineExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const { toast } = useToast();
  const abortRef = useRef(false);

  const exportTimeline = useCallback(
    async (
      clips: TimelineClip[],
      duration: number,
      backgroundAudio: { url: string | null; volume: number; muted: boolean },
      options: {
        resolution?: "720p" | "1080p" | "4K";
        fps?: number;
        tracks?: TimelineTrack[];
        masterVolume?: number;
        format?: "mp4" | "webm";
      } = {}
    ): Promise<ExportResult | null> => {
      if (clips.length === 0) {
        toast({
          title: "Nothing to export",
          description: "Add some clips to the timeline first.",
          variant: "destructive",
        });
        return null;
      }

      setIsExporting(true);
      setProgress({ stage: "preparing", progress: 0, message: "Preparing export…" });
      abortRef.current = false;

      const {
        resolution = "1080p",
        fps = 30,
        tracks = [],
        masterVolume = 1,
        format = "mp4",
      } = options;

      const width = resolution === "4K" ? 3840 : resolution === "1080p" ? 1920 : 1280;
      const height = resolution === "4K" ? 2160 : resolution === "1080p" ? 1080 : 720;

      // Precompute clip lists for performance
      const visualClips = clips.filter((c) => c.type === "video" || c.type === "image");
      const audioClips = clips.filter((c) => c.type === "audio");
      const videoClips = clips.filter((c) => c.type === "video");

      // Track index (used to pick the top-most visual clip when overlapping)
      const trackIndex = new Map<string, number>();
      tracks.forEach((t, idx) => trackIndex.set(t.id, idx));

      const pickActiveVisualClip = (t: number): TimelineClip | null => {
        const active = visualClips.filter(
          (clip) => t >= clip.startTime && t < clip.startTime + clip.duration
        );
        if (active.length === 0) return null;

        // Prefer the clip on the “highest” track index (draw on top)
        active.sort((a, b) => (trackIndex.get(b.trackId || "") ?? 0) - (trackIndex.get(a.trackId || "") ?? 0));
        return active[0] ?? null;
      };

      try {
        // Create canvas for rendering
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Failed to create canvas context");

        // Create audio context for mixing (NOT connected to speakers - silent export)
        const audioContext = new AudioContext();
        if (audioContext.state === "suspended") {
          await audioContext.resume().catch(() => {});
        }

        const audioDestination = audioContext.createMediaStreamDestination();
        const masterGain = audioContext.createGain();
        masterGain.gain.value = masterVolume;
        masterGain.connect(audioDestination);

        // Check if any track is soloed
        const hasSoloedTrack = tracks.some((t) => t.solo);

        // Load all video/image sources
        setProgress({ stage: "preparing", progress: 10, message: "Loading media…" });
        const mediaElements = await loadMediaElements(clips);

        // Load audio clips (audio track clips)
        const audioClipStates: AudioClipState[] = [];
        for (const clip of audioClips) {
          const track = tracks.find((t) => t.id === clip.trackId);
          if (!track) continue;
          if (track.muted || (hasSoloedTrack && !track.solo)) continue;

          try {
            const audio = document.createElement("audio");
            audio.src = clip.sourceUrl;
            audio.crossOrigin = "anonymous";
            audio.preload = "auto";

            await new Promise<void>((resolve, reject) => {
              audio.oncanplaythrough = () => resolve();
              audio.onerror = () => reject(new Error(`Failed to load audio: ${clip.name}`));
              audio.load();
              setTimeout(resolve, 5000);
            });

            const sourceNode = audioContext.createMediaElementSource(audio);
            const gainNode = audioContext.createGain();
            gainNode.gain.value = clip.muted ? 0 : clip.volume * track.volume;
            sourceNode.connect(gainNode);
            gainNode.connect(masterGain);

            audioClipStates.push({ element: audio, sourceNode, gainNode, clip, track });
          } catch (err) {
            console.warn(`Failed to load audio clip ${clip.name}:`, err);
          }
        }

        // Load video audio sources (separate audio element)
        const videoAudioStates: AudioClipState[] = [];
        for (const clip of videoClips) {
          const track = tracks.find((t) => t.id === clip.trackId);
          if (!track || clip.muted || track.muted) continue;
          if (hasSoloedTrack && !track.solo) continue;

          const mediaEl = mediaElements.get(clip.id);
          if (!(mediaEl instanceof HTMLVideoElement)) continue;

          try {
            const audio = document.createElement("audio");
            audio.src = clip.sourceUrl;
            audio.crossOrigin = "anonymous";
            audio.preload = "auto";

            await new Promise<void>((resolve) => {
              audio.oncanplaythrough = () => resolve();
              audio.onerror = () => resolve();
              audio.load();
              setTimeout(resolve, 3000);
            });

            const sourceNode = audioContext.createMediaElementSource(audio);
            const gainNode = audioContext.createGain();
            gainNode.gain.value = clip.volume * (track.volume || 1);
            sourceNode.connect(gainNode);
            gainNode.connect(masterGain);

            videoAudioStates.push({ element: audio, sourceNode, gainNode, clip, track });
          } catch (err) {
            console.warn(`Failed to load video audio for ${clip.name}:`, err);
          }
        }

        // Background audio
        let bgAudioElement: HTMLAudioElement | null = null;
        if (backgroundAudio.url && !backgroundAudio.muted) {
          bgAudioElement = document.createElement("audio");
          bgAudioElement.src = backgroundAudio.url;
          bgAudioElement.crossOrigin = "anonymous";
          bgAudioElement.loop = true;

          await new Promise<void>((resolve) => {
            bgAudioElement!.oncanplaythrough = () => resolve();
            bgAudioElement!.load();
            setTimeout(resolve, 5000);
          });

          const bgSource = audioContext.createMediaElementSource(bgAudioElement);
          const bgGain = audioContext.createGain();
          bgGain.gain.value = backgroundAudio.volume;
          bgSource.connect(bgGain);
          bgGain.connect(masterGain);
        }

        // Canvas stream
        const canvasStream = canvas.captureStream(fps);

        // Combine video and audio streams
        const combinedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioDestination.stream.getAudioTracks(),
        ]);

        // Recorder mime type selection
        const recorderMimeCandidates = [
          "video/webm;codecs=vp8,opus",
          "video/webm;codecs=vp9,opus",
          "video/webm",
          "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
          "video/mp4",
        ];

        const recorderMimeType = recorderMimeCandidates.find((t) => MediaRecorder.isTypeSupported(t));

        // Bitrate settings per resolution (only affects the initial recording; MP4 transcode uses CRF)
        const bitrates: Record<string, number> = {
          "720p": 5000000,
          "1080p": 8000000,
          "4K": 25000000,
        };

        const recorder = new MediaRecorder(combinedStream, {
          ...(recorderMimeType ? { mimeType: recorderMimeType } : {}),
          videoBitsPerSecond: bitrates[resolution] || 8000000,
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        setProgress({ stage: "rendering", progress: 15, message: "Rendering silently…" });

        return await new Promise<ExportResult>((resolve, reject) => {
          recorder.onerror = () => {
            setProgress({ stage: "error", progress: 0, message: "Recording failed" });
            setIsExporting(false);
            reject(new Error("MediaRecorder error"));
          };

          recorder.onstop = async () => {
            try {
              setProgress({ stage: "encoding", progress: 80, message: "Finalizing…" });

              const recordedMime = recorderMimeType || "video/webm";
              const recordedBlob = new Blob(chunks, { type: recordedMime });

              let finalBlob: Blob = recordedBlob;
              let finalMime = recordedMime;

              if (format === "mp4") {
                try {
                  setProgress({ stage: "encoding", progress: 82, message: "Transcoding to MP4…" });
                  finalBlob = await transcodeToMp4Cfr(recordedBlob, fps, resolution, (p) => {
                    setProgress({ stage: "encoding", progress: 82 + p * 13, message: "Transcoding to MP4…" });
                  });
                  finalMime = "video/mp4";
                } catch (err) {
                  console.warn("MP4 transcode failed; falling back to original export", err);
                  toast({
                    title: "MP4 transcode unavailable",
                    description: "Falling back to the original export format for this browser.",
                    variant: "destructive",
                  });
                }
              }

              const finalExt = inferVideoExtFromMime(finalMime);
              const url = URL.createObjectURL(finalBlob);

              // Cleanup media elements
              try {
                audioContext.close();
              } catch {
                // ignore
              }

              mediaElements.forEach((el) => {
                if (el instanceof HTMLVideoElement) {
                  el.pause();
                  el.src = "";
                }
              });
              audioClipStates.forEach((s) => {
                s.element.pause();
                s.element.src = "";
              });
              videoAudioStates.forEach((s) => {
                s.element.pause();
                s.element.src = "";
              });
              if (bgAudioElement) {
                bgAudioElement.pause();
                bgAudioElement.src = "";
              }

              setProgress({ stage: "complete", progress: 100, message: "Export complete!" });
              setIsExporting(false);

              resolve({
                url,
                blob: finalBlob,
                mimeType: finalMime,
                fileExt: finalExt,
              });
            } catch (error) {
              setProgress({ stage: "error", progress: 0, message: "Export failed" });
              setIsExporting(false);
              reject(error);
            }
          };

          // Start recording (no timeslice -> less overhead)
          recorder.start();

          if (bgAudioElement) {
            bgAudioElement.currentTime = 0;
            bgAudioElement.play().catch(() => {});
          }

          // Deterministic frame pacing based on frame index
          const frameIntervalMs = 1000 / fps;
          const totalFrames = Math.ceil(duration * fps);
          const startMs = performance.now();

          let frameIndex = 0;
          let activeVisualClipId: string | null = null;
          let activeVideoEl: HTMLVideoElement | null = null;

          const stopAllMedia = () => {
            mediaElements.forEach((el) => {
              if (el instanceof HTMLVideoElement) el.pause();
            });
            audioClipStates.forEach((s) => s.element.pause());
            videoAudioStates.forEach((s) => s.element.pause());
            if (bgAudioElement) bgAudioElement.pause();
          };

          const syncAudioStates = (t: number) => {
            for (const audioState of audioClipStates) {
              const { element, clip, gainNode, track } = audioState;
              const isActive = t >= clip.startTime && t < clip.startTime + clip.duration;

              gainNode.gain.value = clip.muted ? 0 : clip.volume * track.volume;

              if (isActive) {
                const expectedTime = t - clip.startTime + clip.trimStart;
                if (element.paused) {
                  element.currentTime = expectedTime;
                  element.play().catch(() => {});
                } else {
                  const drift = Math.abs(element.currentTime - expectedTime);
                  if (drift > 0.2) element.currentTime = expectedTime;
                }
              } else if (!element.paused) {
                element.pause();
              }
            }

            for (const audioState of videoAudioStates) {
              const { element, clip, gainNode, track } = audioState;
              const isActive = t >= clip.startTime && t < clip.startTime + clip.duration;

              gainNode.gain.value = clip.muted ? 0 : clip.volume * track.volume;

              if (isActive) {
                const expectedTime = t - clip.startTime + clip.trimStart;
                if (element.paused) {
                  element.currentTime = expectedTime;
                  element.play().catch(() => {});
                } else {
                  const drift = Math.abs(element.currentTime - expectedTime);
                  if (drift > 0.2) element.currentTime = expectedTime;
                }
              } else if (!element.paused) {
                element.pause();
              }
            }
          };

          const tick = () => {
            if (abortRef.current || frameIndex >= totalFrames) {
              stopAllMedia();
              setTimeout(() => recorder.stop(), 100);
              return;
            }

            const t = frameIndex / fps;

            // Clear canvas
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, width, height);

            // Pick active visual clip
            const activeClip = pickActiveVisualClip(t);

            if (activeClip?.id !== activeVisualClipId) {
              // Clip changed
              if (activeVideoEl) {
                activeVideoEl.pause();
                activeVideoEl = null;
              }

              activeVisualClipId = activeClip?.id ?? null;

              if (activeClip) {
                const element = mediaElements.get(activeClip.id);
                if (element instanceof HTMLVideoElement) {
                  const clipTime = t - activeClip.startTime + activeClip.trimStart;
                  element.muted = true;
                  element.currentTime = Math.max(0, clipTime);
                  element.play().catch(() => {});
                  activeVideoEl = element;
                }
              }
            } else if (activeClip && activeVideoEl) {
              // Gentle drift correction only
              const expected = t - activeClip.startTime + activeClip.trimStart;
              const drift = Math.abs(activeVideoEl.currentTime - expected);
              if (drift > 0.2) activeVideoEl.currentTime = Math.max(0, expected);
            }

            // Draw active visual
            if (activeClip) {
              const element = mediaElements.get(activeClip.id);
              if (element) {
                const sourceWidth =
                  element instanceof HTMLVideoElement ? element.videoWidth : element.width;
                const sourceHeight =
                  element instanceof HTMLVideoElement ? element.videoHeight : element.height;

                if (sourceWidth && sourceHeight) {
                  const scale = Math.min(width / sourceWidth, height / sourceHeight);
                  const drawWidth = sourceWidth * scale;
                  const drawHeight = sourceHeight * scale;
                  const drawX = (width - drawWidth) / 2;
                  const drawY = (height - drawHeight) / 2;
                  ctx.drawImage(element, drawX, drawY, drawWidth, drawHeight);
                }
              }
            }

            // Audio sync
            syncAudioStates(t);

            // Progress
            const renderProgress = frameIndex / totalFrames;
            setProgress({
              stage: "rendering",
              progress: 15 + renderProgress * 65,
              message: `Rendering silently… ${Math.round(renderProgress * 100)}%`,
            });

            frameIndex += 1;

            const targetNextMs = startMs + frameIndex * frameIntervalMs;
            const delay = Math.max(0, targetNextMs - performance.now());
            setTimeout(tick, delay);
          };

          tick();
        });
      } catch (error) {
        console.error("Export failed:", error);
        setProgress({
          stage: "error",
          progress: 0,
          message: error instanceof Error ? error.message : "Export failed",
        });
        setIsExporting(false);
        return null;
      }
    },
    [toast]
  );

  const cancelExport = useCallback(() => {
    abortRef.current = true;
  }, []);

  const reset = useCallback(() => {
    setProgress(null);
    setIsExporting(false);
  }, []);

  return { exportTimeline, cancelExport, isExporting, progress, reset };
}

async function loadMediaElements(
  clips: TimelineClip[]
): Promise<Map<string, HTMLVideoElement | HTMLImageElement>> {
  const elements = new Map<string, HTMLVideoElement | HTMLImageElement>();

  await Promise.all(
    clips.map(async (clip) => {
      if (clip.type === "video") {
        const video = document.createElement("video");
        video.src = clip.sourceUrl;
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.preload = "auto";
        video.playsInline = true;

        await new Promise<void>((resolve, reject) => {
          video.onloadeddata = () => resolve();
          video.onerror = () => reject(new Error(`Failed to load video: ${clip.name}`));
          video.load();
          setTimeout(resolve, 5000);
        });

        elements.set(clip.id, video);
      } else if (clip.type === "image") {
        const img = new Image();
        img.crossOrigin = "anonymous";

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load image: ${clip.name}`));
          img.src = clip.sourceUrl;
        });

        elements.set(clip.id, img);
      }
    })
  );

  return elements;
}
