/**
 * Centralized error reporting utility for the Bangers app.
 * Task M6 - Replaces scattered console.error calls with a unified handler.
 */

export const reportError = (error: unknown, context?: Record<string, unknown>) => {
  const err = error instanceof Error ? error : new Error(String(error));
  
  if (__DEV__) {
    console.error(`[${context?.source || 'App'}]`, err.message, context);
  } else {
    // In production, this would send to a service like Sentry or Bugsnag.
    // For now, we'll just log it to the console as a fallback.
    console.error(`[REPORTED ERROR]`, err.message, context);
  }
};
