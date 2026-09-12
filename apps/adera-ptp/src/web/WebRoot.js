import React, { useEffect, useRef } from 'react';
import { AppRegistry, Platform } from 'react-native';
import App from '../../App';

// Aggressive stability control for web platform
const RENDER_THRESHOLD = 100; // ms
const MAX_CONSECUTIVE_RENDERS = 3;

class RenderStabilizer {
  constructor() {
    this.lastRender = Date.now();
    this.consecutiveRenders = 0;
    this.stabilityTimeout = null;
    this.observer = null;
  }

  shouldAllowRender() {
    const now = Date.now();
    const timeSinceLastRender = now - this.lastRender;

    if (timeSinceLastRender < RENDER_THRESHOLD) {
      this.consecutiveRenders++;
      if (this.consecutiveRenders > MAX_CONSECUTIVE_RENDERS) {
        console.log('[RenderStabilizer] Blocking rapid re-render');
        return false;
      }
    } else {
      this.consecutiveRenders = 0;
    }

    this.lastRender = now;
    return true;
  }

  reset() {
    this.consecutiveRenders = 0;
    this.lastRender = Date.now();
  }
}

const WebRoot = () => {
  const stabilizerRef = useRef(new RenderStabilizer());
  const originalRAF = useRef(window.requestAnimationFrame).current;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Override requestAnimationFrame to control render cycles
    window.requestAnimationFrame = (callback) => {
      if (!stabilizerRef.current.shouldAllowRender()) {
        return originalRAF(() => {}); // Empty callback if render blocked
      }
      return originalRAF(callback);
    };

    // Intercept React's internal scheduling
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = (callback, delay, ...args) => {
      if (delay < RENDER_THRESHOLD && typeof callback === 'function') {
        const wrappedCallback = (...callbackArgs) => {
          if (stabilizerRef.current.shouldAllowRender()) {
            callback(...callbackArgs);
          }
        };
        return originalSetTimeout(wrappedCallback, delay, ...args);
      }
      return originalSetTimeout(callback, delay, ...args);
    };

    // Force layout stability
    const style = document.createElement('style');
    style.textContent = `
      * {
        transition: none !important;
        animation: none !important;
      }
    `;
    document.head.appendChild(style);

    // Reset stability controls periodically
    const resetInterval = setInterval(() => {
      stabilizerRef.current.reset();
    }, 5000);

    return () => {
      window.requestAnimationFrame = originalRAF;
      window.setTimeout = originalSetTimeout;
      document.head.removeChild(style);
      clearInterval(resetInterval);
    };
  }, []);

  return <App />;
};

export default WebRoot;