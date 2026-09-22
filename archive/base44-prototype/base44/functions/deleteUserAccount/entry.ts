import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Disconnect all OAuth integrations to revoke access tokens
    const CONNECTOR_IDS = [
      "69e73980123bb49cf43baf96", // GCal2
      "69e7399b50555bb55752878a", // GTasks2
      "69d737c5f7b27024315facdc", // Dropbox
      "69d737a26b81df6409501d64", // Google Docs
      "69d73791470f6b941284c243", // Gmail
      "69d7377e8cef111d099e117b"  // Google Drive
    ];
    
    for (const connectorId of CONNECTOR_IDS) {
      try {
        await base44.asServiceRole.connectors.disconnectAppUser(connectorId);
      } catch (e) {
        // Ignore if not connected
      }
    }

    // Delete all user data
    await base44.asServiceRole.entities.Task.filter({ created_by: user.email }).then(tasks => 
      Promise.all(tasks.map(t => base44.asServiceRole.entities.Task.delete(t.id)))
    );
    await base44.asServiceRole.entities.ScheduleItem.filter({ created_by: user.email }).then(items => 
      Promise.all(items.map(i => base44.asServiceRole.entities.ScheduleItem.delete(i.id)))
    );
    await base44.asServiceRole.entities.DailyChecklist.filter({ created_by: user.email }).then(items => 
      Promise.all(items.map(i => base44.asServiceRole.entities.DailyChecklist.delete(i.id)))
    );
    await base44.asServiceRole.entities.ChecklistCompletion.filter({ created_by: user.email }).then(items => 
      Promise.all(items.map(i => base44.asServiceRole.entities.ChecklistCompletion.delete(i.id)))
    );
    await base44.asServiceRole.entities.Goal.filter({ created_by: user.email }).then(goals => 
      Promise.all(goals.map(g => base44.asServiceRole.entities.Goal.delete(g.id)))
    );
    await base44.asServiceRole.entities.GoalTask.filter({ created_by: user.email }).then(items => 
      Promise.all(items.map(i => base44.asServiceRole.entities.GoalTask.delete(i.id)))
    );
    await base44.asServiceRole.entities.Chore.filter({ created_by: user.email }).then(chores => 
      Promise.all(chores.map(c => base44.asServiceRole.entities.Chore.delete(c.id)))
    );
    await base44.asServiceRole.entities.ChoreUser.filter({ created_by: user.email }).then(users => 
      Promise.all(users.map(u => base44.asServiceRole.entities.ChoreUser.delete(u.id)))
    );
    await base44.asServiceRole.entities.EducationPlan.filter({ created_by: user.email }).then(plans => 
      Promise.all(plans.map(p => base44.asServiceRole.entities.EducationPlan.delete(p.id)))
    );
    await base44.asServiceRole.entities.EducationActivity.filter({ created_by: user.email }).then(activities => 
      Promise.all(activities.map(a => base44.asServiceRole.entities.EducationActivity.delete(a.id)))
    );
    await base44.asServiceRole.entities.Learner.filter({ created_by: user.email }).then(learners => 
      Promise.all(learners.map(l => base44.asServiceRole.entities.Learner.delete(l.id)))
    );
    await base44.asServiceRole.entities.DailyQuote.filter({ created_by: user.email }).then(quotes => 
      Promise.all(quotes.map(q => base44.asServiceRole.entities.DailyQuote.delete(q.id)))
    );
    await base44.asServiceRole.entities.Link.filter({ created_by: user.email }).then(links => 
      Promise.all(links.map(l => base44.asServiceRole.entities.Link.delete(l.id)))
    );
    await base44.asServiceRole.entities.ThemeSettings.filter({ created_by: user.email }).then(settings => 
      Promise.all(settings.map(s => base44.asServiceRole.entities.ThemeSettings.delete(s.id)))
    );
    await base44.asServiceRole.entities.SelectedCalendars.filter({ created_by: user.email }).then(cals => 
      Promise.all(cals.map(c => base44.asServiceRole.entities.SelectedCalendars.delete(c.id)))
    );
    await base44.asServiceRole.entities.SyncState.filter({ created_by: user.email }).then(states => 
      Promise.all(states.map(s => base44.asServiceRole.entities.SyncState.delete(s.id)))
    );

    // Delete the user account using the service role
    await base44.asServiceRole.auth.deleteUser(user.id);

    return Response.json({ success: true, message: 'Account and all data deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});