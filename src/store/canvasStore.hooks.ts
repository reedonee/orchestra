/**
 * Custom React hooks for canvas store
 * Provides convenient selectors and utilities for React components
 */

import { useMemo, useRef, useEffect } from 'react';
import { useCanvasStore, CanvasNode, NodeType } from './canvasStore';

/**
 * Hook: Get a specific node by ID
 * Re-renders only when that specific node changes
 */
export function useCanvasNode(nodeId: string) {
  return useCanvasStore((state) => state.nodes.find((n) => n.id === nodeId));
}

/**
 * Hook: Get all nodes of a specific type
 * Re-renders only when nodes of that type change
 */
export function useCanvasNodesByType(type: NodeType) {
  return useCanvasStore((state) => state.nodes.filter((n) => n.type === type));
}

/**
 * Hook: Get all nodes
 * Re-renders on any node change
 */
export function useCanvasNodes() {
  return useCanvasStore((state) => state.nodes);
}

/**
 * Hook: Get node actions (add, update, remove, etc.)
 * Returns memoized action functions
 */
export function useCanvasActions() {
  return useCanvasStore((state) => ({
    addNode: state.addNode,
    updateNodePosition: state.updateNodePosition,
    updateNodeDimensions: state.updateNodeDimensions,
    appendNodeContent: state.appendNodeContent,
    batchAppendNodeContent: state.batchAppendNodeContent,
    setNodeContent: state.setNodeContent,
    updateNodeMetadata: state.updateNodeMetadata,
    setNodeStreaming: state.setNodeStreaming,
    removeNode: state.removeNode,
    removeNodes: state.removeNodes,
  }));
}

/**
 * Hook: Get a count of nodes by type
 * Useful for UI showing how many nodes of each type exist
 */
export function useCanvasNodeCounts() {
  const nodes = useCanvasNodes();

  return useMemo(() => {
    const counts: Record<NodeType, number> = {
      code: 0,
      chat: 0,
      terminal: 0,
      agent: 0,
    };

    nodes.forEach((node) => {
      counts[node.type]++;
    });

    return counts;
  }, [nodes]);
}

/**
 * Hook: Get streaming nodes (currently receiving content)
 */
export function useStreamingNodes() {
  return useCanvasStore((state) => state.nodes.filter((n) => n.isStreaming));
}

/**
 * Hook: Get bounds of all nodes (min/max x, y)
 * Useful for auto-fitting canvas view
 */
export function useCanvasBounds() {
  const nodes = useCanvasNodes();

  return useMemo(() => {
    if (nodes.length === 0) {
      return {
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0,
        width: 0,
        height: 0,
      };
    }

    let minX = nodes[0].x;
    let minY = nodes[0].y;
    let maxX = nodes[0].x + nodes[0].width;
    let maxY = nodes[0].y + nodes[0].height;

    for (const node of nodes) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [nodes]);
}

/**
 * Hook: Get total content length across all nodes
 * Useful for analytics or storage estimation
 */
export function useTotalContentLength() {
  const nodes = useCanvasNodes();

  return useMemo(() => {
    return nodes.reduce((total, node) => total + node.content.length, 0);
  }, [nodes]);
}

/**
 * Hook: Search nodes by content (case-insensitive)
 */
export function useSearchNodes(query: string) {
  const nodes = useCanvasNodes();

  return useMemo(() => {
    if (!query.trim()) return nodes;

    const lowerQuery = query.toLowerCase();
    return nodes.filter((node) =>
      node.content.toLowerCase().includes(lowerQuery) ||
      node.type.toLowerCase().includes(lowerQuery) ||
      node.id.toLowerCase().includes(lowerQuery)
    );
  }, [nodes, query]);
}

/**
 * Hook: Get nodes sorted by creation time
 */
export function useCanvasNodesSortedByCreated(ascending = true) {
  const nodes = useCanvasNodes();

  return useMemo(() => {
    const sorted = [...nodes].sort((a, b) =>
      ascending ? a.createdAt - b.createdAt : b.createdAt - a.createdAt
    );
    return sorted;
  }, [nodes, ascending]);
}

/**
 * Hook: Get nodes sorted by last update time
 */
export function useCanvasNodesSortedByUpdated(ascending = true) {
  const nodes = useCanvasNodes();

  return useMemo(() => {
    const sorted = [...nodes].sort((a, b) =>
      ascending ? a.updatedAt - b.updatedAt : b.updatedAt - a.updatedAt
    );
    return sorted;
  }, [nodes, ascending]);
}

/**
 * Hook: Get nodes within a bounding box (rectangular region)
 */
export function useNodesInBounds(
  x: number,
  y: number,
  width: number,
  height: number
) {
  const nodes = useCanvasNodes();

  return useMemo(() => {
    return nodes.filter((node) => {
      const nodeRight = node.x + node.width;
      const nodeBottom = node.y + node.height;
      const boundsRight = x + width;
      const boundsBottom = y + height;

      // Check for intersection
      return (
        node.x < boundsRight &&
        nodeRight > x &&
        node.y < boundsBottom &&
        nodeBottom > y
      );
    });
  }, [nodes, x, y, width, height]);
}

/**
 * Hook: Get nodes that intersect with another node
 */
export function useNodesIntersecting(targetNodeId: string) {
  const nodes = useCanvasNodes();
  const targetNode = useCanvasNode(targetNodeId);

  return useMemo(() => {
    if (!targetNode) return [];

    const { x, y, width, height } = targetNode;
    return useNodesInBounds(x, y, width, height).filter(
      (n) => n.id !== targetNodeId
    );
  }, [nodes, targetNode, targetNodeId]);
}

/**
 * Hook: Watch a specific node's content changes
 * Calls callback whenever content changes
 */
export function useNodeContentWatch(
  nodeId: string,
  callback: (content: string) => void
) {
  const node = useCanvasNode(nodeId);

  const previousContent = useRef<string>('');

  useEffect(() => {
    if (node && node.content !== previousContent.current) {
      previousContent.current = node.content;
      callback(node.content);
    }
  }, [node?.content, callback]);
}

/**
 * Hook: Get node change history (track last N updates)
 * Note: This maintains state between renders
 */
export function useNodeChangeHistory(nodeId: string, maxHistory = 10) {
  const node = useCanvasNode(nodeId);
  const historyRef = useRef<Array<{ content: string; timestamp: number }>>([]);

  useEffect(() => {
    if (node) {
      historyRef.current.push({
        content: node.content,
        timestamp: Date.now(),
      });

      if (historyRef.current.length > maxHistory) {
        historyRef.current.shift();
      }
    }
  }, [node?.content, maxHistory]);

  return historyRef.current;
}

/**
 * Note: React import moved to top of file
 * JSX component moved to canvasStore.component.tsx
 */
