import { useState, useRef, useCallback, useEffect } from "react";

const LANG_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

export function useSpeechRecognition({ language = "en", onTranscript, onError } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [activeField, setActiveField] = useState(null); // e.g. "title" | "description"
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const isSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setActiveField(null);
  }, []);

  const startListening = useCallback(
    (fieldKey, onTextChunk) => {
      setError(null);
      if (!isSupported) {
        setError("not_supported");
        onError?.("Speech recognition is not supported in this browser.");
        return;
      }

      // If already listening on this field, toggle off
      if (isListening && activeField === fieldKey) {
        stopListening();
        return;
      }

      // Stop previous instance if active
      if (recognitionRef.current) {
        stopListening();
      }

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = LANG_MAP[language] || "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
        setActiveField(fieldKey);
      };

      recognition.onresult = (event) => {
        let currentInterim = "";
        let currentFinal = "";

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          const transcript = res[0]?.transcript || "";
          if (res.isFinal) {
            currentFinal += (currentFinal ? " " : "") + transcript.trim();
          } else {
            currentInterim += (currentInterim ? " " : "") + transcript.trim();
          }
        }

        const fullText = currentFinal
          ? (currentInterim ? `${currentFinal} ${currentInterim}` : currentFinal)
          : currentInterim;

        if (fullText) {
          onTextChunk?.(fullText, Boolean(currentFinal));
          onTranscript?.(fieldKey, fullText, Boolean(currentFinal));
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "no-speech") return;
        setError(event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          onError?.("Microphone permission denied. Please allow microphone access in your browser settings.");
        } else if (event.error === "network") {
          onError?.("Speech recognition network error. Please check your internet connection.");
        } else {
          onError?.(`Speech recognition error (${event.error}). Please try again.`);
        }
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
        setActiveField(null);
      };

      try {
        recognition.start();
      } catch (err) {
        console.warn("Speech recognition error:", err);
        setError("failed_start");
        stopListening();
      }
    },
    [isSupported, isListening, activeField, language, onTranscript, onError, stopListening]
  );

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    activeField,
    error,
    startListening,
    stopListening,
  };
}
