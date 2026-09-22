import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    // Fetch all ChoreLibrary items
    const allLibraryItems = await base44.asServiceRole.entities.ChoreLibrary.list('-created_date', 500);

    // Clear assigned_to from any items that have it
    let clearedCount = 0;
    for (const item of allLibraryItems) {
      if (item.assigned_to) {
        await base44.asServiceRole.entities.ChoreLibrary.update(item.id, { assigned_to: null });
        clearedCount++;
      }
    }

    return Response.json({ 
      message: `Cleared assignments from ${clearedCount} library items`,
      totalItems: allLibraryItems.length,
      clearedCount 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});