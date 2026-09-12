const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot, {
  // Enable CSS support.
  isCSSEnabled: true,
});

// Transform ESM packages that use import.meta
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
config.resolver.disableHierarchicalLookup = true;

// 4. Symlink support for pnpm
config.resolver.unstable_enableSymlinks = true;

// 5. Exclude problematic ESM packages from web bundle
if (config.resolver.resolverMainFields) {
  config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
}

module.exports = config;
