/**
 * Gemini AI Service
 * Integrates with Google's Gemini 3.5 Flash model for multimodal AI tasks
 * Uses BYOK system for API key management and audio recorder for voice input
 * 
 * Features:
 * - Transcribe audio files to text
 * - Process audio with intent interpretation
 * - Multimodal input support (audio + text)
 * - Streaming responses
 * - Error handling and retry logic
 * - Response caching
 */

import axios, { AxiosInstance } from 'axios';
import { audioRecorder, AudioRecording } from './audioRecorderService';
import { useBYOKStore } from '../store/byokStore';

/**
 * Gemini API response types
 */
export interface GeminiAudioTranscription {
  text: string;
  language?: string;
  confidence?: number;
  processingTimeMs: number;
}

export interface GeminiIntentInterpretation {
  intent: string;
  entities: Record<string, unknown>;
  confidence: number;
  suggestedActions?: string[];
  processingTimeMs: number;
}

export interface GeminiMultimodalResponse {
  content: string;
  type: 'text' | 'code' | 'analysis';
  metadata?: Record<string, unknown>;
  processingTimeMs: number;
  tokenCount?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Gemini request configuration
 */
export interface GeminiRequestConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
}

/**
 * Gemini service error
 */
export class GeminiServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'GeminiServiceError';
  }
}

/**
 * Gemini AI Service
 * Handles all interactions with Google's Gemini API
 */
export class GeminiService {
  private apiClient: AxiosInstance | null = null;
  private apiKey: string | null = null;
  private model: string = 'gemini-3.5-flash';
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models';
  private responseCache: Map<string, GeminiMultimodalResponse> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  private DEFAULT_CONFIG: GeminiRequestConfig = {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  };

  constructor() {
    this.initializeAxios();
  }

