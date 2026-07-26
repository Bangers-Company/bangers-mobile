import { StateStorage } from 'zustand/middleware';

// Workaround for TS class resolution issues in some environments
const { MMKV } = require('react-native-mmkv');
const storage = new MMKV();

export const mmkvStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return storage.delete(name);
  },
};
