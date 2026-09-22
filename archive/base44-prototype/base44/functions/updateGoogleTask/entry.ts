import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, dueDate, dueTime } = await req.json();

    if (!taskId) {
      return Response.json({ error: 'Missing taskId' }, { status: 400 });
    }

    // Get the user's Google Tasks access token
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('69e7399b50555bb55752878a');

    // Build the due datetime for Google Tasks
    let due = null;
    if (dueDate) {
      if (dueTime) {
        due = `${dueDate}T${dueTime}:00`;
      } else {
        due = dueDate;
      }
    }

    const taskUpdate = {
      due: due
    };

    const response = await fetch(`https://www.googleapis.com/tasks/v1/lists/@default/tasks/${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskUpdate)
    });

    if (!response.ok) {
      const error = await response.json();
      return Response.json({ error: `Failed to update Google Task: ${error.error?.message}` }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Google Task updated' });
  } catch (error) {
    console.error('Update Google Task error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});