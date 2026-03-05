const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.blacklistRE = [
  /node_modules\/@react-native\/debugger-frontend\/.*/,
];

config.resolver.assetExts.push("wasm");
config.resolver.sourceExts.push("wasm");

config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./src/global.css" });
