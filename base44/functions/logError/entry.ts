import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const {
      error_type = 'unknown',
      severity = 'error',
      function_name = 'unknown',
      error_message = '',
      error_stack = '',
      context = {},
    } = body;

    // Log to console for server-side visibility
    console.error(`[${severity.toUpperCase()}] [${error_type}] ${function_name}: ${error_message}`);
    if (error_stack) console.error(error_stack);
    if (Object.keys(context).length > 0) console.error('Context:', JSON.stringify(context));

    return Response.json({ logged: true });
  } catch (error) {
    console.error('logError function failed:', error.message);
    return Response.json({ logged: false, error: error.message }, { status: 500 });
  }
});