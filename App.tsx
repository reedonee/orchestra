import React, {useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import {DemoLoader} from './src/components/DemoLoader';
import {ErrorBoundary} from './src/components/ErrorBoundary';
import {isWeb} from './src/utils/platform';
import {ToastProvider} from './src/components/ui/ToastProvider';
import {colors} from './src/theme/designTokens';

type DemoKey =
  | 'home'
  | 'orchestrator'
  | 'taskExecutor'
  | 'infiniteCanvas'
  | 'nodeViewer';

const DEMOS: {
  key: Exclude<DemoKey, 'home'>;
  label: string;
  description: string;
  webSupported: boolean;
}[] = [
  { key: 'orchestrator', label: 'Orchestrator', description: 'AI task decomposition and agent planning', webSupported: true },
  { key: 'taskExecutor', label: 'Task Executor', description: 'Execute decomposed tasks with Gemini', webSupported: true },
  { key: 'infiniteCanvas', label: 'Infinite Canvas', description: 'Pan, zoom, and node-based canvas (native)', webSupported: false },
  { key: 'nodeViewer', label: 'Node Viewer', description: 'Interactive node graph viewer (native)', webSupported: false },
];

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [activeDemo, setActiveDemo] = useState<DemoKey>('home');

  const backgroundColor = colors.bg;
  const cardColor = colors.bgElevated;
  const textColor = colors.textPrimary;
  const mutedColor = colors.textSecondary;

  if (activeDemo !== 'home') {
    const demoMeta = DEMOS.find(d => d.key === activeDemo);
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaView style={[styles.container, {backgroundColor}]}>
          <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
          <View style={styles.demoHeader}>
            <TouchableOpacity onPress={() => setActiveDemo('home')} style={styles.backButton}>
              <Text style={[styles.backButtonText, {color: textColor}]}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.demoTitle, {color: textColor}]}>{demoMeta?.label}</Text>
          </View>
          <View style={styles.demoContent}>
            <DemoLoader demo={activeDemo} onBack={() => setActiveDemo('home')} />
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <ToastProvider>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaView style={[styles.container, {backgroundColor}]}>
          <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
          <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={[styles.title, {color: textColor}]}>Orchestra</Text>
              <Text style={[styles.subtitle, {color: mutedColor}]}>AI orchestration, canvas workflows, and task execution</Text>
            </View>
            {isWeb && (
              <View style={[styles.banner, {backgroundColor: cardColor}]}>
                <Text style={[styles.bannerText, {color: mutedColor}]}>Running on web. Canvas demos require Windows or mobile builds.</Text>
              </View>
            )}
            {DEMOS.map(demo => (
              <TouchableOpacity key={demo.key} style={[styles.card, {backgroundColor: cardColor}]} onPress={() => setActiveDemo(demo.key)}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, {color: textColor}]}>{demo.label}</Text>
                  {isWeb && (
                    <Text style={[styles.badge, {color: demo.webSupported ? colors.success : colors.warning}]}>
                      {demo.webSupported ? 'Web' : 'Native'}
                    </Text>
                  )}
                </View>
                <Text style={[styles.cardDescription, {color: mutedColor}]}>{demo.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </GestureHandlerRootView>
    </ToastProvider>
  );
}

function AppWithBoundary(): JSX.Element {
  return (
    <ErrorBoundary title="Orchestra failed to start">
      <App />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  header: { padding: 24, gap: 4 },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 16, marginBottom: 12 },
  banner: { borderRadius: 8, padding: 12, marginBottom: 8 },
  bannerText: { fontSize: 13, lineHeight: 18 },
  homeContent: { padding: 24, gap: 16 },
  card: { borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  badge: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  cardDescription: { fontSize: 14, lineHeight: 20 },
  demoHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backButton: { paddingVertical: 4, paddingRight: 8 },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  demoTitle: { fontSize: 18, fontWeight: '600' },
  demoContent: { flex: 1 },
});

export default AppWithBoundary;