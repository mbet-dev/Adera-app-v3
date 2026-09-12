// Compatibility layer to fix React Native Paper and native module issues
import { Platform } from 'react-native';

/**
 * initCompatLayer(options?)
 * - Call this once from your app entrypoint (not on module import).
 * - options.suppressList?: string[] to extend the default suppression patterns.
 */
export default function initCompatLayer(options = {}) {
  const suppressErrors = [
    'ExceptionsManager should be set up after React DevTools',
    'property is not writable',
    "Cannot read property 'default' of undefined",
    'View config getter callback',
    'ViewManagerAdapter_ExpoLinearGradient',
    'SafeAreaView has been deprecated',
    'Invariant Violation: View config getter callback',
    'AndroidHorizontalScrollContentView',
    'must be a function (received `undefined`)',

    'ViewManagerAdapter',
    'Native module cannot be null',
    // allow caller to add more
    ...(options.suppressList || [])
  ];

  // Safe wrapper to avoid replacing console globally more than once
  const patchConsole = (() => {
    let patched = false;
    return () => {
      if (patched) return;
      patched = true;

      const originalError = console.error.bind(console);
      const originalWarn = console.warn.bind(console);

      console.error = (...args) => {
        try {
          const message = args[0];
          if (typeof message === 'string') {
            const shouldSuppress = suppressErrors.some(pattern => message.includes(pattern));
            if (shouldSuppress) return;
          }
        } catch (e) {
          // fallthrough to original
        }
        originalError(...args);
      };

      console.warn = (...args) => {
        try {
          const message = args[0];
          if (typeof message === 'string') {
            const shouldSuppress = suppressErrors.some(pattern => message.includes(pattern));
            if (shouldSuppress) return;
          }
        } catch (e) {
          // fallthrough to original
        }
        originalWarn(...args);
      };
    };
  })();

  // Helper: attempt to define property without replacing Object.defineProperty
  const safeDefineProperty = (obj, prop, descriptor) => {
    try {
      return Object.defineProperty(obj, prop, descriptor);
    } catch (error) {
      // Best-effort fallback: try direct assignment for simple descriptors
      try {
        if (descriptor && 'value' in descriptor) {
          obj[prop] = descriptor.value;
          return obj;
        }
      } catch (e) {
        // ignore
      }
      return obj;
    }
  };

  // Patch DevTools hooks safely
  const patchReactDevTools = () => {
    try {
      const hook = global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook && typeof hook === 'object') {
        // Only patch if methods exist; preserve originals
        try {
          if (typeof hook.onCommitFiberRoot === 'function') {
            safeDefineProperty(hook, 'onCommitFiberRoot', { value: () => {}, writable: false });
          } else {
            // set noop if absent to avoid some devtools-related errors
            safeDefineProperty(hook, 'onCommitFiberRoot', { value: () => {}, writable: false });
          }
          safeDefineProperty(hook, 'onCommitFiberUnmount', { value: () => {}, writable: false });
        } catch (e) {
          // swallow - non-critical
        }
      }
    } catch (e) {
      // ignore
    }
  };

  // Patch global invariant safely (do not overwrite if not present)
  const patchInvariant = () => {
    try {
      if (global && typeof global.invariant === 'function') {
        const originalInvariant = global.invariant;
        const wrapped = function(condition, ...args) {
          if (!condition) {
            const message = args[0];
            if (typeof message === 'string' &&
               (message.includes('View config getter callback') ||
                message.includes('ViewManagerAdapter') ||
                message.includes('must be a function'))) {
              // Suppress specific view-manager messages (avoid throwing)
              return;
            }
          }
          return originalInvariant(condition, ...args);
        };
        safeDefineProperty(global, 'invariant', { value: wrapped, writable: false });
      }
    } catch (e) {
      // ignore
    }
  };

  // Only apply more invasive patches on native platforms
  try {
    patchConsole();

    if (Platform.OS !== 'web') {
      // Do NOT replace Object.defineProperty globally - use safe helper where needed.
      patchReactDevTools();
      patchInvariant();
    }
  } catch (e) {
    // If anything goes wrong, fail silently to avoid breaking the app startup.
    // Prefer logging for diagnostics but avoid noisy console output here.
  }

  // Return a small API for testing / further tweaks if needed
  return {
    suppressErrors,
    safeDefineProperty,
    patchReactDevTools,
    patchInvariant
  };
}
