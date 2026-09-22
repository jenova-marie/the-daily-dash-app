import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load sync sources from ThemeSettings
    const themeResults = await base44.entities.ThemeSettings.list('-updated_date', 1);
    const syncSources = themeResults.length && themeResults[0].sync_sources
      ? JSON.parse(themeResults[0].sync_sources)
      : ['calendar', 'tasks'];

    const messages = [];

    // --- Sync Google Calendar → App ---
    if (syncSources.includes('calendar')) {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('69e73980123bb49cf43baf96');
        const selectedCals = await base44.entities.SelectedCalendars.filter({ is_selected: true });

        if (selectedCals.length === 0) {
          messages.push('Calendar: no calendars selected');
        } else {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          let allEvents = [];
          const syncTimestamp = new Date().toISOString();
          const validCalendarIds = new Set();

          for (const calendar of selectedCals) {
            let pageToken = null;
            let calendarEvents = [];
            do {
              const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.calendar_id)}/events`);
              url.searchParams.set('maxResults', '250');
              url.searchParams.set('orderBy', 'startTime');
              url.searchParams.set('singleEvents', 'true');
              url.searchParams.set('timeMin', thirtyDaysAgo);
              if (pageToken) url.searchParams.set('pageToken', pageToken);
              const eventsRes = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
              if (!eventsRes.ok) {
                if (eventsRes.status === 404) {
                  await base44.entities.SelectedCalendars.update(calendar.id, { is_selected: false });
                }
                break;
              }
              validCalendarIds.add(calendar.id);
              const data = await eventsRes.json();
              calendarEvents = calendarEvents.concat(data.items || []);
              pageToken = data.nextPageToken || null;
            } while (pageToken);
            allEvents = allEvents.concat(calendarEvents);
            await sleep(300);
          }

          for (const calId of validCalendarIds) {
            await base44.entities.SelectedCalendars.update(calId, { last_synced: syncTimestamp });
            await sleep(200);
          }

          const existingItems = await base44.entities.ScheduleItem.filter({ source_type: 'calendar' }, '', 1000);
          const existingMap = {};
          for (const item of existingItems) {
            if (item.source_id) existingMap[item.source_id] = item;
          }

          let created = 0, updated = 0;
          for (const event of allEvents) {
            if (!event.start || !event.summary) continue;
            let startDateStr, startTimeStr, endTimeStr;
            if (event.start.dateTime) {
              startDateStr = event.start.dateTime.substring(0, 10);
              startTimeStr = event.start.dateTime.substring(11, 16);
              endTimeStr = (event.end?.dateTime || event.start.dateTime).substring(11, 16);
            } else {
              startDateStr = event.start.date;
              startTimeStr = '00:00';
              endTimeStr = '23:59';
            }
            const eventData = { title: event.summary, date: startDateStr, start_time: startTimeStr, end_time: endTimeStr, source_type: 'calendar', source_id: event.id, notes: event.description || '', color: '#3b82f6' };
            if (existingMap[event.id]) {
              await base44.entities.ScheduleItem.update(existingMap[event.id].id, eventData);
              updated++;
            } else {
              await base44.entities.ScheduleItem.create(eventData);
              created++;
            }
            await sleep(200);
          }

          const syncStates = await base44.entities.SyncState.list('-updated_date', 1);
          const syncData = { last_sync: syncTimestamp, source: 'googlecalendar', synced_account_email: user.email };
          if (syncStates.length > 0) {
            await base44.entities.SyncState.update(syncStates[0].id, syncData);
          } else {
            await base44.entities.SyncState.create(syncData);
          }

          messages.push(`Calendar: ${created} new, ${updated} updated from ${selectedCals.length} calendar(s)`);
        }
      } catch (err) {
        messages.push(`Calendar: skipped (${err.message})`);
      }
    }

    // --- Sync Google Tasks → App ---
    if (syncSources.includes('tasks')) {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('69e7399b50555bb55752878a');
        const response = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error('Failed to fetch Google Task lists');

        const lists = await response.json();
        let created = 0, updated = 0;

        for (const list of lists.items || []) {
          const tasksResponse = await fetch(`https://www.googleapis.com/tasks/v1/lists/${list.id}/tasks`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (!tasksResponse.ok) continue;

          const tasks = await tasksResponse.json();
          for (const gtask of tasks.items || []) {
            if (gtask.hidden) continue;
            const existing = await base44.entities.Task.filter({ google_task_id: gtask.id }, '', 1);
            const taskData = { title: gtask.title || 'Untitled', description: gtask.notes, status: gtask.status === 'completed' ? 'completed' : 'pending', google_task_id: gtask.id, due_date: gtask.due ? gtask.due.split('T')[0] : undefined, category: 'Google Tasks' };
            if (existing.length > 0) {
              await base44.entities.Task.update(existing[0].id, taskData);
              updated++;
            } else {
              await base44.entities.Task.create(taskData);
              created++;
            }
          }
        }

        messages.push(`Tasks: ${created} new, ${updated} updated`);
      } catch (err) {
        messages.push(`Tasks: skipped (${err.message})`);
      }
    }

    return Response.json({ success: true, message: messages.join(' | ') || 'Nothing to sync' });
  } catch (error) {
    console.error('Auto-sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});