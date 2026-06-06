/**
 * Export Utilities - Export canvas to various formats
 */

import { CanvasNode } from '../store/canvasStore';

export interface ExportOptions {
  format: 'json' | 'markdown' | 'html' | 'mermaid' | 'png';
  includeMetadata?: boolean;
  selectedNodeIds?: string[];
}

export const exportToJSON = (nodes: CanvasNode[], options: ExportOptions = { format: 'json' }): string => {
  const data = options.selectedNodeIds
    ? nodes.filter(n => options.selectedNodeIds!.includes(n.id))
    : nodes;
  
  const output = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    nodeCount: data.length,
    nodes: options.includeMetadata ? data : data.map(n => ({
      id: n.id,
      type: n.type,
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
      content: n.content,
      isStreaming: n.isStreaming,
    })),
  };
  
  return JSON.stringify(output, null, 2);
};

export const exportToMarkdown = (nodes: CanvasNode[], options: ExportOptions = { format: 'markdown' }): string => {
  const data = options.selectedNodeIds
    ? nodes.filter(n => options.selectedNodeIds!.includes(n.id))
    : nodes;
  
  let md = `# Orchestra Canvas Export\n\n`;
  md += `**Exported:** ${new Date().toLocaleString()}\n`;
  md += `**Nodes:** ${data.length}\n\n---\n\n`;
  
  for (const node of data) {
    md += `## ${node.type.toUpperCase()} Node (${node.id.slice(0, 8)})\n\n`;
    md += `**Position:** (${Math.round(node.x)}, ${Math.round(node.y)})\n`;
    md += `**Size:** ${Math.round(node.width)}×${Math.round(node.height)}\n\n`;
    md += `\`\`\`\n${node.content}\n\`\`\`\n\n---\n\n`;
  }
  
  return md;
};

export const exportToMermaid = (nodes: CanvasNode[]): string => {
  let mmd = 'graph TD\n';
  
  for (const node of nodes) {
    const id = node.id.replace(/-/g, '_');
    const label = node.content.slice(0, 30).replace(/\n/g, ' ').replace(/"/g, '');
    mmd += `  ${id}["${label}"]\n`;
    mmd += `  class ${id} ${node.type}\n`;
  }
  
  mmd += '\n  classDef agent fill:#3b82f6,color:#fff\n';
  mmd += '  classDef code fill:#10b981,color:#fff\n';
  mmd += '  classDef terminal fill:#6b7280,color:#fff\n';
  mmd += '  classDef chat fill:#f97316,color:#fff\n';
  
  return mmd;
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const shareCanvas = async (nodes: CanvasNode[]): Promise<string | null> => {
  if (typeof navigator !== 'undefined' && navigator.share) {
    const json = exportToJSON(nodes);
    try {
      await navigator.share({
        title: 'Orchestra Canvas',
        text: `Canvas with ${nodes.length} nodes`,
        files: [new File([json], 'canvas.json', { type: 'application/json' })],
      });
      return 'shared';
    } catch (e) {
      console.warn('Share failed:', e);
    }
  }
  return null;
};
