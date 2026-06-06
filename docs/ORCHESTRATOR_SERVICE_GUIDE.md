# OrchestratorService - Complete Guide

## Overview

The **OrchestratorService** is a sophisticated TypeScript service that transforms user requests (transcribed text) into structured, parallelizable task breakdowns. It uses Google's Generative AI SDK with strict JSON schema validation to ensure production-ready output.

**Key Capabilities:**
- ✅ Transcribed text → Task decomposition
- ✅ Structured JSON output with `responseSchema`
- ✅ Agent type assignment (10+ agent types)
- ✅ Dependency tracking for parallelization
- ✅ Token usage tracking
- ✅ Type-safe implementations
- ✅ Production-ready error handling

---

## Architecture

### System Overview

```
User Input (Transcribed Text)
        ↓
┌──────────────────────────────┐
│   OrchestratorService        │
│  - Takes user request        │
│  - Uses BYOK API key         │
│  - Sends to Gemini           │
│  - Validates JSON schema     │
│  - Returns structured output │
└──────────────────────────────┘
        ↓
┌──────────────────────────────┐
│   Gemini 2.0 Flash           │
│  - System Prompt:            │
│    Act as Project Manager    │
│  - Response Format:          │
│    TaskDecomposition JSON    │
│  - Strict Schema Validation  │
└──────────────────────────────┘
        ↓
┌──────────────────────────────┐
│   Task Array                 │
│  - Parallel sub-tasks        │
│  - Agent assignments         │
│  - Dependencies              │
│  - Priority levels           │
│  - Token estimates           │
└──────────────────────────────┘
```

---

## Data Structures

### TaskDecomposition (Main Output)

```typescript
interface TaskDecomposition {
  mainObjective: string;           // Primary goal from user
  summary: string;                 // Decomposition strategy
  totalEstimatedTokens: number;    // Total tokens needed
  subtasks: SubTask[];             // Array of parallel tasks
  executionStrategy?: string;      // How to coordinate
  estimatedTimeMinutes?: number;   // Total execution time
}
```

### SubTask (Individual Task)

```typescript
interface SubTask {
  id: string;                      // Unique ID (task_1, task_2, etc.)
  title: string;                   // Brief title
  description: string;             // Detailed instructions
  agentType: AgentType;            // Type of agent needed
  priority: TaskPriority;          // critical|high|medium|low
  dependencies?: string[];         // IDs of prerequisite tasks
  estimatedTokens?: number;        // Tokens for this task
  context?: Record<string, unknown>; // Additional context
}
```

### AgentTypes (10 Supported)

| Agent Type | Purpose |
|-----------|---------|
| **coder** | Write clean, production-ready code |
| **reviewer** | Code quality, security, best practices |
| **terminal** | Shell commands, system operations |
| **architect** | System design, technical planning |
| **debugger** | Problem diagnosis, bug fixes |
| **documenter** | Technical documentation, comments |
| **tester** | Testing, validation, QA |
| **analyst** | Data analysis, reports, patterns |
| **researcher** | Research, information gathering |
| **coordinator** | Task management, orchestration |

### TaskPriority Levels

| Level | Usage |
|-------|-------|
| **critical** | Blocking tasks, must complete first |
| **high** | Important, needed for other tasks |
| **medium** | Standard priority |
| **low** | Nice-to-have, can run anytime |

---

## Usage Guide

### 1. Basic Setup

```typescript
import { useOrchestrator } from '@/hooks/useOrchestrator';

const MyComponent = () => {
  const orchestrator = useOrchestrator();

  // Set API key once
  useEffect(() => {
    orchestrator.setApiKey(userProvidedApiKey);
  }, []);

  return (
    // Component JSX
  );
};
```

### 2. Decompose a Task

```typescript
const handleDecompose = async () => {
  const userRequest = "Build a weather app with real-time data and offline caching";

  const result = await orchestrator.decomposeTask(userRequest, {
    temperature: 0.5,        // Lower for consistency
    maxOutputTokens: 4096,
  });

  if (result?.success) {
    console.log('Tasks:', result.data?.subtasks);
  } else {
    console.error('Error:', result?.error);
  }
};
```

### 3. Query Decomposition

