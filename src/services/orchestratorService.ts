/**
 * Orchestrator Service
 * 
 * Coordinates AI-powered task decomposition and agent assignment
 * Uses Google Generative AI SDK with strict JSON schema validation
 * Transforms user intent into parallel sub-tasks with agent assignments
 * 
 * Features:
 * - Transcribed text → Task breakdown
 * - Structured JSON output with responseSchema
 * - Agent type assignment (coder, reviewer, terminal, etc.)
 * - Parallel task execution support
 * - Token usage tracking
 * - Error handling and validation
 * - Type-safe task structures
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { useBYOKStore } from '../store/byokStore';
import axios from 'axios';

/**
 * Supported agent types for task assignment
 */
export type AgentType = 
  | 'coder'           // Code generation and development
  | 'reviewer'        // Code review and quality assurance
  | 'terminal'        // Terminal/shell operations
  | 'architect'       // System design and planning
  | 'debugger'        // Problem diagnosis and debugging
  | 'documenter'      // Documentation and comments
  | 'tester'          // Testing and QA automation
  | 'analyst'         // Data analysis and reporting
  | 'researcher'      // Research and investigation
  | 'coordinator';    // Task coordination

/**
 * Priority levels for tasks
 */
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Individual sub-task for agent execution
 */
export interface SubTask {
  id: string;
  title: string;
  description: string;
  agentType: AgentType;
  priority: TaskPriority;
  dependencies?: string[];           // IDs of tasks that must complete first
  estimatedTokens?: number;
  context?: Record<string, unknown>;
}

/**
 * Decomposed task array output from Gemini
 */
export interface TaskDecomposition {
  mainObjective: string;
  summary: string;
  totalEstimatedTokens: number;
  subtasks: SubTask[];
  executionStrategy?: string;        // How tasks should be coordinated
  estimatedTimeMinutes?: number;
}

/**
 * Gemini API response wrapper
 */
export interface OrchestratorResponse {
  success: boolean;
  data?: TaskDecomposition;
  error?: string;
  tokensUsed?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  processingTimeMs: number;
  model: string;
  timestamp: string;
}

/**
 * Configuration for orchestrator behavior
 */
export interface OrchestratorConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  includeExecutionStrategy?: boolean;
  maxParallelTasks?: number;
  model?: string;
}

/**
 * JSON Schema for strict response validation
 * Ensures Gemini output conforms to expected structure
 */
const TASK_DECOMPOSITION_SCHEMA = {
  type: 'object',
  properties: {
    mainObjective: {
      type: 'string',
      description: 'The primary goal stated by the user',
    },
    summary: {
      type: 'string',
      description: 'Brief summary of the decomposition strategy',
    },
    totalEstimatedTokens: {
      type: 'integer',
      description: 'Estimated total tokens needed for all subtasks',
      minimum: 0,
    },
    subtasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            pattern: '^task_[0-9]+$',
            description: 'Unique task identifier (e.g., task_1, task_2)',
          },
          title: {
            type: 'string',
            minLength: 3,
            maxLength: 100,
            description: 'Brief task title',
          },
          description: {
            type: 'string',
            minLength: 10,
            maxLength: 500,
            description: 'Detailed task description with specific instructions',
          },
          agentType: {
            type: 'string',
            enum: [
              'coder',
              'reviewer',
              'terminal',
              'architect',
              'debugger',
              'documenter',
              'tester',
              'analyst',
              'researcher',
              'coordinator',
            ],
            description: 'Type of agent required for this task',
          },
          priority: {
            type: 'string',
            enum: ['critical', 'high', 'medium', 'low'],
            description: 'Task priority level',
          },
          dependencies: {
            type: 'array',
            items: {
              type: 'string',
              pattern: '^task_[0-9]+$',
            },
            description: 'Task IDs that must complete before this task',
          },
          estimatedTokens: {
            type: 'integer',
            minimum: 0,
            description: 'Estimated tokens needed for this specific task',
          },
          context: {
            type: 'object',
            description: 'Additional context-specific information for the agent',
            additionalProperties: true,
          },
        },
        required: ['id', 'title', 'description', 'agentType', 'priority'],
      },
      minItems: 1,
      maxItems: 20,
      description: 'Array of parallel sub-tasks',
    },
    executionStrategy: {
      type: 'string',
      description: 'Strategy for coordinating task execution',
    },
    estimatedTimeMinutes: {
      type: 'integer',
      minimum: 1,
      description: 'Estimated total execution time',
    },
  },
  required: ['mainObjective', 'summary', 'totalEstimatedTokens', 'subtasks'],
};

/**
 * System prompt that instructs Gemini to act as Project Manager
 */
