# Infinite Canvas - Quick Reference

## 🚀 Quick Start (30 seconds)

```typescript
import InfiniteCanvas from './components/InfiniteCanvas';

export const MyScreen = () => (
  <InfiniteCanvas config={{ autoFitContent: true }} />
);
```

## 📦 Installation

```bash
npm install @shopify/react-native-skia react-native-gesture-handler react-native-reanimated zustand immer
```

## 🎮 Controls

| Action | Gesture | Effect |
|--------|---------|--------|
| **Pan** | Drag finger | Move canvas |
| **Zoom** | Pinch gesture | Scale view |
| **Select** | Tap node | Highlight node |
| **Move Node** | Drag selected node | Reposition node |

## 🎨 Components

### InfiniteCanvas
Main component - use this for complete canvas UI
```typescript
<InfiniteCanvas
  config={{ autoFitContent: true }}
  onNodeSelected={(id) => console.log(id)}
/>
```

### CanvasEngine
Low-level: pan/zoom/grid only
```typescript
<CanvasEngine
  width={400}
  height={600}
  onTransformChange={(t) => console.log(t)}
/>
```

### CanvasNodeRenderer
Low-level: node rendering with culling
```typescript
<CanvasNodeRenderer
  canvasRef={ref}
  width={400}
  height={600}
  transform={transform}
  selectedNodeId={id}
/>
```

## 🎯 Common Tasks

### Create a Node
```typescript
const { addNode } = useCanvasActions();

addNode({
  type: 'code',
  x: 100,
  y: 100,
  width: 300,
  height: 200,
  content: 'Your content here',
  metadata: { tags: ['tag1'], customData: {} },
});
```

### Update Node Position
```typescript
const { updateNodePosition } = useCanvasActions();
updateNodePosition(nodeId, newX, newY);
```

### Add Content to Node
```typescript
const { appendNodeContent } = useCanvasActions();
appendNodeContent(nodeId, 'text to add');
```

### Stream Content
```typescript
const { setNodeStreaming, appendNodeContent } = useCanvasActions();

setNodeStreaming(nodeId, true);
for (const chunk of response) {
  appendNodeContent(nodeId, chunk);
}
setNodeStreaming(nodeId, false);
```

### Get All Nodes
```typescript
const nodes = useCanvasNodes();
```

### Get Specific Node Type
```typescript
const codeNodes = useCanvasNodesByType('code');
```

### Get Node Counts
```typescript
const { code, chat, terminal, agent } = useCanvasNodeCounts();
```

### Delete Node
```typescript
const { removeNode } = useCanvasActions();
removeNode(nodeId);
```

## 🎨 Customization

### Change Grid
```typescript
<CanvasEngine
  gridConfig={{
    baseGridSize: 30,
    gridColor: '#000000',
    useLines: true,
    showGridLines: false,
  }}
/>
```

### Change Node Colors
Edit `NODE_TYPE_COLORS` in `CanvasNodeRenderer.tsx`:
```typescript
const NODE_TYPE_COLORS = {
  code: '#FF0000',      // Your color
  chat: '#00FF00',
  terminal: '#0000FF',
  agent: '#FFFF00',
};
```

### Disable Features
```typescript
<InfiniteCanvas
  config={{
    enableNodeDragging: false,    // Can't drag nodes
    enableNodeSelection: false,   // Can't select nodes
    gridEnabled: false,           // Hide grid
  }}
/>
```

## 📐 Coordinate System

```typescript
import { screenToCanvas, canvasToScreen } from './canvasUtils';

// Convert tap location to canvas coords
const canvasCoords = screenToCanvas(tapX, tapY, transform);

// Convert node position to screen coords
const screenCoords = canvasToScreen(nodeX, nodeY, transform);
```

## 🔍 Viewport Utilities

```typescript
import {
  getViewportBounds,
  isPointVisible,
  isRectVisible,
  getFitTransform,
} from './canvasUtils';

// Get visible area
const bounds = getViewportBounds(width, height, transform);

// Check if point is visible
if (isPointVisible({ x: 100, y: 100 }, width, height, transform)) {
  // Point is on screen
}

// Auto-fit content
const fitTransform = getFitTransform(contentBounds, { width, height });
```

## 🐛 Debugging

### Show Debug Overlay
```typescript
<InfiniteCanvas
  config={{ showViewportBounds: true }}
/>
```

