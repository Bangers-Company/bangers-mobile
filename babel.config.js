module.exports = function (api) {
  const isTest = api.env('test');

  const presets = [
    [
      "babel-preset-expo",
      {
        jsxImportSource: isTest ? undefined : "nativewind",
        unstable_transformImportMeta: true,
      },
    ],
  ];

  if (!isTest) {
    presets.push("nativewind/babel");
  }

  return {
    presets,
    plugins: [
      "babel-plugin-transform-import-meta",
      "react-native-reanimated/plugin",
    ],
  };
};
