/**
 * useOrchestrator Hook
 * 
 * React hook for managing task decomposition using OrchestratorService
 * Handles state management, loading, errors, and response caching
 * 
 * Usage:
 * const orchestrator = useOrchestrator();
 * const result = await orchestrator.decomposeTask(userText);
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  orchestratorService,
  TaskDecomposition,
  OrchestratorResponse,
  OrchestratorConfig,
  SubTask,
  AgentType,
  TaskPriority,
} from '../services/orchestratorService';
import { useBYOKStore } from '../store/byokStore';

/**
 * Hook state interface
 */
export interface UseOrchestratorState {
  // Current state
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;

  // Data
  lastDecomposition: TaskDecomposition | null;
  lastResponse: OrchestratorResponse | null;

  // History
  decompositionHistory: OrchestratorResponse[];
  maxHistorySize: number;

  // Statistics
  totalRequests: number;
  totalTokensUsed: number;
  averageProcessingTime: number;

  // API key status
  isApiKeyConfigured: boolean;
}

/**
 * useOrchestrator Hook
 * 
 * Provides orchestrator functionality with React state management
 */
export const useOrchestrator = (maxHistorySize: number = 10) => {
  // State
  const [state, setState] = useState<UseOrchestratorState>({
    isLoading: false,
    isProcessing: false,
    error: null,
    lastDecomposition: null,
    lastResponse: null,
    decompositionHistory: [],
    maxHistorySize,
    totalRequests: 0,
    totalTokensUsed: 0,
    averageProcessingTime: 0,
    isApiKeyConfigured: false,
  });

  // Refs for tracking metrics
  const processingTimesRef = useRef<number[]>([]);
  const isApiKeyConfiguredRef = useRef<boolean>(false);

  // Check API key configuration on mount
  useEffect(() => {
    const store = useBYOKStore.getState();
    const hasKey = !!store.getApiKey('gemini');
    isApiKeyConfiguredRef.current = hasKey;
    setState((prev) => ({ ...prev, isApiKeyConfigured: hasKey }));
  }, []);

  /**
   * Set API key for orchestrator
   */
  const setApiKey = useCallback((apiKey: string): void => {
    try {
      orchestratorService.setApiKey(apiKey);
      isApiKeyConfiguredRef.current = true;
      setState((prev) => ({
        ...prev,
        isApiKeyConfigured: true,
        error: null,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to set API key';
      setState((prev) => ({
        ...prev,
        error: errorMsg,
        isApiKeyConfigured: false,
      }));
    }
  }, []);

  /**
   * Decompose a user request into tasks
   */
  const decomposeTask = useCallback(
    async (
      userRequest: string,
      config?: OrchestratorConfig
    ): Promise<OrchestratorResponse | null> => {
      try {
        // Validate input
        if (!userRequest || userRequest.trim().length === 0) {
          setState((prev) => ({
            ...prev,
            error: 'User request cannot be empty',
          }));
          return null;
        }

        // Check API key
        if (!isApiKeyConfiguredRef.current) {
          setState((prev) => ({
            ...prev,
            error: 'API key not configured. Please set your Gemini API key first.',
          }));
          return null;
        }

        // Start loading
        setState((prev) => ({
          ...prev,
          isLoading: true,
          isProcessing: true,
          error: null,
        }));

        console.log('[useOrchestrator] Starting task decomposition...');

        // Call orchestrator service
        const response = await orchestratorService.decomposeTask(userRequest, config);

        // Track metrics
        processingTimesRef.current.push(response.processingTimeMs);
        if (processingTimesRef.current.length > 100) {
          processingTimesRef.current.shift(); // Keep last 100
        }

        const avgTime =
          processingTimesRef.current.reduce((a, b) => a + b, 0) /
          processingTimesRef.current.length;

        // Update state
        setState((prev) => {
          const newHistory = [...prev.decompositionHistory, response];
          if (newHistory.length > prev.maxHistorySize) {
            newHistory.shift();
          }

          return {
            ...prev,
            isLoading: false,
            isProcessing: false,
            error: response.success ? null : response.error || null,
            lastDecomposition: response.success ? response.data : prev.lastDecomposition,
            lastResponse: response,
            decompositionHistory: newHistory,
            totalRequests: prev.totalRequests + 1,
            totalTokensUsed: prev.totalTokensUsed + (response.tokensUsed?.totalTokens ?? 0),
            averageProcessingTime: avgTime,
          };
        });

        console.log(
          `[useOrchestrator] Task decomposition complete. ` +
          `Status: ${response.success ? 'success' : 'failed'}`
        );

        return response;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('[useOrchestrator] Error during decomposition:', errorMsg);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          isProcessing: false,
          error: errorMsg,
        }));

        return null;
      }
    },
    [state.isApiKeyConfigured]
  );

  /**
   * Get current decomposition
   */
  const getCurrentDecomposition = useCallback((): TaskDecomposition | null => {
    return state.lastDecomposition;
  }, [state.lastDecomposition]);

  /**
   * Get decomposition history
   */
  const getHistory = useCallback((): OrchestratorResponse[] => {
    return [...state.decompositionHistory];
  }, [state.decompositionHistory]);

  /**
   * Clear history
   */
  const clearHistory = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      decompositionHistory: [],
    }));
  }, []);

  /**
   * Clear current error
   */
  const clearError = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback((): void => {
    setState({
      isLoading: false,
      isProcessing: false,
      error: null,
      lastDecomposition: null,
      lastResponse: null,
      decompositionHistory: [],
      maxHistorySize,
      totalRequests: 0,
      totalTokensUsed: 0,
      averageProcessingTime: 0,
      isApiKeyConfigured: state.isApiKeyConfigured,
    });
    processingTimesRef.current = [];
  }, [maxHistorySize, state.isApiKeyConfigured]);

  /**
   * Get task by ID from current decomposition
   */
  const getTaskById = useCallback(
    (taskId: string): SubTask | undefined => {
      return state.lastDecomposition?.subtasks.find((t) => t.id === taskId);
    },
    [state.lastDecomposition]
  );

  /**
   * Filter tasks by agent type
   */
  const getTasksByAgentType = useCallback(
    (agentType: AgentType): SubTask[] => {
      return state.lastDecomposition?.subtasks.filter((t) => t.agentType === agentType) ?? [];
    },
    [state.lastDecomposition]
  );

  /**
   * Filter tasks by priority
   */
  const getTasksByPriority = useCallback(
    (priority: TaskPriority): SubTask[] => {
      return state.lastDecomposition?.subtasks.filter((t) => t.priority === priority) ?? [];
    },
    [state.lastDecomposition]
  );

  /**
   * Get all independent tasks (no dependencies)
   */
  const getIndependentTasks = useCallback((): SubTask[] => {
    return (
      state.lastDecomposition?.subtasks.filter((t) => !t.dependencies || t.dependencies.length === 0) ??
      []
    );
  }, [state.lastDecomposition]);

  /**
   * Get tasks that depend on a specific task
   */
  const getDependentTasks = useCallback(
    (taskId: string): SubTask[] => {
      return (
        state.lastDecomposition?.subtasks.filter(
          (t) => t.dependencies && t.dependencies.includes(taskId)
        ) ?? []
      );
    },
    [state.lastDecomposition]
  );

  /**
   * Calculate task execution order
   */
  const getExecutionOrder = useCallback((): SubTask[] => {
    if (!state.lastDecomposition) return [];

    const tasks = [...state.lastDecomposition.subtasks];
    const executed = new Set<string>();
    const order: SubTask[] = [];

    while (order.length < tasks.length) {
      const readyTasks = tasks.filter(
        (t) =>
          !executed.has(t.id) &&
          (!t.dependencies || t.dependencies.every((depId) => executed.has(depId)))
      );

      if (readyTasks.length === 0) {
        // Circular dependency or error
        break;
      }

      // Sort by priority for execution
      const priorityOrder: Record<TaskPriority, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };
      readyTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      for (const task of readyTasks) {
        order.push(task);
        executed.add(task.id);
      }
    }

    return order;
  }, [state.lastDecomposition]);

  /**
   * Test orchestrator connection
   */
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const result = await orchestratorService.testConnection();
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: result.connected ? null : result.message,
      }));
      return result.connected;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Connection test failed';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
      }));
      return false;
    }
  }, []);

  /**
   * Export current decomposition as JSON
   */
  const exportAsJSON = useCallback((): string | null => {
    if (!state.lastDecomposition) return null;
    return orchestratorService.exportDecompositionJSON(state.lastDecomposition);
  }, [state.lastDecomposition]);

  /**
   * Format current decomposition for display
   */
  const formatForDisplay = useCallback((): string | null => {
    if (!state.lastDecomposition) return null;
    return orchestratorService.formatDecomposition(state.lastDecomposition);
  }, [state.lastDecomposition]);

  return {
    // State
    isLoading: state.isLoading,
    isProcessing: state.isProcessing,
    error: state.error,
    isApiKeyConfigured: state.isApiKeyConfigured,

    // Data
    decomposition: state.lastDecomposition,
    response: state.lastResponse,
    history: state.decompositionHistory,

    // Statistics
    stats: {
      totalRequests: state.totalRequests,
      totalTokensUsed: state.totalTokensUsed,
      averageProcessingTime: state.averageProcessingTime,
    },

    // Actions
    setApiKey,
    decomposeTask,
    testConnection,

    // Decomposition queries
    getCurrentDecomposition,
    getTaskById,
    getTasksByAgentType,
    getTasksByPriority,
    getIndependentTasks,
    getDependentTasks,
    getExecutionOrder,

    // History & Export
    getHistory,
    clearHistory,
    clearError,
    reset,
    exportAsJSON,
    formatForDisplay,
  };
};

/**
 * Export type for external use
 */
export type UseOrchestratorReturn = ReturnType<typeof useOrchestrator>;
