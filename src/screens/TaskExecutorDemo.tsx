/**
 * Task Executor Demo Component
 * 
 * Interactive demonstration of parallel task execution with real-time canvas updates
 * Shows decomposition → execution → visualization flow
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import type { TaskDecomposition } from '../services/orchestratorService';
import { useTaskExecutor, useFormattedStats } from '../hooks/useTaskExecutor';
import { useCanvasNodes } from '../store/canvasStore.hooks';

/**
 * Demo component showcasing task execution flow
 */
export const TaskExecutorDemo: React.FC = () => {
  // State
  const [decomposition, setDecomposition] = useState<TaskDecomposition | null>(
    null
  );
  const [showResults, setShowResults] = useState(false);

  // Executor hook
  const executor = useTaskExecutor();
  const nodes = useCanvasNodes();

  // Format stats
  const formattedStats = useFormattedStats(executor.stats);

  /**
   * Sample decomposition for testing
   */
  const sampleDecomposition: TaskDecomposition = {
    mainObjective: 'Build a real-time notification system',
    summary:
      'Create a scalable notification service with agent assignments',
    totalEstimatedTokens: 25000,
    subtasks: [
      {
        id: 'task_1',
        title: 'Design System Architecture',
        description:
          'Design microservices architecture with event-driven messaging',
        agentType: 'architect',
        priority: 'critical',
        dependencies: [],
        estimatedTokens: 3000,
      },
      {
        id: 'task_2',
        title: 'Implement Message Queue',
        description: 'Build RabbitMQ/Kafka consumer and producer',
        agentType: 'coder',
        priority: 'critical',
        dependencies: ['task_1'],
        estimatedTokens: 4000,
      },
      {
        id: 'task_3',
        title: 'Code Review Setup',
        description: 'Establish code review standards and tooling',
        agentType: 'reviewer',
        priority: 'high',
        dependencies: ['task_2'],
        estimatedTokens: 2500,
      },
      {
        id: 'task_4',
        title: 'API Endpoint Development',
        description: 'Create REST API for notification delivery',
        agentType: 'coder',
        priority: 'high',
        dependencies: ['task_1'],
        estimatedTokens: 3500,
      },
      {
        id: 'task_5',
        title: 'Test Suite Creation',
        description: 'Write comprehensive unit and integration tests',
        agentType: 'tester',
        priority: 'high',
        dependencies: ['task_2', 'task_4'],
        estimatedTokens: 3000,
      },
      {
        id: 'task_6',
        title: 'Performance Analysis',
        description: 'Analyze throughput and latency metrics',
        agentType: 'analyst',
        priority: 'medium',
        dependencies: ['task_5'],
        estimatedTokens: 2500,
      },
      {
        id: 'task_7',
        title: 'Debug Performance Issues',
        description: 'Identify and resolve bottlenecks',
        agentType: 'debugger',
        priority: 'medium',
        dependencies: ['task_6'],
        estimatedTokens: 2000,
      },
      {
        id: 'task_8',
        title: 'Documentation Writing',
        description: 'Create API docs and deployment guide',
        agentType: 'documenter',
        priority: 'medium',
        dependencies: ['task_4', 'task_5'],
        estimatedTokens: 2000,
      },
    ],
    executionStrategy: 'Execute in parallel waves respecting dependencies',
    estimatedTimeMinutes: 120,
  };

  /**
   * Handle execution start
   */
  const handleExecute = useCallback(async () => {
    if (!decomposition) {
      alert('Please load a decomposition first');
      return;
    }

    try {
      await executor.execute(decomposition);
      setShowResults(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Execution failed';
      alert(`Error: ${message}`);
    }
  }, [decomposition, executor]);

  /**
   * Load sample decomposition
   */
  const handleLoadSample = useCallback(() => {
    setDecomposition(sampleDecomposition);
    setShowResults(false);
  }, []);

  /**
   * Cancel execution
   */
  const handleCancel = useCallback(() => {
    executor.cancel();
  }, [executor]);

  /**
   * Export results
   */
  const handleExport = useCallback(() => {
    const json = executor.exportResults();
    // In a real app, save to file or upload
    console.log('Exported results:', json);
    alert('Results exported (see console)');
  }, [executor]);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⚡ Task Executor</Text>
        <Text style={styles.subtitle}>
          Parallel execution with real-time canvas updates
        </Text>
      </View>

      {/* Status Section */}
      {executor.state.isExecuting && (
        <View style={styles.statusSection}>
          <View style={styles.statusContent}>
            <ActivityIndicator size="large" color="#0078d4" />
            <Text style={styles.statusText}>
              Executing Tasks
            </Text>
            <Text style={styles.progressText}>
              {executor.state.completedTasks + executor.state.failedTasks} /{' '}
              {
                (decomposition?.subtasks.length || 0)
              }
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${executor.state.progress}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressPercentage}>
              {executor.state.progress}% Complete
            </Text>
          </View>
        </View>
      )}

      {/* Error Display */}
      {executor.state.error && (
        <View style={styles.errorSection}>
          <Text style={styles.errorTitle}>⚠️ Error</Text>
          <Text style={styles.errorText}>{executor.state.error}</Text>
        </View>
      )}

      {/* Decomposition Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Decomposition</Text>

        {decomposition ? (
          <View style={styles.decompositionContent}>
            <Text style={styles.objectiveText}>
              {decomposition.mainObjective}
            </Text>
            <Text style={styles.summaryText}>{decomposition.summary}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Tasks</Text>
                <Text style={styles.statValue}>
                  {decomposition.subtasks.length}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Est. Tokens</Text>
                <Text style={styles.statValue}>
                  {decomposition.totalEstimatedTokens}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Est. Time</Text>
                <Text style={styles.statValue}>
                  {decomposition.estimatedTimeMinutes}m
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.placeholderText}>No decomposition loaded</Text>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleLoadSample}
        >
          <Text style={styles.buttonText}>📦 Load Sample</Text>
        </TouchableOpacity>
      </View>

      {/* Execution Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎮 Controls</Text>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.button,
              executor.state.isExecuting && styles.buttonDisabled,
            ]}
            onPress={handleExecute}
            disabled={executor.state.isExecuting}
          >
            <Text style={styles.buttonText}>▶️ Execute</Text>
          </TouchableOpacity>

          {executor.state.isExecuting && (
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={handleCancel}
            >
              <Text style={styles.buttonText}>⏹️ Cancel</Text>
            </TouchableOpacity>
          )}

          {!executor.state.isExecuting && executor.results.length > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleExport}
            >
              <Text style={styles.buttonText}>💾 Export</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Canvas Nodes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎨 Canvas Nodes</Text>
        <Text style={styles.nodeCountText}>
          {nodes.length} node{nodes.length !== 1 ? 's' : ''} on canvas
        </Text>

        {nodes.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.nodesScroll}
          >
            {nodes.map((node) => (
              <View key={node.id} style={styles.nodePreview}>
                <Text style={styles.nodeType}>{node.type}</Text>
                <Text style={styles.nodeContent} numberOfLines={3}>
                  {node.content.substring(0, 100)}
                </Text>
                <Text style={styles.nodeMetadata}>
                  {node.isStreaming ? '🔄 Streaming' : '✓ Done'}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Results Section */}
      {executor.results.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Results</Text>

          <View style={styles.resultsStats}>
            <View style={styles.resultStatBox}>
              <Text style={styles.resultStatLabel}>Total</Text>
              <Text style={styles.resultStatValue}>
                {executor.results.length}
              </Text>
            </View>
            <View style={styles.resultStatBox}>
              <Text style={styles.resultStatLabel}>Success</Text>
              <Text style={[styles.resultStatValue, styles.successColor]}>
                {executor.getSuccessfulTasks().length}
              </Text>
            </View>
            <View style={styles.resultStatBox}>
              <Text style={styles.resultStatLabel}>Failed</Text>
              <Text style={[styles.resultStatValue, styles.errorColor]}>
                {executor.getFailedTasks().length}
              </Text>
            </View>
          </View>

          {executor.stats && (
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Duration</Text>
                <Text style={styles.statItemValue}>
                  {formattedStats.duration}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Avg Time/Task</Text>
                <Text style={styles.statItemValue}>
                  {formattedStats.avgTimePerTask}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Success Rate</Text>
                <Text style={styles.statItemValue}>
                  {formattedStats.successRate}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Tokens/Task</Text>
                <Text style={styles.statItemValue}>
                  {formattedStats.tokensPerTask}
                </Text>
              </View>
            </View>
          )}

          {/* Individual Results */}
          <View style={styles.resultsList}>
            {executor.results.slice(0, 5).map((result) => (
              <View key={result.taskId} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTitle}>{result.title}</Text>
                  <Text
                    style={[
                      styles.resultStatus,
                      result.success
                        ? styles.successColor
                        : styles.errorColor,
                    ]}
                  >
                    {result.success ? '✓' : '✗'}
                  </Text>
                </View>
                <Text style={styles.resultTime}>
                  {result.processingTimeMs}ms • {result.tokensUsed?.totalTokens || 0} tokens
                </Text>
              </View>
            ))}

            {executor.results.length > 5 && (
              <Text style={styles.moreResults}>
                +{executor.results.length - 5} more results
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Task Executor v1.0 | Gemini 3.5 Flash Streaming
        </Text>
      </View>
    </ScrollView>
  );
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3c3c3c',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  statusSection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#252526',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0078d4',
  },
  statusContent: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#3c3c3c',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0078d4',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0078d4',
    marginTop: 12,
  },
  errorSection: {
    margin: 20,
    padding: 16,
    backgroundColor: '#3c2020',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#d13438',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d13438',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#e0e0e0',
  },
  section: {
    margin: 20,
    padding: 16,
    backgroundColor: '#252526',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  decompositionContent: {
    marginBottom: 12,
  },
  objectiveText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 12,
    color: '#a0a0a0',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statBox: {
    flex: 1,
    marginHorizontal: 4,
    padding: 8,
    backgroundColor: '#3c3c3c',
    borderRadius: 6,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#a0a0a0',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0078d4',
  },
  placeholderText: {
    fontSize: 12,
    color: '#606060',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#0078d4',
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButton: {
    paddingVertical: 12,
    backgroundColor: '#0078d4',
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButton: {
    backgroundColor: '#107c10',
  },
  dangerButton: {
    backgroundColor: '#d13438',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  nodeCountText: {
    fontSize: 12,
    color: '#a0a0a0',
    marginBottom: 8,
  },
  nodesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  nodePreview: {
    width: 150,
    marginRight: 8,
    padding: 8,
    backgroundColor: '#3c3c3c',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0078d4',
  },
  nodeType: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0078d4',
    marginBottom: 4,
  },
  nodeContent: {
    fontSize: 10,
    color: '#a0a0a0',
    marginBottom: 4,
  },
  nodeMetadata: {
    fontSize: 9,
    color: '#606060',
  },
  resultsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultStatBox: {
    flex: 1,
    marginHorizontal: 4,
    padding: 8,
    backgroundColor: '#3c3c3c',
    borderRadius: 6,
    alignItems: 'center',
  },
  resultStatLabel: {
    fontSize: 10,
    color: '#a0a0a0',
    marginBottom: 4,
  },
  resultStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0078d4',
  },
  successColor: {
    color: '#107c10',
  },
  errorColor: {
    color: '#d13438',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    width: '48%',
    padding: 8,
    backgroundColor: '#3c3c3c',
    borderRadius: 6,
    marginBottom: 8,
  },
  statItemLabel: {
    fontSize: 10,
    color: '#a0a0a0',
    marginBottom: 4,
  },
  statItemValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  resultsList: {
    marginTop: 12,
  },
  resultItem: {
    padding: 10,
    backgroundColor: '#3c3c3c',
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#0078d4',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
    flex: 1,
  },
  resultStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultTime: {
    fontSize: 10,
    color: '#a0a0a0',
  },
  moreResults: {
    fontSize: 10,
    color: '#606060',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#3c3c3c',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#606060',
  },
});
