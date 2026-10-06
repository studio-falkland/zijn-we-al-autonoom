// Metro config: resolve packages through pnpm symlinks via the rnx-kit resolver.
const { getDefaultConfig } = require('expo/metro-config');
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks');

const config = getDefaultConfig(__dirname);
config.resolver.resolveRequest = MetroSymlinksResolver();

module.exports = config;
