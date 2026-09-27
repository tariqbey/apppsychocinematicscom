import { createClient } from "@anam-ai/js-sdk";
import { supabase } from "@/integrations/supabase/client";

/**
 * Gives the GPT-Live voice a face with an Anam live avatar (audio passthrough).
 *
 * GPT-Live stays the brain and the voice. Its remote WebRTC audio is resampled to
 * 16 kHz mono PCM16 and streamed into Anam, which renders the avatar's lip-sync and
 * plays the audio in sync with the video. The raw GPT-Live audio element must be
 * muted while the avatar is on, or you'd hear the voice twice.
 */

type AnamClient = ReturnType<typeof createClient>;
type AgentAudioStream = ReturnType<AnamClient["createAgentAudioInputStream"]>;

const SAMPLE_RATE = 16000;
/** RMS above this counts as the voice speaking. */
const SPEECH_RMS = 0.012;
/** Silence this long after speech closes the current sequence. */
const END_OF_SEQUENCE_MS = 600;

export class AnamAvatarBridge {
  private client: AnamClient | null = null;
  private agentStream: AgentAudioStream | null = null;
  private audioCtx: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private inSequence = false;
  private silenceMs = 0;

  /** Starts the avatar video in the given <video> element. Throws if the avatar can't start. */
  async start(videoElementId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke("anam-session-token", { body: {} });
    if (error || !data?.sessionToken) {
      let detail = (data as { error?: string } | null)?.error;
      const ctx = (error as { context?: Response } | null)?.context;
      if (!detail && ctx && typeof ctx.json === "function") {
        detail = await ctx.json().then((b: { error?: string }) => b?.error).catch(() => undefined);
      }
      throw new Error(detail || "Couldn't start the avatar.");
    }
    this.client = createClient(data.sessionToken, { disableInputAudio: true });
    await this.client.streamToVideoElement(videoElementId);
    this.agentStream = this.client.createAgentAudioInputStream({
      encoding: "pcm_s16le",
      sampleRate: SAMPLE_RATE,
      channels: 1,
    });
  }

  /** Streams the GPT-Live voice (remote WebRTC audio) into the avatar. */
  attachVoice(remote: MediaStream): void {
    if (!this.agentStream || this.audioCtx) return;
    const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    this.audioCtx = ctx;
    const source = ctx.createMediaStreamSource(remote);
    const processor = ctx.createScriptProcessor(2048, 1, 1);
    this.processor = processor;
    const chunkMs = (2048 / SAMPLE_RATE) * 1000;

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      let sum = 0;
      const pcm = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        sum += s * s;
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      const speaking = Math.sqrt(sum / input.length) > SPEECH_RMS;

      if (speaking) {
        this.inSequence = true;
        this.silenceMs = 0;
        this.agentStream?.sendAudioChunk(pcm.buffer);
      } else if (this.inSequence) {
        // Keep short pauses inside the sentence; close the sequence after a real gap.
        this.silenceMs += chunkMs;
        this.agentStream?.sendAudioChunk(pcm.buffer);
        if (this.silenceMs >= END_OF_SEQUENCE_MS) {
          this.agentStream?.endSequence();
          this.inSequence = false;
          this.silenceMs = 0;
        }
      }
    };

    // A ScriptProcessor only runs while connected; route it through a silent gain.
    const sink = ctx.createGain();
    sink.gain.value = 0;
    source.connect(processor);
    processor.connect(sink);
    sink.connect(ctx.destination);
    void ctx.resume();
  }

  /** The user cut in: stop the avatar talking right away. */
  interrupt(): void {
    if (!this.client || !this.inSequence) return;
    this.client.interruptPersona();
    this.agentStream?.endSequence();
    this.inSequence = false;
    this.silenceMs = 0;
  }

  isSpeaking(): boolean {
    return this.inSequence;
  }

  async stop(): Promise<void> {
    this.processor?.disconnect();
    this.processor = null;
    await this.audioCtx?.close().catch(() => undefined);
    this.audioCtx = null;
    await this.client?.stopStreaming().catch(() => undefined);
    this.client = null;
    this.agentStream = null;
    this.inSequence = false;
  }
}
