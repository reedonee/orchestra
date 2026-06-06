# Infinite Canvas Implementation Guide

## Overview

This guide covers the complete infinite canvas system built for Orchestra, consisting of:

1. **CanvasEngine** - Low-level canvas engine with 2D transforms (pan/zoom) and adaptive grid
2. **CanvasNodeRenderer** - Renders Zustand-managed nodes with viewport culling
3. **CanvasUtils** - Coordinate transformation and viewport management utilities
4. **InfiniteCanvas** - High-level component integrating all pieces
5. **InfiniteCanvasDemo** - Complete interactive demo

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  InfiniteCanvas (UI)                │
│  ┌─────────────────────────────────────────────┐    │
│  │  CanvasEngine (2D Transform)                │    │
│  │  ├─ Pan Gesture Handler                     │    │
│  │  ├─ Pinch Gesture Handler                   │    │
│  │  └─ Adaptive Grid Rendering (Skia)          │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │  CanvasNodeRenderer (Content Layer)         │    │
│  │  ├─ Viewport Culling                        │    │
│  │  ├─ Node Transform & Rendering              │    │
│  │  └─ Selection & Interaction                 │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
            ↓ (integrate with)
┌─────────────────────────────────────────────────────┐
│            Zustand Canvas Store                     │
│  ├─ CanvasNode[] (nodes)                            │
│  ├─ Actions (add/remove/update)                     │
│  └─ Custom Hooks (useCanvasNodes, etc.)             │
└─────────────────────────────────────────────────────┘
```

## Component Details

### 1. CanvasEngine

**Purpose**: Low-level rendering and gesture handling for 2D canvas operations.

**Features**:
- Pan gestures (drag to translate)
- Pinch-to-zoom with scale clamping
- Adaptive background grid with zoom-based sizing
- Transform matrix tracking
- Skia-based rendering

**Props**:
```typescript
interface CanvasEngineProps {
  width: number;                          // Canvas width
  height: number;                         // Canvas height
  gridConfig?: Partial<GridConfig>;       // Grid configuration
  onTransformChange?: (transform) => void; // Transform update callback
  backgroundColor?: string;               // Background color
  children?: React.ReactNode;
}
```

**Grid Configuration**:
```typescript
interface GridConfig {
  baseGridSize: number;        // Default: 20px
  minGridSize: number;         // Default: 8px
  maxGridSize: number;         // Default: 100px
  gridColor: string;           // Default: '#E0E0E0'
  gridOpacity: number;         // Default: 0.6
  gridDotRadius: number;       // Default: 1px
  useLines: boolean;           // Default: false (dots)
  showGridLines: boolean;      // Default: true
}
```

**Example Usage**:
```typescript
<CanvasEngine
  width={400}
  height={600}
  gridConfig={{
    baseGridSize: 25,
    gridColor: '#D0D0D0',
    useLines: false,
  }}
  onTransformChange={(transform) => {
    console.log('New transform:', transform);
  }}
/>
```

### 2. CanvasNodeRenderer

**Purpose**: Render Zustand-managed nodes onto the canvas with viewport culling.

**Features**:
- Viewport culling (only renders visible nodes)
- Automatic node color by type
- Zoom-adaptive rendering (different detail levels at different zoom)
- Selection highlighting
- Content preview with truncation
- Metadata display (tags, custom data)

**Props**:
```typescript
interface CanvasNodeRendererProps {
  canvasRef: React.Ref<SkiaView>;
  width: number;
  height: number;
  transform: CanvasTransform;
  selectedNodeId?: string;
  onNodePress?: (nodeId: string) => void;
  onNodeLongPress?: (nodeId: string) => void;
  config?: Partial<NodeRendererConfig>;
}
```

**Node Type Colors**:
- `code`: Blue (#3B82F6)
- `chat`: Green (#10B981)
- `terminal`: Dark gray (#1F2937)
- `agent`: Amber (#F59E0B)

**Rendering Levels by Zoom**:
- `< 0.3x`: Show as small indicator dots
- `0.3x - 0.5x`: Show node type label
- `0.5x - 0.7x`: Add content preview
- `0.7x+`: Add metadata/tags

**Example Usage**:
```typescript
<CanvasNodeRenderer
  canvasRef={ref}
  width={800}
  height={600}
  transform={currentTransform}
  selectedNodeId={selectedId}
  onNodePress={(nodeId) => setSelected(nodeId)}
  config={{
    nodeMinWidth: 200,
    nodeBorderWidth: 3,
    selectedNodeBorderColor: '#FFD700',
  }}
/>
```

### 3. Canvas Utils

**Purpose**: Utility functions for coordinate transformations and viewport calculations.

**Key Functions**:

#### Coordinate Transformations
```typescript
// Convert screen coords to canvas coords
screenToCanvas(screenX, screenY, transform): { x, y }

// Convert canvas coords to screen coords
canvasToScreen(canvasX, canvasY, transform): { x, y }
```

#### Viewport Management
```typescript
// Get visible bounds in world coordinates
getViewportBounds(screenWidth, screenHeight, transform): {
  minX, minY, maxX, maxY, width, height
}

