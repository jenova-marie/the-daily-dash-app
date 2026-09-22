import { useState, useEffect, useCallback } from "react";
import { useHeader } from "@/lib/HeaderContext";
import { base44 } from "@/api/base44Client";
import WidgetCard from "../components/WidgetCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, X, AlertCircle, Plus, Trash2, KeyRound, RotateCcw, Unplug } from "lucide-react";
import LabelPicker from "../components/LabelPicker";
import { saveLabelToHistory } from "../utils/labelHistory";
import ModernTimePicker from "../components/ModernTimePicker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CONNECTORS = [
  { id: "69e73980123bb49cf43baf96", name: "Google Calendar", type: "googlecalendar", icon: "📅", description: "Sync events to your daily schedule" },
  { id: "69e7399b50555bb55752878a", name: "Google Tasks", type: "googletasks", icon: "✓", description: "Sync tasks to your task manager" },
];

const GOOGLE_CALENDAR_ID = "69e73980123bb49cf43baf96";

function PasswordResetSection({ email }) {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async (e) => {
    e.preventDefault();
    setError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await base44.auth.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => { setOpen(false); setSuccess(false); }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to change password. Check your current password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Button variant="outline" onClick={() => { setOpen(true); setError(''); setSuccess(false); }} className="gap-2 w-full">
        <KeyRound className="w-4 h-4" />
        Change Password
      </Button>

      {open && (
        <form onSubmit={handleChange} className="mt-4 space-y-3 p-4 rounded-lg border border-border bg-muted/30">
          {error && <p className="text-xs text-destructive">{error}</p>}
          {success && <p className="text-xs text-green-500">✓ Password changed successfully!</p>}
          <div>
            <Label className="text-xs mb-1 block">Current Password</Label>
            <Input type="password" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} disabled={saving} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">New Password</Label>
            <Input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={saving} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Confirm New Password</Label>
            <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={saving} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {saving ? 'Saving...' : 'Save Password'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={saving} className="bg-secondary/500">
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function Settings() {
  const { setTitle } = useHeader();
  useEffect(() => { setTitle("Settings"); return () => setTitle(""); }, []);
  const [user, setUser] = useState(null);
  const [connectorStatus, setConnectorStatus] = useState({});
  const [connecting, setConnecting] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncState, setSyncState] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [loadingCals, setLoadingCals] = useState(false);
  const [taskLists, setTaskLists] = useState([]);
  const [loadingTaskLists, setLoadingTaskLists] = useState(false);
  const [autoSyncCalendarIds, setAutoSyncCalendarIds] = useState([]);
  const [autoSyncCalendars, setAutoSyncCalendars] = useState([]);
  const [loadingAutoSyncCals, setLoadingAutoSyncCals] = useState(false);
  const [themeSettings, setThemeSettings] = useState(null);
  const [dashboardHeader, setDashboardHeader] = useState("");
  const [savingHeader, setSavingHeader] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteSyncedDialog, setShowDeleteSyncedDialog] = useState(false);
  const [deletingSyncedData, setDeletingSyncedData] = useState(false);
  const [deleteAllAppData, setDeleteAllAppData] = useState(false);
  const [syncTimes, setSyncTimes] = useState([]);
  const [syncSources, setSyncSources] = useState(["calendar", "tasks"]);
  const [newSyncTime, setNewSyncTime] = useState("09:00");
  const [loadingSyncTimes, setLoadingSyncTimes] = useState(false);
  const [savingSyncTimes, setSavingSyncTimes] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [enabledFeatures, setEnabledFeatures] = useState({ vision_board: true, education: true, chores: true });
  const [savingFeatures, setSavingFeatures] = useState(false);
  const [taskDefaultCollapsed, setTaskDefaultCollapsed] = useState(() => {
    try { return localStorage.getItem("tasks_default_collapsed") !== "0"; } catch { return true; }
  });

  const [savingDashboard, setSavingDashboard] = useState(false);
  const [dashboardSaved, setDashboardSaved] = useState(false);
  const [justConnected, setJustConnected] = useState(null); // 'calendar' | 'tasks' | null
  const [confirmDisconnect, setConfirmDisconnect] = useState(null); // connector object or null
  const [trashItems, setTrashItems] = useState([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [permanentlyDeletingId, setPermanentlyDeletingId] = useState(null);

  const checkConnectorStatus = useCallback(async () => {
    setCheckingStatus(true);
    const statuses = {};
    await Promise.all(CONNECTORS.map(async (connector) => {
      try {
        const res = await base44.functions.invoke('checkConnectorStatus', { connectorId: connector.id });
        statuses[connector.id] = res.data?.connected === true;
      } catch {
        statuses[connector.id] = false;
      }
    }));
    setConnectorStatus(statuses);
    setCheckingStatus(false);
  }, []);

  useEffect(() => {
    loadUser();
    loadSyncState();
    loadThemeSettings();
    checkConnectorStatus();
    loadTrash();
    loadSavedCalendars();
    loadSavedTaskLists();
  }, []);

  const loadTrash = async () => {
    try {
      setLoadingTrash(true);
      const items = await base44.entities.TrashBin.filter({}, "-deleted_at", 50);
      const now = new Date();
      // Filter for items deleted in last 24 hours
      const recentItems = items.filter(item => {
        const deletedAt = new Date(item.deleted_at);
        const hoursDiff = (now - deletedAt) / (1000 * 60 * 60);
        return hoursDiff <= 24;
      });
      setTrashItems(recentItems);
    } catch (error) {
      console.error('Failed to load trash:', error);
    } finally {
      setLoadingTrash(false);
    }
  };

  const restoreItem = async (trashItem) => {
    try {
      setRestoringId(trashItem.id);
      const itemData = JSON.parse(trashItem.item_data);
      if (trashItem.item_type === 'task') {
        // Restore without ID so it creates a new record
        const { id, ...taskDataWithoutId } = itemData;
        await base44.entities.Task.create(taskDataWithoutId);
      }
      // Remove from trash
      await base44.entities.TrashBin.delete(trashItem.id);
      await loadTrash();
    } catch (error) {
      console.error('Failed to restore item:', error);
    } finally {
      setRestoringId(null);
    }
  };

  const permanentlyDelete = async (trashItem) => {
    try {
      setPermanentlyDeletingId(trashItem.id);
      await base44.entities.TrashBin.delete(trashItem.id);
      await loadTrash();
    } catch (error) {
      console.error('Failed to permanently delete item:', error);
    } finally {
      setPermanentlyDeletingId(null);
    }
  };



  const saveSyncTimes = async (updatedTimes, updatedSources) => {
    const timesToSave = updatedTimes ?? syncTimes;
    const sourcesToSave = updatedSources ?? syncSources;
    try {
      setSavingSyncTimes(true);
      const payload = { sync_times: JSON.stringify(timesToSave), sync_sources: JSON.stringify(sourcesToSave) };
      if (themeSettings?.id) {
        await base44.entities.ThemeSettings.update(themeSettings.id, payload);
        setThemeSettings({ ...themeSettings, ...payload });
      } else {
        const newSettings = await base44.entities.ThemeSettings.create(payload);
        setThemeSettings(newSettings);
      }
    } catch (error) {
      console.error('Failed to save sync times:', error);
    } finally {
      setSavingSyncTimes(false);
    }
  };

  const toggleSyncSource = async (source) => {
    const updated = syncSources.includes(source)
      ? syncSources.filter(s => s !== source)
      : [...syncSources, source];
    setSyncSources(updated);
    await saveSyncTimes(syncTimes, updated);
  };

  const addSyncTime = async () => {
    if (!syncTimes.includes(newSyncTime)) {
      const updated = [...syncTimes, newSyncTime].sort();
      setSyncTimes(updated);
      await saveSyncTimes(updated);
    }
  };

  const removeSyncTime = async (time) => {
    const updated = syncTimes.filter(t => t !== time);
    setSyncTimes(updated);
    await saveSyncTimes(updated);
  };

  const loadThemeSettings = async () => {
    try {
      const results = await base44.entities.ThemeSettings.list("-updated_date", 1);
      if (results.length) {
        const settings = results[0];
        console.log('Loaded settings:', settings);
        setThemeSettings(settings);
        setDashboardHeader(settings.dashboard_header || "");
        const features = {
          vision_board: settings.enable_vision_board ?? true,
          education: settings.enable_education ?? true,
          chores: settings.enable_chores ?? true,
        };
        console.log('Features loaded:', features);
        setEnabledFeatures(features);
        if (settings.sync_times) setSyncTimes(JSON.parse(settings.sync_times || "[]"));
        if (settings.sync_sources) setSyncSources(JSON.parse(settings.sync_sources || '["calendar","tasks"]'));
        if (settings.auto_sync_calendar_ids) setAutoSyncCalendarIds(JSON.parse(settings.auto_sync_calendar_ids || "[]"));
      }
    } catch (error) {
      console.error('Failed to load theme settings:', error);
    }
  };

  const loadSavedCalendars = async () => {
    try {
      const saved = await base44.entities.SelectedCalendars.filter({});
      if (saved.length > 0) {
        const mapped = saved.map(c => ({
          id: c.id,
          calendar_id: c.calendar_id,
          calendar_name: c.calendar_name,
          is_selected: c.is_selected,
          last_synced: c.last_synced
        }));
        setCalendars(mapped);
        // Also populate auto-sync calendars from saved data
        setAutoSyncCalendars(mapped);
      }
    } catch (e) {
      console.error('Failed to load saved calendars:', e);
    }
  };

  const loadSavedTaskLists = async () => {
    try {
      const saved = await base44.entities.SelectedTaskLists.filter({});
      if (saved.length > 0) {
        const mapped = saved.map(l => ({
          id: l.list_id,
          list_name: l.list_name,
          is_selected: l.is_selected,
          _entityId: l.id
        }));
        setTaskLists(mapped);
      }
    } catch (e) {
      console.error('Failed to load saved task lists:', e);
    }
  };

  const saveHeaderDisplay = async () => {
    try {
      setSavingHeader(true);
      if (themeSettings?.id) {
        await base44.entities.ThemeSettings.update(themeSettings.id, { dashboard_header: dashboardHeader || null });
        setThemeSettings({ ...themeSettings, dashboard_header: dashboardHeader });
      } else {
        const newSettings = await base44.entities.ThemeSettings.create({ dashboard_header: dashboardHeader || null });
        setThemeSettings(newSettings);
      }
    } catch (error) {
      console.error('Failed to save header display:', error);
    } finally {
      setSavingHeader(false);
    }
  };

  const loadUser = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadSyncState = async () => {
    try {
      const states = await base44.entities.SyncState.list("-updated_date", 1);
      if (states.length > 0) {
        setSyncState(states[0]);
      }
    } catch (error) {
      console.error('Failed to load sync state:', error);
    }
  };

  const handleConnect = async (connectorId, connectorType) => {
    try {
      setConnecting(connectorId);
      const url = await base44.connectors.connectAppUser(connectorId);
      const popup = window.open(url, "_blank", "width=500,height=700");
      
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Popup was blocked — redirect in same tab
        window.location.href = url;
        return;
      }

      // Poll for popup close, then retry status check until connected (up to ~15s)
      const timer = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          // Retry checking status up to 10 times with 1.5s delay between attempts
          let connected = false;
          for (let attempt = 0; attempt < 10; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const statuses = {};
            await Promise.all(CONNECTORS.map(async (c) => {
              try {
                const res = await base44.functions.invoke('checkConnectorStatus', { connectorId: c.id });
                statuses[c.id] = res.data?.connected === true;
              } catch {
                statuses[c.id] = false;
              }
            }));
            setConnectorStatus(statuses);
            if (statuses[connectorId]) { connected = true; break; }
          }
          await loadSyncState();
          setConnecting(null);
          if (connected) {
            if (connectorType === 'googlecalendar') setJustConnected('calendar');
            else if (connectorType === 'googletasks') setJustConnected('tasks');
          }
        }
      }, 500);
    } catch (error) {
      console.error("Connect error:", error);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (connectorId) => {
    try {
      await base44.connectors.disconnectAppUser(connectorId);
      setConnectorStatus((prev) => ({ ...prev, [connectorId]: false }));
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  const handleSyncGoogleCalendar = async () => {
    try {
      setSyncing(true);
      setSyncMessage('');
      const response = await base44.functions.invoke('syncGoogleCalendarToApp', {});
      if (response.data?.error) {
        const msg = response.data.error;
        if (msg.includes('No active connection') || msg.includes('connection')) {
          setSyncMessage('✗ Google Calendar is disconnected. Please reconnect it above.');
          setConnectorStatus(prev => ({ ...prev, [GOOGLE_CALENDAR_ID]: false }));
        } else {
          setSyncMessage(`✗ Sync failed: ${msg}`);
        }
      } else {
        setSyncMessage(`✓ ${response.data.message}`);
        setTimeout(() => setSyncMessage(''), 4000);
        await handleFetchCalendars();
      }
    } catch (error) {
      const msg = error.message || '';
      if (msg.includes('No active connection') || msg.includes('not found') || msg.includes('connection')) {
        setSyncMessage('✗ Google Calendar is disconnected. Please reconnect it above.');
        setConnectorStatus(prev => ({ ...prev, [GOOGLE_CALENDAR_ID]: false }));
      } else {
        setSyncMessage(`✗ Sync failed: ${msg}`);
      }
    } finally {
      setSyncing(false);
      setShowSyncDialog(false);
    }
  };

  const handleSyncGoogleTasks = async () => {
    const GTASKS_ID = "69e7399b50555bb55752878a";
    try {
      setSyncing(true);
      setSyncMessage('');
      const response = await base44.functions.invoke('syncGoogleTasks', {});
      if (response.data?.error) {
        const msg = response.data.error;
        if (msg.includes('No active connection') || msg.includes('connection')) {
          setSyncMessage('✗ Google Tasks is disconnected. Please reconnect it above.');
          setConnectorStatus(prev => ({ ...prev, [GTASKS_ID]: false }));
        } else {
          setSyncMessage(`✗ Tasks sync failed: ${msg}`);
        }
      } else {
        setSyncMessage(`✓ ${response.data.message}`);
        setTimeout(() => setSyncMessage(''), 4000);
      }
    } catch (error) {
      const msg = error.message || '';
      if (msg.includes('No active connection') || msg.includes('not found') || msg.includes('connection')) {
        setSyncMessage('✗ Google Tasks is disconnected. Please reconnect it above.');
        setConnectorStatus(prev => ({ ...prev, [GTASKS_ID]: false }));
      } else {
        setSyncMessage(`✗ Tasks sync failed: ${msg}`);
      }
    } finally {
      setSyncing(false);
      setShowSyncDialog(false);
    }
  };

  const handleFetchCalendars = async () => {
    try {
      setLoadingCals(true);
      const response = await base44.functions.invoke('getGoogleCalendars', {});
      setCalendars(response.data.calendars || []);
    } catch (error) {
      setSyncMessage(`✗ Failed to fetch calendars: ${error.message}`);
    } finally {
      setLoadingCals(false);
    }
  };

  const handleFetchAutoSyncCalendars = async () => {
    try {
      setLoadingAutoSyncCals(true);
      const response = await base44.functions.invoke('getGoogleCalendars', {});
      setAutoSyncCalendars(response.data.calendars || []);
    } catch (error) {
      setSyncMessage(`✗ Failed to fetch calendars: ${error.message}`);
    } finally {
      setLoadingAutoSyncCals(false);
    }
  };

  const handleToggleAutoSyncCalendar = async (calId) => {
    const updated = autoSyncCalendarIds.includes(calId)
      ? autoSyncCalendarIds.filter(id => id !== calId)
      : [...autoSyncCalendarIds, calId];
    setAutoSyncCalendarIds(updated);
    const payload = { auto_sync_calendar_ids: JSON.stringify(updated) };
    if (themeSettings?.id) {
      await base44.entities.ThemeSettings.update(themeSettings.id, payload);
      setThemeSettings({ ...themeSettings, ...payload });
    } else {
      const newSettings = await base44.entities.ThemeSettings.create(payload);
      setThemeSettings(newSettings);
    }
  };

  const handleFetchTaskLists = async () => {
    try {
      setLoadingTaskLists(true);
      const response = await base44.functions.invoke('getGoogleTaskLists', {});
      // Re-load from DB so we have entity IDs for toggling
      await loadSavedTaskLists();
    } catch (error) {
      setSyncMessage(`✗ Failed to fetch task lists: ${error.message}`);
    } finally {
      setLoadingTaskLists(false);
    }
  };

  const handleToggleCalendar = async (calId, isSelected) => {
    const cal = calendars.find(c => c.id === calId);
    if (cal && cal.id) {
      await base44.entities.SelectedCalendars.update(cal.id, { is_selected: !isSelected });
      setCalendars(calendars.map(c => c.id === calId ? { ...c, is_selected: !isSelected } : c));
    }
  };

  const handleToggleTaskList = async (listId, isSelected) => {
    const list = taskLists.find(l => l.id === listId);
    if (list) {
      const entityId = list._entityId || list.id;
      await base44.entities.SelectedTaskLists.update(entityId, { is_selected: !isSelected });
      setTaskLists(taskLists.map(l => l.id === listId ? { ...l, is_selected: !isSelected } : l));
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      await base44.functions.invoke('deleteUserAccount', {});
      // Clear session and force hard redirect so user cannot return without new credentials
      await base44.auth.logout();
      window.location.replace('/auth');
    } catch (error) {
      console.error('Delete account error:', error);
      alert('Failed to delete account: ' + error.message);
      setDeletingAccount(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteSyncedData = async () => {
    try {
      setDeletingSyncedData(true);
      setSyncMessage('Deleting data... this may take a few minutes');
      await base44.functions.invoke('deleteSyncedData', { deleteAllAppData });

      // Disconnect all integrations so data doesn't re-sync automatically
      for (const connector of CONNECTORS) {
        if (connectorStatus[connector.id]) {
          try {
            await base44.connectors.disconnectAppUser(connector.id);
          } catch {}
        }
      }

      setSyncMessage(deleteAllAppData ? '✓ All app data deleted & integrations disconnected' : '✓ Synced data deleted & integrations disconnected');
      setTimeout(() => {
        setSyncMessage('');
        setShowDeleteSyncedDialog(false);
        setDeletingSyncedData(false);
        setDeleteAllAppData(false);
      }, 2000);
      await checkConnectorStatus();
      await loadSyncState();
    } catch (error) {
      console.error('Delete synced data error:', error);
      setSyncMessage(`✗ Failed to delete data: ${error.message}`);
      setTimeout(() => {
        setShowDeleteSyncedDialog(false);
        setDeletingSyncedData(false);
        setDeleteAllAppData(false);
      }, 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Account Info */}
      <WidgetCard title="Account" id="account-settings" style={{ backgroundColor: 'hsl(var(--muted) / 0.9)' }}>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="text-sm font-medium">{user?.full_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Role</p>
            <p className="text-sm font-medium capitalize">{user?.role}</p>
          </div>
          <div className="border-t border-border pt-4 space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">Change Password</p>
              <p className="text-xs text-muted-foreground mb-3">We'll send a password reset link to your email address.</p>
              <PasswordResetSection email={user?.email} />
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
              className="w-full gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Delete Account
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Permanently delete your account and all associated data. This action cannot be undone.</p>
          </div>
        </div>
      </WidgetCard>

      {/* Dashboard Settings */}
      <WidgetCard title="Dashboard" id="dashboard-settings" style={{ backgroundColor: 'hsl(var(--muted) / 0.9)' }}>
        <div className="relative">
          <Button 
            onClick={async () => {
              setSavingDashboard(true);
              setDashboardSaved(false);
              try {
                const payload = { 
                  dashboard_header: dashboardHeader || null,
                  enable_vision_board: enabledFeatures.vision_board,
                  enable_education: enabledFeatures.education,
                  enable_chores: enabledFeatures.chores,
                };
                let updated;
                if (themeSettings?.id) {
                  await base44.entities.ThemeSettings.update(themeSettings.id, payload);
                  updated = { ...themeSettings, ...payload };
                } else {
                  updated = await base44.entities.ThemeSettings.create(payload);
                }
                setThemeSettings(updated);
                window.dispatchEvent(new CustomEvent('featuresToggled', { detail: enabledFeatures }));
                setDashboardSaved(true);
                setTimeout(() => setDashboardSaved(false), 2000);
              } catch (error) {
                console.error('Failed to save settings:', error);
              } finally {
                setSavingDashboard(false);
              }
            }} 
            disabled={savingDashboard}
            className="absolute top-0 right-0"
            size="sm"
          >
            {savingDashboard ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : dashboardSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              "Save"
            )}
          </Button>
          <div className="space-y-4 pr-20">
            <div>
              <Label className="text-sm mb-2 block">Custom Display Name</Label>
              <p className="text-xs text-muted-foreground mb-3">Override your first name in the dashboard greeting</p>
              <Input
                value={dashboardHeader}
                onChange={(e) => setDashboardHeader(e.target.value)}
                placeholder="e.g., Boss, Friend"
              />
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <Label className="text-sm block">Feature Toggles</Label>
              <p className="text-xs text-muted-foreground">Enable or disable app features</p>
              
              <div className="space-y-2">
                {enabledFeatures && [
                  { key: 'vision_board', label: 'Vision Board' },
                  { key: 'education', label: 'Education' },
                  { key: 'chores', label: 'Chores' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-2 rounded hover:bg-secondary/30">
                    <label className="text-sm cursor-pointer">{label}</label>
                    <button
                       onClick={async () => {
                            const updated = { ...enabledFeatures, [key]: !enabledFeatures[key] };
                            setEnabledFeatures(updated);
                            setSavingFeatures(true);
                            window.dispatchEvent(new CustomEvent('featuresToggled', { detail: updated }));
                            try {
                              const payload = {
                                enable_vision_board: updated.vision_board,
                                enable_education: updated.education,
                                enable_chores: updated.chores,
                              };
                              if (themeSettings?.id) {
                                await base44.entities.ThemeSettings.update(themeSettings.id, payload);
                                setThemeSettings({ ...themeSettings, ...payload });
                              } else {
                                const newSettings = await base44.entities.ThemeSettings.create(payload);
                                setThemeSettings(newSettings);
                              }
                            } catch (error) {
                              console.error('Failed to save feature toggle:', error);
                            } finally {
                              setSavingFeatures(false);
                            }
                          }}
                       disabled={savingFeatures}
                       className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                         enabledFeatures[key] ? "bg-primary" : "bg-muted"
                       }`}
                     >
                       <span
                         className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                           enabledFeatures[key] ? "translate-x-6" : "translate-x-1"
                         }`}
                       />
                     </button>
                   </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <Label className="text-sm block">Task Manager</Label>
              <div className="flex items-center justify-between p-2 rounded hover:bg-secondary/30">
                <div>
                  <label className="text-sm cursor-pointer">Default task list collapsed</label>
                  <p className="text-xs text-muted-foreground">Start with all task groups collapsed on load</p>
                </div>
                <button
                  onClick={() => {
                    const next = !taskDefaultCollapsed;
                    setTaskDefaultCollapsed(next);
                    try { localStorage.setItem("tasks_default_collapsed", next ? "1" : "0"); } catch {}
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                    taskDefaultCollapsed ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      taskDefaultCollapsed ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </WidgetCard>

      {/* Post-connection notice */}
      {justConnected && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-primary/40 bg-primary/10 text-sm">
          <span className="text-xl">{justConnected === 'calendar' ? '📅' : '✓'}</span>
          <div className="flex-1">
            <p className="font-semibold text-foreground">
              {justConnected === 'calendar' ? 'Google Calendar connected!' : 'Google Tasks connected!'}
            </p>
            <p className="text-muted-foreground mt-0.5">
              {justConnected === 'calendar'
                ? 'Before syncing, scroll down to "Select Calendars to Sync" and choose which calendars to include.'
                : 'Before syncing, scroll down to "Auto-Sync Schedule" and choose which task lists to include under "Task lists to auto-sync".'}
            </p>
          </div>
          <button onClick={() => setJustConnected(null)} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Integrations */}
      <WidgetCard title="Integrations" id="integrations-settings" style={{ backgroundColor: 'hsl(var(--muted) / 0.9)' }}>
        {checkingStatus && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Loader2 className="w-3 h-3 animate-spin" />
            Checking connection status...
          </div>
        )}
        <div className="space-y-3">
          {CONNECTORS.map((connector) => {
            const isConnected = connectorStatus[connector.id] === true;
            const isConnecting = connecting === connector.id;
            return (
              <div key={connector.id} className={`p-3 rounded-lg border ${isConnected ? 'border-green-500/40 bg-green-500/5' : 'border-border'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl shrink-0">{connector.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{connector.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{connector.description}</p>
                      {connector.id === GOOGLE_CALENDAR_ID && syncState && isConnected && (
                        <div className="mt-1.5 space-y-0.5">
                          {syncState.synced_account_email && (
                            <p className="text-xs text-muted-foreground">Account: <span className="font-medium text-foreground">{syncState.synced_account_email}</span></p>
                          )}
                          {syncState.last_sync && (
                            <p className="text-xs text-muted-foreground">Last sync: <span className="font-medium text-foreground">{new Date(syncState.last_sync).toLocaleString()}</span></p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isConnecting ? (
                      <Button disabled size="sm" className="gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </Button>
                    ) : isConnected ? (
                      <Button size="sm" onClick={() => setConfirmDisconnect(connector)} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white border-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Connected
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleConnect(connector.id, connector.type)}>
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </WidgetCard>

      {(calendars.length > 0 || taskLists.length > 0 || connectorStatus[GOOGLE_CALENDAR_ID] || connectorStatus["69e7399b50555bb55752878a"]) && (
       <>
       <WidgetCard title="Select Calendars to Sync" id="calendar-selection" style={{ backgroundColor: 'hsl(var(--muted) / 0.9)' }}>
         <div className="space-y-3">
           <div className="flex gap-2">
             <Button size="sm" onClick={handleFetchCalendars} disabled={loadingCals}>
               {loadingCals ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
               {loadingCals ? 'Loading...' : 'Fetch Calendars'}
             </Button>
             <Button size="sm" onClick={() => setShowSyncDialog(true)} disabled={syncing}>
               {syncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : '↻ '}Sync
             </Button>
           </div>
           {calendars.length > 0 && (
             <div className="space-y-3 border-t border-border pt-3">
               {calendars.map((cal) => (
                 <div key={cal.id} className="flex items-center justify-between gap-3 p-2 rounded hover:bg-secondary/30">
                   <div className="flex items-center gap-3 flex-1">
                     <Checkbox
                       checked={cal.is_selected}
                       onCheckedChange={() => handleToggleCalendar(cal.id, cal.is_selected)}
                     />
                     <div className="flex-1">
                       <label className="text-sm font-medium cursor-pointer block">{cal.calendar_name}</label>
                       {cal.last_synced && (
                         <p className="text-xs text-muted-foreground mt-1">
                           Last synced: {new Date(cal.last_synced).toLocaleString('en-US', { month: 'short', day: 'numeric', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                         </p>
                       )}
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
       </WidgetCard>

       <WidgetCard title="Auto-Sync Schedule" id="sync-times" style={{ backgroundColor: 'hsl(var(--muted) / 0.9)' }}>
         <div className="space-y-4">
           {/* Calendar sources for auto-sync (separate from manual sync selection) */}
           <div>
             <div className="flex items-center justify-between mb-2">
               <p className="text-sm font-medium">📅 Calendars to auto-sync</p>
               <Button size="sm" variant="outline" onClick={handleFetchAutoSyncCalendars} disabled={loadingAutoSyncCals}>
                 {loadingAutoSyncCals ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                 {autoSyncCalendars.length > 0 ? 'Refresh' : 'Load Calendars'}
               </Button>
             </div>
             {autoSyncCalendars.length > 0 ? (
               <div className="space-y-1.5 ml-1">
                 {autoSyncCalendars.map((cal) => (
                   <label key={cal.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-secondary/30">
                     <Checkbox
                       checked={autoSyncCalendarIds.includes(cal.id)}
                       onCheckedChange={() => handleToggleAutoSyncCalendar(cal.id)}
                     />
                     <span className="text-sm">{cal.calendar_name}</span>
                   </label>
                 ))}
               </div>
             ) : (
               <p className="text-xs text-muted-foreground ml-1">Click "Load Calendars" to choose which to include in auto-sync.</p>
             )}
           </div>

           {/* Task list sources */}
           <div className="border-t border-border pt-3">
             <div className="flex items-center justify-between mb-2">
               <p className="text-sm font-medium">✓ Task lists to auto-sync</p>
               <Button size="sm" variant="outline" onClick={handleFetchTaskLists} disabled={loadingTaskLists}>
                 {loadingTaskLists ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                 {taskLists.length > 0 ? 'Refresh' : 'Load Lists'}
               </Button>
             </div>
             {taskLists.length > 0 ? (
               <div className="space-y-1.5 ml-1">
                 {taskLists.map((list) => (
                   <label key={list.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-secondary/30">
                     <Checkbox
                       checked={list.is_selected}
                       onCheckedChange={() => handleToggleTaskList(list.id, list.is_selected)}
                     />
                     <span className="text-sm">{list.list_name}</span>
                   </label>
                 ))}
               </div>
             ) : (
               <p className="text-xs text-muted-foreground ml-1">Click "Load Lists" to choose which task lists to include.</p>
             )}
           </div>

           {/* Scheduled times */}
           <div className="border-t border-border pt-3">
             <p className="text-sm font-medium mb-2">Scheduled sync times</p>
             <p className="text-xs text-muted-foreground mb-3">Syncs run automatically at these times each day.</p>
             <div className="flex gap-2 items-center">
               <div className="w-44">
                 <ModernTimePicker value={newSyncTime} onChange={setNewSyncTime} />
               </div>
               <Button size="sm" onClick={addSyncTime} disabled={savingSyncTimes || syncTimes.includes(newSyncTime)}>
                 <Plus className="w-4 h-4 mr-1" />
                 Add Time
               </Button>
             </div>
             {syncTimes.length > 0 && (
               <div className="space-y-2 border-t border-border pt-3 mt-3">
                 {syncTimes.map((time) => (
                   <div key={time} className="flex items-center justify-between p-2 rounded bg-muted/50">
                     <span className="text-sm font-medium">{time}</span>
                     <Button size="sm" variant="ghost" onClick={() => removeSyncTime(time)} disabled={savingSyncTimes}>
                       <Trash2 className="w-4 h-4 text-destructive" />
                     </Button>
                   </div>
                 ))}
               </div>
             )}
           </div>
         </div>
       </WidgetCard>
       </>
      )}

      <WidgetCard title="Trash Bin" id="trash-bin" style={{ backgroundColor: 'hsl(var(--muted) / 0.9)' }}>
        <div className="space-y-3">
          {loadingTrash ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <p className="text-sm text-muted-foreground">Loading trash...</p>
            </div>
          ) : trashItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Your trash bin is empty</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Items in trash can be restored for 24 hours</p>
              <div className="space-y-2 border-t border-border pt-3">
                {trashItems.map((item) => {
                  let itemData = {};
                  try {
                    itemData = JSON.parse(item.item_data);
                  } catch {}
                  const deletedDate = new Date(item.deleted_at).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{itemData.title || 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Deleted {deletedDate}</p>
                      </div>
                      <div className="flex gap-2 ml-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => restoreItem(item)}
                          disabled={restoringId === item.id || permanentlyDeletingId === item.id}
                          className="gap-1"
                        >
                          {restoringId === item.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => permanentlyDelete(item)}
                          disabled={restoringId === item.id || permanentlyDeletingId === item.id}
                        >
                          {permanentlyDeletingId === item.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </WidgetCard>

      <WidgetCard title="Manage App Data" id="synced-data" style={{ backgroundColor: 'hsl(var(--muted) / 0.9)' }}>
       <div className="space-y-4">
         <div className="space-y-2">
           <p className="text-sm font-medium">Delete Synced Data</p>
           <p className="text-xs text-muted-foreground">Remove all synced Google Calendar events and tasks. Your Google data remains unchanged.</p>
           <Button
             variant="destructive"
             onClick={() => { setDeleteAllAppData(false); setShowDeleteSyncedDialog(true); }}
             className="w-full gap-2"
           >
             <AlertCircle className="w-4 h-4" />
             Delete Synced Data
           </Button>
         </div>
         <div className="border-t border-border pt-4 space-y-2">
           <p className="text-sm font-medium">Delete All App Data</p>
           <p className="text-xs text-muted-foreground">Remove everything: synced data, tasks, chores, goals, checklists, education plans, quotes, and links. Cannot be undone.</p>
           <Button
             variant="destructive"
             onClick={() => { setDeleteAllAppData(true); setShowDeleteSyncedDialog(true); }}
             className="w-full gap-2"
           >
             <AlertCircle className="w-4 h-4" />
             Delete All App Data
           </Button>
         </div>
       </div>
      </WidgetCard>

      {syncMessage && (
        <div className="fixed bottom-4 right-4 p-3 rounded-lg bg-card border border-border text-sm">
          {syncMessage}
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all your data including tasks, schedules, goals, chores, and education plans. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {deletingAccount ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSyncDialog} onOpenChange={(open) => { if (!syncing) setShowSyncDialog(open); }}>
         <AlertDialogContent onInteractOutside={(e) => { if (syncing) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (syncing) e.preventDefault(); }}>
           <AlertDialogHeader>
             <AlertDialogTitle>{syncing ? 'Syncing...' : 'What would you like to sync?'}</AlertDialogTitle>
             <AlertDialogDescription>
               {syncing ? 'Please wait while your data is being synced. Do not close this window.' : 'Choose what to sync right now.'}
             </AlertDialogDescription>
           </AlertDialogHeader>
           {syncing ? (
             <div className="flex flex-col items-center gap-3 py-4">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
               <p className="text-sm text-muted-foreground">Syncing your data...</p>
             </div>
           ) : (
             <>
               <div className="space-y-3 my-4">
                 <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-secondary/30">
                   <Checkbox
                     checked={syncSources.includes('calendar')}
                     onCheckedChange={() => toggleSyncSource('calendar')}
                   />
                   <span className="text-sm">📅 Google Calendar Events</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-secondary/30">
                   <Checkbox
                     checked={syncSources.includes('tasks')}
                     onCheckedChange={() => toggleSyncSource('tasks')}
                   />
                   <span className="text-sm">✓ Google Tasks</span>
                 </label>
               </div>
               <div className="flex gap-3">
                 <Button variant="outline" onClick={() => setShowSyncDialog(false)} className="bg-secondary/500">Cancel</Button>
                 <Button onClick={async () => {
                   if (syncSources.includes('calendar')) await handleSyncGoogleCalendar();
                   if (syncSources.includes('tasks')) await handleSyncGoogleTasks();
                 }} disabled={syncSources.length === 0}>
                   Sync Selected
                 </Button>
               </div>
             </>
           )}
         </AlertDialogContent>
       </AlertDialog>

      <AlertDialog open={!!confirmDisconnect} onOpenChange={(open) => { if (!open) setConfirmDisconnect(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {confirmDisconnect?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the connection. You can reconnect anytime. Your Google data will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel onClick={() => setConfirmDisconnect(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => { await handleDisconnect(confirmDisconnect.id); setConfirmDisconnect(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteSyncedDialog} onOpenChange={(open) => { if (!deletingSyncedData) setShowDeleteSyncedDialog(open); }}>
         <AlertDialogContent onInteractOutside={(e) => { if (deletingSyncedData) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (deletingSyncedData) e.preventDefault(); }}>
           <AlertDialogHeader>
             <AlertDialogTitle className="text-destructive">
               {deletingSyncedData ? 'Deleting...' : deleteAllAppData ? 'Delete All App Data?' : 'Delete Synced Data?'}
             </AlertDialogTitle>
             <AlertDialogDescription>
               {deletingSyncedData
                 ? 'Please wait while your data is being deleted. Do not close this window.'
                 : deleteAllAppData
                 ? 'This will permanently remove ALL app data including tasks, chores, goals, checklists, education plans, quotes, links, and synced data. This cannot be undone.'
                 : 'This will permanently remove all synced Google Calendar events and tasks from your app. You can re-sync your data anytime.'}
             </AlertDialogDescription>
           </AlertDialogHeader>
           {deletingSyncedData ? (
             <div className="flex flex-col items-center gap-3 py-4">
               <Loader2 className="w-8 h-8 animate-spin text-destructive" />
               <p className="text-sm text-muted-foreground">This may take a few minutes...</p>
             </div>
           ) : (
             <div className="flex gap-3">
               <AlertDialogCancel onClick={() => setDeleteAllAppData(false)}>Cancel</AlertDialogCancel>
               <AlertDialogAction
                 onClick={handleDeleteSyncedData}
                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
               >
                 {deleteAllAppData ? 'Delete Everything' : 'Delete Synced Data'}
               </AlertDialogAction>
             </div>
           )}
         </AlertDialogContent>
       </AlertDialog>
    </div>
  );
}