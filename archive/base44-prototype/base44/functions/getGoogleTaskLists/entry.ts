import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection("69e7399b50555bb55752878a");

    const response = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`Google Tasks API error: ${response.status}`);
    }

    const data = await response.json();
    const taskLists = (data.items || []).map(list => ({
      id: list.id,
      list_name: list.title
    }));

    // Check or create SelectedTaskLists records
    const existing = await base44.entities.SelectedTaskLists.list();
    const existingIds = new Set(existing.map(e => e.list_id));

    for (const list of taskLists) {
      if (!existingIds.has(list.id)) {
        try {
          await base44.entities.SelectedTaskLists.create({
            list_id: list.id,
            list_name: list.list_name,
            is_selected: true
          });
        } catch {}
      }
    }

    // Return with is_selected status
    const withStatus = await Promise.all(
      taskLists.map(async (list) => {
        const record = existing.find(e => e.list_id === list.id) || 
                       (await base44.entities.SelectedTaskLists.list()).find(e => e.list_id === list.id);
        return {
          ...list,
          is_selected: record?.is_selected ?? true
        };
      })
    );

    return Response.json({ taskLists: withStatus });
  } catch (error) {
    console.error('Get task lists error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});