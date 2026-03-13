import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const { imageUrl, companionId, mood } = await req.json();
    
    if (!imageUrl || !companionId || !mood) {
      return Response.json({ error: 'Missing imageUrl, companionId, or mood' }, { status: 400 });
    }

    const apiKey = Deno.env.get('REMOVEBG_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'REMOVEBG_API_KEY not set' }, { status: 500 });
    }

    // Fetch image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return Response.json({ error: 'Failed to fetch image' }, { status: 400 });
    }
    const imageBuffer = await imageResponse.arrayBuffer();

    // Remove background using remove.bg API
    const formData = new FormData();
    formData.append('image_file', new Blob([imageBuffer]));
    formData.append('format', 'png');

    const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: formData,
    });

    if (!removeBgResponse.ok) {
      const errorText = await removeBgResponse.text();
      return Response.json({ error: `Remove.bg API error: ${errorText}` }, { status: removeBgResponse.status });
    }

    const processedBuffer = await removeBgResponse.arrayBuffer();
    const processedBlob = new Blob([processedBuffer], { type: 'image/png' });

    // Upload to base44
    const base44 = createClientFromRequest(req);
    const uploadResponse = await base44.integrations.Core.UploadFile({
      file: processedBlob,
    });

    return Response.json({
      success: true,
      companionId,
      mood,
      newUrl: uploadResponse.file_url,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});