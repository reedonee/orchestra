# Audio Recording & Gemini AI Integration Guide

## 🎯 Overview

This guide covers the complete audio-to-AI workflow:
1. **Audio Recording** - Record voice using device microphone
2. **BYOK System** - Securely store user's Gemini API key
3. **Gemini Processing** - Send audio to Google Gemini for AI processing
4. **Multimodal AI** - Combine audio with text prompts for rich context

## 🏗️ Architecture

### Components

```
┌─────────────────────────────────────────────────┐
│         React Native App                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │  UI Components (Screens/Hooks)         │    │
│  │  - AudioGeminiDemoScreen               │    │
│  │  - useAudioGemini Hook                 │    │
│  └────────────────────────────────────────┘    │
│           ▼                    ▼                │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │  Audio Recorder  │  │  BYOK Store      │   │
│  │  Service         │  │  (Zustand)       │   │
│  │                  │  │                  │   │
│  │ - Record audio   │  │ - Store API keys │   │
│  │ - Save files     │  │ - Secure storage │   │
│  │ - Playback       │  │ - Key rotation   │   │
│  └────────┬─────────┘  └──────────┬───────┘   │
│           │                       │            │
│           └───────────┬───────────┘            │
│                       ▼                        │
│          ┌────────────────────────┐           │
│          │  Gemini Service        │           │
│          │                        │           │
│          │ - Transcribe audio     │           │
│          │ - Interpret intent     │           │
│          │ - Process multimodal   │           │
│          │ - Generate responses   │           │
│          └────────────┬───────────┘           │
│                       │                        │
│                       ▼                        │
│          ┌────────────────────────┐           │
│          │  Gemini 3.5 Flash      │           │
│          │  API (Cloud)           │           │
│          └────────────────────────┘           │
└─────────────────────────────────────────────────┘
```

## 📦 Installation

### 1. Install Required Dependencies

```bash
npm install react-native-audio-recorder-player react-native-fs react-native-secure-store axios
```

### 2. Platform-Specific Setup

#### iOS (Info.plist)

```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access to record audio</string>
<key>UIRequiredDeviceCapabilities</key>
<array>
    <string>microphone</string>
</array>
```

#### Android (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### 3. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click "Get API Key"
3. Create new API key
4. Copy the key (never share it!)

## 🔐 BYOK System (Bring Your Own Key)

### Overview

The BYOK (Bring Your Own Key) system allows users to provide their own API keys while keeping them secure:

- **Never Stored in Cloud** - Keys stay on device only
- **Encrypted Storage** - Uses device secure storage
- **Audit Logging** - Track all key access
- **Key Rotation** - Update keys without app update
- **Multiple Providers** - Support for Gemini, OpenAI, etc.

### Implementation

```typescript
import { useBYOKStore, useAPIKey } from '../store/byokStore';

// Store API key
const { setAPIKey } = useAPIKey('gemini');
await setAPIKey('AIza...');

// Retrieve API key (automatically handled by services)
const store = useBYOKStore();
const apiKey = await store.getAPIKey('gemini');

// Check if key exists
const hasKey = await store.hasAPIKey('gemini');

// Rotate key
await store.rotateAPIKey('gemini', 'new_key_here');

// Remove key
await store.removeAPIKey('gemini');
```

### State Structure

```typescript
interface BYOKStoreState {
  // Active keys by provider
  activeKeys: {
    gemini: 'key_1234567890' | null;
    openai: 'key_9876543210' | null;
  };
  
  // Metadata (never stores actual keys)
  keyMetadata: {
    key_1234567890: {
      provider: 'gemini';
      keyId: 'key_1234567890';
      keyHash: 'hash_12345'; // For validation
      isValid: true;
      createdAt: 1234567890;
      lastUsedAt: 1234567890;
    };
  };
  
  // Audit trail
  auditLog: [{
    timestamp: 1234567890;
    action: 'create' | 'use' | 'rotate' | 'delete';
    provider: 'gemini';
    success: true;
  }];
}
```

### Audit Log Example

```typescript
const auditLog = store.getAuditLog('gemini', 10);
// [
//   {
//     timestamp: 1234567890,
//     action: 'create',
//     provider: 'gemini',
//     keyId: 'key_123...',
//     success: true,
//   },
//   {
//     timestamp: 1234567891,
//     action: 'use',
//     provider: 'gemini',
//     keyId: 'key_123...',
//     success: true,
//   },
// ]
```

