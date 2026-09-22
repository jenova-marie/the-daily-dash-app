import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's Google Tasks access token
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection('69e7399b50555bb55752878a');
      accessToken = conn.accessToken;
    } catch (connErr) {
      return Response.json({ error: 'No active connection found for Google Tasks. Please reconnect in Settings.' }, { status: 200 });
    }

    // Load user's preferred category for synced tasks
    const themeResults = await base44.entities.ThemeSettings.list('-updated_date', 1);
    const syncCategory = themeResults[0]?.task_sync_category || 'Google Tasks';
    const syncColor = themeResults[0]?.task_sync_color || '';

    // Fetch tasks from Google Tasks API
    const response = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch Google Tasks lists');
    }

    const lists = await response.json();
    const syncedCount = { created: 0, updated: 0 };

    // Fetch tasks from each list
    for (const list of lists.items || []) {
      const tasksResponse = await fetch(`https://www.googleapis.com/tasks/v1/lists/${list.id}/tasks`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (!tasksResponse.ok) continue;

      const tasks = await tasksResponse.json();

      // Sync each task to the Task entity
      for (const gtask of tasks.items || []) {
        if (gtask.hidden) continue; // Skip completed/hidden tasks

        // Check if task already exists for this user
        const existing = await base44.asServiceRole.entities.Task.filter({ 
          google_task_id: gtask.id,
          created_by: user.email,
        }, '', 1);

        const taskData = {
          title: gtask.title || 'Untitled',
          description: gtask.notes,
          status: gtask.status === 'completed' ? 'completed' : 'pending',
          google_task_id: gtask.id,
          due_date: gtask.due ? gtask.due.split('T')[0] : undefined,
          category: syncCategory,
          category_color: syncColor,
        };

        if (existing.length > 0) {
          await base44.asServiceRole.entities.Task.update(existing[0].id, taskData);
          syncedCount.updated++;
        } else {
          await base44.asServiceRole.entities.Task.create(taskData);
          syncedCount.created++;
        }
      }
    }

    return Response.json({ 
      success: true, 
      message: `Synced ${syncedCount.created} new tasks and updated ${syncedCount.updated} existing tasks`,
      ...syncedCount 
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});