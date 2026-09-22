import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Delete sequentially in batches to avoid rate limits
async function deleteAllOfEntity(entity) {
  let deleted = 0;
  for (let i = 0; i < 200; i++) {
    const items = await entity.list('-created_date', 50);
    if (!items || items.length === 0) break;
    for (const item of items) {
      await entity.delete(item.id).catch(() => {});
      deleted++;
      await sleep(50);
    }
    if (items.length < 50) break;
    await sleep(200);
  }
  return deleted;
}

async function deleteFilteredTasks(entity) {
  let deleted = 0;
  for (let i = 0; i < 200; i++) {
    const items = await entity.filter({ google_task_id: { $exists: true } }, '-created_date', 50);
    if (!items || items.length === 0) break;
    for (const item of items) {
      await entity.delete(item.id).catch(() => {});
      deleted++;
      await sleep(50);
    }
    if (items.length < 50) break;
    await sleep(200);
  }
  return deleted;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const deleteAllAppData = body.deleteAllAppData === true;

    const ue = base44.entities;

    if (deleteAllAppData) {
      const allEntities = [
        'ScheduleItem', 'SelectedCalendars', 'SyncState', 'Task',
        'DeletedSyncItem', 'SelectedTaskLists',
        'Chore', 'ChoreUser', 'Goal', 'GoalTask',
        'DailyChecklist', 'ChecklistCompletion',
        'EducationPlan', 'EducationActivity', 'Learner',
        'DailyQuote', 'Link',
        'DailyPillarTracking', 'PillarActivity', 'Affirmation',
        'HealthPillar', 'ReminderSettings', 'DailyGratitude', 'ThemeSettings',
        'CollageImage',
      ];
      for (const name of allEntities) {
        await deleteAllOfEntity(ue[name]);
        await sleep(300);
      }
      return Response.json({ message: 'All app data deleted' });
    }

    // Synced data only — sequential to avoid rate limits
    const deletedScheduleItems = await deleteAllOfEntity(ue.ScheduleItem);
    await sleep(300);
    const deletedSelectedCalendars = await deleteAllOfEntity(ue.SelectedCalendars);
    await sleep(300);
    const deletedSyncStates = await deleteAllOfEntity(ue.SyncState);
    await sleep(300);
    const deletedTasks = await deleteFilteredTasks(ue.Task);

    return Response.json({
      message: 'All synced data has been deleted',
      deletedScheduleItems,
      deletedSelectedCalendars,
      deletedSyncStates,
      deletedTasks,
    });
  } catch (error) {
    console.error('Delete error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});