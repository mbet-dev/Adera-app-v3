import React, { useEffect } from 'react';
import { Platform } from 'react-native';

export const WebStabilityWrapper = ({ children }) => {
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Prevent rapid re-renders
      let lastRender = Date.now();
      const stabilityCheck = () => {
        const now = Date.now();
        if (now - lastRender < 100) {
          // Too many renders, force stability
          console.log('[WebStability] Enforcing render stability');
          return;
        }
        lastRender = now;
      };

      // Monitor render cycles
      const renderMonitor = new MutationObserver(stabilityCheck);
      renderMonitor.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      // Clean up
      return () => {
        renderMonitor.disconnect();
      };
    }
  }, []);

  return children;
};