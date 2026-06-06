/**
 * Example React component using canvas store hooks
 */

import React from 'react';
import {
  useCanvasNodes,
  useCanvasActions,
  useCanvasNodeCounts,
  useCanvasBounds,
  useTotalContentLength,
  useStreamingNodes,
} from './canvasStore.hooks';

/**
 * Canvas Store Example Component
 * Demonstrates how to use the canvas store in React
 */
export function CanvasStoreExample() {
  const nodes = useCanvasNodes();
  const { addNode } = useCanvasActions();
  const counts = useCanvasNodeCounts();
  const bounds = useCanvasBounds();
  const totalContent = useTotalContentLength();
  const streamingNodes = useStreamingNodes();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Canvas Store State</h2>

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h3>Statistics:</h3>
        <ul>
          <li>Total nodes: {nodes.length}</li>
          <li>Streaming nodes: {streamingNodes.length}</li>
          <li>Total content: {totalContent} characters</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h3>Counts by Type:</h3>
        <ul>
          <li>Code nodes: {counts.code}</li>
          <li>Chat nodes: {counts.chat}</li>
          <li>Terminal nodes: {counts.terminal}</li>
          <li>Agent nodes: {counts.agent}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h3>Canvas Bounds:</h3>
        <p>
          X: {bounds.minX} to {bounds.maxX} (width: {bounds.width})
        </p>
        <p>
          Y: {bounds.minY} to {bounds.maxY} (height: {bounds.height})
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Nodes ({nodes.length} total):</h3>
        <div
          style={{
            maxHeight: '300px',
            overflowY: 'auto',
            backgroundColor: '#f0f0f0',
            padding: '10px',
          }}
        >
          {nodes.length === 0 ? (
            <p>No nodes created yet</p>
          ) : (
            <ul style={{ margin: 0 }}>
              {nodes.map((node) => (
                <li key={node.id} style={{ marginBottom: '8px', wordBreak: 'break-word' }}>
                  <strong>[{node.type}]</strong> {node.id}
                  {node.isStreaming && ' 🔄 STREAMING'}
                  <br />
                  <small>Content: {node.content.substring(0, 50)}{node.content.length > 50 ? '...' : ''}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() =>
            addNode({
              type: 'code',
              x: Math.random() * 800,
              y: Math.random() * 600,
              width: 400,
              height: 300,
              content: 'console.log("New code node");',
            })
          }
        >
          Add Code Node
        </button>

        <button
          onClick={() =>
            addNode({
              type: 'chat',
              x: Math.random() * 800,
              y: Math.random() * 600,
              width: 300,
              height: 400,
              content: 'Start typing...',
            })
          }
        >
          Add Chat Node
        </button>

        <button
          onClick={() =>
            addNode({
              type: 'agent',
              x: Math.random() * 800,
              y: Math.random() * 600,
              width: 400,
              height: 300,
              content: '',
              metadata: { model: 'gpt-4' },
            })
          }
        >
          Add Agent Node
        </button>

        <button
          onClick={() =>
            addNode({
              type: 'terminal',
              x: Math.random() * 800,
              y: Math.random() * 600,
              width: 500,
              height: 300,
              content: '$ ',
            })
          }
        >
          Add Terminal Node
        </button>
      </div>
    </div>
  );
}

/**
 * Detailed Node Viewer Component
 * Shows detailed information about a single node
 */
export function NodeViewer({ nodeId }: { nodeId: string }) {
  const { getState } = useCanvasActions();
  const node = getState().nodes.find((n) => n.id === nodeId);

  if (!node) {
    return <div>Node not found</div>;
  }

  return (
    <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
      <h3>Node: {node.id}</h3>
      <dl>
        <dt>Type:</dt>
        <dd>{node.type}</dd>
        <dt>Position:</dt>
        <dd>
          x={node.x}, y={node.y}
        </dd>
        <dt>Size:</dt>
        <dd>
          {node.width}×{node.height}
        </dd>
        <dt>Content length:</dt>
        <dd>{node.content.length} characters</dd>
        <dt>Created:</dt>
        <dd>{new Date(node.createdAt).toLocaleString()}</dd>
        <dt>Updated:</dt>
        <dd>{new Date(node.updatedAt).toLocaleString()}</dd>
        <dt>Streaming:</dt>
        <dd>{node.isStreaming ? 'Yes' : 'No'}</dd>
        {node.metadata && (
          <>
            <dt>Metadata:</dt>
            <dd>
              <pre>{JSON.stringify(node.metadata, null, 2)}</pre>
            </dd>
          </>
        )}
      </dl>
      <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f0f0f0', padding: '10px' }}>
        <strong>Content:</strong>
        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', margin: 0 }}>
          {node.content}
        </pre>
      </div>
    </div>
  );
}

/**
 * Stream Simulator Component
 * Demonstrates streaming content to an agent node
 */
export function StreamSimulator() {
  const { addNode, appendNodeContent, setNodeStreaming } = useCanvasActions();
  const [nodeId, setNodeId] = React.useState<string | null>(null);
  const [isStreaming, setIsStreaming] = React.useState(false);

  const handleStartStream = async () => {
    if (isStreaming) return;

    // Create a new agent node if not already created
    let targetNodeId = nodeId;
    if (!targetNodeId) {
      targetNodeId = addNode({
        type: 'agent',
        x: 0,
        y: 0,
        width: 400,
        height: 300,
        content: '',
      });
      setNodeId(targetNodeId);
    }

    setIsStreaming(true);
    const store = useCanvasStore.getState();
    store.setNodeStreaming(targetNodeId, true);

    // Simulate streaming chunks
    const chunks = [
      'The quick brown ',
      'fox jumps over ',
      'the lazy dog. ',
      'This is a simulated ',
      'streaming response ',
      'from an AI agent.',
    ];

    for (const chunk of chunks) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      store.appendNodeContent(targetNodeId, chunk);
    }

    store.setNodeStreaming(targetNodeId, false);
    setIsStreaming(false);
  };

  const handleClear = () => {
    if (nodeId) {
      const store = useCanvasStore.getState();
      store.setNodeContent(nodeId, '');
    }
  };

  return (
    <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
      <h3>Stream Simulator</h3>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={handleStartStream} disabled={isStreaming}>
          {isStreaming ? 'Streaming...' : 'Start Stream'}
        </button>
        <button onClick={handleClear} disabled={!nodeId}>
          Clear
        </button>
      </div>
      {nodeId && <p>Node ID: {nodeId}</p>}
      {isStreaming && <p>✓ Currently streaming...</p>}
    </div>
  );
}

// Import useCanvasStore for stream simulator
import { useCanvasStore } from './canvasStore';
