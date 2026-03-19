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
    if (error_stack) console.error(error_stack);
    if (context) console.error('Context:', JSON.stringify(context));

    return Response.json({ logged: true });
  } catch (error) {
    // Never fail on logging
    console.error('logError function itself failed:', error.message);
    return Response.json({ logged: false });
  }
});