## 🎤 Audio Recording Service

### Basic Usage

```typescript
import { audioRecorder } from '../services/audioRecorderService';

// Initialize storage
await audioRecorder.initializeStorage();

// Start recording
const path = await audioRecorder.startRecording();

// Record for some time...
await new Promise(resolve => setTimeout(resolve, 5000));

// Stop recording
const recording = await audioRecorder.stopRecording();
// {
//   id: 'recording_1234567890',
//   filePath: '/Documents/recording.aac',
//   fileName: 'recording.aac',
//   duration: 5000,
//   fileSize: 45120,
//   mimeType: 'audio/aac',
//   timestamp: 1234567890,
//   isProcessed: false
// }

// Save to permanent storage
const saved = await audioRecorder.saveRecording(recording);

// Play recording
await audioRecorder.playRecording(saved.filePath);

// Stop playback
await audioRecorder.stopPlayback();

// Delete recording
await audioRecorder.deleteRecording(saved.filePath);
```

### Advanced Features

```typescript
// Pause recording (iOS only)
await audioRecorder.pauseRecording();

// Resume recording (iOS only)
await audioRecorder.resumeRecording();

// List all recordings
const recordings = await audioRecorder.listRecordings();

// Clean up old recordings (older than 7 days)
const deletedCount = await audioRecorder.cleanupOldRecordings();

// Get as base64 (for API transmission)
const base64Data = await audioRecorder.getRecordingAsBase64(filePath);

// Get recording status
const status = audioRecorder.getRecordingStatus();
// {
//   isRecording: true,
//   duration: 5230,
//   currentPath: '/Documents/recording.aac'
// }
```

### RecordingConfig

```typescript
interface RecordingConfig {
  audioSourceAndroid?: AudioSourceAndroidType;
  audioEncoderAndroid?: AudioEncoderAndroidType;
  sampleRate?: number;           // Default: 48000 Hz
  numberOfChannels?: number;     // Default: 1 (mono)
  bitRate?: number;              // Default: 128000 bps
  quality?: number;              // Default: 1 (highest)
}

// Custom configuration
const recorder = new AudioRecorder({
  sampleRate: 44100,
  bitRate: 192000,
  quality: 1,
});
```

## 🤖 Gemini AI Service

### Transcribe Audio

```typescript
import { geminiService } from '../services/geminiService';

const transcription = await geminiService.transcribeAudio(recording);
console.log(transcription.text);
// "Hello, this is a test recording"
```

### Interpret User Intent

```typescript
const interpretation = await geminiService.interpretAudioIntent(
  recording,
  'The user is in a code editor' // optional context
);

console.log(interpretation.intent);        // "create_function"
console.log(interpretation.entities);      // { functionName: "hello" }
console.log(interpretation.confidence);    // 0.95
console.log(interpretation.suggestedActions);
// ["Create function hello", "Add to file"]
```

### Multimodal Processing

```typescript
// Audio + text context
const response = await geminiService.processMultimodal(
  recording,
  'The user is asking about JavaScript arrays',
  'You are a code tutor. Provide helpful explanations.'
);

console.log(response.content);
// "Arrays in JavaScript are ordered collections..."
```

### Text-Only Generation

```typescript
// No audio, just text
const response = await geminiService.generateFromText(
  'Explain closures in JavaScript',
  'You are an expert JavaScript tutor'
);

console.log(response.content);
```

### Response Structure

```typescript
interface GeminiMultimodalResponse {
  content: string;        // The actual response text
  type: 'text' | 'code' | 'analysis';
  metadata?: {
    source: string;
    recordingId?: string;
  };
  processingTimeMs: number;
  tokenCount?: {
    inputTokens: 1234;
    outputTokens: 5678;
  };
}
```

## 🪝 Hooks

### useAudioGemini - Complete Workflow

