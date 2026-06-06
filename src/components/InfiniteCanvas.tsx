/**
 * InfiniteCanvas Component
 * 
 * Complete infinite canvas implementation combining:
 * - CanvasEngine: 2D pan/zoom/grid
 * - CanvasNodeRenderer: Node rendering with viewport culling
 * - Zustand integration: State management
 * - Interaction handling: Node selection and manipulation
 */

import React, { useCallback, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import type {SkiaDomView} from '@shopify/react-native-skia';

import CanvasEngine from './CanvasEngine';
import { CanvasNodeRenderer } from './CanvasNodeRenderer';
import NodeViewer from './NodeViewer';
import { getViewportBounds, screenToCanvas } from './canvasUtils';
import type { CanvasTransform } from './canvasUtils';
import { useCanvasNodes, useCanvasActions, useCanvasBounds } from '../store/canvasStore.hooks';
import type { CanvasNode } from '../store/canvasStore';

/**
 * Configuration for infinite canvas
 */
interface InfiniteCanvasConfig {
  autoFitContent: boolean;        // Auto-fit to content on load
  enableNodeDragging: boolean;    // Allow dragging nodes
  enableNodeSelection: boolean;   // Allow node selection
  showViewportBounds: boolean;    // Debug: show viewport bounds
  gridEnabled: boolean;           // Show background grid
  zoomMin: number;                // Minimum zoom level
  zoomMax: number;                // Maximum zoom level
  panBoundary?: number;           // Padding for pan boundaries (-1 = unlimited)
}

/**
 * Default infinite canvas configuration
 */
const DEFAULT_CANVAS_CONFIG: InfiniteCanvasConfig = {
  autoFitContent: true,
  enableNodeDragging: true,
  enableNodeSelection: true,
  showViewportBounds: false,
  gridEnabled: true,
  zoomMin: 0.1,
  zoomMax: 10,
  panBoundary: -1, // Unlimited
};

/**
 * Props for InfiniteCanvas
 */
interface InfiniteCanvasProps {
  config?: Partial<InfiniteCanvasConfig>;
  onNodeSelected?: (nodeId: string) => void;
  onNodeDeselected?: () => void;
  backgroundColor?: string;
  useNodeViewer?: boolean;  // Use interactive NodeViewer instead of CanvasNodeRenderer
  nodeViewerConfig?: any;   // Pass config to NodeViewer
}

/**
 * InfiniteCanvas Component
 * Main component for infinite canvas interaction
 */
export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
  config: customConfig = {},
  onNodeSelected,
  onNodeDeselected,
  backgroundColor = '#FFFFFF',
  useNodeViewer = false,
  nodeViewerConfig = {},
}) => {
  // Merge configs
  const config = useMemo(
    () => ({ ...DEFAULT_CANVAS_CONFIG, ...customConfig }),
    [customConfig]
  );

  // Get screen dimensions
  const { width, height } = Dimensions.get('window');

  // Canvas refs
  const canvasEngineRef = useRef<SkiaDomView>(null);
  const canvasNodeRendererRef = useRef<SkiaDomView>(null);

  // Transform state
  const [transform, setTransform] = useState<CanvasTransform>({
    translateX: 0,
    translateY: 0,
    scale: 1,
  });

  // Interaction state
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [draggedNodeId, setDraggedNodeId] = useState<string>();

  // Get store hooks
  const nodes = useCanvasNodes();
  const bounds = useCanvasBounds();
  const actions = useCanvasActions();
  const { updateNodePosition } = actions;

  /**
   * Initialize canvas with content fit
   */
  React.useEffect(() => {
    if (config.autoFitContent && bounds && nodes.length > 0) {
      // Calculate transform to fit all content
      const scale = Math.min(
        width / (bounds.maxX - bounds.minX || 1),
        height / (bounds.maxY - bounds.minY || 1)
      );

      const scaledContentWidth = (bounds.maxX - bounds.minX) * scale;
      const scaledContentHeight = (bounds.maxY - bounds.minY) * scale;

      const tx = (width - scaledContentWidth) / 2 - bounds.minX * scale;
      const ty = (height - scaledContentHeight) / 2 - bounds.minY * scale;

      setTransform({
        scale: Math.min(config.zoomMax, Math.max(config.zoomMin, scale * 0.9)),
        translateX: tx,
        translateY: ty,
      });
    }
  }, [config.autoFitContent, bounds, nodes.length, width, height, config.zoomMin, config.zoomMax]);

  /**
   * Handle transform change from CanvasEngine
   */
  const handleTransformChange = useCallback(
    (newTransform: CanvasTransform) => {
      // Clamp scale
      const clampedScale = Math.max(
        config.zoomMin,
        Math.min(config.zoomMax, newTransform.scale)
      );

      // Apply pan boundaries if configured
      let tx = newTransform.translateX;
      let ty = newTransform.translateY;

      if (config.panBoundary >= 0 && bounds) {
        const screenBounds = getViewportBounds(
          width,
          height,
          { ...newTransform, scale: clampedScale }
        );

        const boundary = config.panBoundary;

        // Clamp pan to keep content within boundary
        // This is a simplified version - full implementation would check bounds
        tx = Math.max(
          -bounds.maxX * clampedScale - boundary,
          Math.min(-bounds.minX * clampedScale + boundary, tx)
        );
        ty = Math.max(
          -bounds.maxY * clampedScale - boundary,
          Math.min(-bounds.minY * clampedScale + boundary, ty)
        );
      }

      setTransform({
        scale: clampedScale,
        translateX: tx,
        translateY: ty,
      });

      // Redraw nodes
      canvasNodeRendererRef.current?.redraw?.();
    },
    [config.zoomMin, config.zoomMax, config.panBoundary, bounds, width, height]
  );

  /**
   * Handle node selection
   */
  const handleNodePress = useCallback(
    (nodeId: string) => {
      if (!config.enableNodeSelection) return;

      if (selectedNodeId === nodeId) {
        // Deselect
        setSelectedNodeId(undefined);
        onNodeDeselected?.();
      } else {
        // Select
        setSelectedNodeId(nodeId);
        onNodeSelected?.(nodeId);
      }
    },
    [selectedNodeId, config.enableNodeSelection, onNodeSelected, onNodeDeselected]
  );

  /**
   * Handle screen press to convert to canvas coordinates
   */
  const handleCanvasPress = useCallback(
    (event: { nativeEvent: { locationX: number; locationY: number } }) => {
      if (!config.enableNodeDragging) return;

      const { locationX, locationY } = event.nativeEvent;
      const canvasCoords = screenToCanvas(locationX, locationY, transform);

      // Find node at this coordinate
      let hitNode: CanvasNode | undefined;

      // Iterate in reverse to find topmost node
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if (
          canvasCoords.x >= node.x &&
          canvasCoords.x <= node.x + node.width &&
          canvasCoords.y >= node.y &&
          canvasCoords.y <= node.y + node.height
        ) {
          hitNode = node;
          break;
        }
      }

      if (hitNode) {
        handleNodePress(hitNode.id);
        setDraggedNodeId(hitNode.id);
      } else {
        // Deselect if clicked on empty space
        if (selectedNodeId) {
          setSelectedNodeId(undefined);
          onNodeDeselected?.();
        }
      }
    },
    [transform, nodes, config.enableNodeDragging, selectedNodeId, handleNodePress, onNodeDeselected]
  );

  /**
   * Handle dragging a node
   */
  const handleNodeDrag = useCallback(
    (locationX: number, locationY: number) => {
      if (!draggedNodeId || !config.enableNodeDragging) return;

      const canvasCoords = screenToCanvas(locationX, locationY, transform);

      const node = nodes.find((n) => n.id === draggedNodeId);
      if (!node) return;

      // Update node position (snapped to half-grid if applicable)
      const newX = Math.round(canvasCoords.x * 2) / 2;
      const newY = Math.round(canvasCoords.y * 2) / 2;

      updateNodePosition(draggedNodeId, newX, newY);
    },
    [draggedNodeId, transform, nodes, config.enableNodeDragging, updateNodePosition]
  );

  return (
    <View style={[styles.container, { width, height }]}>
      <View
        style={styles.canvasContainer}
        onStartShouldSetResponder={() => config.enableNodeDragging && !useNodeViewer}
        onResponderMove={(event: any) => {
          const { locationX, locationY } = event.nativeEvent;
          handleNodeDrag(locationX, locationY);
        }}
        onResponderRelease={() => {
          setDraggedNodeId(undefined);
        }}
      >
        {/* Background grid engine */}
        {config.gridEnabled && (
          <CanvasEngine
            ref={canvasEngineRef}
            width={width}
            height={height}
            onTransformChange={handleTransformChange}
            backgroundColor={backgroundColor}
          />
        )}

        {/* Node rendering layer */}
        {!config.gridEnabled && !useNodeViewer && (
          <View
            style={[
              styles.canvasContainer,
              { backgroundColor },
            ]}
          >
            <CanvasNodeRenderer
              ref={canvasNodeRendererRef}
              canvasRef={canvasNodeRendererRef}
              width={width}
              height={height}
              transform={transform}
              selectedNodeId={selectedNodeId}
              onNodePress={handleNodePress}
            />
          </View>
        )}

        {/* Interactive Node Viewer layer (alternative to CanvasNodeRenderer) */}
        {useNodeViewer && (
          <NodeViewer
            transform={transform}
            canvasWidth={width}
            canvasHeight={height}
            selectedNodeId={selectedNodeId}
            onNodeSelected={onNodeSelected}
            onNodeDeselected={onNodeDeselected}
            config={nodeViewerConfig}
            zIndex={100}
          />
        )}

        {/* Debug: Show viewport bounds */}
        {config.showViewportBounds && bounds && (
          <View style={styles.debugOverlay}>
            <View
              style={{
                padding: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: 4,
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 10 }}>
                Transform: ({transform.translateX.toFixed(1)}, {transform.translateY.toFixed(1)}) @ {(transform.scale * 100).toFixed(0)}%
              </Text>
              <Text style={{ color: '#FFF', fontSize: 10 }}>
                Content: {bounds.minX.toFixed(0)}, {bounds.minY.toFixed(0)} - {bounds.maxX.toFixed(0)}, {bounds.maxY.toFixed(0)}
              </Text>
              <Text style={{ color: '#FFF', fontSize: 10 }}>
                Nodes: {nodes.length} | Selected: {selectedNodeId}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

/**
 * Styled sheet for component
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
  },
  debugOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1000,
  },
});

export default InfiniteCanvas;

export type { InfiniteCanvasConfig, InfiniteCanvasProps };
