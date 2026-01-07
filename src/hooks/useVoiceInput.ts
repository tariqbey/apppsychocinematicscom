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
    onTranscript, 
    onError, 
    onSilence,
    onAudioLevel,
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

  const startSilenceTimer = useCallback((currentTranscript: string) => {
    clearSilenceTimer();
    if (currentTranscript && onSilence) {
      silenceTimerRef.current = setTimeout(() => {
        if (accumulatedTranscriptRef.current.trim()) {
          console.log("[VoiceInput] Silence detected, submitting:", accumulatedTranscriptRef.current);
          onSilence(accumulatedTranscriptRef.current);
          setTranscript("");
          accumulatedTranscriptRef.current = "";
        }
      }, silenceTimeout);
    }
  }, [clearSilenceTimer, onSilence, silenceTimeout]);

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
        onAudioLevel?.(normalizedLevel);
        
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
    } catch (error) {
      console.warn("[VoiceInput] Could not start audio analysis:", error);
    }
  }, [onAudioLevel]);

  const stopAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

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
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      clearSilenceTimer();
      
      if (continuous && hasStartedRef.current) {
        try {
          setTimeout(() => {
            if (hasStartedRef.current && recognitionRef.current) {
              recognitionRef.current.start();
            }
          }, 100);
        } catch (error) {
          console.warn("Could not auto-restart recognition");
        }
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
        console.log("[VoiceInput] Accumulated:", accumulatedTranscriptRef.current);
      }

      const displayTranscript = (accumulatedTranscriptRef.current + " " + interimTranscript).trim();
      setTranscript(displayTranscript);

      if (finalTranscript && onTranscript) {
        onTranscript(finalTranscript);
      }

      if (displayTranscript) {
        startSilenceTimer(displayTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      
      if (event.error === "no-speech" && continuous) {
        return;
      }
      
      setIsListening(false);

      if (onError) {
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
          default:
            errorMessage = `Voice input error: ${event.error}`;
        }
        onError(errorMessage);
      }
    };

    recognitionRef.current = recognition;

    if (autoStart && !hasStartedRef.current) {
      hasStartedRef.current = true;
      try {
        recognition.start();
      } catch (error) {
        console.warn("Could not auto-start recognition");
      }
    }

    return () => {
      hasStartedRef.current = false;
      clearSilenceTimer();
      stopAudioAnalysis();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [continuous, language, onTranscript, onError, autoStart, clearSilenceTimer, startSilenceTimer, stopAudioAnalysis]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return;

    console.log("[VoiceInput] Starting listening");
    hasStartedRef.current = true;
    accumulatedTranscriptRef.current = "";
    setTranscript("");
    
    startAudioAnalysis();
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.warn("Recognition already started");
    }
  }, [isSupported, startAudioAnalysis]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    console.log("[VoiceInput] Stopping listening");
    hasStartedRef.current = false;
    clearSilenceTimer();
    stopAudioAnalysis();
    
    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.warn("Recognition already stopped");
    }
  }, [clearSilenceTimer, stopAudioAnalysis]);

  const toggleListening = useCallback(() => {
    if (isListening) {
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
