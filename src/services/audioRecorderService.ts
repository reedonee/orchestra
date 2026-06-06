/**
 * Audio Recording Service
 * Handles audio recording, playback, and file management using react-native-audio-recorder-player
 * 
 * Features:
 * - Record audio to temporary storage
 * - Save recordings with metadata
 * - Retrieve audio files for processing
 * - Clean up old recordings
 * - Handle permission requests
 */

import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
} from 'react-native-audio-recorder-player';
import { Platform, PermissionsAndroid, NativeModules } from 'react-native';
import * as fs from 'react-native-fs';

const audioRecorderPlayer = new AudioRecorderPlayer();

/**
 * Audio recording metadata
 */
export interface AudioRecording {
  id: string;
  filePath: string;
  fileName: string;
  duration: number; // milliseconds
  fileSize: number; // bytes
  mimeType: string;
  timestamp: number;
  isProcessed: boolean;
}

/**
 * Recording configuration
 */
export interface RecordingConfig {
  audioSourceAndroid?: AudioSourceAndroidType;
  audioEncoderAndroid?: AudioEncoderAndroidType;
  audioEncoderIOS?: number;
  audioFormatIOS?: number;
  sampleRate?: number;
  numberOfChannels?: number;
  bitRate?: number;
  quality?: number;
}

const DEFAULT_CONFIG: RecordingConfig = {
  audioSourceAndroid: AudioSourceAndroidType.MIC,
  audioEncoderAndroid: AudioEncoderAndroidType.AAC,
  audioEncoderIOS: 1,
  audioFormatIOS: 1,
  sampleRate: 48000,
  numberOfChannels: 1,
  bitRate: 128000,
  quality: 1,
};

/**
 * Audio files storage paths
 */
class AudioStoragePaths {
  static get documentsPath(): string {
    return `${fs.DocumentDirectoryPath}/audio_recordings`;
  }

  static get cachePath(): string {
    return `${fs.CachesDirectoryPath}/audio_cache`;
  }

  static get recordingPath(): string {
    if (Platform.OS === 'ios') {
      return `${fs.DocumentDirectoryPath}/recording.m4a`;
    }
    return `${fs.DocumentDirectoryPath}/recording.aac`;
  }
}

/**
 * Audio Recorder Service
 * Provides recording, playback, and file management capabilities
 */
export class AudioRecorder {
  private isRecording: boolean = false;
  private recordingStartTime: number = 0;
  private currentRecordingPath: string = '';
  private recordingDuration: number = 0;

  constructor(private config: RecordingConfig = DEFAULT_CONFIG) {}

  /**
   * Initialize audio storage directories
   */
  async initializeStorage(): Promise<void> {
    try {
      const documentsPath = AudioStoragePaths.documentsPath;
      const cachePath = AudioStoragePaths.cachePath;

      // Create directories if they don't exist
      const docExists = await fs.exists(documentsPath);
      if (!docExists) {
        await fs.mkdir(documentsPath);
      }

      const cacheExists = await fs.exists(cachePath);
      if (!cacheExists) {
        await fs.mkdir(cachePath);
      }
    } catch (error) {
      console.error('Failed to initialize audio storage:', error);
      throw error;
    }
  }

