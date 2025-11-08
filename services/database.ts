// Platform-specific database module re-export
// This file ensures proper module resolution for dynamic imports
// Metro bundler will automatically resolve .native.ts or .web.ts based on platform
// For web platform, we need to explicitly use .web extension
// For native platforms, we use .native extension

// Use conditional exports based on platform
// This approach works better with Metro bundler's platform resolution
let _databaseModule: any = null;

const getDatabaseModule = () => {
  if (_databaseModule) {
    return _databaseModule;
  }

  // Use dynamic import-like approach that works with Metro bundler
  // Metro will automatically resolve the correct file based on platform
  if (typeof window !== 'undefined') {
    // Web platform
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _databaseModule = require('./database.web');
  } else {
    // Native platform (iOS/Android)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _databaseModule = require('./database.native');
  }

  return _databaseModule;
};

const databaseModule = getDatabaseModule();

// Re-export all functions with proper types
export const initDatabase = databaseModule.initDatabase;
export const saveImage = databaseModule.saveImage;
export const addTestResult = databaseModule.addTestResult;
export const getAllTestResults = databaseModule.getAllTestResults;
export const getTestResultById = databaseModule.getTestResultById;
export const updateTestResult = databaseModule.updateTestResult;
export const deleteTestResult = databaseModule.deleteTestResult;
export const getDatabaseStats = databaseModule.getDatabaseStats;

