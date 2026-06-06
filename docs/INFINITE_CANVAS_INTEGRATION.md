# Complete Infinite Canvas Integration Guide

## Quick Start

### 1. Basic Setup

Install required dependencies:
```bash
npm install @shopify/react-native-skia react-native-gesture-handler react-native-reanimated zustand immer
```

### 2. Create Your Screen

```typescript
import React from 'react';
import { View } from 'react-native';
import InfiniteCanvas from './components/InfiniteCanvas';

export const MyCanvasScreen: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      <InfiniteCanvas
        config={{
          autoFitContent: true,
          enableNodeDragging: true,
          gridEnabled: true,
        }}
        onNodeSelected={(nodeId) => {
          console.log('Node selected:', nodeId);
        }}
      />
    </View>
  );
};
```

### 3. Add Nodes Programmatically

```typescript
import { useCanvasActions } from './store/canvasStore.hooks';

const MyComponent: React.FC = () => {
  const { addNode } = useCanvasActions();

  const handleAddCodeNode = () => {
    addNode({
      type: 'code',
      x: 100,
      y: 100,
      width: 400,
      height: 300,
      content: 'const x = 42;',
      metadata: {
        tags: ['javascript', 'demo'],
        customData: {},
      },
    });
  };

  return <Button title="Add Code Node" onPress={handleAddCodeNode} />;
};
```

## Real-World Example: AI Agent Canvas

Here's a complete example showing how to build an AI agent coordination interface:

```typescript
/**
 * AIAgentCanvas.tsx
 * Canvas for coordinating AI agents with code/chat/terminal nodes
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  Button,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import InfiniteCanvas from './components/InfiniteCanvas';
import { useCanvasActions, useCanvasNodes } from './store/canvasStore.hooks';

export const AIAgentCanvas: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useState('');
  const { addNode, appendNodeContent, setNodeStreaming } = useCanvasActions();
  const nodes = useCanvasNodes();

  /**
   * Create a new agent node
   */
  const handleCreateAgent = useCallback(() => {
    const nodeId = Math.random().toString(36).slice(2);
    
    addNode({
      type: 'agent',
      x: Math.random() * 500,
      y: Math.random() * 500,
      width: 400,
      height: 250,
      content: systemPrompt || 'New AI Agent',
      metadata: {
        tags: ['ai', 'agent'],
        customData: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
        },
      },
    });
  }, [addNode, systemPrompt]);

  /**
   * Simulate streaming response from an agent
   */
  const handleStreamResponse = useCallback(
    async (nodeId: string) => {
      const agentNode = nodes.find((n) => n.id === nodeId);
      if (!agentNode) return;

      setNodeStreaming(nodeId, true);

      const response =
        'I will analyze your request and provide a comprehensive response...';

      for (const char of response) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        appendNodeContent(nodeId, char);
      }

      setNodeStreaming(nodeId, false);
    },
    [nodes, setNodeStreaming, appendNodeContent]
  );

  /**
   * Create a workflow of connected agents
   */
  const handleCreateWorkflow = useCallback(() => {
    // Agent 1: Planning
    addNode({
      type: 'agent',
      x: 50,
      y: 50,
      width: 300,
      height: 200,
      content: 'Planning Agent: Break down the task into steps',
      metadata: { tags: ['planner'], customData: {} },
    });

    // Agent 2: Implementation
    addNode({
      type: 'code',
      x: 400,
      y: 50,
      width: 300,
      height: 200,
      content: '# Implementation Agent\n# Write code to solve the task',
      metadata: { tags: ['coder'], customData: {} },
    });

    // Agent 3: Testing
    addNode({
      type: 'terminal',
      x: 750,
      y: 50,
      width: 300,
      height: 200,
      content: 'Testing Agent: Run tests and verify solution',
      metadata: { tags: ['tester'], customData: {} },
    });

    // Agent 4: Documentation
    addNode({
      type: 'chat',
      x: 225,
      y: 300,
      width: 300,
      height: 200,
      content: 'Documentation Agent: Write documentation',
      metadata: { tags: ['documenter'], customData: {} },
    });
  }, [addNode]);

  return (
    <View style={styles.container}>
      <View style={styles.canvasContainer}>
        <InfiniteCanvas
          config={{
            autoFitContent: true,
            enableNodeDragging: true,
            showViewportBounds: false,
          }}
          backgroundColor="#F9FAFB"
        />
      </View>

      <ScrollView style={styles.controlPanel}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Button
            title="Create Agent"
            onPress={handleCreateAgent}
            color="#3B82F6"
          />
          <View style={{ height: 8 }} />
          <Button
            title="Create Workflow"
            onPress={handleCreateWorkflow}
            color="#10B981"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Prompt</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter system prompt for new agents..."
            value={systemPrompt}
            onChangeText={setSystemPrompt}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Info</Text>
          <Text style={styles.infoText}>
            Total Nodes: {nodes.length}
          </Text>
          <Text style={styles.infoText}>
            Agent Nodes: {nodes.filter((n) => n.type === 'agent').length}
          </Text>
          <Text style={styles.infoText}>
            Code Nodes: {nodes.filter((n) => n.type === 'code').length}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  canvasContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  controlPanel: {
    maxHeight: 300,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1F2937',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 10,
    fontSize: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
});

export default AIAgentCanvas;
```

## Advanced Pattern: Multi-Agent Collaboration

