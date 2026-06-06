/**
 * Audio Gemini Demo Screen
 * Interactive demonstration of audio recording and Gemini AI integration
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useAudioGemini, useAudioRecorder } from '../hooks/useAudioGemini';
import { useBYOKStore, useAPIKey } from '../store/byokStore';
import { GeminiIntentInterpretation } from '../services/geminiService';

// Fluent Design Color Scheme
const COLORS = {
  background: '#1e1e1e',
  surface: '#2d2d2d',
  surfaceDark: '#1a1a1a',
  border: '#3f3f3f',
  text: '#ffffff',
  textSecondary: '#b3b3b3',
  accent: '#0078d4',
  success: '#107c10',
  warning: '#ffb900',
  error: '#d83b01',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  buttonSmall: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  input: {
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: COLORS.text,
    fontSize: 14,
    minHeight: 100,
  },
  statusBox: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 4,
  },
  statusBoxSuccess: {
    borderLeftColor: COLORS.success,
  },
  statusBoxError: {
    borderLeftColor: COLORS.error,
  },
  statusBoxWarning: {
    borderLeftColor: COLORS.warning,
  },
  statusText: {
    color: COLORS.text,
    fontSize: 13,
    fontFamily: 'Courier New',
  },
  statusLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.error,
    borderRadius: 6,
    justifyContent: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.text,
  },
  recordingText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.text,
  },
  resultBox: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultTitle: {
    color: COLORS.accent,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultContent: {
    color: COLORS.text,
    fontSize: 12,
    fontFamily: 'Courier New',
    lineHeight: 18,
  },
});

/**
 * API Key Setup Section
 */