```typescript
// Get specific task
const task = orchestrator.getTaskById('task_1');

// Get all tasks for specific agent
const coderTasks = orchestrator.getTasksByAgentType('coder');

// Get critical tasks
const criticalTasks = orchestrator.getTasksByPriority('critical');

// Get independent tasks (no dependencies)
const parallel = orchestrator.getIndependentTasks();

// Get execution order
const order = orchestrator.getExecutionOrder();
```

### 4. Export and Format

```typescript
// Export as JSON
const json = orchestrator.exportAsJSON();

// Format for display
const formatted = orchestrator.formatForDisplay();
```

---

## JSON Schema Validation

The service uses strict JSON schema validation to ensure Gemini output is always valid and parseable.

### ResponseSchema Structure

```typescript
const TASK_DECOMPOSITION_SCHEMA = {
  type: 'object',
  properties: {
    mainObjective: { type: 'string' },
    summary: { type: 'string' },
    totalEstimatedTokens: { type: 'integer', minimum: 0 },
    subtasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { 
            type: 'string', 
            pattern: '^task_[0-9]+$' 
          },
          title: { type: 'string', minLength: 3 },
          description: { type: 'string', minLength: 10 },
          agentType: { 
            type: 'string',
            enum: ['coder', 'reviewer', 'terminal', ...]
          },
          priority: { 
            type: 'string',
            enum: ['critical', 'high', 'medium', 'low']
          },
          dependencies: { type: 'array', items: { type: 'string' } },
          estimatedTokens: { type: 'integer', minimum: 0 },
          context: { type: 'object' },
        },
        required: ['id', 'title', 'description', 'agentType', 'priority'],
      },
      minItems: 1,
      maxItems: 20,
    },
  },
  required: ['mainObjective', 'summary', 'totalEstimatedTokens', 'subtasks'],
};
```

**Validation Guarantees:**
- ✅ Valid JSON structure
- ✅ All required fields present
- ✅ Correct data types
- ✅ Unique task IDs
- ✅ Valid references (dependencies exist)
- ✅ No circular dependencies
- ✅ Agent types valid
- ✅ Priority levels valid

---

## System Prompt

The service includes a comprehensive system prompt that guides Gemini's behavior:

```
You are an expert Project Manager AI specializing in task decomposition and 
parallel execution optimization.

Your responsibility is to take user requests and break them down into granular, 
parallelizable sub-tasks that specialized agents can execute.

## Task Decomposition Rules:
1. **Maximize Parallelization**: Assign tasks to run in parallel when dependencies allow
2. **Clear Dependencies**: Only specify dependencies when truly necessary
3. **Specific Instructions**: Each task description must contain actionable steps
4. **Realistic Estimation**: Provide token estimates based on complexity
5. **Unique IDs**: Format task IDs as "task_1", "task_2", etc.
6. **Priority Levels**: Assign appropriate priorities

## Output Requirements:
- Each task must be specific and actionable
- Tasks should be independent unless dependencies are necessary
- Include context for tasks that need additional information
- Estimate tokens realistically
- Never create more than 20 subtasks per decomposition
```

---

## API Reference

### OrchestratorService Class

#### Methods

```typescript
// Initialize with API key
setApiKey(apiKey: string): void

// Main decomposition method
decomposeTask(
  userRequest: string,
  config?: OrchestratorConfig
): Promise<OrchestratorResponse>

// Validation
validateDecomposition(data: unknown): string | null

// Formatting
formatDecomposition(decomposition: TaskDecomposition): string
exportDecompositionJSON(decomposition: TaskDecomposition): string

// Diagnostics
testConnection(): Promise<{ connected: boolean; message: string }>
getMetrics(): { requestCount; totalTokensUsed; averageTokensPerRequest }
resetMetrics(): void
```

### useOrchestrator Hook

#### State Properties

```typescript
isLoading: boolean
isProcessing: boolean
error: string | null
isApiKeyConfigured: boolean

decomposition: TaskDecomposition | null
response: OrchestratorResponse | null
history: OrchestratorResponse[]

stats: {
  totalRequests: number
  totalTokensUsed: number
  averageProcessingTime: number
}
```

#### Hook Methods

