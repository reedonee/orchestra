/**
 * NodeViewer Demo Screen
 * 
 * Interactive demo showcasing the NodeViewer component with
 * Windows Fluent Design styling
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Switch,
} from 'react-native';

import InfiniteCanvas from '../components/InfiniteCanvas';
import { useCanvasActions, useCanvasNodes } from '../store/canvasStore.hooks';
import type { CanvasNode } from '../store/canvasStore';

/**
 * Colors matching Fluent Design
 */
const COLORS = {
  background: '#1e1e1e',
  surface: '#2d2d2d',
  border: '#3f3f3f',
  text: '#ffffff',
  textSecondary: '#b3b3b3',
  accent: '#0078d4',
  success: '#107c10',
  warning: '#ffb900',
  error: '#e74856',
};

/**
 * NodeViewer Demo Screen
 */
export const NodeViewerDemo: React.FC = () => {
  const [useNodeViewer, setUseNodeViewer] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [nodeContent, setNodeContent] = useState('');

  const { width, height } = Dimensions.get('window');
  const nodes = useCanvasNodes();
  const { addNode, removeNode, updateNodeMetadata } = useCanvasActions();

  /**
   * Create sample node
   */
  const handleCreateNode = useCallback(
    (type: CanvasNode['type']) => {
      const x = Math.random() * 500;
      const y = Math.random() * 500;

      addNode({
        type,
        x,
        y,
        width: 300,
        height: 200,
        content: `${type.toUpperCase()} Node\n\nCreated at: ${new Date().toLocaleTimeString()}\n\nThis is a sample node using the new NodeViewer component with Windows Fluent Design styling.`,
        metadata: {
          tags: ['demo', type, 'fluent-design'],
          customData: { createdAt: Date.now() },
        },
      });
    },
    [addNode]
  );

  /**
   * Create demo grid
   */
  const handleCreateGrid = useCallback(() => {
    const types: Array<CanvasNode['type']> = ['code', 'chat', 'terminal', 'agent'];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const type = types[(row + col) % types.length];
        const x = col * 400;
        const y = row * 400;

        addNode({
          type,
          x,
          y,
          width: 320,
          height: 240,
          content: `${type.toUpperCase()} Node (${row}, ${col})

This is a sample node with Windows Fluent Design styling.
✓ Dark mode color scheme
✓ Fluent Design aesthetics
✓ Draggable interface
✓ Scrollable content
✓ Type-based styling`,
          metadata: {
            tags: ['grid', type, `row-${row}`, `col-${col}`],
            customData: {
              gridPosition: { row, col },
            },
          },
        });
      }
    }
  }, [addNode]);

  /**
   * Delete selected node
   */
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId) {
      removeNode(selectedNodeId);
      setSelectedNodeId(undefined);
    }
  }, [selectedNodeId, removeNode]);

  /**
   * Clear all nodes
   */
  const handleClearAll = useCallback(() => {
    nodes.forEach((node) => removeNode(node.id));
    setSelectedNodeId(undefined);
  }, [nodes, removeNode]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* Canvas */}
      <View
        style={[
          styles.canvasContainer,
          {
            width,
            height: height * 0.65,
            backgroundColor: COLORS.surface,
          },
        ]}
      >
        <InfiniteCanvas
          config={{
            autoFitContent: true,
            enableNodeDragging: !useNodeViewer, // NodeViewer handles its own dragging
            enableNodeSelection: true,
            gridEnabled: true,
            zoomMin: 0.1,
            zoomMax: 10,
          }}
          onNodeSelected={setSelectedNodeId}
          onNodeDeselected={() => setSelectedNodeId(undefined)}
          backgroundColor={COLORS.surface}
          useNodeViewer={useNodeViewer}
          nodeViewerConfig={{
            nodeWidth: 320,
            nodeMinHeight: 200,
            titleBarHeight: 40,
            cornerRadius: 8,
            borderWidth: 1,
            enableDragging: true,
            enableSelection: true,
          }}
        />
      </View>

      {/* Control Panel */}
      <ScrollView
        style={[
          styles.controlPanel,
          {
            backgroundColor: COLORS.background,
            borderTopColor: COLORS.border,
          },
        ]}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
        {/* Viewer Mode Toggle */}
        <View style={[styles.section, { borderBottomColor: COLORS.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Viewer Mode</Text>
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.label}>
              {useNodeViewer ? 'NodeViewer (Interactive)' : 'CanvasNodeRenderer (Static)'}
            </Text>
            <Switch
              value={useNodeViewer}
              onValueChange={setUseNodeViewer}
              trackColor={{ false: COLORS.border, true: COLORS.accent }}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { borderBottomColor: COLORS.border }]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.buttonGrid}>
            <TouchableOpacity
              style={[styles.button, styles.buttonCode]}
              onPress={() => handleCreateNode('code')}
            >
              <Text style={styles.buttonText}>+ Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonChat]}
              onPress={() => handleCreateNode('chat')}
            >
              <Text style={styles.buttonText}>+ Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonTerminal]}
              onPress={() => handleCreateNode('terminal')}
            >
              <Text style={styles.buttonText}>+ Terminal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonAgent]}
              onPress={() => handleCreateNode('agent')}
            >
              <Text style={styles.buttonText}>+ Agent</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.fullButton, styles.buttonSuccess]}
            onPress={handleCreateGrid}
          >
            <Text style={styles.buttonText}>Generate Demo Grid (3×3)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fullButton, styles.buttonError]}
            onPress={handleClearAll}
          >
            <Text style={styles.buttonText}>Clear All Nodes</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={[styles.section, { borderBottomColor: COLORS.border }]}>
          <Text style={styles.sectionTitle}>Canvas Stats</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Nodes:</Text>
            <Text style={styles.statValue}>{nodes.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Code Nodes:</Text>
            <Text style={styles.statValue}>
              {nodes.filter((n) => n.type === 'code').length}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Chat Nodes:</Text>
            <Text style={styles.statValue}>
              {nodes.filter((n) => n.type === 'chat').length}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Terminal Nodes:</Text>
            <Text style={styles.statValue}>
              {nodes.filter((n) => n.type === 'terminal').length}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Agent Nodes:</Text>
            <Text style={styles.statValue}>
              {nodes.filter((n) => n.type === 'agent').length}
            </Text>
          </View>
        </View>

        {/* Selected Node Info */}
        {selectedNode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Node</Text>
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Type:</Text>
                <Text style={styles.infoValue}>
                  {selectedNode.type.toUpperCase()}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ID:</Text>
                <Text style={styles.infoValue}>{selectedNode.id.slice(0, 12)}...</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Position:</Text>
                <Text style={styles.infoValue}>
                  ({selectedNode.x.toFixed(0)}, {selectedNode.y.toFixed(0)})
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Size:</Text>
                <Text style={styles.infoValue}>
                  {selectedNode.width.toFixed(0)} × {selectedNode.height.toFixed(0)}
                </Text>
              </View>
              {selectedNode.metadata?.tags && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tags:</Text>
                  <Text style={styles.infoValue}>
                    {(selectedNode.metadata.tags as string[]).join(', ')}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.fullButton, styles.buttonError]}
              onPress={handleDeleteSelected}
            >
              <Text style={styles.buttonText}>Delete This Node</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Use</Text>
          <Text style={styles.instructionText}>
            • Drag canvas with one finger to pan
          </Text>
          <Text style={styles.instructionText}>
            • Pinch with two fingers to zoom
          </Text>
          <Text style={styles.instructionText}>
            • {useNodeViewer ? 'Drag node title bar to move nodes' : 'Drag selected nodes'}
          </Text>
          <Text style={styles.instructionText}>
            • Tap a node to select it
          </Text>
          <Text style={styles.instructionText}>
            • Scroll node content vertically
          </Text>
          <Text style={styles.instructionText}>
            • Toggle viewer mode to compare both renderers
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  canvasContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  controlPanel: {
    flex: 1,
    padding: 16,
  },

  section: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
  },

  label: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },

  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  button: {
    flex: 0.48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonCode: {
    backgroundColor: '#0078d4',
  },

  buttonChat: {
    backgroundColor: '#107c10',
  },

  buttonTerminal: {
    backgroundColor: '#2d2d2d',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  buttonAgent: {
    backgroundColor: '#d83b01',
  },

  fullButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  buttonSuccess: {
    backgroundColor: '#107c10',
  },

  buttonError: {
    backgroundColor: '#e74856',
  },

  buttonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },

  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },

  infoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  infoLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  infoValue: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '500',
  },

  instructionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
});

export default NodeViewerDemo;
