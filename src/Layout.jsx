import React, { Suspense, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
// Import audioUnlock so its auto-attach listeners run at app startup
import '@/components/utils/audioUnlock';

// ─── Full-screen loader ────────────────────────────────────────────────────
const FullScreenLoader = () => (
  <div style={{
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#06020f',
    zIndex: 9999,
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: '3px solid rgba(168,85,247,0.3)',
        borderTopColor: '#a855f7',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto 12px',
      }} />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Loading…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
);

// ─── Main Layout ───────────────────────────────────────────────────────────
export default function Layout({ children }) {

  // ── Fix 1: viewport-fit=cover + safe-area activation ──────────────────
  useEffect(() => {
    const requiredContent =
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    let vp = document.querySelector('meta[name="viewport"]');
    if (vp) {
      if (vp.getAttribute('content') !== requiredContent) {
        vp.setAttribute('content', requiredContent);
      }
    } else {
      vp = document.createElement('meta');
      vp.name = 'viewport';
      vp.content = requiredContent;
      document.head.appendChild(vp);
    }
  }, []);

  // ── Fix 2: One-time native/PWA setup ──────────────────────────────────
  useEffect(() => {
    if (window.__unfiltrInitialized) return;
    window.__unfiltrInitialized = true;

    // Apple PWA meta tags
    const appleMetas = {
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'apple-mobile-web-app-title': 'Unfiltr',
    };
    Object.entries(appleMetas).forEach(([name, content]) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    });

    // Theme color — always dark for Unfiltr
    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      themeColor = document.createElement('meta');
      themeColor.name = 'theme-color';
      document.head.appendChild(themeColor);
    }
    themeColor.content = '#06020f';

    // Manifest
    if (!document.querySelector('link[rel="manifest"]')) {
      const manifest = document.createElement('link');
      manifest.rel = 'manifest';
      manifest.href = '/manifest.json';
      document.head.appendChild(manifest);
    }

    // Fix: background color in Layout matches index.html
    document.body.style.backgroundColor = '#06020f';
    document.documentElement.style.backgroundColor = '#06020f';

    // CSS custom props for safe-area accessible in JS
    document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)');
    document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)');
    document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left)');
    document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right)');

    // Prevent iOS bounce / overscroll on document (allow inside .scroll-area)
    document.addEventListener('touchmove', (e) => {
      if (e.target.closest('.scroll-area')) return;
      e.preventDefault();
    }, { passive: false });

  }, []);

  // ── Fix 3: Global frontend error logging ──────────────────────────────
  useEffect(() => {
    const logFrontendError = async (error, context) => {
      try {
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : new Error(message).stack;
        await base44.functions.invoke('logError', {
          error_type: 'frontend',
          severity: 'error',
          function_name: context.source || 'GlobalErrorHandler',
          error_message: message,
          error_stack: stack,
          context: { ...context, url: window.location.href, userAgent: navigator.userAgent },
        });
      } catch { /* silent — never loop on logging errors */ }
    };

    const onError = (e) => {
      if (e.message?.includes('Script error')) return;
      logFrontendError(e.error || new Error(e.message), { source: 'window.onerror' });
    };
    const onUnhandled = (e) => {
      logFrontendError(e.reason, { source: 'unhandledrejection' });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandled);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandled);
    };
  }, []);

  return (
    <Suspense fallback={<FullScreenLoader />}>
      {/* Tablet/desktop centering — keeps the app phone-width on larger screens */}
      <div style={{
        maxWidth: 480,
        width: '100%',
        height: '100dvh',
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
        background: '#06020f',
      }}>
        {children}
      </div>
    </Suspense>
  );
}
