import { useState, useCallback, useRef, useEffect } from "react";

interface UseVoiceInputOptions {
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
  onSilence?: (transcript: string) => void;
  onAudioLevel?: (level: number) => void;
  continuous?: boolean;
  language?: string;
  silenceTimeout?: number;
  autoStart?: boolean;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export const useVoiceInput = (options: UseVoiceInputOptions = {}) => {
  const { 
    continuous = false, 
    language = "en-US",
    silenceTimeout = 1500,
    autoStart = false
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTranscriptRef = useRef<string>("");
  const hasStartedRef = useRef(false);
  const isStartingRef = useRef(false);
  
  // Store callbacks in refs to avoid re-creating recognition on every render
  const onTranscriptRef = useRef(options.onTranscript);
  const onErrorRef = useRef(options.onError);
  const onSilenceRef = useRef(options.onSilence);
  const onAudioLevelRef = useRef(options.onAudioLevel);
  
  // Keep refs updated
  useEffect(() => { onTranscriptRef.current = options.onTranscript; }, [options.onTranscript]);
  useEffect(() => { onErrorRef.current = options.onError; }, [options.onError]);
  useEffect(() => { onSilenceRef.current = options.onSilence; }, [options.onSilence]);
  useEffect(() => { onAudioLevelRef.current = options.onAudioLevel; }, [options.onAudioLevel]);
  
  // Audio analysis refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    const currentTranscript = accumulatedTranscriptRef.current;
    if (currentTranscript && onSilenceRef.current) {
      silenceTimerRef.current = setTimeout(() => {
        if (accumulatedTranscriptRef.current.trim()) {
          console.log("[VoiceInput] Silence detected, submitting:", accumulatedTranscriptRef.current);
          onSilenceRef.current?.(accumulatedTranscriptRef.current);
          setTranscript("");
          accumulatedTranscriptRef.current = "";
        }
      }, silenceTimeout);
    }
  }, [clearSilenceTimer, silenceTimeout]);

  // Audio level analysis
  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1);
        
        setAudioLevel(normalizedLevel);
        onAudioLevelRef.current?.(normalizedLevel);
        
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
    } catch (error) {
      console.warn("[VoiceInput] Could not start audio analysis:", error);
    }
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // Initialize recognition ONCE - only depends on config, not callbacks
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      console.log("[VoiceInput] Recognition started");
      setIsListening(true);
      isStartingRef.current = false;
    };

    recognition.onend = () => {
      console.log("[VoiceInput] Recognition ended, hasStarted:", hasStartedRef.current);
      setIsListening(false);
      isStartingRef.current = false;
      
      // Auto-restart if we're supposed to keep listening
      if (continuous && hasStartedRef.current) {
        setTimeout(() => {
          if (hasStartedRef.current && recognitionRef.current) {
            try {
              console.log("[VoiceInput] Auto-restarting...");
              recognitionRef.current.start();
            } catch (error) {
              console.warn("[VoiceInput] Auto-restart failed:", error);
            }
          }
        }, 100);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + " " + finalTranscript).trim();
        console.log("[VoiceInput] Final transcript:", accumulatedTranscriptRef.current);
        onTranscriptRef.current?.(finalTranscript);
      }

      const displayTranscript = (accumulatedTranscriptRef.current + " " + interimTranscript).trim();
      setTranscript(displayTranscript);

      if (displayTranscript) {
        startSilenceTimer();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("[VoiceInput] Recognition error:", event.error);
      isStartingRef.current = false;
      
      // Don't treat no-speech as fatal in continuous mode
      if (event.error === "no-speech" && continuous) {
        return;
      }
      
      // For permission errors, reset started state
      if (event.error === "not-allowed" || event.error === "audio-capture") {
        hasStartedRef.current = false;
        setIsListening(false);
      }

      let errorMessage = "Voice input error";
      switch (event.error) {
        case "no-speech":
          errorMessage = "No speech detected. Please try again.";
          break;
        case "audio-capture":
          errorMessage = "No microphone found. Please check your device.";
          break;
        case "not-allowed":
          errorMessage = "Microphone access denied. Please enable it in your browser settings.";
          break;
        case "network":
          errorMessage = "Network error. Please check your connection.";
          break;
        case "aborted":
          return; // Don't report aborted as error
        default:
          errorMessage = `Voice input error: ${event.error}`;
      }
      onErrorRef.current?.(errorMessage);
    };

    recognitionRef.current = recognition;

    if (autoStart && !hasStartedRef.current) {
      hasStartedRef.current = true;
      try {
        recognition.start();
      } catch (error) {
        console.warn("[VoiceInput] Could not auto-start recognition");
        hasStartedRef.current = false;
      }
    }

    return () => {
      hasStartedRef.current = false;
      clearSilenceTimer();
      stopAudioAnalysis();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [continuous, language, autoStart, clearSilenceTimer, startSilenceTimer, stopAudioAnalysis]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      console.log("[VoiceInput] Cannot start - not supported");
      return;
    }
    
    // Guard against rapid/duplicate start calls
    if (isStartingRef.current) {
      console.log("[VoiceInput] Already starting, skipping");
      return;
    }
    
    if (hasStartedRef.current) {
      console.log("[VoiceInput] Already started, skipping");
      return;
    }

    console.log("[VoiceInput] Starting listening...");
    isStartingRef.current = true;
    accumulatedTranscriptRef.current = "";
    setTranscript("");
    
    startAudioAnalysis();
    
    try {
      recognitionRef.current.start();
      hasStartedRef.current = true;
    } catch (error: any) {
      console.warn("[VoiceInput] Start error:", error);
      isStartingRef.current = false;
      
      // If already running, just mark as started
      if (error.name === "InvalidStateError") {
        hasStartedRef.current = true;
      } else {
        hasStartedRef.current = false;
        onErrorRef.current?.("Failed to start voice input");
      }
    }
    
    // Reset starting guard
    setTimeout(() => {
      isStartingRef.current = false;
    }, 300);
  }, [isSupported, startAudioAnalysis]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    console.log("[VoiceInput] Stopping listening...");
    hasStartedRef.current = false;
    isStartingRef.current = false;
    clearSilenceTimer();
    stopAudioAnalysis();
    
    try {
      recognitionRef.current.stop();
    } catch (error) {
      // Ignore stop errors
    }
  }, [clearSilenceTimer, stopAudioAnalysis]);

  const toggleListening = useCallback(() => {
    if (isListening || hasStartedRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    isSupported,
    audioLevel,
    startListening,
    stopListening,
    toggleListening,
  };
};
