import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GOOGLE_TASKS_CONNECTOR_ID = "69e7399b50555bb55752878a";
const GOOGLE_CALENDAR_CONNECTOR_ID = "69e73980123bb49cf43baf96";

// Fetch an entity by id and confirm it belongs to the caller (created_by === userEmail).
// Returns the entity if owned, null if not found, or the string "forbidden" if it
// belongs to another user — which the caller must reject with a 403.
async function getOwned(db, entityName, id, userEmail) {
  if (!id) return null;
  let items;
  try {
    items = await db.entities[entityName].filter({ id });
  } catch (_) {
    // Malformed or invalid id — treat as not found (no-op).
    return null;
  }
  const item = items[0];
  if (!item) return null;
  if (item.created_by !== userEmail) return "forbidden";
  return item;
}

const forbidden = () => Response.json({ error: 'Forbidden' }, { status: 403 });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;

    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scheduleItemId, action, sourceType, sourceId, googleEventId, googleCalendarId } = await req.json();
    const isDueTask = scheduleItemId && scheduleItemId.startsWith("due-task-");

    if (action === "keep_in_calendar") {
      if (scheduleItemId && !isDueTask) {
        const owned = await getOwned(db, "ScheduleItem", scheduleItemId, user.email);
        if (owned === "forbidden") return forbidden();
        if (owned) await db.entities.ScheduleItem.update(scheduleItemId, { hidden_from_todo: true });
      }
      return Response.json({ success: true });
    }

    if (action === "library") {
      // Verify ownership before mutating anything
      let taskOwned = null;
      if (sourceId && sourceType === "task") {
        taskOwned = await getOwned(db, "Task", sourceId, user.email);
        if (taskOwned === "forbidden") return forbidden();
      }
      let schedOwned = null;
      if (scheduleItemId && !isDueTask) {
        schedOwned = await getOwned(db, "ScheduleItem", scheduleItemId, user.email);
        if (schedOwned === "forbidden") return forbidden();
      }
      // Clear due_date/time so the task goes back to the library
      if (taskOwned) {
        await db.entities.Task.update(sourceId, { due_date: null, due_time: null, synced_to_schedule: false, schedule_time: null });
      }
      // Delete the schedule item if it's a real one
      if (schedOwned) { try { await db.entities.ScheduleItem.delete(scheduleItemId); } catch (_) {} }
      return Response.json({ success: true });
    }

    // delete_app and delete_google: verify all ownership BEFORE mutating
    if (action === "delete_app" || action === "delete_google") {
      let schedOwned = null;
      if (scheduleItemId && !isDueTask) {
        schedOwned = await getOwned(db, "ScheduleItem", scheduleItemId, user.email);
        if (schedOwned === "forbidden") return forbidden();
      }

      let sourceEntityName = null;
      if (action === "delete_app" && sourceId) {
        if (sourceType === "task") sourceEntityName = "Task";
        else if (sourceType === "chore") sourceEntityName = "Chore";
        else if (sourceType === "education") sourceEntityName = "EducationActivity";
        else if (sourceType === "goal") sourceEntityName = "GoalTask";
      } else if (action === "delete_google" && sourceType === "task" && sourceId) {
        sourceEntityName = "Task";
      }
      let sourceOwned = null;
      if (sourceEntityName && sourceId) {
        sourceOwned = await getOwned(db, sourceEntityName, sourceId, user.email);
        if (sourceOwned === "forbidden") return forbidden();
      }

      // Remove the schedule item first (only if owned by the caller)
      if (schedOwned) { try { await db.entities.ScheduleItem.delete(scheduleItemId); } catch (_) {} }

      if (action === "delete_app") {
        if (sourceOwned) await db.entities[sourceEntityName].delete(sourceId);
        return Response.json({ success: true });
      }

      // action === "delete_google"
      if (sourceType === "task" && sourceOwned) {
        const task = sourceOwned;
        if (task.google_task_id) {
          const { accessToken } = await db.connectors.getCurrentAppUserConnection(GOOGLE_TASKS_CONNECTOR_ID);
          await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${task.google_task_id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });
          await db.entities.Task.delete(sourceId);
        }
      } else if ((sourceType === "calendar" || sourceType === "event") && googleEventId) {
        // Deletion uses the caller's own Google Calendar OAuth token, so it can only
        // affect the caller's own calendar — no cross-user access is possible here.
        const calId = googleCalendarId || "primary";
        const { accessToken } = await db.connectors.getCurrentAppUserConnection(GOOGLE_CALENDAR_CONNECTOR_ID);
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${googleEventId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
      }
      return Response.json({ success: true });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});