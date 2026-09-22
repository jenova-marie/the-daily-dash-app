import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user already has any collage images
    const userImages = await base44.entities.CollageImage.list("-updated_date", 1);
    
    if (userImages.length > 0) {
      return Response.json({ success: true, created: false, count: userImages.length });
    }

    // Get builder's marked default images (is_default: true) - only fetch what we need
    const defaultImages = await base44.asServiceRole.entities.CollageImage.filter({ is_default: true }, "-order", 100);
    
    if (defaultImages.length === 0) {
      return Response.json({ success: true, created: false, message: 'No default images to initialize' });
    }

    // Copy default images to the new user (not marked as default for them)
    const imagesToCreate = defaultImages.map(img => ({
      image_url: img.image_url,
      title: img.title,
      order: img.order,
      is_default: false
    }));
    
    // Create in batches to avoid rate limit issues
    const batchSize = 10;
    for (let i = 0; i < imagesToCreate.length; i += batchSize) {
      const batch = imagesToCreate.slice(i, i + batchSize);
      await base44.entities.CollageImage.bulkCreate(batch);
      // Small delay between batches
      if (i + batchSize < imagesToCreate.length) {
        await new Promise(r => setTimeout(r, 100));
      }
    }
    
    return Response.json({ success: true, created: true, count: imagesToCreate.length });
  } catch (error) {
    console.error('Error initializing collage images:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});