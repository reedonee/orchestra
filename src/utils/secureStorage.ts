import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

type SecureStorageModule = {
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
};

let nativeSecureStore: SecureStorageModule | null = null;

async function getNativeSecureStore(): Promise<SecureStorageModule> {
  if (!nativeSecureStore) {
    nativeSecureStore = await import('react-native-secure-store');
  }
  return nativeSecureStore;
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(`secure:${key}`, value);
    return;
  }

  const store = await getNativeSecureStore();
  await store.setItem(key, value);
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(`secure:${key}`);
  }

  const store = await getNativeSecureStore();
  return store.getItem(key);
}

export async function removeSecureItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(`secure:${key}`);
    return;
  }

  const store = await getNativeSecureStore();
  await store.removeItem(key);
}
