import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Check, X } from "lucide-react";

export default function DeletedItemReview() {
  const [deletedItems, setDeletedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadPendingItems();
  }, []);

  const loadPendingItems = async () => {
    setLoading(true);
    const items = await base44.entities.DeletedSyncItem.filter({ status: 'pending_review' }, '-last_detected', 100);
    setDeletedItems(items);
    setLoading(false);
  };

  const handleAllow = async (itemId) => {
    setProcessing(itemId);
    await base44.entities.DeletedSyncItem.update(itemId, { status: 'allowed' });
    setDeletedItems(deletedItems.filter(i => i.id !== itemId));
    setProcessing(null);
  };

  const handleDeny = async (itemId) => {
    setProcessing(itemId);
    const item = deletedItems.find(i => i.id === itemId);
    // Recreate the item in calendar
    if (item.source_type === 'calendar') {
      await base44.entities.ScheduleItem.create({
        title: item.title,
        date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '10:00',
        source_type: 'calendar',
        source_id: item.google_id,
        color: '#3b82f6'
      });
    }
    await base44.entities.DeletedSyncItem.update(itemId, { status: 'denied' });
    setDeletedItems(deletedItems.filter(i => i.id !== itemId));
    setProcessing(null);
  };

  if (loading) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        Loading pending items...
      </div>
    );
  }

  if (deletedItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
      <h3 className="font-semibold text-sm">Items Deleted from Google Calendar</h3>
      <p className="text-xs text-muted-foreground">
        These items were permanently deleted from your Google Calendar. Confirm whether you want to keep them deleted or restore them.
      </p>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {deletedItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between bg-background p-3 rounded border border-border text-sm">
            <div className="flex-1">
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.sync_source}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => handleAllow(item.id)}
                disabled={processing === item.id}
                title="Keep deleted (don't restore)"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                className="h-8"
                onClick={() => handleDeny(item.id)}
                disabled={processing === item.id}
                title="Restore to calendar"
              >
                <Check className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}