// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const View = ({ children, style, ...props }) => React.createElement('View', { style, ...props }, children);
  const Text = ({ children, style, ...props }) => React.createElement('Text', { style, ...props }, children);
  
  const Reanimated = {
    useSharedValue: jest.fn((val) => ({ value: val })),
    useAnimatedStyle: jest.fn((cb) => cb() || {}),
    useAnimatedScrollHandler: jest.fn(() => () => {}),
    withTiming: jest.fn((toValue) => toValue),
    withSpring: jest.fn((toValue) => toValue),
    withRepeat: jest.fn((val) => val),
    withSequence: jest.fn((...args) => args[0]),
    withDelay: jest.fn((delay, val) => val),
    FadeIn: {},
    FadeOut: {},
    Layout: {
      springify: () => ({ damping: () => ({ stiffness: () => ({}) }) }),
    },
    Animated: {
      View,
      Text,
      ScrollView: View,
      Image: View,
      createAnimatedComponent: (cb) => cb,
    },
    default: {
      View,
      Text,
      ScrollView: View,
      Image: View,
      createAnimatedComponent: (cb) => cb,
      addWhitelistedNativeProps: () => {},
      addWhitelistedUIProps: () => {},
    },
  };

  return {
    __esModule: true,
    ...Reanimated,
    default: {
      ...Reanimated.default,
      ...Reanimated.Animated,
    },
  };
});

// Mock Expo SQLite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => ({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    withTransactionAsync: jest.fn((cb) => cb()),
  })),
}));

// Mock Expo Constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      API_URL: 'http://localhost:8000/api',
    },
  },
}));

// Mock Safe Area Context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const insets = { top: 0, left: 0, right: 0, bottom: 0 };
  const frame = { x: 0, y: 0, width: 0, height: 0 };
  const SafeAreaContext = React.createContext(insets);
  const SafeAreaInsetsContext = React.createContext(insets);
  
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    SafeAreaContext,
    SafeAreaInsetsContext,
    SafeAreaConsumer: SafeAreaContext.Consumer,
    initialWindowMetrics: {
      fallback: true,
      frame,
      insets,
    },
  };
});

// Mock React Native Paper
jest.mock('react-native-paper', () => {
  const React = require('react');
  const View = ({ children, ...props }) => React.createElement('View', props, children);
  return {
    Text: ({ children, ...props }) => React.createElement('Text', props, children),
    PaperProvider: ({ children }) => children,
    Button: View,
    Card: View,
    IconButton: View,
    ActivityIndicator: View,
    Portal: ({ children }) => children,
    Modal: View,
    Surface: View,
  };
});
