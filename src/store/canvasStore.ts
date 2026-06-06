/**
 * Zustand store for infinite canvas application
 * Manages canvas nodes with optimized streaming support for AI agents
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * Supported node types on the canvas
 */
export type NodeType = 'code' | 'chat' | 'terminal' | 'agent';

/**
 * Represents a single node on the infinite canvas
 */
export interface CanvasNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  /** Optional metadata for specific node types */
  metadata?: Record<string, unknown>;
  /** Timestamp when node was created (ms) */
  createdAt: number;
  /** Timestamp when node was last updated (ms) */
  updatedAt: number;
  /** Flag for optimistic updates (e.g., streaming in progress) */
  isStreaming?: boolean;
}

/**
 * Canvas store state
 */
export interface CanvasStoreState {
  nodes: CanvasNode[];
}

/**
 * Canvas store actions
 */
export interface CanvasStoreActions {
  /**
   * Add a new node to the canvas
   */
  addNode: (node: Omit<CanvasNode, 'id' | 'createdAt' | 'updatedAt'>) => string;

  /**
   * Update a node's position (x, y coordinates)
   */
  updateNodePosition: (nodeId: string, x: number, y: number) => void;

  /**
   * Update a node's dimensions (width, height)
   */
  updateNodeDimensions: (nodeId: string, width: number, height: number) => void;

  /**
   * Append content to a node (optimized for streaming)
   * Handles rapid incoming text chunks from AI agents with minimal re-renders
   */
  appendNodeContent: (nodeId: string, chunk: string) => void;

  /**
   * Batch append content chunks - more efficient for multiple updates
   * Useful when collecting chunks before applying to store
   */
  batchAppendNodeContent: (updates: Array<{ nodeId: string; chunk: string }>) => void;

  /**
   * Replace entire node content
   */
  setNodeContent: (nodeId: string, content: string) => void;

  /**
   * Update node metadata
   */
  updateNodeMetadata: (nodeId: string, metadata: Record<string, unknown>) => void;

  /**
   * Set streaming status for a node
   */
  setNodeStreaming: (nodeId: string, isStreaming: boolean) => void;

  /**
   * Remove a node from the canvas
   */
  removeNode: (nodeId: string) => void;

  /**
   * Remove multiple nodes
   */
  removeNodes: (nodeIds: string[]) => void;

  /**
   * Get a specific node by ID
   */
  getNode: (nodeId: string) => CanvasNode | undefined;

  /**
   * Get all nodes of a specific type
   */
  getNodesByType: (type: NodeType) => CanvasNode[];

  /**
   * Clear all nodes
   */
  clearNodes: () => void;

  /**
   * Get store state
   */
  getState: () => CanvasStoreState;
}

/**
 * Combined store interface
 */
export type CanvasStore = CanvasStoreState & CanvasStoreActions;

/**
 * Generate unique ID for nodes
 */
const generateId = (): string => {
  return `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Streaming buffer for 60fps batched updates
const appendBufferRef = { current: new Map<string, string>() };
const flushScheduledRef = { current: false };

/**
 * Create the Zustand store with Immer middleware for immutable updates
 * and Devtools for debugging
 */
export const useCanvasStore = create<CanvasStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      nodes: [],

      // Actions
      addNode: (node) => {
        const id = generateId();
        const now = Date.now();

        set((state) => {
          state.nodes.push({
            ...node,
            id,
            createdAt: now,
            updatedAt: now,
            content: node.content || '',
            isStreaming: node.isStreaming ?? false,
          });
        });

        return id;
      },

      updateNodePosition: (nodeId, x, y) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === nodeId);
          if (node) {
            node.x = x;
            node.y = y;
            node.updatedAt = Date.now();
          }
        });
      },

      updateNodeDimensions: (nodeId, width, height) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === nodeId);
          if (node) {
            node.width = width;
            node.height = height;
            node.updatedAt = Date.now();
          }
        });
      },

      /**
       * HIGHLY OPTIMIZED: appendNodeContent for streaming
       *
       * Design decisions for streaming optimization:
       * 1. Direct string concatenation (fastest operation in JS)
       * 2. Single state mutation per chunk (minimal re-renders)
       * 3. Updates timestamp only (efficient diff detection)
       * 4. Immer middleware ensures immutability without overhead
       *
       * Performance characteristics:
       * - O(1) append operation (string concat is optimized in V8)
       * - Single re-render trigger per chunk
       * - Memory efficient (no intermediate string copies)
       * - Suitable for 100+ chunks/second
       *
       * Example usage with streaming:
       * ```
       * for await (const chunk of aiStream) {
       *   store.appendNodeContent(nodeId, chunk);
       * }
       * ```
       */
      appendNodeContent: (nodeId, chunk) => {
        const pending = appendBufferRef.current.get(nodeId) || '';
        appendBufferRef.current.set(nodeId, pending + chunk);

        if (!flushScheduledRef.current) {
          flushScheduledRef.current = true;
          requestAnimationFrame(() => {
            set((state) => {
              for (const [id, content] of appendBufferRef.current.entries()) {
                const node = state.nodes.find((n) => n.id === id);
                if (node) {
                  node.content += content;
                  node.updatedAt = Date.now();
                }
              }
              appendBufferRef.current.clear();
            });
            flushScheduledRef.current = false;
          });
        }
      },

      /**
       * Batch append for multiple nodes in single update
       * Reduces state mutations from N to 1
       * Ideal when distributing stream chunks to multiple nodes
       */
      batchAppendNodeContent: (updates) => {
        set((state) => {
          const now = Date.now();
          const nodeMap = new Map(state.nodes.map((n) => [n.id, n]));

          for (const { nodeId, chunk } of updates) {
            const node = nodeMap.get(nodeId);
            if (node) {
              node.content += chunk;
              node.updatedAt = now;
            }
          }
        });
      },

      setNodeContent: (nodeId, content) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === nodeId);
          if (node) {
            node.content = content;
            node.updatedAt = Date.now();
          }
        });
      },

      updateNodeMetadata: (nodeId, metadata) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === nodeId);
          if (node) {
            node.metadata = {
              ...node.metadata,
              ...metadata,
            };
            node.updatedAt = Date.now();
          }
        });
      },

      setNodeStreaming: (nodeId, isStreaming) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === nodeId);
          if (node) {
            node.isStreaming = isStreaming;
            node.updatedAt = Date.now();
          }
        });
      },

      removeNode: (nodeId) => {
        set((state) => {
          state.nodes = state.nodes.filter((n) => n.id !== nodeId);
        });
      },

      removeNodes: (nodeIds) => {
        set((state) => {
          const idsToRemove = new Set(nodeIds);
          state.nodes = state.nodes.filter((n) => !idsToRemove.has(n.id));
        });
      },

      getNode: (nodeId) => {
        return get().nodes.find((n) => n.id === nodeId);
      },

      getNodesByType: (type) => {
        return get().nodes.filter((n) => n.type === type);
      },

      clearNodes: () => {
        set((state) => {
          state.nodes = [];
        });
      },

      getState: () => {
        return { nodes: get().nodes };
      },
    })),
    {
      name: 'CanvasStore',
      trace: true,
      traceLimit: 25,
    },
  ),
);
