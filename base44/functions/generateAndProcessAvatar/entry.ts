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

    // Step 2: Upload the PNG bytes to base44 storage via multipart form
    const appId = Deno.env.get('BASE44_APP_ID');
    const blob = new Blob([bytes], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', blob, 'avatar.png');

    // Get the user token from the request to upload as user
    const authHeader = req.headers.get('Authorization') || '';
    const uploadRes = await fetch(`https://base44.app/api/apps/${appId}/files/upload`, {
      method: 'POST',
      headers: { 'Authorization': authHeader },
      body: formData,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return Response.json({ error: `upload failed: ${err}` }, { status: 500 });
    }

    const uploadData = await uploadRes.json();
    return Response.json({ file_url: uploadData.file_url || uploadData.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});