// Check if point is visible
isPointVisible(point, screenWidth, screenHeight, transform): boolean

// Check if rectangle intersects viewport
isRectVisible(rect, screenWidth, screenHeight, transform): boolean
```

#### Geometry Utilities
```typescript
// Distance between two points
distance(p1, p2): number

// Angle between two points (radians)
angle(p1, p2): number

// Get bounding box of multiple points
getBoundingBox(points): { x, y, width, height } | null

// Fit rectangle in another (calculate scale)
fitRectInRect(innerRect, outerRect): number

// Get transform to fit and center content
getFitTransform(contentBounds, viewportSize): CanvasTransform
```

**Example Usage**:
```typescript
import { screenToCanvas, getViewportBounds } from './canvasUtils';

// Convert tap location to canvas coordinates
const canvasCoords = screenToCanvas(tapX, tapY, transform);

// Check what's visible
const bounds = getViewportBounds(width, height, transform);
console.log('Visible area:', bounds);

// Auto-fit content
const fitTransform = getFitTransform(contentBounds, { width, height });
```

### 4. InfiniteCanvas

**Purpose**: High-level component combining all pieces into a single interactive canvas.

**Features**:
- Auto-fit content on load
- Node selection and manipulation
- Optional node dragging
- Pan boundary constraints
- Debug mode with stats overlay

**Props**:
```typescript
interface InfiniteCanvasProps {
  config?: Partial<InfiniteCanvasConfig>;
  onNodeSelected?: (nodeId: string) => void;
  onNodeDeselected?: () => void;
  backgroundColor?: string;
}

interface InfiniteCanvasConfig {
  autoFitContent: boolean;        // Auto-fit on load
  enableNodeDragging: boolean;    // Allow dragging nodes
  enableNodeSelection: boolean;   // Allow selecting nodes
  showViewportBounds: boolean;    // Show debug overlay
  gridEnabled: boolean;           // Show background grid
  zoomMin: number;                // Minimum zoom level
  zoomMax: number;                // Maximum zoom level
  panBoundary?: number;           // Pan boundary padding (-1 = unlimited)
}
```

**Default Configuration**:
```typescript
{
  autoFitContent: true,
  enableNodeDragging: true,
  enableNodeSelection: true,
  showViewportBounds: false,
  gridEnabled: true,
  zoomMin: 0.1,
  zoomMax: 10,
  panBoundary: -1,
}
```

**Example Usage**:
```typescript
<InfiniteCanvas
  config={{
    autoFitContent: true,
    enableNodeDragging: true,
    zoomMin: 0.2,
    zoomMax: 8,
    showViewportBounds: true,
  }}
  onNodeSelected={(nodeId) => console.log('Selected:', nodeId)}
  onNodeDeselected={() => console.log('Deselected')}
  backgroundColor="#FAFAFA"
/>
```

### 5. InfiniteCanvasDemo

**Purpose**: Complete interactive demo showcasing all features.

**Features**:
- Quick action buttons to create different node types
- Generate demo grid of nodes
- Real-time stats display
- Node content editor
- Selected node details viewer
- Clear all functionality

## Integration with Zustand Store

The canvas system integrates with the Zustand store through custom hooks:

```typescript
import {
  useCanvasNodes,           // Get all nodes
  useCanvasNodesByType,     // Filter by type
  useCanvasNodeCounts,      // Get counts per type
  useCanvasBounds,          // Get content bounds
  useCanvasActions,         // Get state actions
} from '../store/canvasStore.hooks';

// In a component:
const nodes = useCanvasNodes();
const counts = useCanvasNodeCounts();
const { addNode, updateNodePosition } = useCanvasActions();
```

## Transform Matrix System

The canvas uses a simple 2D transform matrix:

```typescript
interface CanvasTransform {
  translateX: number;  // Horizontal offset
  translateY: number;  // Vertical offset
  scale: number;       // Zoom level (1.0 = 100%)
}

// Convert screen point to canvas coordinates:
canvasX = (screenX - translateX) / scale
canvasY = (screenY - translateY) / scale

// Convert canvas point to screen coordinates:
screenX = canvasX * scale + translateX
screenY = canvasY * scale + translateY
```

## Viewport Culling Algorithm

The renderer only draws nodes that intersect the visible viewport:

```typescript
1. Get viewport bounds:
   bounds = getViewportBounds(width, height, transform)

2. For each node:
   if isRectVisible(node, width, height, transform):
     renderNode(node, transform)

3. This prevents rendering off-screen nodes, improving performance
```

## Performance Optimization Tips

### 1. Viewport Culling
Automatically enabled - nodes outside viewport aren't rendered.

### 2. Zoom-Adaptive Rendering
Different detail levels render at different zoom levels:
```typescript
if (transform.scale >= 0.5) {
  // Render detailed content preview
} else if (transform.scale >= 0.3) {
  // Render simple labels only
} else {
  // Render as tiny dots
}
```

### 3. Batch Updates
For many node changes, use batch operations:
```typescript
const { batchAppendNodeContent } = useCanvasActions();

