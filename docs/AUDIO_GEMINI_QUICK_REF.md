# Audio & Gemini Integration - Quick Reference

## 🎯 5-Minute Setup

### 1. Install Dependencies
```bash
npm install react-native-audio-recorder-player react-native-fs react-native-secure-store axios
```

### 2. Add Permissions

**iOS (Info.plist):**
```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access to record audio</string>
```

**Android (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### 3. Get Gemini API Key
1. Visit https://aistudio.google.com
2. Click "Get API Key"
3. Copy key (keep safe!)

### 4. Set Up Key in App
```typescript
import { useAPIKey } from '../store/byokStore';

const { setAPIKey } = useAPIKey('gemini');
await setAPIKey('your_gemini_api_key_here');
```

## 🎤 Recording in 30 Seconds

```typescript
import { useAudioGemini } from '../hooks/useAudioGemini';

const MyComponent = () => {
  const {
    isRecording,
    startRecording,
    stopRecording,
    currentRecording,
    transcribeAudio,
  } = useAudioGemini();

  return (
    <View>
      <Button
        title={isRecording ? 'Stop' : 'Start'}
        onPress={isRecording ? stopRecording : startRecording}
      />
      
      <Button
        title="Transcribe"
        onPress={transcribeAudio}
        disabled={!currentRecording}
      />
    </View>
  );
};
```

## 🤖 AI Processing Quick Starts

### Transcribe Audio
```typescript
const result = await geminiService.transcribeAudio(recording);
console.log(result.text); // "Hello, how are you?"
```

### Interpret Intent
```typescript
const intent = await geminiService.interpretAudioIntent(recording);
console.log(intent.intent);          // "book_appointment"
console.log(intent.entities);        // { date: "tomorrow", time: "3pm" }
console.log(intent.confidence);      // 0.92
```

### Custom Prompt
```typescript
const response = await geminiService.processMultimodal(
  recording,
  'Explain this as if teaching a 5-year-old'
);
console.log(response.content);
```

### Text Only (No Audio)
```typescript
const response = await geminiService.generateFromText(
  'Write a poem about coding'
);
```

## 🔐 BYOK Key Management

### Set Key
```typescript
const { setAPIKey } = useAPIKey('gemini');
await setAPIKey('AIza...');
```

### Check If Key Exists
```typescript
const { hasKey } = useAPIKey('gemini');
const exists = await hasKey();
```

### Rotate Key
```typescript
const store = useBYOKStore();
await store.rotateAPIKey('gemini', 'new_key');
```

### Remove Key
```typescript
const { removeKey } = useAPIKey('gemini');
await removeKey();
```

### Get Audit Log
```typescript
const store = useBYOKStore();
const log = store.getAuditLog('gemini', 10);
// [{ timestamp, action, success, ... }, ...]
```

## 🎨 UI Component - Recording Status

```typescript
<Text>{state}</Text>
// "idle" | "recording" | "processing" | "success" | "error"

{isRecording && <ActivityIndicator />}

{recordingTime && <Text>{formatTime(recordingTime)}</Text>}

{currentRecording && (
  <Text>Recorded: {formatTime(currentRecording.duration)}</Text>
)}

{error && <Text style={errorStyle}>{error}</Text>}

{lastResult?.transcription && (
  <Text>{lastResult.transcription.text}</Text>
)}
```

## 📁 File Operations

### Save Recording
```typescript
const saved = await audioRecorder.saveRecording(recording);
// saved.filePath = '/Documents/audio_recording/audio_123.aac'
```

### Play Recording
```typescript
await audioRecorder.playRecording(recording.filePath);
await audioRecorder.stopPlayback();
```

### Delete Recording
```typescript
await audioRecorder.deleteRecording(recording.filePath);
```

### List All Recordings
```typescript
const recordings = await audioRecorder.listRecordings();
```

### Clean Up Old Recordings
```typescript
// Delete recordings older than 7 days
await audioRecorder.cleanupOldRecordings(7 * 24 * 60 * 60 * 1000);
```

## 🔄 Common Workflows

### Record → Transcribe → Create Node
```typescript
const { startRecording, stopRecording, transcribeAudio } = useAudioGemini();

// 1. Record
await startRecording();
await sleep(5000); // Record for 5 seconds
const recording = await stopRecording();

// 2. Transcribe
const transcription = await transcribeAudio(recording);

// 3. Create node
addNode({
  type: 'code',
  content: transcription.text,
  x: 0, y: 0, width: 320, height: 200,
});
```

### Record → Intent → Execute Command
```typescript
const { startRecording, stopRecording, interpretIntent } = useAudioGemini();

const recording = await stopRecording();
const intent = await interpretIntent(recording);

if (intent.intent === 'create_node') {
  addNode({ type: intent.entities.nodeType, ... });
}
else if (intent.intent === 'delete_node') {
  deleteNode(intent.entities.nodeId);
}
```

### Record → Context → Generate Response
```typescript
const { processWithPrompt } = useAudioGemini();

const response = await processWithPrompt(
  'User is asking about: ' + topic,
  recording,
  'You are a helpful assistant'
);

createChatMessage(response.content);
```

## 🚨 Error Handling

### Check If Key Is Configured
```typescript
const store = useBYOKStore();
const hasKey = await store.hasAPIKey('gemini');

if (!hasKey) {
  // Show setup screen
  navigateTo('APIKeySetup');
}
```

### Catch and Handle Errors
```typescript
try {
  await transcribeAudio();
} catch (error) {
  if (error instanceof GeminiServiceError) {
    if (error.retryable) {
      // Retry after delay
    } else {
      // Show error to user
    }
  }
}
```

### Use Hook Error State
```typescript
const { error, clearError } = useAudioGemini();

{error && (
  <View>
    <Text>{error}</Text>
    <Button title="Dismiss" onPress={clearError} />
  </View>
)}
```

## 📊 Performance

### Cache Size
```typescript
const status = geminiService.getStatus();
console.log(status.cacheSize); // Number of cached responses
```

### Clear Cache
```typescript
geminiService.clearCache();
```

### Recording Status
```typescript
const { isRecording, duration, currentPath } = 
  audioRecorder.getRecordingStatus();
```

## 🔧 Configuration

### Custom Recording Settings
```typescript
const recorder = new AudioRecorder({
  sampleRate: 44100,          // Hz
  numberOfChannels: 1,        // 1=mono, 2=stereo
  bitRate: 128000,            // bps
  quality: 1,                 // 0-1
});
```

### Custom Gemini Settings
```typescript
const config: GeminiRequestConfig = {
  temperature: 0.7,           // 0-1 (randomness)
  topK: 40,                   // Top K sampling
  topP: 0.95,                 // Top P sampling
  maxOutputTokens: 2048,      // Max response length
};

await geminiService.transcribeAudio(recording, config);
```

## 🎯 Hook Reference

### useAudioGemini (Complete)
```typescript
const {
  // State
  state, recordingTime, currentRecording, lastResult, error,
  isRecording, isProcessing,
  
  // Recording
  startRecording, stopRecording, playRecording, stopPlayback,
  deleteRecording,
  
  // AI
  transcribeAudio, interpretIntent, processWithPrompt,
  
  // Utilities
  clearError, reset,
} = useAudioGemini();
```

### useAudioRecorder (Recording Only)
```typescript
const {
  isRecording, recordingTime, recordings,
  startRecording, stopRecording,
  playRecording, stopPlayback,
  deleteRecording, listRecordings,
} = useAudioRecorder();
```

### useGeminiAPI (Direct Access)
```typescript
const {
  isConfigured,
  transcribeAudio, interpretIntent, processMultimodal,
  generateFromText, validateAPIKey, clearCache,
} = useGeminiAPI();
```

## 🐛 Troubleshooting Checklist

- [ ] Microphone permission granted?
- [ ] Using device (not emulator)?
- [ ] Gemini API key set?
- [ ] Internet connection active?
- [ ] Audio file exists at path?
- [ ] API key not rate limited?
- [ ] Using correct hook for your use case?
- [ ] Storage initialized with `initializeStorage()`?

## 📱 Demo Screen

```typescript
import { AudioGeminiDemoScreen } from '../screens/AudioGeminiDemoScreen';

// Shows complete workflow:
// 1. API Key setup
// 2. Recording controls
// 3. AI processing modes
// 4. Results display
```

## 🔐 Security Checklist

- [ ] Never hardcode API keys
- [ ] Use BYOK store for key management
- [ ] Validate key exists before use
- [ ] Don't log full API keys
- [ ] Clean up old recordings
- [ ] Clear cache periodically
- [ ] Stop recording when done
- [ ] Handle errors gracefully

## 📈 Token Counting

```typescript
const response = await geminiService.processMultimodal(...);

if (response.tokenCount) {
  console.log(`Input: ${response.tokenCount.inputTokens}`);
  console.log(`Output: ${response.tokenCount.outputTokens}`);
  console.log(`Total: ${response.tokenCount.inputTokens + 
                        response.tokenCount.outputTokens}`);
}
```

## 🔗 File Paths

```
iOS:
  Documents: /var/mobile/Containers/Data/Documents/
  Cache:     /var/mobile/Containers/Data/Library/Caches/
  
Android:
  Documents: /data/data/[package]/files/
  Cache:     /data/data/[package]/cache/
  
Orchestra Audio Files:
  Documents: {path}/audio_recordings/
  Cache:     {path}/audio_cache/
```

## 📚 Example Components

### Recording Button
```typescript
<TouchableOpacity onPress={isRecording ? stopRecording : startRecording}>
  <Text>{isRecording ? 'Stop' : 'Record'}</Text>
  {isRecording && <ActivityIndicator />}
</TouchableOpacity>
```

### Transcription Display
```typescript
{lastResult?.transcription && (
  <ScrollView>
    <Text>{lastResult.transcription.text}</Text>
  </ScrollView>
)}
```

### Error Display
```typescript
{error && (
  <View style={errorStyle}>
    <Text>{error}</Text>
  </View>
)}
```

## ⏱️ Timing Format

```typescript
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const displaySeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${displaySeconds}`;
}

formatTime(5230);  // "1:23"
formatTime(125);   // "0:00"
```

---

**Quick Links:**
- [Full Guide](./AUDIO_GEMINI_GUIDE.md)
- [Gemini API](https://ai.google.dev/gemini-api)
- [Demo Screen](../src/screens/AudioGeminiDemoScreen.tsx)
- [Services](../src/services/)
