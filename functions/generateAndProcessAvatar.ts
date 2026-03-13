import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Converts a base64 data URL to a Blob-like Uint8Array + mime type
function dataUrlToBytes(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return { bytes, mime };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { image_url } = await req.json();
    if (!image_url) return Response.json({ error: 'image_url required' }, { status: 400 });

    // Step 1: Remove background
    const removeBgRes = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': Deno.env.get('REMOVEBG_API_KEY'),
      },
      body: (() => {
        const fd = new FormData();
        fd.append('image_url', image_url);
        fd.append('size', 'auto');
        return fd;
      })(),
    });

    if (!removeBgRes.ok) {
      const err = await removeBgRes.text();
      return Response.json({ error: `removebg failed: ${err}` }, { status: 500 });
    }

    const imageBuffer = await removeBgRes.arrayBuffer();
    const bytes = new Uint8Array(imageBuffer);

    // Step 2: Upload to base44 storage
    const blob = new Blob([bytes], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', blob, 'avatar.png');

    const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({ file: blob });
    
    return Response.json({ file_url: uploadRes.file_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});