batchAppendNodeContent([
  { nodeId: 'node1', chunk: 'text1' },
  { nodeId: 'node2', chunk: 'text2' },
  { nodeId: 'node3', chunk: 'text3' },
]);
```

### 4. React Memo
Wrap node components in React.memo to prevent unnecessary re-renders:
```typescript
const NodeView = React.memo(({ node, selected }) => (
  // render node
), (prev, next) => {
  // Custom comparison logic
  return prev.node.id === next.node.id && 
         prev.selected === next.selected;
});
```

## Common Patterns

### Pattern 1: Select and Move Node
```typescript
const [selectedNodeId, setSelectedNodeId] = useState<string>();
const { updateNodePosition } = useCanvasActions();

const handleNodePress = (nodeId: string) => {
  setSelectedNodeId(nodeId);
};

const handleNodeDrag = (nodeId: string, dx: number, dy: number) => {
  const node = nodes.find(n => n.id === nodeId);
  if (node) {
    updateNodePosition(nodeId, node.x + dx, node.y + dy);
  }
};
```

### Pattern 2: Auto-Fit Content
```typescript
const bounds = useCanvasBounds();
const { width, height } = Dimensions.get('window');

useEffect(() => {
  if (bounds) {
    const fitTransform = getFitTransform(bounds, { width, height });
    setTransform(fitTransform);
  }
}, [bounds]);
```

### Pattern 3: Search Nodes
```typescript
import { useSearchNodes } from '../store/canvasStore.hooks';

const [query, setQuery] = useState('');
const results = useSearchNodes(query);

// Results are filtered by content, type, or ID
```

### Pattern 4: Streaming Content
```typescript
const { appendNodeContent, setNodeStreaming } = useCanvasActions();

// Start streaming
setNodeStreaming(nodeId, true);

// Append chunks as they arrive
for await (const chunk of streamResponse()) {
  appendNodeContent(nodeId, chunk);
}

// Stop streaming
setNodeStreaming(nodeId, false);
```

## Gesture Handling

### Pan Gesture
- **Detection**: Single finger drag
- **Callback**: `onPanBegin`, `onPanUpdate`, `onPanEnd`
- **Effect**: Updates `translateX` and `translateY`

### Pinch Gesture
- **Detection**: Two finger pinch
- **Callback**: `onPinchBegin`, `onPinchUpdate`, `onPinchEnd`
- **Effect**: Updates `scale` with clamping

### Node Selection
- **Detection**: Tap on canvas coordinate
- **Action**: Converts screen coords to canvas coords, finds hit node
- **Effect**: Updates `selectedNodeId`

### Node Dragging
- **Detection**: Pan gesture on selected node
- **Action**: Moves node while dragging
- **Effect**: Calls `updateNodePosition` in real-time

## Debugging

### Enable Debug Overlay
```typescript
<InfiniteCanvas
  config={{ showViewportBounds: true }}
/>
```

This displays:
- Current transform (position and scale)
- Content bounds
- Node count and selection status

### Log Viewport Changes
```typescript
<CanvasEngine
  onTransformChange={(transform) => {
    console.log('Transform:', {
      x: transform.translateX,
      y: transform.translateY,
      zoom: transform.scale * 100 + '%',
    });
  }}
/>
```

### Redux DevTools
Use Redux DevTools browser extension to time-travel through state changes:
```typescript
// Store is configured with Redux DevTools middleware
// Open Redux DevTools extension to inspect state history
```

## Limitations & Future Improvements

### Current Limitations
- Node dragging happens at 0.3x zoom (minimum for text)
- Grid lines can't be disabled per-node type
- No built-in zoom animation (uses spring config but not activated)
- No scroll wheel zoom on non-mobile

### Planned Improvements
1. **Scroll Wheel Zoom**: Implement with platform detection
2. **Inertial Scrolling**: Use spring animation after pan release
3. **Node Grouping**: Allow selecting/moving multiple nodes
4. **Undo/Redo**: Implement with Redux DevTools integration
5. **Export/Import**: Save canvas state to JSON
6. **Infinite Grid**: Render grid in all directions without bounds
7. **Node Animations**: Smooth transitions when moving/creating
8. **Performance Profiling**: Redux DevTools + React Profiler integration

## Troubleshooting

### Nodes Not Rendering
1. Check if nodes are in viewport: `isRectVisible()`
2. Verify `useCanvasNodes()` hook returns nodes
3. Check if `selectedNodeId` matches node IDs exactly

### Panning Not Working
1. Ensure `enableNodeDragging` is true in config
2. Check gesture handler setup in CanvasEngine
3. Verify `onTransformChange` callback is called

### Zoom Not Working
1. Check gesture handler is properly registered
2. Verify `zoomMin` and `zoomMax` values
3. Check if pinch gesture is being detected

### Performance Issues
1. Check viewport culling is working: `isRectVisible()` returns false for off-screen nodes
2. Profile with React DevTools Profiler
3. Consider reducing node count or using node clustering
4. Enable Redux DevTools to check state update frequency

## References

- [Shopify Skia Documentation](https://shopify.dev/api/react-native-skia)
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