```typescript
// Core functionality
setApiKey(apiKey: string): void
decomposeTask(userRequest: string, config?: OrchestratorConfig): Promise<OrchestratorResponse | null>
testConnection(): Promise<boolean>

// Queries
getTaskById(taskId: string): SubTask | undefined
getTasksByAgentType(agentType: AgentType): SubTask[]
getTasksByPriority(priority: TaskPriority): SubTask[]
getIndependentTasks(): SubTask[]
getDependentTasks(taskId: string): SubTask[]
getExecutionOrder(): SubTask[]

// History & Export
getHistory(): OrchestratorResponse[]
clearHistory(): void
clearError(): void
reset(): void
exportAsJSON(): string | null
formatForDisplay(): string | null
```

---

## Configuration

### OrchestratorConfig

```typescript
interface OrchestratorConfig {
  temperature?: number;           // 0-2 (default: 0.5 for consistency)
  topP?: number;                  // 0-1 (default: 0.95)
  topK?: number;                  // Positive integer (default: 40)
  maxOutputTokens?: number;       // Default: 4096
  includeExecutionStrategy?: boolean;
  maxParallelTasks?: number;
  model?: string;                 // Default: 'gemini-2.0-flash'
}
```

### Recommended Configurations

**High Consistency (Default)**
```typescript
{
  temperature: 0.5,
  maxOutputTokens: 4096,
}
```

**More Varied Decompositions**
```typescript
{
  temperature: 0.7,
  topP: 0.95,
  maxOutputTokens: 4096,
}
```

**Quick Decompositions**
```typescript
{
  temperature: 0.3,
  maxOutputTokens: 2048,
}
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "API key not configured" | No BYOK key set | Call `setApiKey()` first |
| "User request cannot be empty" | Empty input | Provide non-empty request |
| "Invalid JSON in response" | Malformed Gemini response | Retry or check API |
| "Decomposition validation failed" | Schema mismatch | Service validates automatically |
| "Connection failed" | Network/API issue | Check connection and key |

### Error Recovery

```typescript
const result = await orchestrator.decomposeTask(userRequest);

if (!result?.success) {
  console.error('Decomposition failed:', result?.error);
  
  // Retry with different config
  const retryResult = await orchestrator.decomposeTask(userRequest, {
    temperature: 0.3, // More consistent
  });
}
```

---

## Real-World Examples

### Example 1: Web App Development

**Input:**
```
"Create a fully-featured e-commerce platform with user authentication, 
product catalog, shopping cart, payment processing, and admin dashboard"
```

**Output (JSON):**
```json
{
  "mainObjective": "Build complete e-commerce platform",
  "summary": "Decomposed into 12 parallel tasks across frontend, backend, and DevOps",
  "totalEstimatedTokens": 18500,
  "subtasks": [
    {
      "id": "task_1",
      "title": "Design System Architecture",
      "description": "Design microservices architecture with separate services for auth, products, orders, and payments",
      "agentType": "architect",
      "priority": "critical",
      "dependencies": []
    },
    {
      "id": "task_2",
      "title": "Implement User Authentication",
      "description": "Build JWT-based authentication with signup, login, and session management",
      "agentType": "coder",
      "priority": "critical",
      "dependencies": ["task_1"]
    },
    ...
  ]
}
```

### Example 2: Mobile App Feature

**Input:**
```
"Add real-time notifications to our chat app with sound alerts, 
badge counts, and notification scheduling"
```

**Output:**
```json
{
  "mainObjective": "Implement real-time notifications",
  "summary": "5 parallel tasks: backend setup, frontend UI, push service integration, testing, deployment",
  "totalEstimatedTokens": 8200,
  "subtasks": [
    {
      "id": "task_1",
      "title": "Set Up Push Notification Backend",
      "description": "Configure Firebase Cloud Messaging and database schema for storing notification preferences",
      "agentType": "architect",
      "priority": "critical"
    },
    ...
  ]
}
```

---

## Performance Optimization

### Token Usage Tracking

```typescript
const metrics = orchestrator.stats;
console.log(`Total tokens: ${metrics.totalTokensUsed}`);
console.log(`Average per request: ${metrics.averageTokensPerRequest}`);
```

### Batch Processing

```typescript
const requests = [request1, request2, request3];

for (const request of requests) {
  const result = await orchestrator.decomposeTask(request);
  // Process result
}