const PROJECT_MANAGER_SYSTEM_PROMPT = `You are an expert Project Manager AI specializing in task decomposition and parallel execution optimization.

Your responsibility is to take user requests and break them down into granular, parallelizable sub-tasks that specialized agents can execute.

## Agent Types Available:
- **coder**: Writes clean, production-ready code with best practices
- **reviewer**: Reviews code quality, security, and best practices
- **terminal**: Executes shell commands and system operations
- **architect**: Designs system architecture and technical solutions
- **debugger**: Diagnoses issues and proposes fixes
- **documenter**: Writes technical documentation and comments
- **tester**: Creates and runs tests, validates functionality
- **analyst**: Analyzes data, generates reports, identifies patterns
- **researcher**: Investigates technologies, gathers information
- **coordinator**: Manages task dependencies and orchestration

## Task Decomposition Rules:
1. **Maximize Parallelization**: Assign tasks to run in parallel when dependencies allow
2. **Clear Dependencies**: Only specify dependencies when truly necessary (data flow, logical order)
3. **Specific Instructions**: Each task description must contain actionable steps for the assigned agent
4. **Realistic Estimation**: Provide token estimates based on task complexity
5. **Unique IDs**: Format task IDs as "task_1", "task_2", etc.
6. **Priority Levels**: Assign appropriate priorities (critical for blocking tasks, high for important, etc.)

## Task Output Requirements:
- Each task must be specific and actionable
- Tasks should be independent unless dependencies are necessary
- Include context for tasks that need additional information
- Estimate tokens realistically: simple 50-200, complex 500-2000
- Never create more than 20 subtasks per decomposition

## Response Format:
You MUST respond with ONLY valid JSON matching the schema, no markdown, no explanations, no code blocks.`;

/**
 * OrchestratorService
 * 
 * Main service for task decomposition using Gemini AI
 * Converts user transcriptions into structured task breakdowns
 */
export class OrchestratorService {
  private geminiClient: GoogleGenerativeAI | null = null;
  private apiKey: string | null = null;
  private model: string = 'gemini-2.0-flash';
  private requestCount: number = 0;
  private totalTokensUsed: number = 0;

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize Gemini AI client with BYOK API key
   */
  private async initializeClient(): Promise<void> {
    try {
      // Get API key from BYOK store
      const store = useBYOKStore.getState();
      const apiKey = await store.getAPIKey('gemini');

      if (!apiKey) {
        console.warn(
          'OrchestratorService: No Gemini API key found in BYOK store. ' +
          'Call setApiKey() before using orchestrator.'
        );
        return;
      }

      this.apiKey = apiKey;
      this.geminiClient = new GoogleGenerativeAI(apiKey);
      console.log('OrchestratorService: Gemini client initialized');
    } catch (error) {
      console.error('Failed to initialize OrchestratorService:', error);
    }
  }

  /**
   * Ensure Gemini client is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.geminiClient) {
      await this.initializeClient();
      if (!this.geminiClient) {
        throw new Error(
          'OrchestratorService not initialized. API key not configured. ' +
          'Set your Gemini API key using setApiKey() first.'
        );
      }
    }
  }

  /**
   * Set Gemini API key in BYOK store
   */
  public async setApiKey(apiKey: string): Promise<void> {
    try {
      const store = useBYOKStore.getState();
      await store.setAPIKey('gemini', apiKey);
      this.apiKey = apiKey;
      this.geminiClient = new GoogleGenerativeAI(apiKey);
      console.log('OrchestratorService: API key updated');
    } catch (error) {
      console.error('Failed to set API key:', error);
      throw error;
    }
  }

  /**
   * Decompose user request into parallel sub-tasks
   * 
   * @param userRequest - Transcribed user text or direct request
   * @param config - Optional configuration overrides
   * @returns Promise<OrchestratorResponse> with decomposed tasks
   */
  public async decomposeTask(
    userRequest: string,
    config: OrchestratorConfig = {}
  ): Promise<OrchestratorResponse> {
    const startTime = Date.now();

    try {
      await this.ensureInitialized();

      if (!userRequest || userRequest.trim().length === 0) {
        return {
          success: false,
          error: 'User request cannot be empty',
          processingTimeMs: Date.now() - startTime,
          model: this.model,
          timestamp: new Date().toISOString(),
        };
      }

      console.log(`[Orchestrator] Decomposing task: ${userRequest.substring(0, 100)}...`);

      // Prepare Gemini request with responseSchema
      const generationConfig = {
        temperature: config.temperature ?? 0.5, // Lower for consistent JSON
        topP: config.topP ?? 0.95,
        topK: config.topK ?? 40,
        maxOutputTokens: config.maxOutputTokens ?? 4096,
        responseMimeType: 'application/json',
        responseSchema: TASK_DECOMPOSITION_SCHEMA,
      };

      // Create the model instance
      const model = this.geminiClient!.getGenerativeModel({
        model: config.model ?? this.model,
        systemInstruction: PROJECT_MANAGER_SYSTEM_PROMPT,
      });

      // Build the prompt
      const prompt = `User Request: "${userRequest}"

Please decompose this request into parallel sub-tasks. Each task should have:
- A unique ID (task_1, task_2, etc.)
- Clear title and detailed description
- Appropriate agent type assignment
- Priority level
- Any dependencies between tasks
- Estimated tokens needed

Respond with ONLY valid JSON, no markdown or explanations.`;

      console.log('[Orchestrator] Sending request to Gemini API...');

      // Send request to Gemini with streaming disabled for JSON schema validation
      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig,
      });

