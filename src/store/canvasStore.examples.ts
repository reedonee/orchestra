/**
 * Example: Basic Canvas Store Usage
 * Demonstrates fundamental operations with the Zustand canvas store
 */

import { useCanvasStore, CanvasNode, NodeType } from '@/store/canvasStore';

/**
 * Example 1: Creating and managing nodes
 */
export function example1_BasicNodeManagement() {
  const store = useCanvasStore.getState();

  // Add a code node
  const codeNodeId = store.addNode({
    type: 'code',
    x: 100,
    y: 100,
    width: 400,
    height: 300,
    content: 'function hello() {\n  console.log("Hello, World!");\n}',
  });

  console.log('Created code node:', codeNodeId);

  // Add a chat node
  const chatNodeId = store.addNode({
    type: 'chat',
    x: 550,
    y: 100,
    width: 300,
    height: 400,
    content: 'Start a conversation...',
  });

  console.log('Created chat node:', chatNodeId);

  // Add an agent node
  const agentNodeId = store.addNode({
    type: 'agent',
    x: 900,
    y: 100,
    width: 400,
    height: 300,
    content: '',
    metadata: {
      model: 'gpt-4',
      temperature: 0.7,
    },
  });

  console.log('Created agent node:', agentNodeId);

  // Get a node
  const node = store.getNode(codeNodeId);
  console.log('Retrieved node:', node?.type, node?.content.substring(0, 30));

  // Update position
  store.updateNodePosition(codeNodeId, 150, 150);
  console.log('Updated position');

  // Update dimensions
  store.updateNodeDimensions(codeNodeId, 450, 350);
  console.log('Updated dimensions');

  // Get all nodes
  const allNodes = store.getState().nodes;
  console.log(`Total nodes: ${allNodes.length}`);

  return { codeNodeId, chatNodeId, agentNodeId };
}

/**
 * Example 2: Filtering and querying nodes
 */
export function example2_QueryingNodes() {
  const store = useCanvasStore.getState();

  // Get all code nodes
  const codeNodes = store.getNodesByType('code');
  console.log(`Found ${codeNodes.length} code nodes`);

  // Get all agent nodes
  const agentNodes = store.getNodesByType('agent');
  console.log(`Found ${agentNodes.length} agent nodes`);

  // Find a node with specific metadata
  const codeNode = codeNodes[0];
  if (codeNode?.metadata?.language) {
    console.log(`Code node language: ${codeNode.metadata.language}`);
  }

  // Count total nodes
  const totalNodes = store.getState().nodes.length;
  console.log(`Total nodes on canvas: ${totalNodes}`);
}

/**
 * Example 3: Content management
 */
export function example3_ContentManagement() {
  const store = useCanvasStore.getState();

  // Create a node
  const nodeId = store.addNode({
    type: 'terminal',
    x: 0,
    y: 0,
    width: 500,
    height: 300,
    content: '$ ',
  });

  // Append content (like terminal output)
  store.appendNodeContent(nodeId, 'ls -la\n');
  store.appendNodeContent(nodeId, 'total 24\n');
  store.appendNodeContent(nodeId, 'drwxr-xr-x  5 user  group   160 Jun  4 10:00 .\n');
  store.appendNodeContent(nodeId, 'drwxr-xr-x 10 user  group   320 Jun  4 09:00 ..\n');

  // Get node with new content
  const node = store.getNode(nodeId);
  console.log('Terminal output:', node?.content);

  // Replace entire content
  store.setNodeContent(nodeId, '$ clear\n');

  // Update with new content
  const updatedNode = store.getNode(nodeId);
  console.log('After clear:', updatedNode?.content);

  return nodeId;
}

/**
 * Example 4: Batch operations
 */
