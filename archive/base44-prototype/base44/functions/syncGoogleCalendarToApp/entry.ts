import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection('69e73980123bb49cf43baf96');
      accessToken = conn.accessToken;
    } catch (connErr) {
      return Response.json({ error: 'No active connection found for Google Calendar. Please reconnect in Settings.' }, { status: 200 });
    }

    const timeMin = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const selectedCals = await base44.entities.SelectedCalendars.filter({ is_selected: true });
    if (selectedCals.length === 0) {
      return Response.json({ success: true, message: 'No calendars selected to sync' });
    }

    // Fetch ALL existing schedule items for this user (user-scoped = RLS automatically filters to current user)
    const [existingByType, existingByGoogleEventId] = await Promise.all([
      base44.entities.ScheduleItem.filter({ source_type: 'calendar' }, '-created_date', 3000),
      base44.entities.ScheduleItem.filter({}, '-created_date', 3000),
    ]);

    // Merge into dedup maps
    const existingBySourceId = {};
    const existingByGoogleId = {};

    for (const item of existingByType) {
      if (item.source_id) existingBySourceId[item.source_id] = item;
      if (item.google_event_id) existingByGoogleId[item.google_event_id] = item;
    }
    // Also catch items that have a google_event_id but maybe wrong source_type
    for (const item of existingByGoogleEventId) {
      if (item.google_event_id && !existingByGoogleId[item.google_event_id]) {
        existingByGoogleId[item.google_event_id] = item;
      }
      if (item.source_id && !existingBySourceId[item.source_id]) {
        existingBySourceId[item.source_id] = item;
      }
    }

    let totalCreated = 0;
    let totalUpdated = 0;
    let totalDeleted = 0;

    // Track all Google event IDs returned across all calendars in this sync window
    const activeGoogleEventIds = new Set();
    // Track which calendar IDs were successfully fetched (so we only delete from those)
    const successfullyFetchedCalendarIds = new Set();

    for (const calendar of selectedCals) {
      const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.calendar_id)}/events`);
      url.searchParams.set('maxResults', '250');
      url.searchParams.set('singleEvents', 'true');
      url.searchParams.set('orderBy', 'startTime');
      url.searchParams.set('timeMin', timeMin);
      url.searchParams.set('timeMax', timeMax);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!res.ok) {
        console.log(`Skipping calendar ${calendar.calendar_id}: ${res.status}`);
        if (res.status === 404) {
          await base44.entities.SelectedCalendars.update(calendar.id, { is_selected: false });
        }
        // Do NOT mark as successfully fetched — skip deletion for this calendar
        continue;
      }

      const data = await res.json();
      const events = (data.items || []).filter(e => e.status !== 'cancelled');

      // Mark this calendar as successfully fetched
      successfullyFetchedCalendarIds.add(calendar.calendar_id);

      // Track active event IDs for this calendar
      for (const event of events) {
        if (event.id) activeGoogleEventIds.add(event.id);
      }

      const toCreate = [];
      const toUpdate = [];

      for (const event of events) {
        if (!event.start || !event.summary) continue;

        let startDate, startTime, endTime;
        if (event.start.dateTime) {
          startDate = event.start.dateTime.substring(0, 10);
          startTime = event.start.dateTime.substring(11, 16);
          endTime = (event.end?.dateTime || event.start.dateTime).substring(11, 16);
        } else {
          startDate = event.start.date;
          startTime = '00:00';
          endTime = '23:59';
        }

        const stripHtml = (html) => html ? html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim() : '';

        const itemData = {
          title: event.summary,
          date: startDate,
          start_time: startTime,
          end_time: endTime,
          source_type: 'calendar',
          source_id: event.id,
          google_event_id: event.id,
          google_calendar_id: calendar.calendar_id,
          notes: stripHtml(event.description || ''),
          color: '#3b82f6'
        };

        const existingItem = existingBySourceId[event.id] || existingByGoogleId[event.id];
        if (existingItem && existingItem !== true) {
          // Skip if identical (title, date, start_time, end_time all match)
          const isDuplicate =
            existingItem.title === itemData.title &&
            existingItem.date === itemData.date &&
            existingItem.start_time === itemData.start_time &&
            existingItem.end_time === itemData.end_time;
          if (!isDuplicate) {
            toUpdate.push({ id: existingItem.id, data: itemData });
          }
        } else if (!existingBySourceId[event.id] && !existingByGoogleId[event.id]) {
          toCreate.push(itemData);
          // Mark as seen immediately to prevent duplicates within the same sync run
          existingBySourceId[event.id] = true;
          existingByGoogleId[event.id] = true;
        }
      }

      // Bulk create in batches of 20
      for (let i = 0; i < toCreate.length; i += 20) {
        await base44.entities.ScheduleItem.bulkCreate(toCreate.slice(i, i + 20));
        if (i + 20 < toCreate.length) await sleep(200);
      }
      totalCreated += toCreate.length;

      // Update existing items (limit 20 to avoid timeout)
      for (const item of toUpdate.slice(0, 20)) {
        await base44.entities.ScheduleItem.update(item.id, item.data);
      }
      totalUpdated += Math.min(toUpdate.length, 20);

      await base44.entities.SelectedCalendars.update(calendar.id, { last_synced: new Date().toISOString() });
      await sleep(200);
    }

    // Delete local calendar items only from calendars that were successfully fetched
    // and whose Google events no longer appear in the sync window
    const toDelete = [];
    for (const item of existingByType) {
      if (
        item.google_event_id &&
        item.google_calendar_id &&
        successfullyFetchedCalendarIds.has(item.google_calendar_id) &&
        !activeGoogleEventIds.has(item.google_event_id)
      ) {
        // Only delete if the item's date is within our sync window
        const itemDate = new Date(item.date);
        const windowStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const windowEnd = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
        if (itemDate >= windowStart && itemDate <= windowEnd) {
          toDelete.push(item.id);
        }
      }
    }
    for (const id of toDelete) {
      await base44.entities.ScheduleItem.delete(id);
    }
    totalDeleted += toDelete.length;

    // Update sync state
    const syncData = { last_sync: new Date().toISOString(), source: 'googlecalendar', synced_account_email: user.email };
    const syncStates = await base44.entities.SyncState.list('-updated_date', 1);
    if (syncStates.length > 0) {
      await base44.entities.SyncState.update(syncStates[0].id, syncData);
    } else {
      await base44.entities.SyncState.create(syncData);
    }

    return Response.json({
      success: true,
      message: `Synced: ${totalCreated} created, ${totalUpdated} updated, ${totalDeleted} deleted across ${selectedCals.length} calendar(s)`
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});