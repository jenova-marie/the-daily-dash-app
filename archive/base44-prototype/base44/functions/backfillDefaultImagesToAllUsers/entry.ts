import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all images marked as default
    const allImages = await base44.asServiceRole.entities.CollageImage.list("-order", 10000);
    const defaultImages = allImages.filter(img => img.is_default === true);

    if (defaultImages.length === 0) {
      return Response.json({ error: `No default images found. Total images: ${allImages.length}` }, { status: 400 });
    }

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list("-created_date", 10000);

    let totalProcessed = 0;
    let totalCreated = 0;

    for (const targetUser of allUsers) {
      try {
        // Get user's current collage images
        const userImages = await base44.asServiceRole.entities.CollageImage.filter({ created_by: targetUser.email }, "", 1000);
        const existingUrls = new Set(userImages.map(img => img.image_url));

        // Add missing default images for this user
        const imagesToCreate = defaultImages
          .filter(img => !existingUrls.has(img.image_url))
          .map(img => ({
            image_url: img.image_url,
            title: img.title,
            order: img.order || 0,
            is_default: false
          }));

        if (imagesToCreate.length > 0) {
          // Create images for this user via service role
          await base44.asServiceRole.entities.CollageImage.bulkCreate(
            imagesToCreate.map(img => ({ ...img, created_by: targetUser.email }))
          );
          totalCreated += imagesToCreate.length;
        }
        totalProcessed++;
      } catch (error) {
        console.error(`Error processing user ${targetUser.email}:`, error);
      }
    }

    return Response.json({
      success: true,
      message: `Backfilled default images to all users`,
      usersProcessed: totalProcessed,
      imagesCreated: totalCreated
    });
  } catch (error) {
    console.error('Error backfilling images:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});