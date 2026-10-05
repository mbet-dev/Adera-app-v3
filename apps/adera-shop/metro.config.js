const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

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

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve (sub)dependencies only from the project root's node_modules
config.resolver.disableHierarchicalLookup = true;

// 4. Fix for the unstable_path.match error
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// 5. Add support for additional file extensions
config.resolver.assetExts.push(
  // Adds support for `.db` files for SQLite databases
  'db'
);

// 6. Support for workspace packages
config.resolver.unstable_enablePackageExports = true;

// 7. Symlink support
config.resolver.unstable_enableSymlinks = true;

// 8. Stub react-native-maps on web to avoid native-only module errors
const stubPath = path.resolve(projectRoot, 'stubs/react-native-maps.js');
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && (moduleName === 'react-native-maps' || moduleName.startsWith('react-native-maps/'))) {
    return { filePath: stubPath, type: 'source' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
