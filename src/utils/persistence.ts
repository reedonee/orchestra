/**
 * Persistence Layer - Auto-save canvas and settings to AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CanvasNode } from '../store/canvasStore';

const KEYS = {
  CANVAS_NODES: 'orchestra:canvas:nodes',
  CANVAS_VIEWPORT: 'orchestra:canvas:viewport',
  BYOK_KEYS: 'orchestra:byok:keys',
  SETTINGS: 'orchestra:settings',
  RECENT_PROJECTS: 'orchestra:recent',
};

export interface PersistedCanvas {
  nodes: CanvasNode[];
  viewport: { x: number; y: number; zoom: number };
  savedAt: number;
}

export interface PersistedSettings {
  theme: 'dark' | 'light' | 'system';
  autoSave: boolean;
  streamingBatchMs: number;
  showGrid: boolean;
  snapToGrid: boolean;
}

const DEFAULT_SETTINGS: PersistedSettings = {
  theme: 'system',
  autoSave: true,
  streamingBatchMs: 16,
  showGrid: true,
  snapToGrid: false,
};

export const saveCanvas = async (nodes: CanvasNode[], viewport: { x: number; y: number; zoom: number }) => {
  try {
    const data: PersistedCanvas = { nodes, viewport, savedAt: Date.now() };
    await AsyncStorage.setItem(KEYS.CANVAS_NODES, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save canvas:', e);
  }
};

export const loadCanvas = async (): Promise<PersistedCanvas | null> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.CANVAS_NODES);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('Failed to load canvas:', e);
    return null;
  }
};

export const saveSettings = async (settings: Partial<PersistedSettings>) => {
  try {
    const current = await loadSettings();
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
};

export const loadSettings = async (): Promise<PersistedSettings> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const addRecentProject = async (name: string, nodeCount: number) => {
  try {
    const current = await getRecentProjects();
    const updated = [
      { name, nodeCount, openedAt: Date.now() },
      ...current.filter(p => p.name !== name),
    ].slice(0, 10);
    await AsyncStorage.setItem(KEYS.RECENT_PROJECTS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save recent project:', e);
  }
};

export const getRecentProjects = async (): Promise<Array<{ name: string; nodeCount: number; openedAt: number }>> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.RECENT_PROJECTS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch (e) {
    console.warn('Failed to clear data:', e);
  }
};
