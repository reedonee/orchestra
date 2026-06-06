/**
 * Complete Infinite Canvas Demo
 * 
 * Demonstrates full integration of:
 * - Zustand store for state management
 * - CanvasEngine for 2D pan/zoom/grid
 * - CanvasNodeRenderer for rendering nodes
 * - InfiniteCanvas for complete interactive canvas
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import InfiniteCanvas from '../components/InfiniteCanvas';
import { useCanvasActions, useCanvasNodes, useCanvasNodeCounts } from '../store/canvasStore.hooks';
import type { CanvasNode } from '../store/canvasStore';

/**
 * Main demo component
 */
export const InfiniteCanvasDemo: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [newNodeContent, setNewNodeContent] = useState('');

  // Get store
  const nodes = useCanvasNodes();
  const counts = useCanvasNodeCounts();
  const actions = useCanvasActions();

  const { width, height } = Dimensions.get('window');

  /**
   * Add a new node to the canvas
   */
  const handleAddNode = useCallback(
    (type: CanvasNode['type']) => {
      // Generate random position
      const x = Math.random() * 500;
      const y = Math.random() * 500;

      actions.addNode({
        type,
        x,
        y,
        width: 300,
        height: 200,
        content: newNodeContent || `New ${type} node`,
        metadata: {
          tags: ['demo'],
          customData: {},
        },
      });

      setNewNodeContent('');
    },
    [actions, newNodeContent]
  );

  /**
   * Remove selected node
   */
  const handleRemoveSelected = useCallback(() => {
    if (selectedNodeId) {
      actions.removeNode(selectedNodeId);
      setSelectedNodeId(undefined);
    }
  }, [selectedNodeId, actions]);

  /**
   * Update selected node content
   */
  const handleUpdateContent = useCallback(() => {
    if (selectedNodeId) {
      actions.setNodeContent(selectedNodeId, newNodeContent);
      setNewNodeContent('');
    }
  }, [selectedNodeId, newNodeContent, actions]);

  /**
   * Clear all nodes
   */
  const handleClearAll = useCallback(() => {
    const nodeIds = nodes.map((n) => n.id);
    if (nodeIds.length > 0) {
      actions.removeNodes(nodeIds);
      setSelectedNodeId(undefined);
    }
  }, [nodes, actions]);

  /**
   * Generate demo content
   */
  const handleGenerateDemo = useCallback(() => {
    // Create a simple grid of nodes
    const types: Array<CanvasNode['type']> = ['code', 'chat', 'terminal', 'agent'];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const type = types[(row + col) % types.length];
        const x = col * 400;
        const y = row * 400;

        actions.addNode({
          type,
          x,
          y,
          width: 300,
          height: 200,
          content: `${type.toUpperCase()} Node (${col}, ${row})
Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
          metadata: {
            tags: ['demo', `row-${row}`, `col-${col}`],
            customData: {
              gridPosition: `${row},${col}`,
            },
          },
        });
      }
    }
  }, [actions]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <View style={styles.container}>
      {/* Canvas viewport */}
      <View style={[styles.canvasViewport, { width, height: height * 0.6 }]}>
        <InfiniteCanvas
          config={{
            autoFitContent: true,
            enableNodeDragging: true,
            enableNodeSelection: true,
            gridEnabled: true,
            zoomMin: 0.1,
            zoomMax: 5,
          }}
          onNodeSelected={setSelectedNodeId}
          onNodeDeselected={() => setSelectedNodeId(undefined)}
        />
      </View>

      {/* Control panel */}
      <ScrollView style={styles.controlPanel}>
        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Canvas Stats</Text>
          <Text style={styles.statText}>Total nodes: {nodes.length}</Text>
          <Text style={styles.statText}>Code: {counts.code}</Text>
          <Text style={styles.statText}>Chat: {counts.chat}</Text>
          <Text style={styles.statText}>Terminal: {counts.terminal}</Text>
          <Text style={styles.statText}>Agent: {counts.agent}</Text>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleAddNode('code')}
          >
            <Text style={styles.buttonText}>+ Code Node</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleAddNode('chat')}
          >
            <Text style={styles.buttonText}>+ Chat Node</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleAddNode('terminal')}
          >
            <Text style={styles.buttonText}>+ Terminal Node</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleAddNode('agent')}
          >
            <Text style={styles.buttonText}>+ Agent Node</Text>
          </TouchableOpacity>

          <View style={{ height: 8 }} />

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleGenerateDemo}
          >
            <Text style={styles.buttonText}>Generate Demo Grid</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonDanger]}
            onPress={handleClearAll}
          >
            <Text style={styles.buttonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Content editor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Node Content</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter node content..."
            value={newNodeContent}
            onChangeText={setNewNodeContent}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={() => (selectedNodeId ? handleUpdateContent() : handleAddNode('code'))}
          >
            <Text style={styles.buttonText}>
              {selectedNodeId ? 'Update Selected' : 'Create Node'}
            </Text>
          </TouchableOpacity>

          {selectedNode && (
            <>
              <View style={{ height: 12 }} />
              <TouchableOpacity
                style={[styles.button, styles.buttonDanger]}
                onPress={handleRemoveSelected}
              >
                <Text style={styles.buttonText}>Remove Selected Node</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Selected node info */}
        {selectedNode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Node Details</Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>ID: </Text>
              {selectedNode.id.slice(0, 8)}...
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Type: </Text>
              {selectedNode.type}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Position: </Text>
              ({selectedNode.x.toFixed(0)}, {selectedNode.y.toFixed(0)})
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Size: </Text>
              {selectedNode.width.toFixed(0)} × {selectedNode.height.toFixed(0)}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Content: </Text>
              {selectedNode.content.slice(0, 50)}
              {selectedNode.content.length > 50 ? '...' : ''}
            </Text>
            {selectedNode.metadata?.tags && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Tags: </Text>
                {(selectedNode.metadata.tags as string[]).join(', ')}
              </Text>
            )}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructionText}>• Drag the canvas to pan</Text>
          <Text style={styles.instructionText}>• Pinch to zoom</Text>
          <Text style={styles.instructionText}>• Tap a node to select it</Text>
          <Text style={styles.instructionText}>• Drag a selected node to move it</Text>
          <Text style={styles.instructionText}>• Use the controls to add/edit nodes</Text>
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * Styled sheet for component
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  canvasViewport: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  controlPanel: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statsSection: {
    marginBottom: 20,
    backgroundColor: '#F0F4FF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1F2937',
  },
  statText: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
    fontSize: 12,
    minHeight: 60,
    textAlignVertical: 'top',
    color: '#1F2937',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#10B981',
  },
  buttonDanger: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  detailText: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 6,
    lineHeight: 18,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#1F2937',
  },
  instructionText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 18,
  },
});

export default InfiniteCanvasDemo;
