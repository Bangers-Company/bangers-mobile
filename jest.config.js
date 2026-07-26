module.exports = {
  preset: 'jest-expo/node',
  setupFiles: ['<rootDir>/node_modules/react-native/jest/setup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|nativewind|react-native-svg|expo-router|expo-linking|expo-constants|expo-modules-core|expo-font|expo-asset|expo-sqlite|expo-file-system|expo-constants|react-native-css-interop)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  haste: {
    defaultPlatform: 'ios',
  },
  moduleNameMapper: {
    '^expo-router$': 'expo-router/build/index.js',
    'expo/src/winter/(.*)': '<rootDir>/jest-mocks/empty.js',
    'expo/src/async-require/(.*)': '<rootDir>/jest-mocks/empty.js',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
};