const totalStats = orchestrator.stats;
```

### Caching Strategy

```typescript
// Store results for reuse
const cachedDecompositions = new Map<string, TaskDecomposition>();

const getCachedOrFetch = async (request: string) => {
  if (cachedDecompositions.has(request)) {
    return cachedDecompositions.get(request);
  }
  
  const result = await orchestrator.decomposeTask(request);
  cachedDecompositions.set(request, result?.data);
  return result?.data;
};
```

---

## Testing

### Unit Tests

```typescript
describe('OrchestratorService', () => {
  it('should decompose task successfully', async () => {
    const service = new OrchestratorService();
    service.setApiKey(process.env.GEMINI_API_KEY);
    
    const result = await service.decomposeTask('Build a TODO app');
    
    expect(result.success).toBe(true);
    expect(result.data?.subtasks).toBeDefined();
    expect(result.data?.subtasks.length).toBeGreaterThan(0);
  });

  it('should validate task schema', () => {
    const service = new OrchestratorService();
    
    const validDecomp = {
      mainObjective: 'Test',
      summary: 'Test decomposition',
      totalEstimatedTokens: 100,
      subtasks: [{
        id: 'task_1',
        title: 'Task 1',
        description: 'A detailed description of task 1',
        agentType: 'coder',
        priority: 'high'
      }]
    };
    
    const error = service.validateDecomposition(validDecomp);
    expect(error).toBeNull();
  });
});
```

### Integration Tests

```typescript
// Test with real Gemini API
const testRealIntegration = async () => {
  const orchestrator = useOrchestrator();
  orchestrator.setApiKey(process.env.GEMINI_API_KEY);
  
  const result = await orchestrator.decomposeTask(
    'Create a mobile app that tracks fitness activities'
  );
  
  console.log('Real API Test:');
  console.log(`Success: ${result?.success}`);
  console.log(`Tasks: ${result?.data?.subtasks.length}`);
  console.log(`Tokens: ${result?.tokensUsed?.totalTokens}`);
};
```

---

## Best Practices

✅ **DO:**
- Validate API key before decomposition
- Use appropriate temperature settings (0.5 for consistency)
- Cache decompositions for repeated requests
- Track token usage for billing
- Handle errors gracefully
- Validate dependencies manually if critical
- Log all decompositions for debugging

❌ **DON'T:**
- Store API keys in plain text
- Make concurrent API calls without rate limiting
- Ignore schema validation errors
- Use high temperature (>0.8) for consistent output
- Create more than 20 subtasks (auto-limited anyway)
- Forget to set API key before decomposing

---

## Troubleshooting

### Issue: "API key not configured"
**Solution:**
```typescript
orchestrator.setApiKey(userApiKey);
```

### Issue: Invalid JSON response
**Solution:** Retry with lower temperature:
```typescript
const result = await orchestrator.decomposeTask(request, {
  temperature: 0.3
});
```

### Issue: Circular dependencies detected
**Solution:** Simplify request or break into smaller tasks

### Issue: Response too long (>4096 tokens)
**Solution:** Reduce task complexity or increase maxOutputTokens:
```typescript
const result = await orchestrator.decomposeTask(request, {
  maxOutputTokens: 8192
});
```

---

## Integration with Canvas

The OrchestratorService integrates seamlessly with your canvas system:

```typescript
// Get decomposed tasks and add to canvas
const result = await orchestrator.decomposeTask(userRequest);

if (result?.success) {
  const tasks = result.data?.subtasks || [];
  
  tasks.forEach((task, index) => {
    canvas.addNode({
      type: 'agent',
      content: task.description,
      x: index * 100,
      y: 0,
      metadata: {
        agentType: task.agentType,
        priority: task.priority,
        taskId: task.id,
      }
    });
  });
}
```

---

## Status: Production Ready ✅

- ✅ Full TypeScript support
- ✅ Comprehensive error handling
- ✅ JSON schema validation
- ✅ Token usage tracking
- ✅ Extensive documentation
- ✅ React hook integration
- ✅ Demo component included
- ✅ Ready for deployment

---

**Version:** 1.0.0  
**Created:** June 4, 2026  
**Last Updated:** June 4, 2026  
**Status:** Production Ready
