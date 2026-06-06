# ⚡ Task Executor - Quick Reference

## 5-Minute Setup

### 1. Import Components

```typescript
import { executeTasksInParallel } from '@/services/taskExecutor';
import { useTaskExecutor } from '@/hooks/useTaskExecutor';
import { useCanvasStore } from '@/store/canvasStore';
```

### 2. Execute Tasks

```typescript
// Get decomposition from orchestrator
const decomposition = await orchestrator.decomposeTask(userInput);

// Execute in parallel
const { results, stats } = await executeTasksInParallel(decomposition);

// Access results
results.forEach(r => {
  console.log(`${r.title}: ${r.success ? '✓' : '✗'}`);
});
```

### 3. React Component

```typescript
function TaskExecutor() {
  const executor = useTaskExecutor();
  
  const handleExecute = async () => {
    await executor.execute(decomposition);
  };

  return (
    <View>
      <Text>{executor.state.progress}%</Text>
      <TouchableOpacity onPress={handleExecute}>
        <Text>Execute</Text>
      </TouchableOpacity>
      {executor.results.map(r => (
        <Text key={r.taskId}>{r.title}</Text>
      ))}
    </View>
  );
}
```

---

## Core API

### executeTasksInParallel(decomposition, onProgress?)

Main execution function.

| Parameter | Type | Description |
|-----------|------|-------------|
| `decomposition` | `TaskDecomposition` | Tasks to execute |
| `onProgress?` | `(result) => void` | Progress callback |

**Returns:**
```typescript
{
  results: TaskExecutionResult[],
  stats: ExecutionStats
}
```

**Example:**
```typescript
const { results, stats } = await executeTasksInParallel(
  decomposition,
  (result) => console.log(`✓ ${result.title}`)
);
```

---

## useTaskExecutor Hook

### State

```typescript
executor.state.isExecuting      // boolean
executor.state.progress         // 0-100
executor.state.completedTasks   // number
executor.state.failedTasks      // number
executor.state.error            // string | null
```

### Actions

```typescript
await executor.execute(decomposition)   // Start execution
executor.pause()                        // Pause
executor.resume()                       // Resume
executor.cancel()                       // Cancel
```

### Results

```typescript
executor.results                        // TaskExecutionResult[]
executor.stats                          // ExecutionStats | null
executor.getSuccessfulTasks()          // Filter successful
executor.getFailedTasks()              // Filter failed
executor.getTaskResult(taskId)         // Get by ID
executor.getTasksByAgentType(type)     // Filter by agent
```

### Management

```typescript
executor.clearResults()                 // Clear all
executor.exportResults()                // Export as JSON
```

---

## Data Structures

### TaskExecutionResult

```typescript
{
  taskId: string;                    // Task ID from decomposition
  nodeId: string;                    // Canvas node ID
  title: string;                     // Task title
  success: boolean;                  // Execution success
  content: string;                   // Generated content
  error?: string;                    // Error message if failed
  tokensUsed?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  processingTimeMs: number;          // Execution time
  timestamp: string;                 // ISO timestamp
  streamedAt?: number;               // Chunk count
}
```

### ExecutionStats

```typescript
{
  totalTasks: number;                // Total tasks
  completedTasks: number;            // Successful count
  failedTasks: number;               // Failed count
  totalTokensUsed: number;           // Sum of all tokens
  totalProcessingTimeMs: number;     // Total time
  concurrentStreams: number;         // Peak concurrent
  averageChunkSize: number;          // Avg chunk size
  startedAt: string;                 // Start timestamp
  completedAt?: string;              // End timestamp
}
```

---

## Common Patterns

### Pattern 1: Execute and Display Progress

```typescript
const executor = useTaskExecutor();

const handleExecute = async () => {
  await executor.execute(decomposition);
};

return (
  <View>
    <ProgressBar value={executor.state.progress} />
    <Text>{executor.state.completedTasks}/{decomposition.subtasks.length}</Text>
    <Button title="Execute" onPress={handleExecute} />
  </View>
);
```