const APIKeySetup: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const { setAPIKey, hasKey } = useAPIKey('gemini');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleSetKey = useCallback(async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    try {
      setLoading(true);
      await setAPIKey(apiKey);
      Alert.alert('Success', 'API key configured successfully');
      setApiKey('');
    } catch (error) {
      Alert.alert('Error', `Failed to set API key: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [apiKey, setAPIKey]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🔑 Gemini API Key (BYOK)</Text>

      <TextInput
        style={[
          styles.input,
          {
            paddingRight: 44,
          },
        ]}
        placeholder="Enter your Gemini API key"
        placeholderTextColor={COLORS.textSecondary}
        value={apiKey}
        onChangeText={setApiKey}
        secureTextEntry={!showKey}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSetKey}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.text} />
        ) : (
          <Text style={styles.buttonText}>
            {hasKey ? '✓ API Key Configured' : 'Set API Key'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={[styles.statusBox, hasKey ? styles.statusBoxSuccess : styles.statusBoxWarning]}>
        <Text style={styles.statusLabel}>Key Status:</Text>
        <Text style={styles.statusText}>
          {hasKey
            ? '✓ API key is securely stored'
            : '⚠ No API key configured yet'}
        </Text>
      </View>
    </View>
  );
};

/**
 * Recording Section
 */
const RecordingSection: React.FC = () => {
  const {
    state,
    recordingTime,
    startRecording,
    stopRecording,
    playRecording,
    deleteRecording,
    currentRecording,
  } = useAudioGemini();

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const displaySeconds = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${displaySeconds}`;
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎤 Recording</Text>

      {state === 'recording' ? (
        <View style={styles.recordingIndicator}>
          <ActivityIndicator color={COLORS.text} />
          <Text style={styles.recordingText}>Recording: {formatTime(recordingTime)}</Text>
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.buttonSmall, state === 'recording' && styles.buttonDisabled]}
          onPress={startRecording}
          disabled={state === 'recording'}
        >
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.buttonSmall,
            { backgroundColor: COLORS.error },
            state !== 'recording' && styles.buttonDisabled,
          ]}
          onPress={stopRecording}
          disabled={state !== 'recording'}
        >
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.buttonSmall,
            !currentRecording && styles.buttonDisabled,
          ]}
          onPress={() => currentRecording && playRecording(currentRecording)}
          disabled={!currentRecording}
        >
          <Text style={styles.buttonText}>Play</Text>
        </TouchableOpacity>
      </View>

      {currentRecording && (
        <View style={[styles.statusBox, styles.statusBoxSuccess]}>
          <Text style={styles.statusLabel}>Recording Info:</Text>
          <Text style={styles.statusText}>
            Duration: {formatTime(currentRecording.duration)}
            {'\n'}
            Size: {(currentRecording.fileSize / 1024).toFixed(1)} KB
            {'\n'}
            Type: {currentRecording.mimeType}
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * AI Processing Section
 */
const AIProcessingSection: React.FC = () => {
  const {
    state,
    currentRecording,
    transcribeAudio,
    interpretIntent,
    processWithPrompt,
    lastResult,
    error,
  } = useAudioGemini();

  const [customPrompt, setCustomPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'transcribe' | 'interpret' | 'custom'>(
    'transcribe'
  );

  const handleTranscribe = useCallback(async () => {
    const result = await transcribeAudio();
    if (result) {
      Alert.alert(
        'Transcription',
        result.text.substring(0, 200) + (result.text.length > 200 ? '...' : '')
      );
    }
  }, [transcribeAudio]);

  const handleInterpret = useCallback(async () => {
    const result = await interpretIntent();
    if (result) {
      Alert.alert('Intent Detected', result.intent);
    }
  }, [interpretIntent]);

  const handleCustom = useCallback(async () => {
    if (!customPrompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }
    await processWithPrompt(customPrompt);
  }, [customPrompt, processWithPrompt]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🤖 AI Processing</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transcribe' && styles.tabActive]}
          onPress={() => setActiveTab('transcribe')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'transcribe' && styles.tabTextActive,
            ]}
          >
            Transcribe
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'interpret' && styles.tabActive]}
          onPress={() => setActiveTab('interpret')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'interpret' && styles.tabTextActive,
            ]}
          >
            Interpret
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'custom' && styles.tabActive]}
          onPress={() => setActiveTab('custom')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'custom' && styles.tabTextActive,
            ]}
          >
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'transcribe' && (
        <TouchableOpacity
          style={[styles.button, (!currentRecording || state === 'processing') && styles.buttonDisabled]}
          onPress={handleTranscribe}
          disabled={!currentRecording || state === 'processing'}
        >
          {state === 'processing' ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <Text style={styles.buttonText}>Transcribe Audio</Text>
          )}
        </TouchableOpacity>
      )}

      {activeTab === 'interpret' && (
        <TouchableOpacity
          style={[styles.button, (!currentRecording || state === 'processing') && styles.buttonDisabled]}
          onPress={handleInterpret}
          disabled={!currentRecording || state === 'processing'}
        >
          {state === 'processing' ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <Text style={styles.buttonText}>Interpret Intent</Text>
          )}
        </TouchableOpacity>
      )}

      {activeTab === 'custom' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter custom prompt for Gemini"
            placeholderTextColor={COLORS.textSecondary}
            value={customPrompt}
            onChangeText={setCustomPrompt}
            editable={state !== 'processing'}
            multiline
          />
          <TouchableOpacity
            style={[styles.button, (!currentRecording || state === 'processing') && styles.buttonDisabled]}
            onPress={handleCustom}
            disabled={!currentRecording || state === 'processing'}
          >
            {state === 'processing' ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.buttonText}>Process</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {error && (
        <View style={[styles.statusBox, styles.statusBoxError]}>
          <Text style={styles.statusLabel}>Error:</Text>
          <Text style={styles.statusText}>{error}</Text>
        </View>
      )}

      {lastResult && (
        <View style={styles.resultBox}>
          {lastResult.transcription && (
            <>
              <Text style={styles.resultTitle}>📝 Transcription:</Text>
              <Text style={styles.resultContent}>{lastResult.transcription.text}</Text>
            </>
          )}

          {lastResult.interpretation && (
            <>
              <Text style={[styles.resultTitle, { marginTop: 12 }]}>🎯 Intent:</Text>
              <Text style={styles.resultContent}>
                {lastResult.interpretation.intent}
                {'\n\n'}
                Confidence: {(lastResult.interpretation.confidence * 100).toFixed(0)}%
              </Text>
            </>
          )}

          {lastResult.response && (
            <>
              <Text style={[styles.resultTitle, { marginTop: 12 }]}>💭 Response:</Text>
              <Text style={styles.resultContent}>
                {lastResult.response.content.substring(0, 300)}
                {lastResult.response.content.length > 300 ? '...' : ''}
              </Text>
            </>
          )}

          <Text style={[styles.statusLabel, { marginTop: 12 }]}>
            Processing time: {lastResult.duration}ms
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * Main Demo Screen
 */
export const AudioGeminiDemoScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🎙️ Audio Gemini</Text>
          <Text style={styles.subtitle}>
            Record audio and process with Google Gemini AI
          </Text>
        </View>

        <APIKeySetup />
        <RecordingSection />
        <AIProcessingSection />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Information</Text>
          <Text style={styles.resultContent}>
            1. First, configure your Gemini API key above{'\n'}
            2. Record audio using the microphone{'\n'}
            3. Process with AI using Transcribe, Interpret, or Custom prompts{'\n'}
            4. View results below{'\n\n'}
            <Text style={{ fontWeight: '600' }}>BYOK System:</Text>
            {'\n'}
            Your API key is securely stored in device secure storage and never sent to any external service except Gemini.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </View>
    </ScrollView>
  );
};

export default AudioGeminiDemoScreen;