export function example4_BatchOperations() {
  const store = useCanvasStore.getState();

  // Create multiple nodes
  const nodeIds: string[] = [];
  for (let i = 0; i < 3; i++) {
    const nodeId = store.addNode({
      type: 'agent',
      x: i * 450,
      y: 0,
      width: 400,
      height: 300,
      content: '',
    });
    nodeIds.push(nodeId);
  }

  console.log(`Created ${nodeIds.length} nodes`);

  // Batch append content to all nodes
  store.batchAppendNodeContent([
    { nodeId: nodeIds[0], chunk: 'Agent 1: Processing...' },
    { nodeId: nodeIds[1], chunk: 'Agent 2: Processing...' },
    { nodeId: nodeIds[2], chunk: 'Agent 3: Processing...' },
  ]);

  // Verify
  nodeIds.forEach((nodeId, i) => {
    const node = store.getNode(nodeId);
    console.log(`Node ${i + 1} content:`, node?.content);
  });

  // Batch remove
  store.removeNodes([nodeIds[0], nodeIds[2]]);
  console.log(`Removed 2 nodes, ${store.getState().nodes.length} remain`);

  return nodeIds;
}

/**
 * Example 5: Metadata management
 */
export function example5_MetadataManagement() {
  const store = useCanvasStore.getState();

  const nodeId = store.addNode({
    type: 'code',
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    content: 'const x = 42;',
    metadata: {
      language: 'javascript',
      theme: 'dark',
    },
  });

  console.log('Created node with metadata');

  // Update metadata
  store.updateNodeMetadata(nodeId, {
    theme: 'light',
    isExecuting: true,
  });

  // Get node and check metadata
  const node = store.getNode(nodeId);
  console.log('Updated metadata:', node?.metadata);
  // Output: { language: 'javascript', theme: 'light', isExecuting: true }

  return nodeId;
}

/**
 * Example 6: Streaming simulation (AI Agent response)
 */
export async function example6_StreamingContent() {
  const store = useCanvasStore.getState();

  // Create an agent node
  const agentNodeId = store.addNode({
    type: 'agent',
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    content: '',
  });

  console.log('Created agent node:', agentNodeId);

  // Mark as streaming
  store.setNodeStreaming(agentNodeId, true);

  // Simulate streaming response from AI
  const chunks = [
    'The quick brown ',
    'fox jumps over ',
    'the lazy dog. ',
    'This is simulated ',
    'streaming content.',
  ];

  for (const chunk of chunks) {
    // In real scenario, this would be from an API stream
    await new Promise((resolve) => setTimeout(resolve, 100));
    store.appendNodeContent(agentNodeId, chunk);
  }

  // Done streaming
  store.setNodeStreaming(agentNodeId, false);

  const node = store.getNode(agentNodeId);
  console.log('Final content:', node?.content);
  console.log('Is streaming:', node?.isStreaming);

  return agentNodeId;
}

/**
 * Example 7: React component integration
 */
export function example7_ReactComponent() {
  return `
    import { useCanvasStore } from '@/store/canvasStore';
    
    export function CanvasContainer() {
      // Subscribe to all nodes
      const nodes = useCanvasStore((state) => state.nodes);
      const addNode = useCanvasStore((state) => state.addNode);
      const updateNodePosition = useCanvasStore((state) => state.updateNodePosition);
      const appendNodeContent = useCanvasStore((state) => state.appendNodeContent);
      
      const handleAddNode = () => {
        addNode({
          type: 'code',
          x: Math.random() * 800,
          y: Math.random() * 600,
          width: 400,
          height: 300,
          content: 'New node',
        });
      };
      
      return (
        <div>
          <button onClick={handleAddNode}>Add Node</button>
          {nodes.map((node) => (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                width: node.width,
                height: node.height,
              }}
            >
              <h3>{node.type}</h3>
              <p>{node.content}</p>
            </div>
          ))}
        </div>
      );
    }
  `;
}

/**
 * Example 8: Streaming multiple agents
 */
export async function example8_MultipleAgentStreaming() {
  const store = useCanvasStore.getState();

  // Create multiple agent nodes
  const agents = [
    {
      nodeId: store.addNode({
        type: 'agent',
        x: 0,
        y: 0,
        width: 400,
        height: 300,
        content: '',
        metadata: { name: 'Agent 1' },
      }),
      prompt: 'Summarize: The future is now',
    },
    {
      nodeId: store.addNode({
        type: 'agent',
        x: 450,
        y: 0,
        width: 400,
        height: 300,
        content: '',
        metadata: { name: 'Agent 2' },
      }),
      prompt: 'Translate to Spanish: Hello world',
    },
  ];

  console.log('Created 2 agent nodes');

  // Simulate streaming for both agents
  const streamAgent = async (nodeId: string, chunks: string[]) => {
    store.setNodeStreaming(nodeId, true);

    for (const chunk of chunks) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      store.appendNodeContent(nodeId, chunk);
    }

    store.setNodeStreaming(nodeId, false);
  };

  // Stream both agents simultaneously
  await Promise.all([
    streamAgent(agents[0].nodeId, ['Agent 1: ', 'The future ', 'is now.']),
    streamAgent(agents[1].nodeId, ['Agent 2: ', 'Hola ', 'mundo.']),
  ]);

  // Get final state
  agents.forEach(({ nodeId }) => {
    const node = store.getNode(nodeId);
    console.log(`${node?.metadata?.name}:`, node?.content);
  });

  return agents;
}

