/**
 * Keyboard Shortcuts System - Fixed
 */

import { useEffect, useCallback } from 'react';
import { Keyboard, Platform } from 'react-native';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  global?: boolean;
}

const pressedKeys = new Set<string>();

export const useKeyboardShortcuts = (shortcuts: Shortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (e: any) => {
      const key = e.nativeEvent?.key?.toLowerCase() || '';
      if (key) pressedKeys.add(key);
      
      for (const shortcut of shortcuts) {
        const matchKey = shortcut.key.toLowerCase();
        const matchCtrl = shortcut.ctrl === (pressedKeys.has('control') || pressedKeys.has('ctrl'));
        const matchShift = shortcut.shift === pressedKeys.has('shift');
        const matchAlt = shortcut.alt === pressedKeys.has('alt');
        const matchMeta = shortcut.meta === (pressedKeys.has('meta') || pressedKeys.has('command'));
        
        if (key === matchKey && matchCtrl && matchShift && matchAlt && matchMeta) {
          e.preventDefault?.();
          shortcut.action();
        }
      }
    };
    
    const handleKeyUp = (e: any) => {
      const key = e.nativeEvent?.key?.toLowerCase() || '';
      if (key) pressedKeys.delete(key);
    };
    
    const listener = Keyboard.addListener('keyDown', handleKeyDown);
    const listenerUp = Keyboard.addListener('keyUp', handleKeyUp);
    
    return () => {
      listener.remove();
      listenerUp.remove();
      pressedKeys.clear();
    };
  }, [shortcuts]);
};

export const createShortcuts = (actions: Record<string, () => void>): Shortcut[] => [
  { key: 'z', ctrl: true, action: actions.undo, description: 'Undo' },
  { key: 'z', ctrl: true, shift: true, action: actions.redo, description: 'Redo' },
  { key: 's', ctrl: true, action: actions.save, description: 'Save canvas' },
  { key: 'e', ctrl: true, action: actions.export, description: 'Export' },
  { key: '0', ctrl: true, action: actions.resetZoom, description: 'Reset zoom' },
  { key: '=', ctrl: true, action: actions.zoomIn, description: 'Zoom in' },
  { key: '-', ctrl: true, action: actions.zoomOut, description: 'Zoom out' },
  { key: 'f', ctrl: true, action: actions.find, description: 'Find node' },
  { key: 'n', ctrl: true, action: actions.newNode, description: 'New node' },
  { key: 'd', ctrl: true, action: actions.duplicate, description: 'Duplicate node' },
  { key: 'backspace', action: actions.delete, description: 'Delete selected' },
  { key: 'a', ctrl: true, action: actions.selectAll, description: 'Select all' },
  { key: ' ', ctrl: true, action: actions.runOrchestrator, description: 'Run orchestrator' },
  { key: 'enter', ctrl: true, action: actions.executeTasks, description: 'Execute tasks' },
  { key: '`', ctrl: true, action: actions.toggleSidebar, description: 'Toggle sidebar' },
  { key: '\\', ctrl: true, action: actions.toggleGrid, description: 'Toggle grid' },
  { key: '/', ctrl: true, action: actions.showHelp, description: 'Show shortcuts' },
  ...(Platform.OS === 'macos' ? [
    { key: 'k', meta: true, action: actions.clearCanvas, description: 'Clear canvas' },
  ] : []),
];