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

    // Fetch original image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return Response.json({ error: 'Failed to fetch image' }, { status: 400 });
    }
    const imageBuffer = await imageResponse.arrayBuffer();

    // Remove background using remove.bg API
    const formData = new FormData();
    formData.append('image_file', new Blob([imageBuffer], { type: 'image/png' }));
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
      return Response.json({ error: `Remove.bg failed: ${errorText}` }, { status: removeBgResponse.status });
    }

    const processedBuffer = await removeBgResponse.arrayBuffer();
    
    // Return the processed image as base64
    const uint8View = new Uint8Array(processedBuffer);
    let binary = '';
    for (let i = 0; i < uint8View.length; i++) {
      binary += String.fromCharCode(uint8View[i]);
    }
    const base64 = btoa(binary);

    return Response.json({
      success: true,
      companionId,
      mood,
      processedImage: base64,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});