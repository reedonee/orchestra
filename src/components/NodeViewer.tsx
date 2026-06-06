/**
 * NodeViewer Component
 * 
 * Renders interactive nodes on top of Skia canvas with Windows Fluent Design aesthetic.
 * Features:
 * - Reads nodes from Zustand canvas store
 * - Absolute positioning based on node x/y coordinates
 * - Dragging support with gesture handler
 * - Dark mode Windows Fluent Design styling
 * - Scrollable content area
 * - Smooth animations and transitions
 * - Type-based styling
 * - Selection highlighting
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  GestureResponderEvent,
  Text,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

import { useCanvasNodes, useCanvasActions } from '../store/canvasStore.hooks';
import type { CanvasNode } from '../store/canvasStore';
import { CanvasTransform } from './canvasUtils';

/**
 * Color scheme for Fluent Design (dark mode)
 */
const FLUENT_COLORS = {
  // Base colors
  background: '#1e1e1e',        // Primary background
  surfaceLight: '#2d2d2d',      // Light surface
  surfaceDark: '#1a1a1a',       // Dark surface
  border: '#3f3f3f',            // Border color
  
  // Text colors
  textPrimary: '#ffffff',       // Primary text
  textSecondary: '#b3b3b3',     // Secondary text
  textTertiary: '#808080',      // Tertiary text
  
  // Status colors
  success: '#107c10',           // Success green
  warning: '#ffb900',           // Warning yellow
  error: '#e74856',             // Error red
  info: '#0078d4',              // Info blue
  
  // Node type colors (adapted for Fluent)
  code: '#0078d4',              // Blue
  chat: '#107c10',              // Green
  terminal: '#2d2d2d',          // Dark gray
  agent: '#d83b01',             // Orange
};

/**
 * Node type colors mapping
 */
const NODE_TYPE_COLORS: Record<CanvasNode['type'], string> = {
  code: FLUENT_COLORS.code,
  chat: FLUENT_COLORS.chat,
  terminal: FLUENT_COLORS.terminal,
  agent: FLUENT_COLORS.agent,
};

/**
 * Configuration for node viewer
 */
