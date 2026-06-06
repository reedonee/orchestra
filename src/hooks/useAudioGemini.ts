/**
 * Audio Gemini Integration Hook
 * Combines audio recording with Gemini AI processing
 * Provides easy-to-use interface for voice-based AI interactions
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { audioRecorder, AudioRecording } from '../services/audioRecorderService';
import { geminiService, GeminiAudioTranscription, GeminiIntentInterpretation, GeminiMultimodalResponse, GeminiServiceError } from '../services/geminiService';
import { useBYOKStore } from '../store/byokStore';

/**
 * Processing state for UI feedback
 */
export type ProcessingState = 'idle' | 'recording' | 'processing' | 'success' | 'error';

/**
 * Audio processing result
 */
export interface AudioProcessingResult {
  recording: AudioRecording;
  transcription?: GeminiAudioTranscription;
  interpretation?: GeminiIntentInterpretation;
  response?: GeminiMultimodalResponse;
  error?: string;
  duration: number;
}

/**
 * useAudioGemini Hook
 * Manages complete audio-to-AI workflow
 */
export const useAudioGemini = () => {
  const [state, setState] = useState<ProcessingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentRecording, setCurrentRecording] = useState<AudioRecording | null>(null);
  const [lastResult, setLastResult] = useState<AudioProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const byokStore = useBYOKStore();

  // Initialize audio recorder
  useEffect(() => {
    audioRecorder.initializeStorage().catch((err) => {
      console.error('Failed to initialize audio storage:', err);
      setError('Audio storage initialization failed');
    });
  }, []);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setState('recording');
      setRecordingTime(0);

      // Start audio recording
      await audioRecorder.startRecording();

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 100);
      }, 100);
    } catch (err) {
      setState('error');
      const message = err instanceof Error ? err.message : 'Recording failed';
      setError(message);
      console.error('Recording error:', err);
    }
  }, []);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(async (): Promise<AudioRecording | null> => {
    try {
      // Stop timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      // Stop recording
      const recording = await audioRecorder.stopRecording();
      if (!recording) {
        throw new Error('No recording data');
      }

      // Save recording
      const saved = await audioRecorder.saveRecording(recording);
      setCurrentRecording(saved);
      setState('idle');

      return saved;
    } catch (err) {
      setState('error');
      const message = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(message);
      console.error('Stop recording error:', err);
      return null;
    }
  }, []);

  /**
   * Transcribe audio
   */
  const transcribeAudio = useCallback(
    async (recording?: AudioRecording): Promise<GeminiAudioTranscription | null> => {
      try {
        const target = recording || currentRecording;
        if (!target) {
          throw new Error('No recording available');
        }

        // Verify API key exists
        const hasKey = await byokStore.hasAPIKey('gemini');
        if (!hasKey) {
          throw new Error('Gemini API key not configured');
        }

        setState('processing');
        setError(null);

        const result = await geminiService.transcribeAudio(target);

        setState('success');
        setLastResult({
          recording: target,
          transcription: result,
          duration: target.duration,
        });

        return result;
      } catch (err) {
        setState('error');
        const message = err instanceof Error ? err.message : 'Transcription failed';
        setError(message);
        console.error('Transcription error:', err);
        return null;
      }
    },
    [currentRecording, byokStore]
  );

  /**
   * Interpret user intent from audio
   */
  const interpretIntent = useCallback(
    async (
      recording?: AudioRecording,
      context?: string
    ): Promise<GeminiIntentInterpretation | null> => {
      try {
        const target = recording || currentRecording;
        if (!target) {
          throw new Error('No recording available');
        }

        const hasKey = await byokStore.hasAPIKey('gemini');
        if (!hasKey) {
          throw new Error('Gemini API key not configured');
        }

        setState('processing');
        setError(null);

        const result = await geminiService.interpretAudioIntent(target, context);

        setState('success');
        setLastResult({
          recording: target,
          interpretation: result,
          duration: target.duration,
        });

        return result;
      } catch (err) {
        setState('error');
        const message = err instanceof Error ? err.message : 'Intent interpretation failed';
        setError(message);
        console.error('Intent interpretation error:', err);
        return null;
      }
    },
    [currentRecording, byokStore]
  );

  /**
   * Process audio with custom prompt
   */
  const processWithPrompt = useCallback(
    async (
      prompt: string,
      recording?: AudioRecording,
      systemPrompt?: string
    ): Promise<GeminiMultimodalResponse | null> => {
      try {
        const target = recording || currentRecording;
        if (!target) {
          throw new Error('No recording available');
        }

        const hasKey = await byokStore.hasAPIKey('gemini');
        if (!hasKey) {
          throw new Error('Gemini API key not configured');
        }

        setState('processing');
        setError(null);

        const result = await geminiService.processMultimodal(
          target,
          prompt,
          systemPrompt
        );

        setState('success');
        setLastResult({
          recording: target,
          response: result,
          duration: target.duration,
        });

        return result;
      } catch (err) {
        setState('error');
        const message = err instanceof Error ? err.message : 'Processing failed';
        setError(message);
        console.error('Processing error:', err);
        return null;
      }
    },
    [currentRecording, byokStore]
  );

  /**
   * Play current recording
   */
  const playRecording = useCallback(
    async (recording?: AudioRecording) => {
      try {
        const target = recording || currentRecording;
        if (!target) {
          throw new Error('No recording available');
        }

        await audioRecorder.playRecording(target.filePath);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Playback failed';
        setError(message);
        console.error('Playback error:', err);
      }
    },
    [currentRecording]
  );

  /**
   * Stop playback
   */
  const stopPlayback = useCallback(async () => {
    try {
      await audioRecorder.stopPlayback();
    } catch (err) {
      console.error('Stop playback error:', err);
    }
  }, []);

  /**
   * Delete recording
   */
  const deleteRecording = useCallback(
    async (recording?: AudioRecording) => {
      try {
        const target = recording || currentRecording;
        if (!target) {
          throw new Error('No recording available');
        }

        await audioRecorder.deleteRecording(target.filePath);
        if (!recording) {
          setCurrentRecording(null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Delete failed';
        setError(message);
        console.error('Delete error:', err);
      }
    },
    [currentRecording]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState('idle');
    setRecordingTime(0);
    setCurrentRecording(null);
    setLastResult(null);
    setError(null);

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, []);

  return {
    // State
    state,
    recordingTime,
    currentRecording,
    lastResult,
    error,
    isRecording: state === 'recording',
    isProcessing: state === 'processing',

    // Recording actions
    startRecording,
    stopRecording,
    playRecording,
    stopPlayback,
    deleteRecording,

    // AI actions
    transcribeAudio,
    interpretIntent,
    processWithPrompt,

    // Utilities
    clearError,
    reset,
  };
};

/**
 * useAudioRecorder Hook
 * Simplified hook for just recording (no Gemini)
 */
export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    audioRecorder.initializeStorage().catch(console.error);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setRecordingTime(0);
      await audioRecorder.startRecording();
      setIsRecording(true);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 100);
      }, 100);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<AudioRecording | null> => {
    try {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      const recording = await audioRecorder.stopRecording();
      if (recording) {
        const saved = await audioRecorder.saveRecording(recording);
        setRecordings((prev) => [...prev, saved]);
        setIsRecording(false);
        return saved;
      }

      setIsRecording(false);
      return null;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      return null;
    }
  }, []);

  const playRecording = useCallback(async (recording: AudioRecording) => {
    await audioRecorder.playRecording(recording.filePath);
  }, []);

  const stopPlayback = useCallback(async () => {
    await audioRecorder.stopPlayback();
  }, []);

  const deleteRecording = useCallback(async (recording: AudioRecording) => {
    await audioRecorder.deleteRecording(recording.filePath);
    setRecordings((prev) => prev.filter((r) => r.id !== recording.id));
  }, []);

  const listRecordings = useCallback(async () => {
    const list = await audioRecorder.listRecordings();
    setRecordings(list);
    return list;
  }, []);

  return {
    isRecording,
    recordingTime,
    recordings,
    startRecording,
    stopRecording,
    playRecording,
    stopPlayback,
    deleteRecording,
    listRecordings,
  };
};

/**
 * useGeminiAPI Hook
 * Direct access to Gemini service
 */
export const useGeminiAPI = () => {
  const byokStore = useBYOKStore();
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    byokStore.hasAPIKey('gemini').then(setIsConfigured);
  }, [byokStore]);

  return {
    isConfigured,
    transcribeAudio: geminiService.transcribeAudio,
    interpretIntent: geminiService.interpretAudioIntent,
    processMultimodal: geminiService.processMultimodal,
    generateFromText: geminiService.generateFromText,
    validateAPIKey: geminiService.validateAPIKey,
    clearCache: geminiService.clearCache,
  };
};
