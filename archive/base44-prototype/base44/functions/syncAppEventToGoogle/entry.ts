import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { event, eventAction } = body.args ?? body;

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!event || !eventAction) {
      return Response.json({ error: 'Missing event or eventAction' }, { status: 400 });
    }


    // Get the Google Calendar connector (app user)
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('69e73980123bb49cf43baf96');

    // Determine which calendar to use (primary calendar)
    const calendarId = event.google_calendar_id || 'primary';

    if (eventAction === 'create') {
      // Create event in Google Calendar
      const startDateTime = new Date(`${event.date}T${event.start_time}:00`).toISOString();
      const endDateTime = new Date(`${event.date}T${event.end_time || '23:59'}:00`).toISOString();

      const googleEvent = {
        summary: event.title,
        description: event.notes || '',
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime },
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return Response.json({ error: `Failed to create event: ${error.error.message}` }, { status: 500 });
      }

      const createdEvent = await response.json();

      // Update the ScheduleItem with the google_event_id
      await base44.entities.ScheduleItem.update(event.id, {
        google_event_id: createdEvent.id,
        google_calendar_id: calendarId,
      });

      return Response.json({ success: true, message: 'Event created in Google Calendar', googleEventId: createdEvent.id });
    } else if (eventAction === 'update') {
      // Update event in Google Calendar
      if (!event.google_event_id) {
        return Response.json({ error: 'Event does not have a google_event_id' }, { status: 400 });
      }

      const startDateTime = new Date(`${event.date}T${event.start_time}:00`).toISOString();
      const endDateTime = new Date(`${event.date}T${event.end_time || '23:59'}:00`).toISOString();

      const googleEvent = {
        summary: event.title,
        description: event.notes || '',
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime },
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(event.google_event_id)}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return Response.json({ error: `Failed to update event: ${error.error.message}` }, { status: 500 });
      }

      return Response.json({ success: true, message: 'Event updated in Google Calendar' });
    } else if (eventAction === 'delete') {
      // Delete event from Google Calendar
      if (!event.google_event_id) {
        return Response.json({ error: 'Event does not have a google_event_id' }, { status: 400 });
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(event.google_event_id)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok && response.status !== 404 && response.status !== 204) {
        const errorText = await response.text().catch(() => '');
        let message = errorText;
        try { message = JSON.parse(errorText)?.error?.message || errorText; } catch {}
        return Response.json({ error: `Failed to delete event: ${message}` }, { status: 500 });
      }

      return Response.json({ success: true, message: 'Event deleted from Google Calendar' });
    }

    return Response.json({ error: 'Invalid eventAction' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});