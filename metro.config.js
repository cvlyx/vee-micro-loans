const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Fix for vector icons font loading issues
config.resolver.assetExts.push('ttf');
config.resolver.assetExts.push('otf');

// Ensure proper asset handling for Expo vector icons
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