```typescript
import { useAudioGemini } from '../hooks/useAudioGemini';

export const MyComponent = () => {
  const {
    // State
    state,                    // 'idle' | 'recording' | 'processing' | 'success' | 'error'
    recordingTime,           // Milliseconds
    currentRecording,        // AudioRecording | null
    lastResult,              // AudioProcessingResult | null
    error,                   // Error message or null
    isRecording,
    isProcessing,

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
  } = useAudioGemini();

  return (
    <View>
      <Button
        title={isRecording ? 'Stop' : 'Start'}
        onPress={isRecording ? stopRecording : startRecording}
      />
      <Text>{formatTime(recordingTime)}</Text>
      <Button
        title="Transcribe"
        onPress={() => transcribeAudio()}
        disabled={!currentRecording}
      />
    </View>
  );
};
```

### useAudioRecorder - Recording Only

```typescript
import { useAudioRecorder } from '../hooks/useAudioGemini';

const {
  isRecording,
  recordingTime,
  recordings,
  startRecording,
  stopRecording,
  playRecording,
  stopPlayback,
  deleteRecording,
  listRecordings,
} = useAudioRecorder();
```

### useGeminiAPI - Direct Access

```typescript
import { useGeminiAPI } from '../hooks/useAudioGemini';

const { 
  isConfigured,
  transcribeAudio,
  interpretIntent,
  processMultimodal,
  generateFromText,
  validateAPIKey,
  clearCache,
} = useGeminiAPI();
```

## 🎨 Demo Screen

The `AudioGeminiDemoScreen` component provides:

- **API Key Setup** - Securely enter and manage Gemini API key
- **Recording Controls** - Start/stop/play recording
- **AI Processing** - Three modes:
  - **Transcribe** - Convert audio to text
  - **Interpret** - Detect user intent
  - **Custom** - Use custom prompts
- **Results Display** - Show processing results
- **Status Feedback** - Real-time feedback

### Usage

```typescript
import { AudioGeminiDemoScreen } from '../screens/AudioGeminiDemoScreen';

<AudioGeminiDemoScreen />
```

## 🔒 Security Best Practices

### 1. API Key Management

```typescript
// ✅ DO: Use BYOK system
await setAPIKey(userProvidedKey);

// ❌ DON'T: Store in plain text
const API_KEY = 'AIza...'; // Don't do this!
```

### 2. Never Log Keys

```typescript
// ✅ DO: Log masked key
console.log(`Using key: ${maskKey(apiKey)}`);
// Using key: AIza****...****1234

// ❌ DON'T: Log full key
console.log(`API Key: ${apiKey}`);
```

### 3. Validate Before Use

```typescript
// ✅ DO: Validate key exists before use
const hasKey = await store.hasAPIKey('gemini');
if (!hasKey) {
  throw new Error('API key not configured');
}

// ❌ DON'T: Assume key exists
const apiKey = await store.getAPIKey('gemini'); // Could be null
```

### 4. Clean Up Resources

```typescript
// ✅ DO: Stop recording when done
useEffect(() => {
  return () => {
    audioRecorder.cleanup();
  };
}, []);

// ❌ DON'T: Leave recordings in memory
```

## 🚨 Error Handling

### Common Errors

```typescript
// No API key configured
GeminiServiceError: No Gemini API key configured
Code: NO_API_KEY, Retryable: false

// Rate limited (try again later)
GeminiServiceError: Rate limit exceeded
Code: RATE_LIMIT, Retryable: true

// Service error (temporary)
GeminiServiceError: Gemini service error
Code: SERVICE_ERROR, Retryable: true

// Invalid response
GeminiServiceError: Invalid response format from Gemini
Code: INVALID_RESPONSE, Retryable: false
```

### Retry Logic

```typescript
async function transcribeWithRetry(
  recording: AudioRecording,
  maxRetries = 3
): Promise<GeminiAudioTranscription | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await geminiService.transcribeAudio(recording);
    } catch (error) {
      if (error instanceof GeminiServiceError) {
        if (!error.retryable) {
          throw error;
        }
        if (i < maxRetries - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, 1000 * Math.pow(2, i))
          );
          continue;
        }
      }
      throw error;
    }
  }
  return null;
}
```

## 📊 Performance Tips

### 1. Cache Transcriptions

```typescript
// Gemini service automatically caches for 5 minutes
const result1 = await geminiService.transcribeAudio(recording);
const result2 = await geminiService.transcribeAudio(recording);
// result2 comes from cache (instant)
```