      const responseText = response.response.text();
      console.log(`[Orchestrator] Received response (${responseText.length} chars)`);

      // Parse and validate JSON response
      let decomposition: TaskDecomposition;
      try {
        decomposition = JSON.parse(responseText) as TaskDecomposition;
      } catch (parseError) {
        console.error('Failed to parse Gemini response as JSON:', parseError);
        return {
          success: false,
          error: `Invalid JSON in response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          processingTimeMs: Date.now() - startTime,
          model: this.model,
          timestamp: new Date().toISOString(),
        };
      }

      // Validate decomposition structure
      const validationError = this.validateDecomposition(decomposition);
      if (validationError) {
        console.error('Decomposition validation failed:', validationError);
        return {
          success: false,
          error: `Decomposition validation failed: ${validationError}`,
          processingTimeMs: Date.now() - startTime,
          model: this.model,
          timestamp: new Date().toISOString(),
        };
      }

      // Extract token usage
      const usageMetadata = response.response.usageMetadata;
      const tokensUsed = {
        inputTokens: usageMetadata?.promptTokenCount ?? 0,
        outputTokens: usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: (usageMetadata?.promptTokenCount ?? 0) + (usageMetadata?.candidatesTokenCount ?? 0),
      };

      // Update metrics
      this.requestCount++;
      this.totalTokensUsed += tokensUsed.totalTokens;

      console.log(
        `[Orchestrator] Task decomposition complete. ` +
        `Created ${decomposition.subtasks.length} tasks. ` +
        `Tokens: ${tokensUsed.totalTokens} (input: ${tokensUsed.inputTokens}, output: ${tokensUsed.outputTokens})`
      );

      return {
        success: true,
        data: decomposition,
        tokensUsed,
        processingTimeMs: Date.now() - startTime,
        model: config.model ?? this.model,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Orchestrator] Error during decomposition:', errorMessage);

      return {
        success: false,
        error: `Decomposition failed: ${errorMessage}`,
        processingTimeMs: Date.now() - startTime,
        model: this.model,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate task decomposition structure
   * Ensures all required fields are present and correctly formatted
   */
  private validateDecomposition(data: unknown): string | null {
    if (!data || typeof data !== 'object') {
      return 'Response is not a valid object';
    }

    const decomp = data as Record<string, unknown>;

    // Check required fields
    if (typeof decomp.mainObjective !== 'string' || !decomp.mainObjective.trim()) {
      return 'mainObjective must be a non-empty string';
    }

    if (typeof decomp.summary !== 'string' || !decomp.summary.trim()) {
      return 'summary must be a non-empty string';
    }

    if (typeof decomp.totalEstimatedTokens !== 'number' || decomp.totalEstimatedTokens < 0) {
      return 'totalEstimatedTokens must be a non-negative number';
    }

    if (!Array.isArray(decomp.subtasks)) {
      return 'subtasks must be an array';
    }

    if (decomp.subtasks.length === 0) {
      return 'subtasks array must contain at least one task';
    }

    if (decomp.subtasks.length > 20) {
      return 'subtasks array must contain at most 20 tasks';
    }

    // Validate each subtask
    const taskIds = new Set<string>();
    for (let i = 0; i < decomp.subtasks.length; i++) {
      const task = decomp.subtasks[i];

      if (!task || typeof task !== 'object') {
        return `Subtask ${i} is not a valid object`;
      }

      const t = task as Record<string, unknown>;

      // Required fields
      if (typeof t.id !== 'string' || !t.id.match(/^task_\d+$/)) {
        return `Subtask ${i}: id must match pattern "task_N"`;
      }

      if (taskIds.has(t.id)) {
        return `Subtask ${i}: duplicate id "${t.id}"`;
      }
      taskIds.add(t.id);

      if (typeof t.title !== 'string' || t.title.length < 3) {
        return `Subtask ${i}: title must be a string with at least 3 characters`;
      }

      if (typeof t.description !== 'string' || t.description.length < 10) {
        return `Subtask ${i}: description must be a string with at least 10 characters`;
      }

      if (typeof t.agentType !== 'string') {
        return `Subtask ${i}: agentType must be a string`;
      }

      const validAgentTypes = [
        'coder',
        'reviewer',
        'terminal',
        'architect',
        'debugger',
        'documenter',
        'tester',
        'analyst',
        'researcher',
        'coordinator',
      ];
      if (!validAgentTypes.includes(t.agentType)) {
        return `Subtask ${i}: agentType must be one of ${validAgentTypes.join(', ')}`;
      }

      if (typeof t.priority !== 'string') {
        return `Subtask ${i}: priority must be a string`;
      }

      const validPriorities = ['critical', 'high', 'medium', 'low'];
      if (!validPriorities.includes(t.priority)) {
        return `Subtask ${i}: priority must be one of ${validPriorities.join(', ')}`;
      }

      // Optional fields
      if (t.dependencies) {
        if (!Array.isArray(t.dependencies)) {
          return `Subtask ${i}: dependencies must be an array`;
        }

        for (const dep of t.dependencies) {
          if (typeof dep !== 'string' || !dep.match(/^task_\d+$/)) {
            return `Subtask ${i}: invalid dependency "${dep}"`;
          }
        }
      }

      if (t.estimatedTokens !== undefined) {
        if (typeof t.estimatedTokens !== 'number' || t.estimatedTokens < 0) {
          return `Subtask ${i}: estimatedTokens must be a non-negative number`;
        }
      }
    }

    // Validate that all referenced dependencies exist
    for (const task of decomp.subtasks as SubTask[]) {
      if (task.dependencies) {
        for (const depId of task.dependencies) {
          if (!taskIds.has(depId)) {
            return `Task ${task.id} references non-existent dependency "${depId}"`;
          }
        }
      }
    }

    return null; // No validation errors
  }

  /**
   * Get current service metrics
   */
  public getMetrics(): {
    requestCount: number;
    totalTokensUsed: number;
    averageTokensPerRequest: number;
  } {
    return {
      requestCount: this.requestCount,
      totalTokensUsed: this.totalTokensUsed,
      averageTokensPerRequest:
        this.requestCount > 0 ? Math.round(this.totalTokensUsed / this.requestCount) : 0,
    };
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.requestCount = 0;
    this.totalTokensUsed = 0;
  }

  /**
   * Format task decomposition for display
   */
  public formatDecomposition(decomposition: TaskDecomposition): string {
    let output = `\n${'='.repeat(60)}\n`;
    output += `TASK DECOMPOSITION\n`;
    output += `${'='.repeat(60)}\n\n`;

    output += `Objective: ${decomposition.mainObjective}\n`;
    output += `Summary: ${decomposition.summary}\n`;
    output += `Estimated Tokens: ${decomposition.totalEstimatedTokens}\n`;
    if (decomposition.estimatedTimeMinutes) {
      output += `Estimated Time: ${decomposition.estimatedTimeMinutes} minutes\n`;
    }
    output += '\n';

    output += `SUBTASKS (${decomposition.subtasks.length}):\n`;
    output += `${'-'.repeat(60)}\n\n`;

    for (const task of decomposition.subtasks) {
      output += `[${task.id}] ${task.title}\n`;
      output += `  Agent: ${task.agentType} | Priority: ${task.priority}\n`;
      output += `  Description: ${task.description}\n`;

      if (task.dependencies && task.dependencies.length > 0) {
        output += `  Depends on: ${task.dependencies.join(', ')}\n`;
      }

      if (task.estimatedTokens) {
        output += `  Est. Tokens: ${task.estimatedTokens}\n`;
      }

      if (task.context && Object.keys(task.context).length > 0) {
        output += `  Context: ${JSON.stringify(task.context)}\n`;
      }

      output += '\n';
    }

    if (decomposition.executionStrategy) {
      output += `EXECUTION STRATEGY:\n`;
      output += `${'-'.repeat(60)}\n`;
      output += `${decomposition.executionStrategy}\n\n`;
    }

    output += `${'='.repeat(60)}\n`;

    return output;
  }

  /**
   * Export decomposition to JSON
   */
  public exportDecompositionJSON(decomposition: TaskDecomposition): string {
    return JSON.stringify(decomposition, null, 2);
  }

  /**
   * Test Gemini connection and schema validation
   */
  public async testConnection(): Promise<{
    connected: boolean;
    message: string;
    model?: string;
  }> {
    try {
      this.ensureInitialized();

      const model = this.geminiClient!.getGenerativeModel({
        model: this.model,
      });

      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Respond with JSON: {"status": "ok"}',
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 50,
        },
      });

      return {
        connected: true,
        message: 'Connected to Gemini API successfully',
        model: this.model,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        connected: false,
        message: `Failed to connect: ${errorMessage}`,
      };
    }
  }
}

/**
 * Export singleton instance
 */
export const orchestratorService = new OrchestratorService();

/**
 * Export types for external use
 */
export type {
  TaskDecomposition,
  SubTask,
  OrchestratorResponse,
  OrchestratorConfig,
};
