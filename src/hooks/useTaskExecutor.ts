/**
 * useTaskExecutor Hook
 * 
 * React hook for executing orchestrated tasks in parallel
 * Manages execution state, progress tracking, and error handling
 * Integrates with canvas store for real-time updates
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TaskDecomposition } from '../services/orchestratorService';
import type {
  TaskExecutionResult,
  ExecutionStats,
} from '../services/taskExecutor';
import { executeTasksInParallel, taskExecutor } from '../services/taskExecutor';

/**
 * Execution state
 */
export interface ExecutionState {
  isExecuting: boolean;
  isPaused: boolean;
  error: string | null;
  progress: number; // 0-100
  currentTask: string | null;
  completedTasks: number;
  failedTasks: number;
}

/**
 * Hook return type
 */
export interface UseTaskExecutorReturn {
  // State
  state: ExecutionState;
  results: TaskExecutionResult[];
  stats: ExecutionStats | null;

  // Actions
  execute: (decomposition: TaskDecomposition) => Promise<void>;
  pause: () => void;
  resume: () => void;
  cancel: () => void;

  // Queries
  getTaskResult: (taskId: string) => TaskExecutionResult | undefined;
  getSuccessfulTasks: () => TaskExecutionResult[];
  getFailedTasks: () => TaskExecutionResult[];
  getTasksByAgentType: (agentType: string) => TaskExecutionResult[];

  // Management
  clearResults: () => void;
  exportResults: () => string;
}

/**
 * useTaskExecutor Hook
 * 
 * Execute orchestrated tasks in parallel with real-time canvas updates
 * 
 * Usage:
 * ```typescript
 * const executor = useTaskExecutor();
 * 
 * // Execute tasks
 * await executor.execute(decomposition);
 * 
 * // Monitor progress
 * console.log(`${executor.state.progress}% complete`);
 * 
 * // Get results
 * const successful = executor.getSuccessfulTasks();
 * ```
 */
export function useTaskExecutor(): UseTaskExecutorReturn {
  // State management
  const [state, setState] = useState<ExecutionState>({
    isExecuting: false,
    isPaused: false,
    error: null,
    progress: 0,
    currentTask: null,
    completedTasks: 0,
    failedTasks: 0,
  });

  const [results, setResults] = useState<TaskExecutionResult[]>([]);
  const [stats, setStats] = useState<ExecutionStats | null>(null);

  // Refs for execution control
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPausedRef = useRef(false);
  const totalTasksRef = useRef(0);

  /**
   * Execute all tasks in parallel
   */
  const execute = useCallback(
    async (decomposition: TaskDecomposition) => {
      try {
        // Reset state
        setState({
          isExecuting: true,
          isPaused: false,
          error: null,
          progress: 0,
          currentTask: null,
          completedTasks: 0,
          failedTasks: 0,
        });
        setResults([]);
        setStats(null);

        abortControllerRef.current = new AbortController();
        isPausedRef.current = false;
        totalTasksRef.current = decomposition.subtasks.length;

        // Execute tasks with progress callback
        const { results: executionResults, stats: executionStats } =
          await executeTasksInParallel(decomposition, (result) => {
            // Update state for each completed task
            setResults((prev) => [...prev, result]);

            setState((prev) => {
              const completed = result.success
                ? prev.completedTasks + 1
                : prev.completedTasks;
              const failed = !result.success
                ? prev.failedTasks + 1
                : prev.failedTasks;
              const total = completed + failed;
              const progress = Math.round(
                (total / totalTasksRef.current) * 100
              );

              return {
                ...prev,
                currentTask: null,
                completedTasks: completed,
                failedTasks: failed,
                progress: Math.min(progress, 100),
              };
            });
          });

        // Set final results and stats
        setResults(executionResults);
        setStats(executionStats);

        setState((prev) => ({
          ...prev,
          isExecuting: false,
          progress: 100,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        setState((prev) => ({
          ...prev,
          isExecuting: false,
          isPaused: false,
          error: errorMessage,
        }));
      }
    },
    []
  );

  /**
   * Pause execution
   */
  const pause = useCallback(() => {
    isPausedRef.current = true;
    setState((prev) => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  /**
   * Resume execution
   */
  const resume = useCallback(() => {
    isPausedRef.current = false;
    setState((prev) => ({
      ...prev,
      isPaused: false,
    }));
  }, []);

  /**
   * Cancel execution
   */
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setState((prev) => ({
      ...prev,
      isExecuting: false,
      isPaused: false,
    }));
  }, []);

  /**
   * Get result for specific task
   */
  const getTaskResult = useCallback(
    (taskId: string) => {
      return results.find((r) => r.taskId === taskId);
    },
    [results]
  );

  /**
   * Get all successful task results
   */
  const getSuccessfulTasks = useCallback(() => {
    return results.filter((r) => r.success);
  }, [results]);

  /**
   * Get all failed task results
   */
  const getFailedTasks = useCallback(() => {
    return results.filter((r) => !r.success);
  }, [results]);

  /**
   * Get results by agent type
   */
  const getTasksByAgentType = useCallback(
    (agentType: string) => {
      return results.filter(
        (r) => (r as any).metadata?.agentType === agentType
      );
    },
    [results]
  );

  /**
   * Clear all results
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setStats(null);
    setState({
      isExecuting: false,
      isPaused: false,
      error: null,
      progress: 0,
      currentTask: null,
      completedTasks: 0,
      failedTasks: 0,
    });
  }, []);

  /**
   * Export results as JSON
   */
  const exportResults = useCallback(() => {
    return JSON.stringify(
      {
        results,
        stats,
        executedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }, [results, stats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    state,
    results,
    stats,
    execute,
    pause,
    resume,
    cancel,
    getTaskResult,
    getSuccessfulTasks,
    getFailedTasks,
    getTasksByAgentType,
    clearResults,
    exportResults,
  };
}

/**
 * Hook to track execution progress
 */
export function useExecutionProgress(
  isExecuting: boolean,
  completedTasks: number,
  totalTasks: number
) {
  return Math.round((completedTasks / totalTasks) * 100);
}

/**
 * Hook to format execution statistics
 */
export function useFormattedStats(stats: ExecutionStats | null) {
  return {
    duration: stats
      ? `${((Date.parse(stats.completedAt || new Date().toISOString()) - Date.parse(stats.startedAt)) / 1000).toFixed(1)}s`
      : 'N/A',
    avgTimePerTask: stats
      ? `${(stats.totalProcessingTimeMs / stats.totalTasks).toFixed(0)}ms`
      : 'N/A',
    successRate: stats
      ? `${(((stats.totalTasks - stats.failedTasks) / stats.totalTasks) * 100).toFixed(1)}%`
      : 'N/A',
    tokensPerTask: stats
      ? `${(stats.totalTokensUsed / stats.totalTasks).toFixed(0)}`
      : 'N/A',
  };
}
