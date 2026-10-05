// Jest setup file — global mocks and polyfills

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock react-native platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'web',
  select: jest.fn((obj) => obj.web),
}));

// Global fetch mock
global.fetch = global.fetch || jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
  })
);