interface NodeViewerConfig {
  nodeWidth: number;            // Default: 320px
  nodeMinHeight: number;        // Default: 200px
  titleBarHeight: number;       // Default: 40px
  cornerRadius: number;         // Default: 8px
  borderWidth: number;          // Default: 1px
  shadowBlur: number;           // Default: 16px
  animationDuration: number;    // Default: 300ms
  enableDragging: boolean;      // Default: true
  enableSelection: boolean;     // Default: true
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: NodeViewerConfig = {
  nodeWidth: 320,
  nodeMinHeight: 200,
  titleBarHeight: 40,
  cornerRadius: 8,
  borderWidth: 1,
  shadowBlur: 16,
  animationDuration: 300,
  enableDragging: true,
  enableSelection: true,
};

/**
 * Props for NodeViewer component
 */
interface NodeViewerProps {
  transform: CanvasTransform;           // Current canvas transform
  canvasWidth: number;                  // Canvas width
  canvasHeight: number;                 // Canvas height
  selectedNodeId?: string;              // Currently selected node
  onNodeSelected?: (nodeId: string) => void;
  onNodeDeselected?: () => void;
  config?: Partial<NodeViewerConfig>;
  zIndex?: number;                      // Z-index for overlay
}

/**
 * Individual node component
 */
interface NodeComponentProps {
  node: CanvasNode;
  isSelected: boolean;
  config: NodeViewerConfig;
  transform: CanvasTransform;
  canvasWidth: number;
  canvasHeight: number;
  onSelect?: (nodeId: string) => void;
  onPositionChange?: (nodeId: string, x: number, y: number) => void;
}

/**
 * Individual Node Component with dragging support
 */
const NodeComponent = React.memo(
  ({
    node,
    isSelected,
    config,
    transform,
    canvasWidth,
    canvasHeight,
    onSelect,
    onPositionChange,
  }: NodeComponentProps) => {
    const panRef = useRef(null);
    const lastPositionRef = useRef({ x: node.x, y: node.y });

    // Shared values for animation
    const offsetX = useSharedValue(0);
    const offsetY = useSharedValue(0);

    /**
     * Calculate screen position from canvas coordinates
     */
    const screenX = useMemo(
      () => node.x * transform.scale + transform.translateX,
      [node.x, transform.translateX, transform.scale]
    );

    const screenY = useMemo(
      () => node.y * transform.scale + transform.translateY,
      [node.y, transform.translateY, transform.scale]
    );

    /**
     * Handle pan gesture
     */
    const handlePanEvent = useCallback(
      (event: PanGestureHandlerEventPayload) => {
        if (!config.enableDragging) return;

        offsetX.value = event.translationX;
        offsetY.value = event.translationY;
      },
      [config.enableDragging, offsetX, offsetY]
    );

    /**
     * Handle pan end - update node position
     */
    const handlePanEnd = useCallback(() => {
      const deltaX = offsetX.value / transform.scale;
      const deltaY = offsetY.value / transform.scale;

      const newX = lastPositionRef.current.x + deltaX;
      const newY = lastPositionRef.current.y + deltaY;

      lastPositionRef.current = { x: newX, y: newY };

      onPositionChange?.(node.id, newX, newY);

      offsetX.value = withSpring(0);
      offsetY.value = withSpring(0);
    }, [offsetX, offsetY, transform.scale, node.id, onPositionChange]);

    /**
     * Animated style for node position
     */
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: screenX + offsetX.value },
        { translateY: screenY + offsetY.value },
      ],
    }));

    const typeColor = NODE_TYPE_COLORS[node.type];
    const isVisible = screenX + config.nodeWidth > 0 &&
                     screenX < canvasWidth &&
                     screenY + config.nodeMinHeight > 0 &&
                     screenY < canvasHeight;

    if (!isVisible) return null;

    return (
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={handlePanEvent}
        onEnded={handlePanEnd}
      >
        <Animated.View
          style={[
            styles.nodeContainer,
            animatedStyle,
            {
              width: config.nodeWidth,
              minHeight: config.nodeMinHeight,
            },
          ]}
        >
          <View
            style={[
              styles.nodeRoot,
              {
                borderRadius: config.cornerRadius,
                borderWidth: config.borderWidth,
                borderColor: isSelected ? FLUENT_COLORS.info : typeColor,
                backgroundColor: FLUENT_COLORS.surfaceLight,
                shadowColor: typeColor,
                shadowOpacity: isSelected ? 0.3 : 0.1,
                shadowRadius: config.shadowBlur,
                elevation: isSelected ? 12 : 4,
              },
            ]}
            onStartShouldSetResponder={() => true}
            onResponderGrant={() => onSelect?.(node.id)}
          >
            {/* Title Bar */}
            <View
              style={[
                styles.titleBar,
                {
                  height: config.titleBarHeight,
                  borderBottomWidth: 1,
                  borderBottomColor: FLUENT_COLORS.border,
                  backgroundColor: typeColor,
                },
              ]}
            >
              {/* Type Indicator */}
              <View
                style={[
                  styles.typeIndicator,
                  { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                ]}
              >
                <Text style={styles.typeText}>
                  {node.type.toUpperCase().slice(0, 1)}
                </Text>
              </View>

              {/* Title */}
              <Text
                style={styles.titleText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
              </Text>

              {/* Status Indicator */}
              {node.isStreaming && (
                <View style={styles.streamingIndicator}>
                  <View style={styles.streamingDot} />
                  <Text style={styles.streamingText}>Live</Text>
                </View>
              )}
            </View>

            {/* Content Area */}
            <ScrollView
              style={[
                styles.contentArea,
                { backgroundColor: FLUENT_COLORS.background },
              ]}
              scrollEnabled={true}
              scrollEventThrottle={16}
            >
              <Text
                style={[
                  styles.contentText,
                  { color: FLUENT_COLORS.textPrimary },
                ]}
              >
                {node.content || 'No content'}
              </Text>

              {/* Metadata Section */}
              {node.metadata?.tags && (node.metadata.tags as string[]).length > 0 && (
                <View style={styles.metadataSection}>
                  <Text style={styles.metadataLabel}>Tags</Text>
                  <View style={styles.tagsContainer}>
                    {(node.metadata.tags as string[]).map((tag, index) => (
                      <View
                        key={index}
                        style={[
                          styles.tag,
                          { backgroundColor: 'rgba(0, 120, 212, 0.15)' },
                        ]}
                      >
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View
              style={[
                styles.footer,
                {
                  borderTopWidth: 1,
                  borderTopColor: FLUENT_COLORS.border,
                  backgroundColor: FLUENT_COLORS.surfaceDark,
                },
              ]}
            >
              <Text style={styles.footerText}>
                {node.id.slice(0, 8)}...
              </Text>
              <Text style={styles.footerText}>
                {node.width.toFixed(0)}×{node.height.toFixed(0)}
              </Text>
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    );
  }
);

NodeComponent.displayName = 'NodeComponent';

/**
 * NodeViewer Component - Main component
 */
export const NodeViewer: React.FC<NodeViewerProps> = ({
  transform,
  canvasWidth,
  canvasHeight,
  selectedNodeId,
  onNodeSelected,
  onNodeDeselected,
  config: customConfig,
  zIndex = 100,
}) => {
  // Merge configs
  const config = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...customConfig }),
    [customConfig]
  );

  // Get nodes from store
  const nodes = useCanvasNodes();
  const { updateNodePosition } = useCanvasActions();

  /**
   * Handle node selection
   */
  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      if (!config.enableSelection) return;

      if (selectedNodeId === nodeId) {
        onNodeDeselected?.();
      } else {
        onNodeSelected?.(nodeId);
      }
    },
    [selectedNodeId, config.enableSelection, onNodeSelected, onNodeDeselected]
  );

  /**
   * Handle node position change
   */
  const handlePositionChange = useCallback(
    (nodeId: string, newX: number, newY: number) => {
      updateNodePosition(nodeId, newX, newY);
    },
    [updateNodePosition]
  );

  return (
    <View
      style={[
        styles.overlay,
        {
          width: canvasWidth,
          height: canvasHeight,
          zIndex,
        },
      ]}
      pointerEvents="box-none"
    >
      {nodes.map((node) => (
        <NodeComponent
          key={node.id}
          node={node}
          isSelected={selectedNodeId === node.id}
          config={config}
          transform={transform}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          onSelect={handleNodeSelect}
          onPositionChange={handlePositionChange}
        />
      ))}
    </View>
  );
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'box-none',
  },

  nodeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  nodeRoot: {
    overflow: 'hidden',
    backgroundColor: FLUENT_COLORS.surfaceLight,
  },

  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },

  typeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  typeText: {
    color: FLUENT_COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },

  titleText: {
    flex: 1,
    color: FLUENT_COLORS.textPrimary,
    fontWeight: '500',
    fontSize: 13,
  },

  streamingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  streamingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: FLUENT_COLORS.textPrimary,
  },

  streamingText: {
    color: FLUENT_COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '500',
  },

  contentArea: {
    flex: 1,
    padding: 12,
    backgroundColor: FLUENT_COLORS.background,
  },

  contentText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'monospace',
  },

  metadataSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: FLUENT_COLORS.border,
  },

  metadataLabel: {
    color: FLUENT_COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },

  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 120, 212, 0.15)',
  },

  tagText: {
    color: FLUENT_COLORS.info,
    fontSize: 10,
    fontWeight: '500',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: FLUENT_COLORS.surfaceDark,
  },

  footerText: {
    color: FLUENT_COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '400',
  },
});

export type { NodeViewerProps, NodeViewerConfig };
export default NodeViewer;
