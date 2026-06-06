/**
 * CanvasNodeRenderer Component
 * 
 * Renders canvas nodes from Zustand store onto the SkiaCanvas with proper transforms.
 * Features:
 * - Viewport culling (only renders visible nodes)
 * - Transform matrix application for pan/zoom
 * - Node selection and interaction
 * - Adaptive node sizing based on zoom level
 * - Support for multiple node types (code, chat, terminal, agent)
 */

import React, { useCallback, useMemo, useRef } from 'react';
import {
  Canvas,
  Skia,
  Group,
  Rect,
  Text,
} from '@shopify/react-native-skia';
import type {SkiaDomView} from '@shopify/react-native-skia';
import { useCanvasNodes } from '../store/canvasStore.hooks';
import type { CanvasNode } from '../store/canvasStore';
import { CanvasTransform, getViewportBounds, isRectVisible } from './canvasUtils';

/**
 * Colors for different node types
 */
const NODE_TYPE_COLORS: Record<CanvasNode['type'], string> = {
  code: '#3B82F6',      // Blue
  chat: '#10B981',      // Green
  terminal: '#1F2937',  // Dark gray
  agent: '#F59E0B',     // Amber
};

/**
 * Configuration for node rendering
 */
interface NodeRendererConfig {
  nodeMinWidth: number;           // Minimum node width
  nodeMinHeight: number;          // Minimum node height
  nodeCornerRadius: number;       // Corner radius for nodes
  nodeBorderWidth: number;        // Border width when selected
  selectedNodeBorderColor: string; // Selection border color
  textPadding: number;            // Padding inside nodes for text
  previewTextLineLimit: number;   // Max lines to show in preview
}

/**
 * Default node renderer configuration
 */
const DEFAULT_NODE_RENDERER_CONFIG: NodeRendererConfig = {
  nodeMinWidth: 150,
  nodeMinHeight: 100,
  nodeCornerRadius: 8,
  nodeBorderWidth: 2,
  selectedNodeBorderColor: '#FFD700', // Gold
  textPadding: 12,
  previewTextLineLimit: 3,
};

/**
 * Props for CanvasNodeRenderer
 */
interface CanvasNodeRendererProps {
  canvasRef: React.Ref<SkiaDomView>;
  width: number;
  height: number;
  transform: CanvasTransform;
  selectedNodeId?: string;
  onNodePress?: (nodeId: string) => void;
  onNodeLongPress?: (nodeId: string) => void;
  config?: Partial<NodeRendererConfig>;
}

/**
 * Convert node type to display label
 */
function getNodeTypeLabel(type: CanvasNode['type']): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Truncate text to fit within width with ellipsis
 */
function truncateText(text: string, maxChars: number): string {
  if (text.length > maxChars) {
    return text.substring(0, maxChars - 3) + '...';
  }
  return text;
}

/**
 * Get preview text from node content
 */
function getNodePreview(
  content: string,
  lineLimit: number,
  charLimit: number
): string {
  const lines = content.split('\n').slice(0, lineLimit);
  const preview = lines.join('\n');
  return truncateText(preview, charLimit);
}

/**
 * CanvasNodeRenderer Component
 * Renders all canvas nodes with viewport culling
 */
export const CanvasNodeRenderer = React.forwardRef<
  SkiaDomView,
  CanvasNodeRendererProps
>(
  (
    {
      canvasRef,
      width,
      height,
      transform,
      selectedNodeId,
      onNodePress,
      onNodeLongPress,
      config: customConfig,
    },
    ref
  ) => {
    // Merge configs
    const config = useMemo(
      () => ({ ...DEFAULT_NODE_RENDERER_CONFIG, ...customConfig }),
      [customConfig]
    );

    // Get all nodes from store
    const nodes = useCanvasNodes();

    // Callback for gesture tracking (to be integrated with gesture system)
    const nodeInteractionRef = useRef<{
      nodeId: string;
      timestamp: number;
    } | null>(null);

    /**
     * Check if node is visible in current viewport
     */
    const visibleNodes = useMemo(() => {
      const bounds = getViewportBounds(width, height, transform);

      return nodes.filter((node) => {
        return isRectVisible(
          {
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
          },
          width,
          height,
          transform
        );
      });
    }, [nodes, width, height, transform]);

    return (
      <Canvas style={{ width, height }} ref={ref}>
        <Group>
          {/* Draw all visible nodes */}
          {visibleNodes.map((node) => {
            const screenX = node.x * transform.scale + transform.translateX;
            const screenY = node.y * transform.scale + transform.translateY;
            const screenWidth = node.width * transform.scale;
            const screenHeight = node.height * transform.scale;

            return (
              <Group key={node.id}>
                {/* Node background */}
                <Rect
                  x={screenX}
                  y={screenY}
                  width={screenWidth}
                  height={screenHeight}
                  color={NODE_TYPE_COLORS[node.type]}
                  r={config.nodeCornerRadius * transform.scale}
                />

                {/* Selection border */}
                {node.id === selectedNodeId && (
                  <Rect
                    x={screenX}
                    y={screenY}
                    width={screenWidth}
                    height={screenHeight}
                    color="transparent"
                    strokeWidth={config.nodeBorderWidth * transform.scale}
                    strokeColor={config.selectedNodeBorderColor}
                    r={config.nodeCornerRadius * transform.scale}
                  />
                )}

                {/* Node content - rendered at sufficient zoom */}
                {transform.scale >= 0.3 && (
                  <Text
                    x={screenX + config.textPadding * transform.scale}
                    y={
                      screenY +
                      config.textPadding * transform.scale +
                      12 * transform.scale
                    }
                    text={getNodeTypeLabel(node.type)}
                    font={Skia.Font(null, Math.max(10, 12 * transform.scale))}
                    color="#FFFFFF"
                  />
                )}
              </Group>
            );
          })}
        </Group>
      </Canvas>
    );
  }
);

CanvasNodeRenderer.displayName = 'CanvasNodeRenderer';

/**
 * Hook to handle node interaction with proper throttling
 */
export function useNodeInteraction() {
  const lastInteractionRef = useRef<{
    nodeId: string;
    timestamp: number;
    type: 'press' | 'longpress';
  } | null>(null);

  const LONG_PRESS_DURATION = 500; // ms

  const handleNodePress = useCallback(
    (nodeId: string, onNodePress?: (nodeId: string) => void) => {
      const now = Date.now();

      if (
        lastInteractionRef.current &&
        lastInteractionRef.current.nodeId === nodeId &&
        now - lastInteractionRef.current.timestamp < LONG_PRESS_DURATION
      ) {
        // This is a long press
        if (lastInteractionRef.current.type === 'press') {
          // Mark as long press
          lastInteractionRef.current.type = 'longpress';
        }
      } else {
        // New press
        lastInteractionRef.current = {
          nodeId,
          timestamp: now,
          type: 'press',
        };

        onNodePress?.(nodeId);
      }
    },
    []
  );

  return { handleNodePress };
}

export type { NodeRendererConfig, CanvasNodeRendererProps };
