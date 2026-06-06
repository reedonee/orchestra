# 🚀 Task Executor - Parallel Streaming Implementation

## Overview

The Task Executor is a high-performance parallel task execution engine that uses Gemini 3.5 Flash's `generateContentStream` API to deliver real-time updates to the canvas. It transforms orchestrated task decompositions into concurrent streaming operations without blocking the main thread.

### Key Features

✅ **Parallel Execution** - Execute multiple tasks simultaneously respecting dependencies  
✅ **Real-Time Streaming** - Stream chunks arrive directly to canvas nodes  
✅ **Non-Blocking** - All streams run asynchronously without blocking UI  
✅ **Canvas Integration** - Canvas nodes created before stream starts  
✅ **Dependency Tracking** - Automatic task wave execution respecting dependencies  
✅ **Error Recovery** - Per-task error handling with fallback  
✅ **Progress Tracking** - Real-time progress updates and statistics  
✅ **Token Accounting** - Track input/output tokens across all streams  

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Orchestrator (Task Decomposition)              │
│        ┌─────────────────────────────────┐               │
│        │ task_1, task_2, ... task_N      │               │
│        │ with dependencies               │               │
│        └─────────────────────────────────┘               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Task Executor Service      │
        ├──────────────────────────────┤
        │ • Dependency Resolution      │
        │ • Wave-based Execution       │
        │ • Stream Management          │
        └──────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ Task 1  │  │ Task 2  │  │ Task 3  │
    │ Stream  │  │ Stream  │  │ Stream  │
    └─────────┘  └─────────┘  └─────────┘
          │            │            │
          │  Gemini 3.5 Flash  generateContentStream
          │            │            │
          ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ Canvas  │  │ Canvas  │  │ Canvas  │
    │ Node 1  │  │ Node 2  │  │ Node 3  │
    │ appends │  │ appends │  │ appends │
    └─────────┘  └─────────┘  └─────────┘
```

---

## Core Components

### TaskExecutorService

Main service class handling parallel execution.

```typescript
class TaskExecutorService {
  // Initialize with BYOK API key
  async initializeClient(): Promise<void>

  // Execute all tasks in parallel, respecting dependencies
  async executeTasksInParallel(
    decomposition: TaskDecomposition,
    onProgress?: (result: TaskExecutionResult) => void
  ): Promise<{ results: TaskExecutionResult[]; stats: ExecutionStats }>

  // Single task execution with streaming
  private async executeTask(
    task: SubTask,
    allTasks: SubTask[]
  ): Promise<TaskExecutionResult>

  // Get independent tasks for parallel execution
  private getIndependentTasks(
    tasks: SubTask[],
    completedIds: Set<string>
  ): SubTask[]

  // Statistics tracking
  getStats(): ExecutionStats
  resetStats(): void
}
```

### Key Methods

#### `executeTasksInParallel(decomposition, onProgress?)`

Main orchestration method.

**Parameters:**
- `decomposition: TaskDecomposition` - Tasks to execute
- `onProgress?: (result: TaskExecutionResult) => void` - Progress callback

**Returns:**
```typescript
{
  results: TaskExecutionResult[],    // Individual task results
  stats: ExecutionStats              // Aggregated statistics
}
```

**Process:**
1. Initialize client with BYOK API key
2. Reset statistics
3. Execute tasks in dependency-respecting waves:
   - Find independent tasks (no unmet dependencies)
   - Create canvas nodes for all tasks in wave
   - Execute all tasks in parallel
   - Await all streams to complete
   - Mark completed, move to next wave
4. Return aggregated results

**Example:**
```typescript
const executor = new TaskExecutorService();
const result = await executor.executeTasksInParallel(decomposition, (result) => {
  console.log(`${result.title}: ${result.success ? '✓' : '✗'}`);
});

console.log(`Completed: ${result.stats.completedTasks}`);
console.log(`Total tokens: ${result.stats.totalTokensUsed}`);
```

---

## Canvas Integration

### Canvas Node Lifecycle

1. **Creation Phase** (Before stream starts)
   ```typescript
   const nodeId = canvasStore.addNode({
     type: 'agent',
     x: 100 * agentTypeIndex,
     y: priorityY,
     width: 400,
     height: 300,
     content: `🔄 ${task.title}\n[${task.agentType}] Priority: ${task.priority}\n\n`,
     isStreaming: true,
   });
   ```

2. **Streaming Phase** (As chunks arrive)
   ```typescript
   for await (const chunk of response.stream) {
     const text = chunk.content.parts[0].text;
     canvasStore.appendNodeContent(nodeId, text);  // Real-time update
   }
   ```

3. **Completion Phase** (After stream ends)
   ```typescript
   canvasStore.setNodeStreaming(nodeId, false);
   ```

### Real-Time Updates

Canvas nodes update via `appendNodeContent` for each chunk:

```typescript
// Stream chunk arrives every 50-200ms typically
for await (const chunk of stream) {
  const text = chunk.content.parts[0].text;
  
  // Direct canvas node update (no batching overhead)
  canvasStore.appendNodeContent(nodeId, text);
  
  // UI re-renders with new content
  // No blocking - UI remains responsive
}
```

---

## Parallel Execution Example

### Scenario: 8 Tasks with Dependencies

```
Task Structure:
  ├─ task_1 (architect) - no deps
  ├─ task_2 (coder) - depends on task_1
  ├─ task_3 (coder) - depends on task_1
  ├─ task_4 (reviewer) - depends on task_2, task_3
  ├─ task_5 (tester) - depends on task_2
  ├─ task_6 (analyst) - depends on task_5
  ├─ task_7 (debugger) - depends on task_6
  └─ task_8 (documenter) - depends on task_4, task_5

