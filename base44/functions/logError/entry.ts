import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Deduplicate identical errors within this window (milliseconds).
const DEDUP_WINDOW_MS = 60_000; // 1 minute

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return Response.json({ logged: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const {
      error_type,
      severity,
      function_name,
      error_message,
      error_stack,
      context,
    } = body as {
      error_type?: string;
      severity?: string;
      function_name?: string;
      error_message?: string;
      error_stack?: string;
      context?: unknown;
    };

    // Dedup: skip if the same error was logged within the dedup window.
    const dedupWindowCutoff = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString();
    const existingErrors = await base44.asServiceRole.entities.ErrorLog.filter({
      error_type: error_type || 'unknown',
      function_name: function_name || 'unknown',
    });

    const isDuplicate = Array.isArray(existingErrors) && existingErrors.some(
      (e: Record<string, unknown>) => {
        // Base44 may store the timestamp as `created_at` or `created_date`.
        const ts = (e.created_at || e.created_date) as string | undefined;
        return ts && ts >= dedupWindowCutoff;
      }
    );

    if (isDuplicate) {
      return Response.json({ logged: false, reason: 'deduplicated' });
    }

    // Log to server console for monitoring.
    console.error(`[${(severity as string)?.toUpperCase() || 'ERROR'}] [${error_type}] ${function_name}: ${error_message}`);

    // Persist to ErrorLog entity.
    await base44.asServiceRole.entities.ErrorLog.create({
      error_type: error_type || 'unknown',
      severity: severity || 'error',
      function_name: function_name || 'unknown',
      error_message: error_message || 'No message',
      error_stack: error_stack || '',
      context: context ? JSON.stringify(context) : '',
      created_at: new Date().toISOString(),
    });

    return Response.json({ logged: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('logError function itself failed:', msg);
    return Response.json({ logged: false });
  }
});