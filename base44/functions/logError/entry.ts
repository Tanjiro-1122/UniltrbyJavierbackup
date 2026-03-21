import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const {
      error_type,
      severity,
      function_name,
      error_message,
      error_stack,
      context,
    } = await req.json();

    // Log to server console for monitoring
    console.error(`[${severity?.toUpperCase() || 'ERROR'}] [${error_type}] ${function_name}: ${error_message}`);

    // Persist to ErrorLog entity
    await base44.asServiceRole.entities.ErrorLog.create({
      error_type: error_type || 'unknown',
      severity: severity || 'error',
      function_name: function_name || 'unknown',
      error_message: error_message || 'No message',
      error_stack: error_stack || '',
      context: context ? JSON.stringify(context) : '',
    });

    return Response.json({ logged: true });
  } catch (error) {
    console.error('logError function itself failed:', error.message);
    return Response.json({ logged: false });
  }
});