import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all current user's collage images
    const userImages = await base44.entities.CollageImage.list("-order", 1000);

    if (userImages.length === 0) {
      return Response.json({ error: 'No images found', message: 'Upload images to your collage first' }, { status: 400 });
    }

    // Mark all as defaults for propagation to new users (use service role to bypass RLS)
    const imagesToUpdate = userImages.map(img => ({
      id: img.id,
      is_default: true
    }));

    let updated = 0;
    for (const img of imagesToUpdate) {
      await base44.asServiceRole.entities.CollageImage.update(img.id, { is_default: true });
      updated++;
    }

    return Response.json({ 
      success: true, 
      message: `Marked ${updated} images as defaults for new users`,
      count: updated
    });
  } catch (error) {
    console.error('Error marking images as defaults:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});