### 2. Clean Up Old Recordings

```typescript
// Remove recordings older than 7 days
await audioRecorder.cleanupOldRecordings(7 * 24 * 60 * 60 * 1000);
```

### 3. Viewport Culling

```typescript
// List only recent recordings
const recordings = await audioRecorder.listRecordings();
const recent = recordings.slice(-20); // Last 20 only
```

## 📚 File Structure

```
src/
├── services/
│   ├── audioRecorderService.ts      # Audio recording & playback
│   └── geminiService.ts             # Gemini AI integration
├── store/
│   └── byokStore.ts                 # BYOK security store
├── hooks/
│   └── useAudioGemini.ts            # React hooks
└── screens/
    └── AudioGeminiDemoScreen.tsx    # Demo screen
```

## 🔗 Integration Examples

### Example 1: Voice-Controlled Node Creation

```typescript
const { interpretIntent, processWithPrompt } = useAudioGemini();

const handleVoiceCommand = async () => {
  const intent = await interpretIntent(recording, 'Creating a code node');
  
  if (intent.intent === 'create_node') {
    const nodeType = intent.entities.type || 'code';
    const content = lastResult?.transcription?.text || '';
    
    addNode({
      type: nodeType,
      content,
      x: 0,
      y: 0,
      width: 320,
      height: 200,
    });
  }
};
```

### Example 2: Code Explanation

```typescript
const { processWithPrompt } = useAudioGemini();

const explainCode = async (code: string) => {
  const result = await processWithPrompt(
    'Explain what this code does, step by step:' + code,
    recording,
    'You are an expert code reviewer'
  );
  
  return result.content;
};
```

### Example 3: Meeting Transcription

```typescript
const { transcribeAudio } = useAudioGemini();

const transcribeMeeting = async () => {
  const result = await transcribeAudio(recording);
  
  const sections = result.text.split('\n\n');
  const nodes = sections.map((content, index) => ({
    type: 'chat' as const,
    content,
    x: index * 350,
    y: 0,
    width: 320,
    height: 200,
  }));
  
  nodes.forEach(addNode);
};
```

## 🔄 Workflow Examples

### Complete Recording-to-AI Workflow

```
1. User taps "Record" button
   ↓
2. Audio recording starts
   ↓
3. User speaks command/content
   ↓
4. User taps "Stop"
   ↓
5. Audio saved to device storage
   ↓
6. User taps "Transcribe"
   ↓
7. Audio sent to Gemini API with BYOK key
   ↓
8. Gemini returns transcription
   ↓
9. Result displayed to user
   ↓
10. User can act on result (create node, etc.)
```

### State Machine

```
[IDLE] 
  │ startRecording()
  ▼
[RECORDING]
  │ stopRecording()
  ▼
[IDLE]
  │ transcribeAudio() or interpretIntent()
  ▼
[PROCESSING]
  │
  ├─→ Success → [SUCCESS]
  │              │ (result available)
  │              ▼ (any new action resets)
  │              [IDLE]
  │
  └─→ Error → [ERROR]
               │
               ▼ clearError()
               [IDLE]
```

## 🐛 Troubleshooting

### No Audio Recording

1. Check microphone permissions
2. Ensure device has microphone
3. Check volume is not muted
4. Try on actual device (simulator may not have audio)

### Gemini API Errors

1. Verify API key is correct
2. Check API key is active in Google Cloud Console
3. Verify internet connection
4. Check API rate limits

### Audio File Not Found

1. Ensure `initializeStorage()` was called
2. Verify file path is correct
3. Check app has storage permissions
4. Ensure file wasn't deleted

### Poor Transcription Quality

1. Record in quiet environment
2. Speak clearly
3. Use higher sample rate in config
4. Check audio format is supported

## 📖 Related Documentation

- [Gemini API Documentation](https://ai.google.dev/gemini-api)
- [react-native-audio-recorder-player](https://github.com/react-native-audio-toolkit/react-native-audio-recorder-player)
- [react-native-secure-store](https://github.com/prscX/react-native-secure-store)
- [Zustand Store](https://github.com/pmndrs/zustand)

## 📝 License

All code provided is part of the Orchestra project.

---

**Status**: Production Ready
**Last Updated**: 2024
**Type Safety**: 100% TypeScript
