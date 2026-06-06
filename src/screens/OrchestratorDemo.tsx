/**
 * OrchestratorDemo Component
 * 
 * Interactive demo showcasing OrchestratorService capabilities
 * Shows task decomposition from user input with full UI
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  Dimensions,
} from 'react-native';
import { useOrchestrator } from '../hooks/useOrchestrator';
import { TaskPriority, AgentType, SubTask } from '../services/orchestratorService';

const { width } = Dimensions.get('window');

/**
 * Demo examples for quick testing
 */
const DEMO_PROMPTS = [
  'Build a weather app that fetches data from an API, displays it in a beautiful UI, and caches the results locally',
  'Create an authentication system with login, signup, and password reset flows, including email verification',
  'Implement a real-time chat application with user presence, message history, and typing indicators',
  'Develop a task management tool with filtering, sorting, and drag-and-drop functionality',
  'Build a recommendation engine that analyzes user behavior and suggests relevant items',
];

interface TaskDisplayProps {
  task: SubTask;
  index: number;
}

/**
 * Individual task display component
 */
const TaskDisplay: React.FC<TaskDisplayProps> = ({ task, index }) => {
  const [expanded, setExpanded] = useState(false);

  const agentColors: Record<AgentType, string> = {
    coder: '#0078d4',
    reviewer: '#107c10',
    terminal: '#2d2d2d',
    architect: '#d83b01',
    debugger: '#9f40d1',
    documenter: '#00a4ef',
    tester: '#5b4d9f',
    analyst: '#4f7c1b',
    researcher: '#8661c5',
    coordinator: '#ff8c00',
  };

  const priorityColors: Record<TaskPriority, string> = {
    critical: '#d13438',
    high: '#ffb900',
    medium: '#107c10',
    low: '#0078d4',
  };

  return (
    <View style={styles.taskContainer}>
      <TouchableOpacity
        style={styles.taskHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.taskTitleRow}>
          <Text style={styles.taskIndex}>#{index + 1}</Text>
          <Text style={styles.taskTitle}>{task.title}</Text>
        </View>

        <View style={styles.taskBadges}>
          <View
            style={[
              styles.badge,
              { backgroundColor: agentColors[task.agentType] || '#0078d4' },
            ]}
          >
            <Text style={styles.badgeText}>{task.agentType}</Text>
          </View>

          <View
            style={[
              styles.badge,
              { backgroundColor: priorityColors[task.priority] || '#0078d4' },
            ]}
          >
            <Text style={styles.badgeText}>{task.priority}</Text>
          </View>

          {task.estimatedTokens && (
            <View style={[styles.badge, { backgroundColor: '#464647' }]}>
              <Text style={styles.badgeText}>{task.estimatedTokens} tokens</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.taskDetails}>
          <Text style={styles.detailLabel}>Description:</Text>
          <Text style={styles.detailText}>{task.description}</Text>

          {task.dependencies && task.dependencies.length > 0 && (
            <>
              <Text style={styles.detailLabel}>Dependencies:</Text>
              <View style={styles.dependencyList}>
                {task.dependencies.map((dep) => (
                  <View key={dep} style={styles.dependencyBadge}>
                    <Text style={styles.dependencyText}>{dep}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {task.context && Object.keys(task.context).length > 0 && (
            <>
              <Text style={styles.detailLabel}>Context:</Text>
              <Text style={styles.detailText}>{JSON.stringify(task.context, null, 2)}</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
};

/**
 * OrchestratorDemo Component
 */
export const OrchestratorDemo: React.FC = () => {
  const [input, setInput] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<number | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [expandedStats, setExpandedStats] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const orchestrator = useOrchestrator();

  /**
   * Handle API key setup
   */
  const handleSetApiKey = () => {
    if (!apiKeyInput.trim()) {
      Alert.alert('Error', 'Please enter your Gemini API key');
      return;
    }

    try {
      orchestrator.setApiKey(apiKeyInput.trim());
      setApiKeyInput('');
      setShowApiKeyInput(false);
      Alert.alert('Success', 'API key has been set');
    } catch (error) {
      Alert.alert('Error', 'Failed to set API key');
    }
  };

  /**
   * Handle decomposition
   */
  const handleDecompose = async () => {
    const userRequest = input.trim();

    if (!userRequest) {
      Alert.alert('Error', 'Please enter a task description or select a demo');
      return;
    }

    if (!orchestrator.isApiKeyConfigured) {
      Alert.alert('Error', 'Please configure your Gemini API key first');
      return;
    }

    try {
      const result = await orchestrator.decomposeTask(userRequest, {
        temperature: 0.5,
        maxOutputTokens: 4096,
      });

      if (!result || !result.success) {
        Alert.alert('Error', result?.error || 'Failed to decompose task');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  /**
   * Handle demo prompt selection
   */
  const handleSelectDemo = (index: number) => {
    setInput(DEMO_PROMPTS[index]);
    setSelectedPrompt(index);
  };

  /**
   * Test connection
   */
  const handleTestConnection = async () => {
    const connected = await orchestrator.testConnection();
    if (connected) {
      Alert.alert('Success', 'Connected to Gemini API');
    } else {
      Alert.alert('Error', orchestrator.error || 'Failed to connect');
    }
  };

  /**
   * Export result
   */
  const handleExport = () => {
    const json = orchestrator.exportAsJSON();
    if (json) {
      Alert.alert('Export', 'JSON copied to clipboard\n\n' + json.substring(0, 200) + '...');
    }
  };

  /**
   * Format and display
   */
  const handleFormat = () => {
    const formatted = orchestrator.formatForDisplay();
    if (formatted) {
      Alert.alert('Formatted Output', formatted.substring(0, 500) + '...');
    }
  };

  // API Key Setup Screen
  if (showApiKeyInput || !orchestrator.isApiKeyConfigured) {
    return (
      <View style={styles.container}>
        <View style={styles.setupContainer}>
          <Text style={styles.setupTitle}>Setup Gemini API Key</Text>
          <Text style={styles.setupSubtitle}>
            Enter your Bring Your Own Key (BYOK) Gemini API key
          </Text>

          <TextInput
            style={styles.apiKeyInput}
            placeholder="Enter your Gemini API key..."
            value={apiKeyInput}
            onChangeText={setApiKeyInput}
            placeholderTextColor="#999"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSetApiKey}
            disabled={!apiKeyInput.trim()}
          >
            <Text style={styles.buttonText}>Save API Key</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setShowApiKeyInput(false)}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Get your API key at: console.cloud.google.com
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orchestrator Demo</Text>
        <Text style={styles.headerSubtitle}>AI-Powered Task Decomposition</Text>

        {orchestrator.isApiKeyConfigured && (
          <View style={styles.apiKeyBadge}>
            <Text style={styles.apiKeyBadgeText}>✓ API Key Configured</Text>
          </View>
        )}
      </View>

      {/* Error Display */}
      {orchestrator.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{orchestrator.error}</Text>
          <TouchableOpacity onPress={orchestrator.clearError}>
            <Text style={styles.errorDismiss}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* API Key Settings */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => setShowApiKeyInput(true)}
      >
        <Text style={styles.settingsButtonText}>⚙️ Change API Key</Text>
      </TouchableOpacity>

      {/* Input Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enter Task Description</Text>

        <TextInput
          style={styles.textInput}
          placeholder="Describe the task you want to decompose..."
          value={input}
          onChangeText={setInput}
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, orchestrator.isLoading && styles.disabledButton]}
          onPress={handleDecompose}
          disabled={orchestrator.isLoading}
        >
          {orchestrator.isLoading ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.buttonText}>Decomposing...</Text>
            </>
          ) : (
            <Text style={styles.buttonText}>Decompose Task</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Demo Prompts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Demo Prompts (Click to use)</Text>

        {DEMO_PROMPTS.map((prompt, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.demoPrompt,
              selectedPrompt === index && styles.demoPromptSelected,
            ]}
            onPress={() => handleSelectDemo(index)}
          >
            <Text style={styles.demoPromptText}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Statistics */}
      {orchestrator.stats.totalRequests > 0 && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.statsHeader}
            onPress={() => setExpandedStats(!expandedStats)}
          >
            <Text style={styles.sectionTitle}>Statistics</Text>
            <Text style={styles.expandIcon}>{expandedStats ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {expandedStats && (
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Requests</Text>
                <Text style={styles.statValue}>{orchestrator.stats.totalRequests}</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Tokens Used</Text>
                <Text style={styles.statValue}>{orchestrator.stats.totalTokensUsed}</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Avg Time</Text>
                <Text style={styles.statValue}>
                  {orchestrator.stats.averageProcessingTime.toFixed(0)}ms
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.section}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleTestConnection}
          >
            <Text style={styles.buttonText}>Test Connection</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleFormat}
            disabled={!orchestrator.decomposition}
          >
            <Text style={styles.buttonText}>Format</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleExport}
            disabled={!orchestrator.decomposition}
          >
            <Text style={styles.buttonText}>Export JSON</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Decomposition Results */}
      {orchestrator.decomposition && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Decomposition Results</Text>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Objective:</Text>
            <Text style={styles.summaryText}>{orchestrator.decomposition.mainObjective}</Text>

            <Text style={styles.summaryLabel}>Summary:</Text>
            <Text style={styles.summaryText}>{orchestrator.decomposition.summary}</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Tasks</Text>
                <Text style={styles.summaryValue}>{orchestrator.decomposition.subtasks.length}</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Est. Tokens</Text>
                <Text style={styles.summaryValue}>
                  {orchestrator.decomposition.totalEstimatedTokens}
                </Text>
              </View>

              {orchestrator.decomposition.estimatedTimeMinutes && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Est. Time</Text>
                  <Text style={styles.summaryValue}>
                    {orchestrator.decomposition.estimatedTimeMinutes}m
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Tasks List */}
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Tasks</Text>
          {orchestrator.decomposition.subtasks.map((task, index) => (
            <TaskDisplay key={task.id} task={task} index={index} />
          ))}

          {/* Execution Strategy */}
          {orchestrator.decomposition.executionStrategy && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Execution Strategy</Text>
              <View style={styles.strategyBox}>
                <Text style={styles.strategyText}>
                  {orchestrator.decomposition.executionStrategy}
                </Text>
              </View>
            </>
          )}
        </View>
      )}

      {/* Footer Spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },

  header: {
    backgroundColor: '#252526',
    padding: 16,
    marginBottom: 16,
    borderBottomColor: '#3e3e42',
    borderBottomWidth: 1,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#b4b4b4',
    marginTop: 4,
  },

  apiKeyBadge: {
    backgroundColor: '#107c10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },

  apiKeyBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },

  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#1e1e1e',
  },

  setupTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },

  setupSubtitle: {
    fontSize: 14,
    color: '#b4b4b4',
    marginBottom: 24,
  },

  apiKeyInput: {
    backgroundColor: '#3c3c3c',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#464647',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
  },

  helpText: {
    color: '#b4b4b4',
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },

  settingsButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#3c3c3c',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderColor: '#464647',
    borderWidth: 1,
  },

  settingsButtonText: {
    color: '#0078d4',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#252526',
    borderRadius: 8,
    padding: 16,
    borderColor: '#3e3e42',
    borderWidth: 1,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },

  textInput: {
    backgroundColor: '#3c3c3c',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#464647',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },

  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },

  primaryButton: {
    backgroundColor: '#0078d4',
  },

  secondaryButton: {
    backgroundColor: '#464647',
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },

  demoPrompt: {
    backgroundColor: '#3c3c3c',
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
    borderColor: '#464647',
    borderWidth: 1,
  },

  demoPromptSelected: {
    borderColor: '#0078d4',
    backgroundColor: '#2d2d30',
  },

  demoPromptText: {
    color: '#b4b4b4',
    fontSize: 13,
    lineHeight: 18,
  },

  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  expandIcon: {
    color: '#b4b4b4',
    fontSize: 12,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },

  statBox: {
    flex: 1,
    backgroundColor: '#3c3c3c',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },

  statLabel: {
    fontSize: 12,
    color: '#b4b4b4',
    marginBottom: 4,
  },

  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0078d4',
  },

  errorContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#5c2e2e',
    borderColor: '#d13438',
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  errorText: {
    color: '#f1707b',
    fontSize: 13,
    flex: 1,
  },

  errorDismiss: {
    color: '#0078d4',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 12,
  },

  summaryBox: {
    backgroundColor: '#3c3c3c',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    borderColor: '#464647',
    borderWidth: 1,
  },

  summaryLabel: {
    fontSize: 12,
    color: '#b4b4b4',
    fontWeight: '600',
    marginTop: 8,
  },

  summaryText: {
    fontSize: 13,
    color: '#ffffff',
    marginTop: 4,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },

  summaryItem: {
    flex: 1,
    backgroundColor: '#2d2d30',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0078d4',
    marginTop: 4,
  },

  taskContainer: {
    backgroundColor: '#3c3c3c',
    borderRadius: 4,
    marginBottom: 8,
    borderColor: '#464647',
    borderWidth: 1,
    overflow: 'hidden',
  },

  taskHeader: {
    padding: 12,
  },

  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  taskIndex: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0078d4',
    marginRight: 8,
  },

  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },

  taskBadges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },

  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },

  taskDetails: {
    backgroundColor: '#2d2d30',
    padding: 12,
    borderTopColor: '#464647',
    borderTopWidth: 1,
  },

  detailLabel: {
    fontSize: 12,
    color: '#b4b4b4',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },

  detailText: {
    fontSize: 12,
    color: '#ffffff',
    lineHeight: 16,
  },

  dependencyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },

  dependencyBadge: {
    backgroundColor: '#0078d4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },

  dependencyText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },

  strategyBox: {
    backgroundColor: '#3c3c3c',
    borderRadius: 4,
    padding: 12,
    borderColor: '#464647',
    borderWidth: 1,
  },

  strategyText: {
    color: '#b4b4b4',
    fontSize: 13,
    lineHeight: 18,
  },
});
