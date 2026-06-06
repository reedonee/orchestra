/**
 * OrchestratorService Type Exports
 * 
 * Centralized type definitions for easy importing
 * Usage: import type { TaskDecomposition, SubTask } from '@/types/orchestrator';
 */

export type {
  // Main data structures
  TaskDecomposition,
  SubTask,
  OrchestratorResponse,

  // Configuration
  OrchestratorConfig,

  // Enums
  AgentType,
  TaskPriority,
} from '@/services/orchestratorService';

export {
  // Service singleton
  orchestratorService,
} from '@/services/orchestratorService';

export {
  // Hook
  useOrchestrator,
} from '@/hooks/useOrchestrator';

/**
 * Common import patterns
 */

// Pattern 1: Import service and types
// import { orchestratorService } from '@/types/orchestrator';
// import type { TaskDecomposition, SubTask } from '@/types/orchestrator';

// Pattern 2: Import hook
// import { useOrchestrator } from '@/types/orchestrator';
// const orchestrator = useOrchestrator();

// Pattern 3: Type-safe task handling
// import type { SubTask, AgentType, TaskPriority } from '@/types/orchestrator';
// const task: SubTask = { ... };

// Pattern 4: Configuration
// import type { OrchestratorConfig } from '@/types/orchestrator';
// const config: OrchestratorConfig = { temperature: 0.5 };\n