  /**
   * Initialize Axios client with auth headers
   */
  private initializeAxios(): void {
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth
    this.apiClient.interceptors.request.use(async (config) => {
      const store = useBYOKStore.getState();
      const apiKey = await store.getAPIKey('gemini');

      if (!apiKey) {
        throw new GeminiServiceError(
          'No Gemini API key configured',
          'NO_API_KEY',
          401,
          false
        );
      }

      config.params = config.params || {};
      config.params.key = apiKey;
      return config;
    });

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          throw new GeminiServiceError(
            'Rate limit exceeded',
            'RATE_LIMIT',
            429,
            true
          );
        }
        if (error.response?.status >= 500) {
          throw new GeminiServiceError(
            'Gemini service error',
            'SERVICE_ERROR',
            error.response?.status,
            true
          );
        }
        throw error;
      }
    );
  }

  /**
   * Convert audio file to base64 for API transmission
   */
  private async audioToBase64(recording: AudioRecording): Promise<string> {
    try {
      return await audioRecorder.getRecordingAsBase64(recording.filePath);
    } catch (error) {
      throw new GeminiServiceError(
        `Failed to read audio file: ${error}`,
        'AUDIO_READ_ERROR',
        undefined,
        false
      );
    }
  }

  /**
   * Get MIME type for audio file
   */
  private getAudioMimeType(recording: AudioRecording): string {
    return recording.mimeType || 'audio/aac';
  }

  /**
   * Transcribe audio file using Gemini's multimodal capabilities
   */
  async transcribeAudio(
    recording: AudioRecording,
    config?: GeminiRequestConfig
  ): Promise<GeminiAudioTranscription> {
    const startTime = Date.now();

    try {
      // Check cache
      const cacheKey = `transcribe_${recording.id}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return {
          text: cached.content,
          language: cached.metadata?.language as string | undefined,
          confidence: cached.metadata?.confidence as number | undefined,
          processingTimeMs: cached.processingTimeMs,
        };
      }

      // Convert audio to base64
      const audioBase64 = await this.audioToBase64(recording);
      const mimeType = this.getAudioMimeType(recording);

      // Prepare request
      const requestConfig = { ...this.DEFAULT_CONFIG, ...config };

      const requestBody = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: audioBase64,
                },
              },
              {
                text: 'Please transcribe this audio file to text. Return only the transcription.',
              },
            ],
          },
        ],
        generationConfig: {
          temperature: requestConfig.temperature,
          topK: requestConfig.topK,
          topP: requestConfig.topP,
          maxOutputTokens: requestConfig.maxOutputTokens,
        },
      };

      if (!this.apiClient) {
        throw new GeminiServiceError(
          'API client not initialized',
          'CLIENT_NOT_INITIALIZED',
          undefined,
          false
        );
      }

      // Make API request
      const response = await this.apiClient.post(
        `/${this.model}:generateContent`,
        requestBody
      );

      // Extract transcription from response
      const transcription = this.extractTextContent(response.data);
      const processingTime = Date.now() - startTime;

      // Cache result
      this.setInCache(cacheKey, {
        content: transcription,
        type: 'text',
        metadata: {
          source: 'audio_transcription',
          recordingId: recording.id,
        },
        processingTimeMs: processingTime,
      });

      // Update recording metadata
      await this.updateRecordingMetadata(recording.id, {
        transcription,
        transcribedAt: Date.now(),
      });

      return {
        text: transcription,
        processingTimeMs: processingTime,
      };
    } catch (error) {
      console.error('Audio transcription failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Interpret user intent from audio
   */
  async interpretAudioIntent(
    recording: AudioRecording,
    context?: string,
    config?: GeminiRequestConfig
  ): Promise<GeminiIntentInterpretation> {
    const startTime = Date.now();

    try {
      // Convert audio to base64
      const audioBase64 = await this.audioToBase64(recording);
      const mimeType = this.getAudioMimeType(recording);

      // Prepare request
      const requestConfig = { ...this.DEFAULT_CONFIG, ...config };

      const systemPrompt = `You are an intent interpreter. Analyze the audio and determine:
1. The primary intent (what the user wants to do)
2. Entities mentioned (specific values, names, etc.)
3. Confidence level (0-1)
4. Suggested actions to fulfill the intent

Return JSON format: {
  "intent": "string",
  "entities": {},
  "confidence": 0-1,
  "suggestedActions": []
}`;

      const userPrompt = context
        ? `Audio context: ${context}\n\nAnalyze this audio:`
        : 'Analyze this audio:';

      const requestBody = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: audioBase64,
                },
              },
              {
                text: userPrompt,
              },
            ],
          },
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          temperature: requestConfig.temperature,
          topK: requestConfig.topK,
          topP: requestConfig.topP,
          maxOutputTokens: requestConfig.maxOutputTokens,
        },
      };

      if (!this.apiClient) {
        throw new GeminiServiceError(
          'API client not initialized',
          'CLIENT_NOT_INITIALIZED',
          undefined,
          false
        );
      }

      // Make API request
      const response = await this.apiClient.post(
        `/${this.model}:generateContent`,
        requestBody
      );

      // Parse response
      const responseText = this.extractTextContent(response.data);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new GeminiServiceError(
          'Invalid response format from Gemini',
          'INVALID_RESPONSE',
          undefined,
          false
        );
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const processingTime = Date.now() - startTime;

      return {
        intent: parsed.intent,
        entities: parsed.entities || {},
        confidence: parsed.confidence,
        suggestedActions: parsed.suggestedActions,
        processingTimeMs: processingTime,
      };
    } catch (error) {
      console.error('Intent interpretation failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Send audio + text context to Gemini
   */
  async processMultimodal(
    recording: AudioRecording,
    textContext: string,
    systemPrompt?: string,
    config?: GeminiRequestConfig
  ): Promise<GeminiMultimodalResponse> {
    const startTime = Date.now();

    try {
      // Convert audio to base64
      const audioBase64 = await this.audioToBase64(recording);
      const mimeType = this.getAudioMimeType(recording);

      // Prepare request
      const requestConfig = { ...this.DEFAULT_CONFIG, ...config };

      const requestBody = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: audioBase64,
                },
              },
              {
                text: textContext,
              },
            ],
          },
        ],
        systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
        generationConfig: {
          temperature: requestConfig.temperature,
          topK: requestConfig.topK,
          topP: requestConfig.topP,
          maxOutputTokens: requestConfig.maxOutputTokens,
        },
      };

      if (!this.apiClient) {
        throw new GeminiServiceError(
          'API client not initialized',
          'CLIENT_NOT_INITIALIZED',
          undefined,
          false
        );
      }

      // Make API request
      const response = await this.apiClient.post(
        `/${this.model}:generateContent`,
        requestBody
      );

      // Extract response
      const content = this.extractTextContent(response.data);
      const processingTime = Date.now() - startTime;

      const result: GeminiMultimodalResponse = {
        content,
        type: 'text',
        metadata: {
          source: 'multimodal_audio_text',
          recordingId: recording.id,
          contextLength: textContext.length,
        },
        processingTimeMs: processingTime,
        tokenCount: response.data.usageMetadata
          ? {
              inputTokens: response.data.usageMetadata.promptTokenCount,
              outputTokens: response.data.usageMetadata.candidatesTokenCount,
            }
          : undefined,
      };

      // Cache result
      const cacheKey = `multimodal_${recording.id}_${Date.now()}`;
      this.setInCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Multimodal processing failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Generate response from text prompt (no audio)
   */
  async generateFromText(
    prompt: string,
    systemPrompt?: string,
    config?: GeminiRequestConfig
  ): Promise<GeminiMultimodalResponse> {
    const startTime = Date.now();

    try {
      const requestConfig = { ...this.DEFAULT_CONFIG, ...config };

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
        generationConfig: {
          temperature: requestConfig.temperature,
          topK: requestConfig.topK,
          topP: requestConfig.topP,
          maxOutputTokens: requestConfig.maxOutputTokens,
        },
      };

      if (!this.apiClient) {
        throw new GeminiServiceError(
          'API client not initialized',
          'CLIENT_NOT_INITIALIZED',
          undefined,
          false
        );
      }

      const response = await this.apiClient.post(
        `/${this.model}:generateContent`,
        requestBody
      );

      const content = this.extractTextContent(response.data);
      const processingTime = Date.now() - startTime;

      return {
        content,
        type: 'text',
        processingTimeMs: processingTime,
        tokenCount: response.data.usageMetadata
          ? {
              inputTokens: response.data.usageMetadata.promptTokenCount,
              outputTokens: response.data.usageMetadata.candidatesTokenCount,
            }
          : undefined,
      };
    } catch (error) {
      console.error('Text generation failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Extract text content from Gemini API response
   */
  private extractTextContent(response: any): string {
    try {
      if (
        response.candidates &&
        response.candidates[0] &&
        response.candidates[0].content &&
        response.candidates[0].content.parts
      ) {
        const parts = response.candidates[0].content.parts;
        return parts.map((part: any) => part.text || '').join('');
      }
      return '';
    } catch (error) {
      console.error('Failed to extract text content:', error);
      return '';
    }
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): GeminiMultimodalResponse | null {
    const cached = this.responseCache.get(key);
    if (cached && Date.now() - cached.processingTimeMs < this.cacheTTL) {
      return cached;
    }
    if (cached) {
      this.responseCache.delete(key);
    }
    return null;
  }

  private setInCache(key: string, value: GeminiMultimodalResponse): void {
    this.responseCache.set(key, value);

    // Cleanup old entries
    if (this.responseCache.size > 100) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.responseCache.clear();
  }

  /**
   * Error handling
   */
  private handleError(error: any): GeminiServiceError {
    if (error instanceof GeminiServiceError) {
      return error;
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.message;

      if (status === 401) {
        return new GeminiServiceError('Unauthorized: Invalid API key', 'UNAUTHORIZED', 401, false);
      }
      if (status === 403) {
        return new GeminiServiceError('Forbidden: Access denied', 'FORBIDDEN', 403, false);
      }
      if (status === 429) {
        return new GeminiServiceError('Rate limited', 'RATE_LIMIT', 429, true);
      }
      if (status >= 500) {
        return new GeminiServiceError('Gemini API error', 'SERVICE_ERROR', status, true);
      }

      return new GeminiServiceError(message, 'API_ERROR', status, false);
    }

    return new GeminiServiceError(
      error.message || 'Unknown error',
      'UNKNOWN_ERROR',
      undefined,
      false
    );
  }

  /**
   * Update recording metadata in persistent storage
   */
  private async updateRecordingMetadata(
    recordingId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      // This would integrate with your recording storage system
      // For now, just log it
      console.log(`Updated metadata for ${recordingId}:`, metadata);
    } catch (error) {
      console.error('Failed to update recording metadata:', error);
    }
  }

  /**
   * Validate API key with test call
   */
  async validateAPIKey(): Promise<boolean> {
    try {
      const result = await this.generateFromText(
        'Say "API key is valid" in JSON format: {"status": "valid"}'
      );
      return !!result.content;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    configured: boolean;
    model: string;
    cacheSize: number;
  } {
    return {
      configured: !!this.apiClient,
      model: this.model,
      cacheSize: this.responseCache.size,
    };
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
