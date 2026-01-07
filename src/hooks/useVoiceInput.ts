import { useState, useCallback, useRef, useEffect } from "react";

interface UseVoiceInputOptions {
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
  onSilence?: (transcript: string) => void;
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
    continuous = false, 
    language = "en-US",
    silenceTimeout = 1500,
    autoStart = false
  } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTranscriptRef = useRef<string>("");
  const hasStartedRef = useRef(false);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startSilenceTimer = useCallback((currentTranscript: string) => {
    clearSilenceTimer();
    if (currentTranscript && onSilence) {
      const transcriptSnapshot = currentTranscript;
      silenceTimerRef.current = setTimeout(() => {
        // Check if transcript hasn't changed (user stopped speaking)
        if (accumulatedTranscriptRef.current.trim()) {
          console.log("[VoiceInput] Silence detected, submitting:", accumulatedTranscriptRef.current);
          onSilence(accumulatedTranscriptRef.current);
          setTranscript("");
          accumulatedTranscriptRef.current = "";
        }
      }, silenceTimeout);
    }
  }, [clearSilenceTimer, onSilence, silenceTimeout]);

  useEffect(() => {
    // Check for browser support
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
      
      // Auto-restart if in continuous mode and was intentionally started
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

      // Accumulate final transcripts
      if (finalTranscript) {
        accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + " " + finalTranscript).trim();
        console.log("[VoiceInput] Accumulated:", accumulatedTranscriptRef.current);
      }

      // Show current speech (accumulated + interim)
      const displayTranscript = (accumulatedTranscriptRef.current + " " + interimTranscript).trim();
      setTranscript(displayTranscript);

      if (finalTranscript && onTranscript) {
        onTranscript(finalTranscript);
      }

      // Start/restart silence detection timer on any speech
      if (displayTranscript) {
        startSilenceTimer(displayTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      
      // Don't stop for no-speech errors in continuous mode
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

    // Auto-start if requested
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
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [continuous, language, onTranscript, onError, autoStart, clearSilenceTimer, startSilenceTimer]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return;

    console.log("[VoiceInput] Starting listening");
    hasStartedRef.current = true;
    accumulatedTranscriptRef.current = "";
    setTranscript("");
    try {
      recognitionRef.current.start();
    } catch (error) {
      // Already started
      console.warn("Recognition already started");
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    console.log("[VoiceInput] Stopping listening");
    hasStartedRef.current = false;
    clearSilenceTimer();
    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.warn("Recognition already stopped");
    }
  }, [clearSilenceTimer]);

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
    startListening,
    stopListening,
    toggleListening,
  };
};