  /**
   * Request audio recording permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);

        return (
          grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
          PermissionsAndroid.RESULTS.GRANTED
        );
      }
      // iOS handles permissions automatically in Info.plist
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  /**
   * Start audio recording
   */
  async startRecording(fileName?: string): Promise<string> {
    try {
      // Check permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Audio recording permission denied');
      }

      // Stop any ongoing recording
      if (this.isRecording) {
        await this.stopRecording();
      }

      // Initialize storage
      await this.initializeStorage();

      // Set recording path
      this.currentRecordingPath = fileName || AudioStoragePaths.recordingPath;
      this.recordingStartTime = Date.now();
      this.isRecording = true;

      // Start recording
      await audioRecorderPlayer.startRecorder(
        this.currentRecordingPath,
        this.config
      );

      console.log(`Recording started: ${this.currentRecordingPath}`);
      return this.currentRecordingPath;
    } catch (error) {
      this.isRecording = false;
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop audio recording and return recording info
   */
  async stopRecording(): Promise<AudioRecording | null> {
    try {
      if (!this.isRecording) {
        console.warn('No active recording to stop');
        return null;
      }

      const result = await audioRecorderPlayer.stopRecorder();
      this.isRecording = false;

      this.recordingDuration = Date.now() - this.recordingStartTime;

      // Get file info
      const fileInfo = await fs.stat(this.currentRecordingPath);
      const fileName = this.currentRecordingPath.split('/').pop() || 'recording';

      const recording: AudioRecording = {
        id: `recording_${Date.now()}`,
        filePath: this.currentRecordingPath,
        fileName,
        duration: this.recordingDuration,
        fileSize: fileInfo.size,
        mimeType: Platform.OS === 'ios' ? 'audio/mp4' : 'audio/aac',
        timestamp: Date.now(),
        isProcessed: false,
      };

      console.log(`Recording stopped: ${this.currentRecordingPath}`);
      return recording;
    } catch (error) {
      this.isRecording = false;
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  /**
   * Pause recording (iOS only)
   */
  async pauseRecording(): Promise<void> {
    try {
      if (!this.isRecording) {
        throw new Error('No active recording to pause');
      }

      if (Platform.OS === 'ios') {
        await audioRecorderPlayer.pauseRecorder();
        console.log('Recording paused');
      } else {
        throw new Error('Pause is only supported on iOS');
      }
    } catch (error) {
      console.error('Failed to pause recording:', error);
      throw error;
    }
  }

  /**
   * Resume recording (iOS only)
   */
  async resumeRecording(): Promise<void> {
    try {
      if (!this.isRecording) {
        throw new Error('No active recording to resume');
      }

      if (Platform.OS === 'ios') {
        await audioRecorderPlayer.resumeRecorder();
        console.log('Recording resumed');
      } else {
        throw new Error('Resume is only supported on iOS');
      }
    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw error;
    }
  }

  /**
   * Play audio file
   */
  async playRecording(filePath: string): Promise<void> {
    try {
      const msg = await audioRecorderPlayer.startPlayer(filePath);
      console.log(`Playing: ${msg}`);
    } catch (error) {
      console.error('Failed to play recording:', error);
      throw error;
    }
  }

  /**
   * Stop audio playback
   */
  async stopPlayback(): Promise<void> {
    try {
      await audioRecorderPlayer.stopPlayer();
    } catch (error) {
      console.error('Failed to stop playback:', error);
      throw error;
    }
  }

  /**
   * Save recording to permanent storage
   */
  async saveRecording(
    recording: AudioRecording,
    customFileName?: string
  ): Promise<AudioRecording> {
    try {
      const documentsPath = AudioStoragePaths.documentsPath;
      const fileName = customFileName || `audio_${recording.id}.${this.getFileExtension()}`;
      const destinationPath = `${documentsPath}/${fileName}`;

      // Copy from temporary location to documents
      await fs.copyFile(recording.filePath, destinationPath);

      const updatedRecording: AudioRecording = {
        ...recording,
        filePath: destinationPath,
        fileName,
        isProcessed: false,
      };

      console.log(`Recording saved: ${destinationPath}`);
      return updatedRecording;
    } catch (error) {
      console.error('Failed to save recording:', error);
      throw error;
    }
  }

  /**
   * Delete recording file
   */
  async deleteRecording(filePath: string): Promise<void> {
    try {
      const exists = await fs.exists(filePath);
      if (exists) {
        await fs.unlink(filePath);
        console.log(`Recording deleted: ${filePath}`);
      }
    } catch (error) {
      console.error('Failed to delete recording:', error);
      throw error;
    }
  }

  /**
   * Get recording file as base64
   */
  async getRecordingAsBase64(filePath: string): Promise<string> {
    try {
      const exists = await fs.exists(filePath);
      if (!exists) {
        throw new Error(`File not found: ${filePath}`);
      }

      const base64Data = await fs.readFile(filePath, 'base64');
      return base64Data;
    } catch (error) {
      console.error('Failed to read recording as base64:', error);
      throw error;
    }
  }

  /**
   * Get recording file as binary data
   */
  async getRecordingAsBuffer(filePath: string): Promise<Buffer> {
    try {
      const base64Data = await this.getRecordingAsBase64(filePath);
      return Buffer.from(base64Data, 'base64');
    } catch (error) {
      console.error('Failed to read recording as buffer:', error);
      throw error;
    }
  }

  /**
   * List all saved recordings
   */
  async listRecordings(): Promise<AudioRecording[]> {
    try {
      const documentsPath = AudioStoragePaths.documentsPath;
      const files = await fs.readDir(documentsPath);

      const recordings: AudioRecording[] = [];

      for (const file of files) {
        if (file.isFile() && this.isAudioFile(file.name)) {
          const filePath = `${documentsPath}/${file.name}`;
          const recording: AudioRecording = {
            id: file.name,
            filePath,
            fileName: file.name,
            duration: 0,
            fileSize: file.size || 0,
            mimeType: this.getMimeType(file.name),
            timestamp: file.mtime || 0,
            isProcessed: false,
          };
          recordings.push(recording);
        }
      }

      return recordings;
    } catch (error) {
      console.error('Failed to list recordings:', error);
      return [];
    }
  }

  /**
   * Clean up old recordings
   */
  async cleanupOldRecordings(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const recordings = await this.listRecordings();
      const now = Date.now();
      let deletedCount = 0;

      for (const recording of recordings) {
        const age = now - recording.timestamp;
        if (age > maxAgeMs) {
          await this.deleteRecording(recording.filePath);
          deletedCount++;
        }
      }

      console.log(`Cleaned up ${deletedCount} old recordings`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup recordings:', error);
      return 0;
    }
  }

  /**
   * Get current recording status
   */
  getRecordingStatus(): {
    isRecording: boolean;
    duration: number;
    currentPath: string;
  } {
    return {
      isRecording: this.isRecording,
      duration: this.isRecording ? Date.now() - this.recordingStartTime : 0,
      currentPath: this.currentRecordingPath,
    };
  }

  /**
   * Check if file is audio file
   */
  private isAudioFile(fileName: string): boolean {
    const audioExtensions = ['.aac', '.m4a', '.mp3', '.wav', '.ogg'];
    return audioExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }

  /**
   * Get file extension based on platform
   */
  private getFileExtension(): string {
    return Platform.OS === 'ios' ? 'm4a' : 'aac';
  }

  /**
   * Get MIME type from file name
   */
  private getMimeType(fileName: string): string {
    if (fileName.endsWith('.m4a')) return 'audio/mp4';
    if (fileName.endsWith('.aac')) return 'audio/aac';
    if (fileName.endsWith('.mp3')) return 'audio/mpeg';
    if (fileName.endsWith('.wav')) return 'audio/wav';
    if (fileName.endsWith('.ogg')) return 'audio/ogg';
    return 'audio/mpeg';
  }

  /**
   * Cleanup: Stop recording and playback
   */
  async cleanup(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      }
      await this.stopPlayback();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Export singleton instance
export const audioRecorder = new AudioRecorder();