### Log Transform Changes
```typescript
<CanvasEngine
  onTransformChange={(transform) => {
    console.log(`Pan: (${transform.translateX}, ${transform.translateY})`);
    console.log(`Zoom: ${(transform.scale * 100).toFixed(0)}%`);
  }}
/>
```

### Inspect Store State
```typescript
import { useCanvasStore } from './store/canvasStore';

const nodes = useCanvasStore((state) => state.nodes);
const printState = () => useCanvasStore.getState();
```

## ⚙️ Configuration Presets

### Presentation Mode (Read-Only)
```typescript
<InfiniteCanvas
  config={{
    enableNodeDragging: false,
    enableNodeSelection: false,
    autoFitContent: true,
  }}
/>
```

### Editing Mode (Full Control)
```typescript
<InfiniteCanvas
  config={{
    enableNodeDragging: true,
    enableNodeSelection: true,
    autoFitContent: false,
    showViewportBounds: false,
  }}
/>
```

### Debug Mode (Development)
```typescript
<InfiniteCanvas
  config={{
    showViewportBounds: true,
    gridEnabled: true,
    zoomMin: 0.05,
    zoomMax: 20,
  }}
/>
```

## 🎯 Node Types & Colors

| Type | Color | RGB |
|------|-------|-----|
| code | Blue | #3B82F6 |
| chat | Green | #10B981 |
| terminal | Dark Gray | #1F2937 |
| agent | Amber | #F59E0B |

## 🔗 Interfaces

```typescript
// Node in store
interface CanvasNode {
  id: string;
  type: 'code' | 'chat' | 'terminal' | 'agent';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  metadata?: { tags: string[]; customData: Record<string, any> };
  createdAt: number;
  updatedAt: number;
  isStreaming: boolean;
}

// Transform state
interface CanvasTransform {
  translateX: number;
  translateY: number;
  scale: number;
}

// Grid config
interface GridConfig {
  baseGridSize: number;
  minGridSize: number;
  maxGridSize: number;
  gridColor: string;
  gridOpacity: number;
  gridDotRadius: number;
  useLines: boolean;
  showGridLines: boolean;
}
```

## 📊 Performance Tips

1. **Use viewport culling**: Only visible nodes render (automatic)
2. **Batch updates**: Use `batchAppendNodeContent()` for many nodes
3. **Memoize components**: Wrap in React.memo to prevent re-renders
4. **Reduce node count**: Consider node clustering at large scale
5. **Profile**: Use Redux DevTools to check update frequency

## 🔍 Common Issues

| Problem | Solution |
|---------|----------|
| Nodes not visible | Check coordinates and zoom level |
| Gestures not working | Ensure event handlers are connected |
| Performance lag | Enable viewport culling, reduce node count |
| Selection not working | Verify `selectedNodeId` state |
| Grid looks wrong | Adjust `baseGridSize` and zoom limits |

## 🎓 Learn More

- **Full Guide**: `docs/INFINITE_CANVAS_GUIDE.md`
- **Integration**: `docs/INFINITE_CANVAS_INTEGRATION.md`
- **Delivery**: `docs/INFINITE_CANVAS_DELIVERY.md`
- **Store API**: `docs/ZUSTAND_STORE_GUIDE.md`
- **Demo**: `src/screens/InfiniteCanvasDemo.tsx`

## 📚 Hooks Cheat Sheet

```typescript
// Read operations
useCanvasNodes()                    // All nodes
useCanvasNode(id)                   // Specific node
useCanvasNodesByType(type)          // Filter by type
useCanvasNodeCounts()               // Counts per type
useCanvasBounds()                   // Content bounds
useStreamingNodes()                 // Currently streaming
useSearchNodes(query)               // Search content
useTotalContentLength()             // Total chars
useNodesInBounds(x, y, w, h)       // Find in region

// Write operations
useCanvasActions()                  // All actions
```

## 🎯 Next Steps

1. ✅ Install dependencies
2. ✅ Copy components to your project
3. ✅ Add `<InfiniteCanvas />` to a screen
4. ✅ Test gestures
5. ✅ Read full documentation
6. ✅ Customize for your needs
7. ✅ Deploy to production

---

**Version**: 1.0 | **Last Updated**: 2024 | **Status**: Production Ready
