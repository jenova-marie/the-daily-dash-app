import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

export async function deduplicate(base44) {
  // Fetch all calendar items in batches
  let all = [];
  for (let page = 0; page < 20; page++) {
    const batch = await base44.entities.ScheduleItem.filter(
      { source_type: 'calendar' },
      '-created_date',
      500
    );
    all = all.concat(batch);
    if (batch.length < 500) break;
  }

  const groups = {};
  for (const item of all) {
    const key = item.google_event_id
      ? `gid:${item.google_event_id}`
      : `manual:${item.title}|${item.date}|${item.start_time}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  const deleteIds = [];
  for (const items of Object.values(groups)) {
    if (items.length <= 1) continue;
    items.sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date));
    items.slice(1).forEach(dupe => deleteIds.push(dupe.id));
  }

  // Delete in parallel batches of 20
  for (let i = 0; i < deleteIds.length; i += 20) {
    await Promise.all(deleteIds.slice(i, i + 20).map(id => base44.entities.ScheduleItem.delete(id).catch(() => {})));
  }

  return { deleted: deleteIds.length, total: all.length };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await deduplicate(base44);

    return Response.json({
      success: true,
      message: `Deleted ${result.deleted} duplicate calendar events out of ${result.total} total.`,
      ...result,
    });
  } catch (error) {
    console.error('Dedup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});