/**
 * Example 9: Performance - handling high-frequency updates
 */
export async function example9_HighFrequencyUpdates() {
  const store = useCanvasStore.getState();

  const nodeId = store.addNode({
    type: 'terminal',
    x: 0,
    y: 0,
    width: 500,
    height: 400,
    content: '',
  });

  const startTime = performance.now();
  const chunkCount = 1000;

  // Rapidly append small chunks
  for (let i = 0; i < chunkCount; i++) {
    store.appendNodeContent(nodeId, `chunk${i} `);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  const node = store.getNode(nodeId);
  console.log(`
    Performance Test Results:
    - Chunks: ${chunkCount}
    - Duration: ${duration.toFixed(2)}ms
    - Avg per chunk: ${(duration / chunkCount).toFixed(3)}ms
    - Content length: ${node?.content.length} chars
  `);

  return { nodeId, duration, chunkCount };
}

/**
 * Example 10: Complete workflow - Code execution
 */
export async function example10_CompleteWorkflow() {
  const store = useCanvasStore.getState();

  console.log('\n=== Code Execution Workflow ===\n');

  // 1. Create code node
  const codeNodeId = store.addNode({
    type: 'code',
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    content: 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}',
    metadata: {
      language: 'javascript',
      isExecuting: false,
    },
  });
  console.log('1. Created code node');

  // 2. Create terminal node for output
  const terminalNodeId = store.addNode({
    type: 'terminal',
    x: 450,
    y: 0,
    width: 400,
    height: 300,
    content: '$ node code.js\n',
  });
  console.log('2. Created terminal node');

  // 3. Mark code as executing
  store.updateNodeMetadata(codeNodeId, { isExecuting: true });
  console.log('3. Marked as executing');

  // 4. Simulate execution output streaming
  const outputs = [
    'Starting execution...\n',
    'Computing fibonacci(10)...\n',
    'Result: 55\n',
    'Execution completed.\n',
  ];

  for (const output of outputs) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    store.appendNodeContent(terminalNodeId, output);
  }
  console.log('4. Streamed output');

  // 5. Mark execution complete
  store.updateNodeMetadata(codeNodeId, { isExecuting: false });
  console.log('5. Marked execution complete');

  // 6. Display final state
  const codeNode = store.getNode(codeNodeId);
  const terminalNode = store.getNode(terminalNodeId);

  console.log('\nFinal State:');
  console.log('Code Node:', codeNode?.metadata?.isExecuting ? 'executing' : 'idle');
  console.log('Terminal Output:', terminalNode?.content);
  console.log('\n=== Workflow Complete ===\n');

  return { codeNodeId, terminalNodeId };
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('\n📊 Zustand Canvas Store - Examples\n');

  console.log('--- Example 1: Basic Node Management ---');
  example1_BasicNodeManagement();

  console.log('\n--- Example 2: Querying Nodes ---');
  example2_QueryingNodes();

  console.log('\n--- Example 3: Content Management ---');
  example3_ContentManagement();

  console.log('\n--- Example 4: Batch Operations ---');
  example4_BatchOperations();

  console.log('\n--- Example 5: Metadata Management ---');
  example5_MetadataManagement();

  console.log('\n--- Example 6: Streaming Content ---');
  await example6_StreamingContent();

  console.log('\n--- Example 8: Multiple Agent Streaming ---');
  await example8_MultipleAgentStreaming();

  console.log('\n--- Example 9: High Frequency Updates ---');
  await example9_HighFrequencyUpdates();

  console.log('\n--- Example 10: Complete Workflow ---');
  await example10_CompleteWorkflow();

  console.log('\n✅ All examples completed!\n');
}
