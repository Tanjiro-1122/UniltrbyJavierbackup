import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image_url } = await req.json();
    if (!image_url) {
      return Response.json({ error: 'image_url is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('REMOVEBG_API_KEY');

    const formData = new FormData();
    formData.append('image_url', image_url);
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: `Remove.bg error: ${err}` }, { status: response.status });
    }

    // Get the PNG as binary and upload it
    const imageBuffer = await response.arrayBuffer();
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    // Upload to base44 storage
    const uploadForm = new FormData();
    uploadForm.append('file', blob, 'nobg.png');

    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file: blob });

    return Response.json({ file_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});