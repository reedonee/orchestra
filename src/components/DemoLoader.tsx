import React, {Suspense, lazy, type ComponentType} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

import {ErrorBoundary} from './ErrorBoundary';
import {isWeb} from '../utils/platform';

type DemoKey =
  | 'orchestrator'
  | 'taskExecutor'
  | 'infiniteCanvas'
  | 'nodeViewer';

const OrchestratorDemo = lazy(() =>
  import('../screens/OrchestratorDemo').then(m => ({
    default: m.OrchestratorDemo,
  })),
);

const TaskExecutorDemo = lazy(() =>
  import('../screens/TaskExecutorDemo').then(m => ({
    default: m.TaskExecutorDemo,
  })),
);

const InfiniteCanvasDemo = lazy(() => import('../screens/InfiniteCanvasDemo'));
const NodeViewerDemo = lazy(() => import('../screens/NodeViewerDemo'));

const WEB_UNSUPPORTED: DemoKey[] = ['infiniteCanvas', 'nodeViewer'];

const DEMO_COMPONENTS: Record<DemoKey, ComponentType> = {
  orchestrator: OrchestratorDemo,
  taskExecutor: TaskExecutorDemo,
  infiniteCanvas: InfiniteCanvasDemo,
  nodeViewer: NodeViewerDemo,
};

type Props = {
  demo: DemoKey;
  onBack: () => void;
};

function UnsupportedDemo({label}: {label: string}) {
  return (
    <View style={styles.unsupported}>
      <Text style={styles.unsupportedTitle}>{label} is not available on web</Text>
      <Text style={styles.unsupportedBody}>
        This demo uses native Skia canvas rendering. Use the Windows or mobile
        build, or try Orchestrator / Task Executor here in the browser.
      </Text>
    </View>
  );
}

function LoadingFallback() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={styles.loadingText}>Loading demo...</Text>
    </View>
  );
}

export function DemoLoader({demo, onBack}: Props) {
  if (isWeb && WEB_UNSUPPORTED.includes(demo)) {
    return <UnsupportedDemo label={demo} />;
  }

  const Component = DEMO_COMPONENTS[demo];

  return (
    <ErrorBoundary onReset={onBack}>
      <Suspense fallback={<LoadingFallback />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#888888',
    fontSize: 14,
  },
  unsupported: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  unsupportedTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  unsupportedBody: {
    color: '#aaaaaa',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
