/**
 * Task Executor Service
 * 
 * Executes decomposed tasks in parallel using Gemini 3.5 Flash streaming
 * Provides real-time canvas updates via Zustand store
 * Handles concurrent streams without blocking the main thread
 * 
 * Features:
 * - Parallel task execution
 * - Real-time streaming updates
 * - Canvas node creation and updates
 * - Concurrent stream management
 * - Error recovery per-task
 * - Progress tracking
 * - Token usage aggregation
 * - Non-blocking execution
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SubTask, TaskDecomposition } from './orchestratorService';
import { useBYOKStore } from '../store/byokStore';
import { useCanvasStore } from '../store/canvasStore';

/**
 * Task execution result
 */
export interface TaskExecutionResult {
  taskId: string;
  nodeId: string;
  title: string;
  success: boolean;
  content: string;
  error?: string;
  tokensUsed?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  processingTimeMs: number;
  timestamp: string;
  streamedAt?: number; // Chunks received during execution
}

/**
 * Parallel execution statistics
 */
export interface ExecutionStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalTokensUsed: number;
  totalProcessingTimeMs: number;
  concurrentStreams: number;
  averageChunkSize: number;
  startedAt: string;
  completedAt?: string;
}

/**
 * Task executor with streaming support
 */
class TaskExecutorService {
  private client: GoogleGenerativeAI | null = null;
  private model = 'gemini-3.5-flash';
  private activeStreams = new Set<string>();
  private stats: ExecutionStats = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    totalTokensUsed: 0,
    totalProcessingTimeMs: 0,
    concurrentStreams: 0,
    averageChunkSize: 0,
    startedAt: new Date().toISOString(),
  };

  /**
   * Initialize the executor with API key from BYOK store
   */
  async initializeClient(): Promise<void> {
    try {
      const byokStore = useBYOKStore.getState();
      const apiKey = byokStore.getApiKey('gemini');

      if (!apiKey) {
        throw new Error('Gemini API key not configured in BYOK store');
      }

      this.client = new GoogleGenerativeAI(apiKey);
    } catch (error) {
      console.error('Failed to initialize task executor:', error);
      throw error;
    }
  }

  /**
   * Ensure client is initialized before use
   */
  private ensureInitialized(): void {
    if (!this.client) {
      throw new Error(
        'Task executor not initialized. Call initializeClient() first'
      );
    }
  }

  /**
   * Generate execution context prompt for a task
   */
  private getTaskPrompt(task: SubTask, allTasks: SubTask[]): string {
    const completedDependencies = task.dependencies
      ?.filter((depId) => {
        const depTask = allTasks.find((t) => t.id === depId);
        return depTask ? 'completed' : 'pending';
      })
      .join(', ') || 'none';

    return `
You are a ${task.agentType} agent executing the following task:

TASK: ${task.title}
DESCRIPTION: ${task.description}
PRIORITY: ${task.priority}
AGENT TYPE: ${task.agentType}
ESTIMATED TOKENS: ${task.estimatedTokens || 'N/A'}
DEPENDENCIES COMPLETED: ${completedDependencies}

Context: ${JSON.stringify(task.context || {})}

Provide a detailed execution plan and output for this task. Be specific and actionable.
Format your response as a comprehensive execution report.
`;
  }

  /**
   * Get system prompt for task execution
   */
  private getSystemPrompt(task: SubTask): string {
    const agentPrompts: Record<string, string> = {
      coder: 'You are an expert software developer. Write clean, well-documented code.',
      reviewer: 'You are a code review expert. Provide thorough quality and security analysis.',
      terminal: 'You are a shell scripting expert. Provide efficient, safe terminal commands.',
      architect: 'You are a system architect. Design scalable, robust architectures.',
      debugger: 'You are a debugging expert. Systematically identify and fix issues.',
      documenter: 'You are a technical writer. Create clear, comprehensive documentation.',
      tester: 'You are a QA engineer. Develop comprehensive test strategies.',
      analyst: 'You are a data analyst. Provide insightful analysis and recommendations.',
      researcher: 'You are a research specialist. Conduct thorough investigation and reporting.',
      coordinator: 'You are a project coordinator. Manage tasks and synchronization.',
    };

    return (
      agentPrompts[task.agentType] ||
      'You are a helpful AI assistant executing a task.'
    );
  }

  /**
   * Execute a single task with streaming
   * Creates canvas node and updates in real-time
   */
  private async executeTask(
    task: SubTask,
    allTasks: SubTask[]
  ): Promise<TaskExecutionResult> {
    const startTime = Date.now();
    const nodeId = this.createCanvasNode(task);

    try {
      this.ensureInitialized();

      const prompt = this.getTaskPrompt(task, allTasks);
      const systemPrompt = this.getSystemPrompt(task);

      const canvasStore = useCanvasStore.getState();
      canvasStore.setNodeStreaming(nodeId, true);

      let totalContent = '';
      let inputTokens = 0;
      let outputTokens = 0;
      let chunkCount = 0;
      const chunkSizes: number[] = [];

      // Initiate stream
      const response = await (this.client as GoogleGenerativeAI)
        .getGenerativeModel({ model: this.model })
        .generateContentStream({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
          },
        });

      // Process stream chunks
      for await (const chunk of response.stream) {
        if (chunk.content?.parts[0]) {
          const chunkText = (chunk.content.parts[0] as any).text || '';
          totalContent += chunkText;
          chunkCount++;
          chunkSizes.push(chunkText.length);

          // Update canvas node in real-time
          canvasStore.appendNodeContent(nodeId, chunkText);
        }

        // Update token counts if available
        if (chunk.usageMetadata) {
          inputTokens = chunk.usageMetadata.promptTokenCount || 0;
          outputTokens = chunk.usageMetadata.candidatesTokenCount || 0;
        }
      }

      // Mark streaming as complete
      canvasStore.setNodeStreaming(nodeId, false);

      const processingTime = Date.now() - startTime;
      const totalTokens = inputTokens + outputTokens;
      const avgChunkSize =
        chunkSizes.length > 0
          ? Math.round(chunkSizes.reduce((a, b) => a + b) / chunkSizes.length)
          : 0;

      // Update execution stats
      this.stats.completedTasks++;
      this.stats.totalTokensUsed += totalTokens;
      this.stats.totalProcessingTimeMs += processingTime;
      this.stats.averageChunkSize = Math.round(
        (this.stats.averageChunkSize + avgChunkSize) / 2
      );

      return {
        taskId: task.id,
        nodeId,
        title: task.title,
        success: true,
        content: totalContent,
        tokensUsed: {
          inputTokens,
          outputTokens,
          totalTokens,
        },
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        streamedAt: chunkCount,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      // Mark streaming as failed
      const canvasStore = useCanvasStore.getState();
      canvasStore.setNodeStreaming(nodeId, false);
      canvasStore.appendNodeContent(
        nodeId,
        `\n\n⚠️ Error: ${errorMessage}`
      );

      this.stats.failedTasks++;

      return {
        taskId: task.id,
        nodeId,
        title: task.title,
        success: false,
        content: '',
        error: errorMessage,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      };
    } finally {
      this.activeStreams.delete(task.id);
      this.stats.concurrentStreams = this.activeStreams.size;
    }
  }

  /**
   * Create a canvas node for the task
   */
  private createCanvasNode(task: SubTask): string {
    const canvasStore = useCanvasStore.getState();

    // Calculate position based on agent type and task index
    const agentTypeIndex = this.getAgentTypeIndex(task.agentType);
    const x = agentTypeIndex * 450;
    const y = (task.priority === 'critical' ? 0 : 350);

    const nodeId = canvasStore.addNode({
      type: 'agent',
      x,
      y,
      width: 400,
      height: 300,
      content: `🔄 ${task.title}\n[${task.agentType}] Priority: ${task.priority}\n\n`,
      isStreaming: true,
      metadata: {
        taskId: task.id,
        agentType: task.agentType,
        priority: task.priority,
        dependencies: task.dependencies || [],
      },
    });

    return nodeId;
  }

  /**
   * Get visual position index for agent type
   */
  private getAgentTypeIndex(agentType: string): number {
    const agentTypeMap: Record<string, number> = {
      coder: 0,
      reviewer: 1,
      terminal: 2,
      architect: 3,
      debugger: 4,
      documenter: 5,
      tester: 6,
      analyst: 7,
      researcher: 8,
      coordinator: 9,
    };
    return agentTypeMap[agentType] || 0;
  }

  /**
   * Calculate which tasks can run in parallel
   */
  private getIndependentTasks(
    tasks: SubTask[],
    completedIds: Set<string>
  ): SubTask[] {
    return tasks.filter((task) => {
      const deps = task.dependencies || [];
      return deps.every((depId) => completedIds.has(depId));
    });
  }

  /**
   * Execute all tasks in parallel, respecting dependencies
   * 
   * This is the main orchestration function that:
   * 1. Creates canvas nodes for each task
   * 2. Initiates concurrent streams without blocking
   * 3. Updates canvas in real-time as chunks arrive
   * 4. Respects task dependencies
   * 5. Tracks statistics and progress
   */
  async executeTasksInParallel(
    decomposition: TaskDecomposition,
    onProgress?: (result: TaskExecutionResult) => void
  ): Promise<{
    results: TaskExecutionResult[];
    stats: ExecutionStats;
  }> {
    try {
      await this.initializeClient();

      const allTasks = decomposition.subtasks;
      const results: TaskExecutionResult[] = [];
      const completedIds = new Set<string>();

      // Initialize stats
      this.stats = {
        totalTasks: allTasks.length,
        completedTasks: 0,
        failedTasks: 0,
        totalTokensUsed: 0,
        totalProcessingTimeMs: 0,
        concurrentStreams: 0,
        averageChunkSize: 0,
        startedAt: new Date().toISOString(),
      };

      let remainingTasks = [...allTasks];

      // Execute tasks in waves respecting dependencies
      while (remainingTasks.length > 0) {
        const independentTasks = this.getIndependentTasks(
          remainingTasks,
          completedIds
        );

        if (independentTasks.length === 0) {
          console.error('Circular dependency detected or no executable tasks');
          break;
        }

        // Execute independent tasks in parallel (non-blocking)
        this.stats.concurrentStreams = independentTasks.length;

        const taskPromises = independentTasks.map((task) => {
          this.activeStreams.add(task.id);
          return this.executeTask(task, allTasks);
        });

        // Await all parallel tasks
        const waveResults = await Promise.all(taskPromises);

        // Process results
        waveResults.forEach((result) => {
          results.push(result);
          if (result.success) {
            completedIds.add(result.taskId);
          }
          onProgress?.(result);
        });

        // Remove completed tasks from remaining
        remainingTasks = remainingTasks.filter(
          (task) =>
            !waveResults.some((result) => result.taskId === task.id)
        );
      }

      this.stats.completedAt = new Date().toISOString();

      return {
        results,
        stats: this.stats,
      };
    } catch (error) {
      console.error('Failed to execute tasks in parallel:', error);
      throw error;
    }
  }

  /**
   * Get current execution statistics
   */
  getStats(): ExecutionStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalTokensUsed: 0,
      totalProcessingTimeMs: 0,
      concurrentStreams: 0,
      averageChunkSize: 0,
      startedAt: new Date().toISOString(),
    };
  }

  /**
   * Set API key manually (alternative to BYOK store)
   */
  setApiKey(apiKey: string): void {
    this.client = new GoogleGenerativeAI(apiKey);
  }
}

/**
 * Singleton instance for task execution
 */
export const taskExecutor = new TaskExecutorService();

/**
 * Main execution function exported for direct use
 * 
 * Usage:
 * ```
 * const { results, stats } = await executeTasksInParallel(decomposition);
 * ```
 */
export async function executeTasksInParallel(
  decomposition: TaskDecomposition,
  onProgress?: (result: TaskExecutionResult) => void
): Promise<{
  results: TaskExecutionResult[];
  stats: ExecutionStats;
}> {
  return taskExecutor.executeTasksInParallel(decomposition, onProgress);
}

/**
 * Execute with custom API key
 */
export async function executeTasksInParallelWithKey(
  apiKey: string,
  decomposition: TaskDecomposition,
  onProgress?: (result: TaskExecutionResult) => void
): Promise<{
  results: TaskExecutionResult[];
  stats: ExecutionStats;
}> {
  taskExecutor.setApiKey(apiKey);
  return taskExecutor.executeTasksInParallel(decomposition, onProgress);
}