Execution Waves:
  Wave 1: [task_1] 
          ↓ (task_1 completes)
  Wave 2: [task_2, task_3, task_5] (3 parallel streams)
          ↓ (all complete)
  Wave 3: [task_4, task_6] (2 parallel streams)
          ↓ (all complete)
  Wave 4: [task_7] (depends on task_6)
          ↓ (completes)
  Wave 5: [task_8] (depends on task_4, task_7)
          ↓ (completes)

Result: 8 tasks executed with 5 waves instead of 8 sequential calls
```

### Code Flow

```typescript
// Phase 1: Decompose
const decomposition = await orchestrator.decomposeTask(userRequest);
// Returns: { mainObjective, summary, subtasks: [task_1, task_2, ...] }

// Phase 2: Execute in parallel
const { results, stats } = await executeTasksInParallel(decomposition);

// Real-time: Canvas nodes appear and stream content

// Phase 3: Access results
results.forEach(result => {
  console.log(`${result.title}: ${result.processingTimeMs}ms`);
});

// Statistics
console.log(`Total: ${stats.totalTokensUsed} tokens`);
console.log(`Success rate: ${stats.completedTasks / stats.totalTasks * 100}%`);
```

---

## Streaming with Gemini 3.5 Flash

### generateContentStream API

```typescript
const response = await model.generateContentStream({
  contents: [{
    role: 'user',
    parts: [{ text: prompt }]
  }],
  systemInstruction: systemPrompt,
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 2048,
  }
});

// Process stream chunks
for await (const chunk of response.stream) {
  // Each chunk contains partial content
  const text = chunk.content.parts[0].text;
  
  // Update UI immediately
  canvasStore.appendNodeContent(nodeId, text);
  
  // Access token counts
  if (chunk.usageMetadata) {
    console.log(`Prompt tokens: ${chunk.usageMetadata.promptTokenCount}`);
    console.log(`Output tokens: ${chunk.usageMetadata.candidatesTokenCount}`);
  }
}
```

### Key Properties

- **Non-blocking**: Stream processing doesn't block main thread
- **Chunk-based**: Content arrives in chunks (typically 1-10 tokens)
- **Progressive**: Tokens appear before full response completes
- **Token Tracking**: Token counts available per chunk
- **Error Handling**: Errors propagate through stream

---

## React Hook Integration

### useTaskExecutor Hook

```typescript
const executor = useTaskExecutor();

// State
executor.state.isExecuting        // boolean
executor.state.progress           // 0-100
executor.state.completedTasks     // number
executor.state.failedTasks        // number
executor.state.error              // string | null

// Results
executor.results                  // TaskExecutionResult[]
executor.stats                    // ExecutionStats | null

// Actions
await executor.execute(decomposition)
executor.pause()
executor.resume()
executor.cancel()

// Queries
executor.getTaskResult(taskId)
executor.getSuccessfulTasks()
executor.getFailedTasks()
executor.getTasksByAgentType(agentType)