```typescript
/**
 * Multi-agent collaboration with streaming updates
 */

export const MultiAgentCollaboration: React.FC = () => {
  const { addNode, appendNodeContent, setNodeStreaming } = useCanvasActions();

  /**
   * Create agents and coordinate their work
   */
  const handleStartCollaboration = useCallback(async () => {
    // Create agent nodes
    const agentIds = {
      research: addNode({
        type: 'agent',
        x: 0,
        y: 0,
        width: 350,
        height: 250,
        content: 'Research Agent',
        metadata: { tags: ['research'], customData: { role: 'researcher' } },
      }).id,
      
      writer: addNode({
        type: 'agent',
        x: 400,
        y: 0,
        width: 350,
        height: 250,
        content: 'Writing Agent',
        metadata: { tags: ['writing'], customData: { role: 'writer' } },
      }).id,
      
      editor: addNode({
        type: 'agent',
        x: 800,
        y: 0,
        width: 350,
        height: 250,
        content: 'Editing Agent',
        metadata: { tags: ['editing'], customData: { role: 'editor' } },
      }).id,
    };

    // Simulate collaborative work
    for (const [role, nodeId] of Object.entries(agentIds)) {
      setNodeStreaming(nodeId, true);
      
      const response = `${role.toUpperCase()}: Processing...`;
      for (const char of response) {
        await new Promise((r) => setTimeout(r, 30));
        appendNodeContent(nodeId, char);
      }
      
      setNodeStreaming(nodeId, false);
    }
  }, [addNode, appendNodeContent, setNodeStreaming]);

  return (
    <View>
      <InfiniteCanvas />
      <Button 
        title="Start Collaboration" 
        onPress={handleStartCollaboration} 
      />
    </View>
  );
};
```

## Integration Patterns

### Pattern 1: React Navigation Integration

```typescript
import { useIsFocused } from '@react-navigation/native';

export const CanvasScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const [nodes, setNodes] = useState<CanvasNode[]>([]);

  // Load nodes when screen is focused
  React.useEffect(() => {
    if (isFocused) {
      // Refresh nodes from store
      const unsubscribe = useCanvasStore.subscribe(
        (state) => state.nodes,
        (nodes) => setNodes(nodes)
      );
      return unsubscribe;
    }
  }, [isFocused]);

  return <InfiniteCanvas />;
};
```

### Pattern 2: With Redux for Global State

```typescript
import { useDispatch, useSelector } from 'react-redux';

export const CanvasScreen: React.FC = () => {
  const dispatch = useDispatch();
  const selectedNodeId = useSelector((state) => state.canvas.selectedNodeId);

  const handleNodeSelect = (nodeId: string) => {
    dispatch({ type: 'CANVAS/SELECT_NODE', payload: nodeId });
  };

  return (
    <InfiniteCanvas onNodeSelected={handleNodeSelect} />
  );
};
```

### Pattern 3: With React Query for Server Sync

```typescript
import { useQuery, useMutation } from 'react-query';

export const SyncedCanvasScreen: React.FC = () => {
  const { data: nodes } = useQuery('canvas-nodes', fetchNodesFromServer);
  const mutation = useMutation(saveNodesToServer);

  const handleNodeUpdated = useCallback(
    (nodeId: string) => {
      // Sync to server
      mutation.mutate({ nodeId });
    },
    [mutation]
  );

  return (
    <InfiniteCanvas 
      onNodeSelected={handleNodeUpdated}
    />
  );
};
```

## Performance Optimization

### Use Memoization

```typescript
const MemoizedCanvasNode = React.memo(
  ({ node, isSelected }) => (
    // Render node
  ),
  (prev, next) => {
    // Custom comparison
    return (
      prev.node.id === next.node.id &&
      prev.node.x === next.node.x &&
      prev.node.y === next.node.y &&
      prev.isSelected === next.isSelected
    );
  }
);
```

### Batch Updates

```typescript
const { batchAppendNodeContent } = useCanvasActions();

// Instead of:
for (const update of updates) {
  appendNodeContent(update.nodeId, update.chunk);
}

// Do:
batchAppendNodeContent(updates);
```

### Use Redux DevTools for Profiling

```typescript
// Enable Redux DevTools in your browser
// View action history and state changes
// Time-travel debug through canvas operations
```

## Common Use Cases

### Use Case 1: Code Editor with Split View

```typescript
<View style={{ flex: 1, flexDirection: 'row' }}>
  <View style={{ flex: 1 }}>
    <InfiniteCanvas config={{ gridEnabled: true }} />
  </View>
  <CodeEditor nodeId={selectedNodeId} />
</View>
```

### Use Case 2: Presentation Mode

```typescript
<InfiniteCanvas
  config={{
    enableNodeDragging: false,
    enableNodeSelection: false,
    gridEnabled: false,
  }}
/>
```

### Use Case 3: Collaborative Editing

```typescript
// With WebSocket sync
const handleTransformChange = (transform) => {
  socket.emit('transform-update', transform);
};

const handleNodeUpdated = (nodeId) => {
  socket.emit('node-update', nodeId);
};
```

## Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| Nodes not rendering | Check viewport bounds, verify node coordinates |
| Pan not working | Ensure gestures are enabled, check transform state |
| Performance lag | Enable viewport culling, reduce node count, profile |
| Zoom not smooth | Check spring config, verify reanimated version |
| Selection not working | Verify hit detection, check selectedNodeId state |

## Next Steps

1. **Implement scrolling**: Add mouse wheel zoom support
2. **Add animations**: Use spring animations for smooth transitions
3. **Node grouping**: Allow selecting and moving multiple nodes together
4. **Export/import**: Add canvas state persistence
5. **Real-time collab**: Add WebSocket sync for collaborative editing
6. **Accessibility**: Add keyboard shortcuts and screen reader support

## Related Documentation

- [CanvasEngine Component Guide](./INFINITE_CANVAS_GUIDE.md#canvasengine)
- [Zustand Store API](./ZUSTAND_STORE_GUIDE.md)
- [Canvas Utilities Reference](./INFINITE_CANVAS_GUIDE.md#canvas-utils)
