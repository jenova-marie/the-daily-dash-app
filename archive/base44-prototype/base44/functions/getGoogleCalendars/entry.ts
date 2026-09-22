import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('69e73980123bb49cf43baf96');

    const calendarsRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!calendarsRes.ok) {
      throw new Error(`Google Calendar API error: ${calendarsRes.status}`);
    }

    const calendarData = await calendarsRes.json();
    const googleCalendars = calendarData.items || [];

    // Get existing saved calendars for this user
    const existingCals = await base44.entities.SelectedCalendars.filter({ created_by: user.email });
    const existingMap = {};
    for (const c of existingCals) {
      existingMap[c.calendar_id] = c;
    }

    // Upsert: create new ones, leave existing ones alone
    for (const cal of googleCalendars) {
      if (!existingMap[cal.id]) {
        const created = await base44.entities.SelectedCalendars.create({
          calendar_id: cal.id,
          calendar_name: cal.summary,
          is_selected: cal.primary || false
        });
        existingMap[cal.id] = created;
      }
    }

    // Return merged list: all Google calendars with their saved selection state
    const merged = googleCalendars.map(cal => {
      const saved = existingMap[cal.id];
      return {
        id: saved ? saved.id : null,
        calendar_id: cal.id,
        calendar_name: cal.summary,
        is_selected: saved ? saved.is_selected : (cal.primary || false),
        last_synced: saved ? saved.last_synced : null
      };
    });

    return Response.json({ success: true, calendars: merged });
  } catch (error) {
    console.error('Error fetching calendars:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});