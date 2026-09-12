import { mergeConfig } from 'vite';
import config from './vite.config.js';
// Keep test optimization/HMR state separate from the user's running app.
export default mergeConfig(config, { cacheDir: 'node_modules/.vite-e2e' });