### Pattern 2: Monitor Success Rate

```typescript
const successRate = executor.results.length > 0
  ? (executor.getSuccessfulTasks().length / executor.results.length * 100).toFixed(1)
  : 0;

return <Text>Success: {successRate}%</Text>;
```

### Pattern 3: Export Results

```typescript
const handleExport = () => {
  const json = executor.exportResults();
  // Save to file or upload
  console.log(json);
};
```

### Pattern 4: Track Tokens

```typescript
const totalTokens = executor.stats?.totalTokensUsed || 0;
const costEstimate = totalTokens * 0.00001;  // Example pricing

return <Text>Cost: ${costEstimate.toFixed(4)}</Text>;
```

### Pattern 5: Error Handling

```typescript
{executor.state.error && (
  <View style={styles.error}>
    <Text>{executor.state.error}</Text>
    <Button title="Clear" onPress={() => executor.clearResults()} />
  </View>
)}
```

---

## Canvas Integration

### Automatic Node Creation

Canvas nodes are automatically created:
- Before stream starts: `addNode()`
- During streaming: `appendNodeContent()`
- After completion: `setNodeStreaming(false)`

**Result:** Real-time content updates on canvas

### Node Layout

Position calculation:
- **X:** Based on agent type (coder=0, reviewer=450, etc.)
- **Y:** Based on priority (critical=0, high=350)
- **Size:** 400x300 fixed

### Real-Time Updates

Each stream chunk updates the canvas node:

```typescript
for await (const chunk of stream) {
  // Canvas node content appends immediately
  canvasStore.appendNodeContent(nodeId, chunkText);
}
```

---

## Performance Tips

| Tip | Impact |
|-----|--------|
| Execute in waves | Respects dependencies automatically |
| Monitor tokens | Track costs in real-time |
| Check progress | UI feels responsive |
| Export results | Persist execution data |
| Clear on completion | Memory cleanup |

---

## Error Handling

```typescript
try {
  const { results } = await executeTasksInParallel(decomposition);
  
  // Check results
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.error('Failed tasks:', failed);
  }
} catch (error) {
  console.error('Execution failed:', error);
}
```

---

## Integration Checklist

- ✅ Import `executeTasksInParallel`
- ✅ Configure Gemini API key in BYOK store
- ✅ Test with sample decomposition
- ✅ Monitor canvas nodes appearing
- ✅ Verify real-time content updates
- ✅ Check error handling
- ✅ Track execution statistics
- ✅ Export and verify results

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No canvas nodes | Check canvas store initialized |
| No streaming | Verify Gemini API key |
| Slow updates | Check network latency |
| Memory errors | Monitor concurrent tasks |
| Results not showing | Check executor.results array |

---

## Files Reference

| File | Purpose |
|------|---------|
| `taskExecutor.ts` | Core service + singleton |
| `useTaskExecutor.ts` | React hook |
| `TaskExecutorDemo.tsx` | Interactive demo |
| `TASK_EXECUTOR_GUIDE.md` | Detailed guide (this file) |

---

## Examples

### Full Workflow Example

```typescript
// 1. Get decomposition
const decomposition = await orchestrator.decomposeTask(userRequest);

// 2. Execute tasks
const executor = useTaskExecutor();
await executor.execute(decomposition);

// 3. Monitor execution
const { state, results, stats } = executor;
console.log(`${state.progress}% complete`);

// 4. Process results
results.forEach(result => {
  if (result.success) {
    console.log(`✓ ${result.title} (${result.tokensUsed?.totalTokens} tokens)`);
  } else {
    console.error(`✗ ${result.title}: ${result.error}`);
  }
});

// 5. Export data
const json = executor.exportResults();
await saveToFile(json);
```

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Quick Links:**
- [Full Guide](./TASK_EXECUTOR_GUIDE.md)
- [Demo Component](../src/screens/TaskExecutorDemo.tsx)
- [Service Code](../src/services/taskExecutor.ts)