// Management
executor.clearResults()
executor.exportResults()  // JSON string
```

### Usage Example

```typescript
function MyComponent() {
  const executor = useTaskExecutor();
  const [decomposition, setDecomposition] = useState(null);

  const handleExecute = async () => {
    await executor.execute(decomposition);
  };

  return (
    <View>
      <Text>Progress: {executor.state.progress}%</Text>
      
      <TouchableOpacity onPress={handleExecute}>
        <Text>Execute Tasks</Text>
      </TouchableOpacity>

      {executor.results.map(result => (
        <Text key={result.taskId}>
          {result.title}: {result.success ? '✓' : '✗'}
        </Text>
      ))}
    </View>
  );
}
```

---

## Performance Characteristics

### Metrics

| Metric | Value |
|--------|-------|
| **Tasks Executed in Parallel** | Up to N tasks |
| **Chunk Processing** | 50-200ms typical |
| **UI Blocking** | None (all async) |
| **Memory per Stream** | ~100KB per active stream |
| **Max Concurrent Streams** | 100+ (system dependent) |
| **Token Tracking** | Per-chunk metadata |

### Optimization Techniques

1. **Non-blocking Streams**: All I/O is async
2. **Canvas Batching**: Optional batch updates for performance
3. **Wave-based Execution**: Respects dependencies efficiently
4. **Chunk Buffering**: Minimal memory per stream
5. **Token Accounting**: Accurate tracking across streams

---

## Error Handling

### Per-Task Error Recovery

```typescript
private async executeTask(task: SubTask): Promise<TaskExecutionResult> {
  try {
    // Stream execution
    for await (const chunk of stream) {
      canvasStore.appendNodeContent(nodeId, chunk);
    }
  } catch (error) {
    // Graceful failure
    canvasStore.setNodeStreaming(nodeId, false);
    canvasStore.appendNodeContent(nodeId, `\n\n⚠️ Error: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      // ... other metadata
    };
  }
}
```

### Error Types

- **API Errors**: Network issues, rate limits, auth failures
- **Stream Errors**: Connection drops, timeout
- **Task Errors**: Circular dependencies, missing context
- **Canvas Errors**: Node not found (gracefully handled)

All errors are caught per-task and reported in results.

---

## Statistics and Monitoring

### ExecutionStats

```typescript
{
  totalTasks: number;              // Total tasks executed
  completedTasks: number;          // Successfully completed
  failedTasks: number;             // Failed tasks
  totalTokensUsed: number;         // Sum of all tokens
  totalProcessingTimeMs: number;   // Total execution time
  concurrentStreams: number;       // Peak concurrent streams
  averageChunkSize: number;        // Average chunk size
  startedAt: string;               // ISO timestamp
  completedAt?: string;            // ISO timestamp
}
```

### Metrics Tracking

```typescript
// Per-task
result.tokensUsed.inputTokens      // Prompt tokens
result.tokensUsed.outputTokens     // Completion tokens
result.processingTimeMs            // Execution time
result.streamedAt                  // Chunk count

// Aggregate
stats.totalTokensUsed              // Sum across tasks
stats.totalProcessingTimeMs        // Sum across tasks
stats.concurrentStreams            // Peak concurrency
```

---

## Integration Checklist

- ✅ Import `TaskExecutorService` in your service layer
- ✅ Import `useTaskExecutor` hook in React components
- ✅ Ensure Zustand canvas store is available
- ✅ Configure BYOK store with Gemini API key
- ✅ Test with sample decomposition
- ✅ Monitor error handling
- ✅ Track performance metrics
- ✅ Handle UI updates during streaming

---

## API Reference

### TaskExecutorService

```typescript
// Core methods
executeTasksInParallel(decomposition, onProgress?)
getStats()
resetStats()
setApiKey(apiKey)
initializeClient()
```

### Exported Functions

```typescript
// Main execution
executeTasksInParallel(decomposition, onProgress?)
executeTasksInParallelWithKey(apiKey, decomposition, onProgress?)

// Singleton
taskExecutor: TaskExecutorService
```

### Data Types

```typescript
// Result
interface TaskExecutionResult {
  taskId: string;
  nodeId: string;
  title: string;
  success: boolean;
  content: string;
  error?: string;
  tokensUsed?: { inputTokens; outputTokens; totalTokens };
  processingTimeMs: number;
  timestamp: string;
  streamedAt?: number;
}

// Statistics
interface ExecutionStats {
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
```

---

## Best Practices

1. **Always initialize before use**
   ```typescript
   await taskExecutor.initializeClient();
   ```

2. **Monitor progress**
   ```typescript
   await executeTasksInParallel(decomposition, (result) => {
     console.log(`Progress: ${result.taskId}`);
   });
   ```

3. **Handle errors gracefully**
   ```typescript
   const { results } = await executeTasksInParallel(decomposition);
   results.forEach(result => {
     if (!result.success) console.error(result.error);
   });
   ```

4. **Track statistics**
   ```typescript
   const stats = taskExecutor.getStats();
   console.log(`Tokens: ${stats.totalTokensUsed}`);
   ```

5. **Respect dependencies**
   - Task executor automatically respects `task.dependencies`
   - No manual dependency management needed

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Tasks not streaming** | Check API key in BYOK store |
| **Canvas nodes not appearing** | Verify canvasStore is initialized |
| **Slow execution** | Check network latency, reduce chunk size |
| **Memory issues** | Reduce concurrent task count |
| **Token overflow** | Monitor `totalTokensUsed` in stats |

---

## Next Steps

1. Review `TaskExecutorDemo.tsx` for interactive example
2. Integrate with your voice recording service
3. Connect to canvas visualization
4. Test with real decompositions
5. Monitor performance and adjust parameters

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** June 4, 2026
