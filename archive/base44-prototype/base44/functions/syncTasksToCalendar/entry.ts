import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('69e73980123bb49cf43baf96');

    // Fetch the Google account email
    let accountEmail = '';
    try {
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        accountEmail = profile.email || '';
      }
    } catch (err) {
      console.error('Failed to fetch Google account email:', err.message);
    }

    // Fetch all active tasks
    const tasks = await base44.entities.Task.filter({
      status: { $ne: 'completed' }
    }, '-created_date', 100);

    const authHeader = { Authorization: `Bearer ${accessToken}` };
    let syncedCount = 0;

    // Sync each task to Google Calendar
    for (const task of tasks) {
      // Skip tasks without due dates
      if (!task.due_date) continue;

      const eventBody = {
        summary: task.title,
        description: task.description || '',
        start: {
          date: task.due_date
        },
        end: {
          date: task.due_date
        },
        extendedProperties: {
          private: {
            taskId: task.id,
            priority: task.priority || 'medium',
            category: task.category || ''
          }
        }
      };

      if (task.due_time) {
        const [hours, minutes] = task.due_time.split(':');
        const startDateTime = new Date(`${task.due_date}T${task.due_time}:00`);
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 1);

        eventBody.start = { dateTime: startDateTime.toISOString() };
        eventBody.end = { dateTime: endDateTime.toISOString() };
      }

      try {
        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify(eventBody)
        });

        if (res.ok) {
          syncedCount++;
          const event = await res.json();
          
          // Store the Google event ID on the task
          await base44.entities.Task.update(task.id, {
            google_task_id: event.id,
            synced_to_schedule: true,
            schedule_time: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error(`Failed to sync task ${task.id}:`, err.message);
      }
    }

    // Update sync state
    const syncStates = await base44.asServiceRole.entities.SyncState.list();
    if (syncStates.length > 0) {
      await base44.asServiceRole.entities.SyncState.update(syncStates[0].id, {
        last_sync: new Date().toISOString(),
        source: 'tasks',
        synced_account_email: accountEmail
      });
    } else {
      await base44.asServiceRole.entities.SyncState.create({
        last_sync: new Date().toISOString(),
        source: 'tasks',
        synced_account_email: accountEmail
      });
    }

    return Response.json({ 
      success: true, 
      message: `Synced ${syncedCount} tasks to Google Calendar` 
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});