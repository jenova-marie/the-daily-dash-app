import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useHeader } from "@/lib/HeaderContext";
import { base44 } from "@/api/base44Client";
import WidgetCard from "../components/WidgetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Users, UserPlus, Printer, Mail, Trash2, HelpCircle, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, CheckSquare, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import SwipeableListItem from "../components/SwipeableListItem";
import ChoresOnboarding from "@/components/onboarding/ChoresOnboarding";
import ChoreGenerator from "@/components/ChoreGenerator";
import ChoreLibraryDialog from "@/components/ChoreLibraryDialog";
import PrintFormatChores from "@/components/PrintFormatChores";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_SHORT_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const frequencyLabels = { once: "Once", daily: "Daily", weekly: "Weekly", biweekly: "Bi-Weekly", monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly", as_needed: "As Needed", other: "Other" };

import { getStoredRooms, saveCustomRoom, deleteCustomRoom, buildRoomOptions, getDeletedRooms } from "@/lib/choreRooms";

export default function Chores() {
  const location = useLocation();
  const { setTitle, setHeaderRight } = useHeader();
  useEffect(() => { setTitle("Chore Manager"); return () => setTitle(""); }, []);
  useEffect(() => { setHeaderRight(<Button size="icon" variant="ghost" onClick={() => setShowOnboarding(true)} title="Guide" className="h-8 w-8 text-sm font-medium"><HelpCircle className="w-4 h-4" /></Button>); return () => setHeaderRight(null); }, []);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem("chores_onboarded"); } catch { return false; }
  });
  const [chores, setChores] = useState([]);
  const [choreLibrary, setChoreLibrary] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [choreDialog, setChoreDialog] = useState(false);
  const [userDialog, setUserDialog] = useState(false);
  const [filterUser, setFilterUser] = useState(null);
  const [filterRoom, setFilterRoom] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterFrequency, setFilterFrequency] = useState(null);
  const [filterTime, setFilterTime] = useState(null);
  // Track the order filters were applied for cascade grouping
  const [filterOrder, setFilterOrder] = useState([]); // e.g. ["user", "room", "category"]

  const setFilterWithOrder = (key, value, setter) => {
    setter(value);
    setFilterOrder(prev => {
      if (value === null) return prev.filter(k => k !== key);
      if (prev.includes(key)) return prev;
      return [...prev, key];
    });
  };
  const [filterStatus, setFilterStatus] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("filter") === "all" ? "all" : "due";
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get("filter") === "due") setFilterStatus("due");
  }, [location.search]);
  const [activeTab, setActiveTab] = useState("chores");
  const today = new Date().toISOString().split('T')[0];
  const todayDayFull = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
  const todayDayOfMonth = new Date().getDate();
  const isChoresDueToday = (c) => {
    if (c.status === "completed") return false;
    if (c.frequency === "daily") return true;
    if (c.frequency === "weekly" && c.day_of_week?.includes(todayDayFull)) return true;
    if (c.due_date === today) return true;
    if (c.frequency === "monthly" && c.due_date) return parseInt(c.due_date.split('-')[2]) === todayDayOfMonth;
    return false;
  };
  const [form, setForm] = useState({ title: "", description: "", assigned_to: "", assigned_to_ids: [], frequency: "weekly", room: "", priority: "medium", day_of_week: [], time_estimate: 0, notes: "", chore_type: "" });
  // No auto-assign needed — user picks from checkboxes
  const [userForm, setUserForm] = useState({ name: "", color: "#10b981" });
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ name: "", color: "#10b981" });
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [filterMealStatus, setFilterMealStatus] = useState("pending");
  const todayShortDefault = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];
  const DAYS_SHORT_ALL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [collapsedMealDays, setCollapsedMealDays] = useState(() =>
    DAYS_SHORT_ALL.filter(d => d !== todayShortDefault)
  );
  const [allMealDaysCollapsed, setAllMealDaysCollapsed] = useState(false);

  const toggleMealDay = (day) => {
    setCollapsedMealDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleAllMealDays = () => {
    if (allMealDaysCollapsed) {
      // Expand all — clear collapsed list
      setAllMealDaysCollapsed(false);
      setCollapsedMealDays([]);
    } else {
      // Collapse all — add all days to collapsed list
      setAllMealDaysCollapsed(true);
      setCollapsedMealDays([...DAYS_SHORT_ALL]);
    }
  };
  const [collapsedGroups, setCollapsedGroups] = useState([]);
  const [allCollapsed, setAllCollapsed] = useState(true);
  const [editingChore, setEditingChore] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saveNewToLibrary, setSaveNewToLibrary] = useState(false);
  const [editSaveToLibrary, setEditSaveToLibrary] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkReassignOpen, setBulkReassignOpen] = useState(false);
  const [bulkReassignIds, setBulkReassignIds] = useState([]);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [customRooms, setCustomRooms] = useState(() => getStoredRooms());
  const [deletedRoomsState, setDeletedRoomsState] = useState(() => getDeletedRooms());
  const [printNoteDialog, setPrintNoteDialog] = useState(null); // null | "chores" | "meals"
  const [printNote, setPrintNote] = useState(() => localStorage.getItem("last_chore_print_note") || "");
  const choreTapTimers = useRef({});
  const tapTimers = useRef({});

  const toggleGroup = (key) => {
    // When allCollapsed is true, collapsedGroups acts as an "exceptions" (expanded) list
    // When allCollapsed is false, collapsedGroups acts as a "collapsed" list
    setCollapsedGroups(prev => {
      if (allCollapsed) {
        // key in list = expanded exception; toggle it
        return prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      } else {
        return prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      }
    });
  };

  const toggleAllCollapsed = () => {
    setAllCollapsed(prev => !prev);
    setCollapsedGroups([]);
  };

  const handleMealTap = (meal) => {
    if (tapTimers.current[meal.id]) {
      clearTimeout(tapTimers.current[meal.id]);
      delete tapTimers.current[meal.id];
      setSelectedMeal(meal);
    } else {
      tapTimers.current[meal.id] = setTimeout(() => { delete tapTimers.current[meal.id]; }, 400);
    }
  };

  const resetCompletedChores = async () => {
    const completedChores = chores.filter(c => c.status === "completed");
    for (const chore of completedChores) {
      await base44.entities.Chore.update(chore.id, { status: "pending" });
    }
    loadData();
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow - now;
    setTimeout(resetCompletedChores, timeUntilMidnight);
  };

  useEffect(() => { 
    loadData();
    // Reset completed chores at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow - now;
    const timeout = setTimeout(resetCompletedChores, timeUntilMidnight);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    base44.auth.me().then(user => setCurrentUser(user)).catch(() => {});
  }, []);

  const UNASSIGNED_NAME = "UNASSIGNED";

  const loadData = async () => {
    const [c, u, lib] = await Promise.all([
      base44.entities.Chore.list("-created_date", 1000),
      base44.entities.ChoreUser.list(),
      base44.entities.ChoreLibrary.list("-created_date", 1000),
    ]);
    setChores(c);
    setUsers(u);
    setChoreLibrary(lib);
    // Sync room names to localStorage, skipping any the user has explicitly deleted
    const deletedRooms = getDeletedRooms();
    [...c, ...lib].forEach(item => {
      if (item.room?.trim() && !deletedRooms.includes(item.room.trim().toLowerCase())) {
        saveCustomRoom(item.room.trim());
      }
    });
    setCustomRooms(getStoredRooms());
  };

  const createChore = async () => {
    if (!form.title) return;
    if (!form.chore_type) return;
    const selectedIds = form.assigned_to_ids?.length ? form.assigned_to_ids : [];
    if (!selectedIds.length) return;
    // Normalize and save room
    const normalizedRoom = normalizeRoom(form.room);
    if (normalizedRoom) {
      saveCustomRoom(normalizedRoom);
      setCustomRooms(getStoredRooms());
    }
    const normalizedType = normalizeChoreType(form.chore_type);
    const choreData = {
      title: form.title,
      description: form.description,
      frequency: form.frequency,
      room: normalizedRoom,
      priority: form.priority,
      day_of_week: form.day_of_week,
      time_estimate: form.time_estimate,
      notes: form.notes,
      chore_type: normalizedType,
    };
    for (const uid of selectedIds) {
      const isDuplicate = chores.some(c =>
        c.assigned_to === uid &&
        c.title?.toLowerCase() === form.title?.toLowerCase() &&
        c.frequency === form.frequency &&
        (c.room || "").toLowerCase() === (normalizedRoom || "").toLowerCase() &&
        c.priority === form.priority &&
        normalizeChoreType(c.chore_type) === normalizedType
      );
      if (!isDuplicate) {
        await base44.entities.Chore.create({ ...choreData, assigned_to: uid });
      }
    }
    if (saveNewToLibrary && form.title) {
      const libFreqs = ["daily", "weekly", "biweekly", "monthly"];
      const existingLib = await base44.entities.ChoreLibrary.list("-created_date", 200);
      const finalFreq = libFreqs.includes(form.frequency) ? form.frequency : "weekly";
      const isDuplicate = existingLib.some(lib =>
        lib.title?.toLowerCase() === form.title?.toLowerCase() &&
        lib.frequency === finalFreq &&
        (lib.room || "") === (form.room || "") &&
        lib.priority === (form.priority || "medium") &&
        lib.chore_type === (form.chore_type || "")
      );
      if (!isDuplicate) {
        await base44.entities.ChoreLibrary.create({
          title: form.title,
          description: form.description || "",
          frequency: finalFreq,
          time_estimate: form.time_estimate || 0,
          priority: form.priority || "medium",
          room: normalizedRoom || "",
          chore_type: normalizedType || "",
        });
      }
    }
    setForm({ title: "", description: "", assigned_to: "", assigned_to_ids: [], frequency: "weekly", room: "", priority: "medium", day_of_week: [], time_estimate: 0, notes: "", chore_type: "", _customRoom: false });
    setSaveNewToLibrary(false);
    setChoreDialog(false);
    loadData();
  };

  const createUser = async () => {
    if (!userForm.name) return;
    await base44.entities.ChoreUser.create(userForm);
    setUserForm({ name: "", color: "#10b981" });
    setUserDialog(false);
    loadData();
  };

  const normalizeRoom = (room) => {
    if (!room) return room;
    return room.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const normalizeChoreType = (type) => {
    if (!type) return type;
    return type.trim();
  };

  const deleteChore = async (id) => {
    await base44.entities.Chore.delete(id);
    loadData();
  };

  const deleteUser = async (id) => {
    await base44.entities.ChoreUser.delete(id);
    loadData();
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setEditUserForm({ name: user.name || "", color: user.color || "#10b981" });
  };

  const saveEditUser = async () => {
    if (!editingUser || !editUserForm.name) return;
    await base44.entities.ChoreUser.update(editingUser.id, { name: editUserForm.name, color: editUserForm.color });
    setEditingUser(null);
    loadData();
  };

  const calculateNextDueDate = (frequency, fromDate = new Date()) => {
    const newDate = new Date(fromDate);
    if (frequency === "daily") newDate.setDate(newDate.getDate() + 1);
    else if (frequency === "weekly") newDate.setDate(newDate.getDate() + 7);
    else if (frequency === "biweekly") newDate.setDate(newDate.getDate() + 14);
    else if (frequency === "monthly") newDate.setMonth(newDate.getMonth() + 1);
    else if (frequency === "quarterly") newDate.setMonth(newDate.getMonth() + 3);
    else if (frequency === "yearly") newDate.setFullYear(newDate.getFullYear() + 1);
    // as_needed: no next due date
    return newDate.toISOString().split('T')[0];
  };

  const toggleChore = async (chore) => {
    if (chore.status !== "completed") {
      const todayStr = new Date().toISOString().split('T')[0];
      // Next due calculated from completion date (never goes overdue)
      const nextDue = chore.frequency !== "as_needed" ? calculateNextDueDate(chore.frequency) : null;
      await base44.entities.Chore.update(chore.id, {
        status: "completed",
        last_completed_date: todayStr,
        ...(nextDue ? { due_date: nextDue } : {})
      });
    } else {
      await base44.entities.Chore.update(chore.id, { status: "pending", last_completed_date: null });
    }
    loadData();
  };

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      day_of_week: f.day_of_week.includes(day)
        ? f.day_of_week.filter((d) => d !== day)
        : [...f.day_of_week, day],
    }));
  };

  const openEditChore = (chore) => {
    setEditSaveToLibrary(false);
    setEditingChore(chore);
    setEditForm({
      title: chore.title || "",
      assigned_to: chore.assigned_to || "",
      assigned_to_ids: [chore.assigned_to].filter(Boolean), // multi-select state
      frequency: chore.frequency || "weekly",
      room: chore.room || "",
      time_estimate: chore.time_estimate || 0,
      day_of_week: chore.day_of_week || [],
      description: chore.description || "",
      notes: chore.notes || "",
      priority: chore.priority || "medium",
      chore_type: chore.chore_type || "",
    });
  };

  const toggleEditAssignedTo = (uid) => {
    setEditForm(f => {
      const ids = f.assigned_to_ids || [];
      return {
        ...f,
        assigned_to_ids: ids.includes(uid) ? ids.filter(id => id !== uid) : [...ids, uid],
      };
    });
  };

  const saveEditChore = async () => {
    if (!editingChore) return;

    const normalizedEditRoom = normalizeRoom(editForm.room);
    if (normalizedEditRoom) {
      saveCustomRoom(normalizedEditRoom);
      setCustomRooms(getStoredRooms());
    }
    const normalizedEditType = normalizeChoreType(editForm.chore_type);
    const selectedIds = editForm.assigned_to_ids || [];
    const choreData = {
      title: editForm.title,
      description: editForm.description,
      frequency: editForm.frequency,
      room: normalizedEditRoom,
      priority: editForm.priority,
      day_of_week: editForm.day_of_week,
      time_estimate: editForm.time_estimate,
      notes: editForm.notes,
      chore_type: normalizedEditType,
    };

    const newAssignedTo = selectedIds.length > 0 ? selectedIds[0] : (editingChore.assigned_to || "");
    const updatedChore = { ...editingChore, ...choreData, assigned_to: newAssignedTo };

    // Close dialog immediately — optimistic update so UI feels instant
    setEditingChore(null);
    setEditSaveToLibrary(false);

    // Optimistically update local state right away
    setChores(prev => prev.map(c => c.id === editingChore.id ? updatedChore : c));

    // Persist to DB
    await base44.entities.Chore.update(editingChore.id, { ...choreData, assigned_to: newAssignedTo });

    // Create copies for additional assignees
    for (let i = 1; i < selectedIds.length; i++) {
      const alreadyExists = chores.some(c =>
        c.id !== editingChore.id &&
        c.assigned_to === selectedIds[i] &&
        c.title?.toLowerCase() === editForm.title?.toLowerCase() &&
        c.frequency === editForm.frequency
      );
      if (!alreadyExists) {
        await base44.entities.Chore.create({ ...choreData, assigned_to: selectedIds[i], status: "pending" });
      }
    }

    // Save to library only if user explicitly checked the option
    if (editSaveToLibrary && editForm.title) {
      const libFreqs = ["daily", "weekly", "biweekly", "monthly"];
      const existingLib = await base44.entities.ChoreLibrary.list("-created_date", 200);
      const finalFreq = libFreqs.includes(editForm.frequency) ? editForm.frequency : "weekly";
      const isDuplicate = existingLib.some(lib =>
        lib.title?.toLowerCase() === editForm.title?.toLowerCase() &&
        lib.frequency === finalFreq &&
        (lib.room || "") === (editForm.room || "") &&
        lib.priority === (editForm.priority || "medium") &&
        lib.chore_type === (editForm.chore_type || "")
      );
      if (!isDuplicate) {
        await base44.entities.ChoreLibrary.create({
          title: editForm.title,
          description: editForm.description || "",
          frequency: finalFreq,
          time_estimate: editForm.time_estimate || 0,
          priority: editForm.priority || "medium",
          room: normalizedEditRoom || "",
          chore_type: normalizedEditType || "",
        });
      }
    }

    // Refresh from DB in background to sync any server-side changes
    loadData();
  };

  const handleChoreTap = (chore) => {
    if (choreTapTimers.current[chore.id]) {
      clearTimeout(choreTapTimers.current[chore.id]);
      delete choreTapTimers.current[chore.id];
      openEditChore(chore);
    } else {
      choreTapTimers.current[chore.id] = setTimeout(() => { delete choreTapTimers.current[chore.id]; }, 400);
    }
  };

  const toggleEditDay = (day) => {
    setEditForm(f => ({
      ...f,
      day_of_week: f.day_of_week?.includes(day)
        ? f.day_of_week.filter(d => d !== day)
        : [...(f.day_of_week || []), day],
    }));
  };

  const toggleBulkSelect = (id) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleGroupBulkSelect = (ids) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      const allSelected = ids.every(id => next.has(id));
      if (allSelected) { ids.forEach(id => next.delete(id)); }
      else { ids.forEach(id => next.add(id)); }
      return next;
    });
  };

  const exitBulkMode = () => {
    setBulkMode(false);
    setBulkSelected(new Set());
  };

  const bulkDelete = async () => {
     try {
       for (const id of bulkSelected) await base44.entities.Chore.delete(id);
     } finally {
       setBulkDeleteConfirmOpen(false);
       exitBulkMode();
       loadData();
     }
   };

  const bulkReassign = async (newUserIds) => {
    // For each selected chore id, update assigned_to to the first user, create copies for additional users
    const selectedChores = chores.filter(c => bulkSelected.has(c.id));
    for (const chore of selectedChores) {
      if (newUserIds.length === 0) continue;
      await base44.entities.Chore.update(chore.id, { assigned_to: newUserIds[0] });
      for (let i = 1; i < newUserIds.length; i++) {
        const isDuplicate = chores.some(c =>
          c.assigned_to === newUserIds[i] &&
          c.title?.toLowerCase() === chore.title?.toLowerCase() &&
          c.frequency === chore.frequency &&
          (c.room || "") === (chore.room || "") &&
          c.priority === chore.priority &&
          c.chore_type === chore.chore_type
        );
        if (!isDuplicate) {
          await base44.entities.Chore.create({ ...chore, id: undefined, assigned_to: newUserIds[i], status: "pending" });
        }
      }
    }
    setBulkReassignOpen(false);
    setBulkReassignIds([]);
    exitBulkMode();
    loadData();
  };

  const matchesUserFilter = (c) => {
    if (!filterUser || filterUser === "__all__") return true;
    const selectedUser = users.find(u => u.id === filterUser);
    return c.assigned_to === filterUser || (selectedUser && c.assigned_to === selectedUser.name);
  };

  const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack", "Meal"];
  const isMealType = (chore_type) => MEAL_TYPES.includes(chore_type);

   const allRooms = buildRoomOptions(
     [...choreLibrary, ...chores]
       .filter(c => c.room && !isMealType(c.chore_type))
       .map(c => c.room)
   ).filter(r => !isMealType(r) && !deletedRoomsState.includes(r.trim().toLowerCase()));
   const allCategories = [...new Set([...choreLibrary, ...chores].filter(c => c.chore_type && !isMealType(c.chore_type)).map(c => normalizeChoreType(c.chore_type)))].sort();
   const DEFAULT_FREQUENCIES = ["once", "daily", "weekly", "biweekly", "monthly", "quarterly", "yearly", "as_needed"];
   const allFrequencies = [...new Set([...DEFAULT_FREQUENCIES, ...[...choreLibrary, ...chores].filter(c => !isMealType(c.chore_type) && c.frequency).map(c => c.frequency?.toLowerCase())])].sort();
   const extraFrequencies = ["weekdays", "weekends"];

  const matchesTimeFilter = (c) => {
    if (!filterTime || filterTime === "__all__") return true;
    const t = c.time_estimate || 0;
    if (filterTime === "quick") return t > 0 && t <= 15;
    if (filterTime === "medium") return t > 15 && t <= 30;
    if (filterTime === "long") return t > 30;
    return true;
  };

  const matchesFrequencyFilter = (c) => {
     if (!filterFrequency || filterFrequency === "__all__") return true;
     if (filterFrequency === "weekdays") {
       const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
       return (c.day_of_week || []).map(d => d.toLowerCase()).some(d => weekdays.includes(d));
     }
     if (filterFrequency === "weekends") {
       const weekend = ["saturday", "sunday"];
       return (c.day_of_week || []).map(d => d.toLowerCase()).some(d => weekend.includes(d));
     }
     return c.frequency?.toLowerCase() === filterFrequency;
   };

   // Base filtered chores without status filter — used for pill counts (excludes meals/menu items)
   const baseFilteredChores = chores.filter(c => {
     // Exclude meals — they belong in Menu tab only
     if (isMealType(c.chore_type)) return false;
     if (!c.assigned_to) return false;
     if (!matchesUserFilter(c)) return false;
     if (!matchesTimeFilter(c)) return false;
     if (!matchesFrequencyFilter(c)) return false;
     // Location filter: check if room exists and matches (case-insensitive)
     if (filterRoom && filterRoom !== "__all__") {
       const choreRoom = (c.room || "").trim().toLowerCase();
       const filterRoomLower = filterRoom.trim().toLowerCase();
       if (!choreRoom || choreRoom !== filterRoomLower) return false;
     }
     return true;
   });

  const filteredChores = baseFilteredChores.filter((c) => {
    // Double-check meals are excluded (shouldn't be needed, but explicit)
    if (isMealType(c.chore_type)) return false;
    if (filterStatus === "due") return isChoresDueToday(c);
    if (filterStatus === "completed") return c.status === "completed";
    return c.status !== "completed";
  });
  const getUserName = (id) => users.find((u) => u.id === id)?.name || "Unassigned";

  const getFilterLabel = () => {
    if (!filterUser || filterUser === "__all__") return "Weekly Chore Schedule";
    return `${getUserName(filterUser)}'s Chores`;
  };

  const executePrint = (note, isMeals = false) => {
    localStorage.setItem("last_chore_print_note", note || "");
    const printableChores = isMeals
      ? chores.filter(c => c.chore_type === "Meal" && (!filterUser || filterUser === "__all__" || c.assigned_to === filterUser))
      : filteredChores;
    const title = isMeals ? "Weekly Meal Schedule" : "Weekly Chore Schedule";
    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 28px; font-weight: bold; margin-bottom: 8px; text-align: center; }
        .date-line { text-align: center; color: #666; margin-bottom: 6px; font-size: 12px; }
        .note-line { text-align: center; color: #333; margin-bottom: 0; font-size: 13px; font-style: italic; }
        .person-section { margin-bottom: 35px; page-break-inside: avoid; }
        .person-name { font-size: 18px; font-weight: bold; border-bottom: 3px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
        .freq-group { margin-bottom: 18px; }
        .freq-label { font-size: 14px; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; }
        tr { border-bottom: 1px solid #ddd; }
        td { padding: 10px 0; vertical-align: top; }
        input[type="checkbox"] { margin-right: 8px; }
        .chore-title { font-size: 14px; font-weight: 500; margin-bottom: 4px; }
        .chore-desc { font-size: 12px; color: #666; margin-bottom: 4px; }
        .chore-meta { text-align: right; font-size: 12px; color: #666; }
        @media print { body { margin: 0; padding: 0; } }
      </style>
    `;
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>${title}</title>${styles}</head><body>`);
    win.document.write(`<h1>${title}</h1>`);
    win.document.write(`<div class="date-line">Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>`);
    if (note?.trim()) {
      win.document.write(`<div class="note-line">${note.trim()}</div>`);
    }

    if (isMeals) {
      const DAYS_S = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const DAY_F = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
      DAYS_S.forEach(d => {
        const dayMeals = printableChores.filter(m => m.frequency === "daily" || m.day_of_week?.includes(d));
        if (dayMeals.length === 0) return;
        win.document.write(`<div class="person-section"><div class="person-name">${DAY_F[d]}</div><table>`);
        dayMeals.forEach(meal => {
          const assignee = users.find(u => u.id === meal.assigned_to)?.name || "";
          win.document.write(`
            <tr>
              <td style="width:5%;"><input type="checkbox" /></td>
              <td style="width:65%; padding-right:15px;">
                <div class="chore-title">${meal.title}</div>
                ${meal.description ? `<div class="chore-desc">${meal.description}</div>` : ''}
              </td>
              <td style="width:30%;" class="chore-meta">
                ${meal.room ? `<div>${meal.room}</div>` : ''}
                ${meal.time_estimate > 0 ? `<div>${meal.time_estimate}min</div>` : ''}
                ${assignee ? `<div>${assignee}</div>` : ''}
              </td>
            </tr>
          `);
        });
        win.document.write(`</table></div>`);
      });
    } else {
      users.forEach(user => {
        const userChores = printableChores.filter(c => c.assigned_to === user.id);
        if (userChores.length === 0) return;
        win.document.write(`<div class="person-section"><div class="person-name">${user.name}</div>`);
        ['daily', 'weekly', 'biweekly', 'monthly'].forEach(freq => {
          const freqChores = userChores.filter(c => c.frequency === freq);
          if (freqChores.length === 0) return;
          const freqLabel = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Bi-Weekly', monthly: 'Monthly' }[freq];
          win.document.write(`<div class="freq-group"><div class="freq-label">${freqLabel}</div><table>`);
          freqChores.forEach(chore => {
            win.document.write(`
              <tr>
                <td style="width: 5%;"><input type="checkbox" /></td>
                <td style="width: 60%; padding-right: 15px;">
                  <div class="chore-title">${chore.title}</div>
                  ${chore.description ? `<div class="chore-desc">${chore.description}</div>` : ''}
                </td>
                <td style="width: 35%;" class="chore-meta">
                  ${chore.room ? `<div>${chore.room}</div>` : ''}
                  ${chore.time_estimate > 0 ? `<div>${chore.time_estimate}min</div>` : ''}
                  ${chore.day_of_week?.length > 0 ? `<div>${chore.day_of_week.map(d => d.slice(0, 3)).join(', ')}</div>` : ''}
                </td>
              </tr>
            `);
          });
          win.document.write(`</table></div>`);
        });
        win.document.write(`</div>`);
      });
    }

    win.document.write(`</body></html>`);
    win.document.close();
    win.print();
  };

  const handlePrint = (isMeals = false) => {
    setPrintNoteDialog(isMeals ? "meals" : "chores");
  };

  const handleEmail = async () => {
    const printableChores = filterUser === "all" ? filteredChores : filteredChores;
    const user = await base44.auth.me();
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayMap = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
    
    let htmlBody = `
      <h1 style="font-size: 28px; margin-bottom: 8px;">Weekly ${filterStatus === "meals" ? "Meal" : "Chore"} Schedule</h1>
      <p style="color: #666; margin-bottom: 30px; font-size: 12px;">
        Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    `;
    
    // Get all items to email
    const itemsToEmail = filterUser === "all" ? printableChores : printableChores;
    
    // Organize by day of week
    const itemsByDay = {};
    daysOfWeek.forEach(day => { itemsByDay[day] = []; });
    
    itemsToEmail.forEach(item => {
      if (item.frequency === "daily") {
        daysOfWeek.forEach(day => itemsByDay[day].push(item));
      } else if (item.frequency === "weekly" && item.day_of_week?.length > 0) {
        item.day_of_week.forEach(shortDay => {
          const fullDay = dayMap[shortDay] || shortDay;
          if (itemsByDay[fullDay]) itemsByDay[fullDay].push(item);
        });
      }
    });

    // Render each day vertically
    daysOfWeek.forEach(day => {
      const dayItems = itemsByDay[day];
      if (dayItems.length === 0) return;
      
      htmlBody += `<h2 style="font-size: 18px; font-weight: bold; margin-top: 25px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #333;">${day}</h2>`;
      dayItems.forEach(item => {
        htmlBody += `
          <div style="margin-bottom: 18px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0;">
            <div style="display: flex; gap: 8px; align-items: flex-start;">
              <input type="checkbox" style="margin-top: 3px; min-width: 16px;" />
              <div style="flex: 1;">
                <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px;">${item.title}</div>
                ${item.description ? `<div style="font-size: 12px; color: #666; margin-bottom: 6px; line-height: 1.4;">${item.description}</div>` : ''}
                <div style="font-size: 11px; color: #777; line-height: 1.6;">
                  ${item.assigned_to ? `<div><strong>${filterStatus === "meals" ? "Chef:" : "Person:"}</strong> ${item.assigned_to}</div>` : ''}
                  ${item.room ? `<div><strong>${filterStatus === "meals" ? "Type:" : "Room:"}</strong> ${item.room}</div>` : ''}
                  ${item.time_estimate > 0 ? `<div><strong>Time:</strong> ${item.time_estimate} min</div>` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
      });
    });
    
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: getFilterLabel(),
      body: htmlBody,
    });
    alert("Sent to your email!");
  };

  const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const DAY_FULL = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

  const MEAL_TYPE_COLORS = {
    Breakfast: "text-amber-400",
    Lunch:     "text-green-400",
    Dinner:    "text-blue-400",
    Snack:     "text-purple-400",
  };

  const renderMealsWeeklyGrid = () => {
    const allMeals = chores.filter(c =>
      isMealType(c.chore_type) &&
      (filterMealStatus === "completed" ? c.status === "completed" : c.status !== "completed") &&
      (!filterUser || filterUser === "__all__" || c.assigned_to === filterUser)
    );

    if (allMeals.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No meals planned</p>;

    const getMealsForDay = (shortDay) => {
      return allMeals.filter(m => {
        if (m.frequency === "daily") return true;
        return m.day_of_week?.includes(shortDay);
      });
    };

    const getMealType = (m) => MEAL_TYPES.includes(m.room) ? m.room : "Other";

    const todayShort = todayShortDefault;

    return (
      <div className="space-y-1">
        {DAYS_SHORT.map(d => {
          const dayMeals = getMealsForDay(d);
          const isToday = d === todayShort;
          const isCollapsed = collapsedMealDays.includes(d);
          // Group by meal type
          const byType = {};
          dayMeals.forEach(m => {
            const t = getMealType(m);
            if (!byType[t]) byType[t] = [];
            byType[t].push(m);
          });
          const activeTypes = [...MEAL_TYPES, "Other"].filter(t => byType[t]?.length > 0);

          return (
            <div key={d} className={cn("rounded-lg border", isToday ? "border-primary/50 bg-primary/5" : "border-border/40 bg-muted/20")}>
              <button
                onClick={() => toggleMealDay(d)}
                className="flex items-center gap-1.5 w-full text-left px-3 py-2.5"
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                <span className={cn("text-xs font-bold uppercase tracking-wider flex-1", isToday ? "text-primary" : "text-muted-foreground")}>
                  {DAY_FULL[d]} {isToday && <span className="ml-1 text-[10px] normal-case font-normal opacity-70">today</span>}
                </span>
                {activeTypes.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">{dayMeals.length} meal{dayMeals.length !== 1 ? "s" : ""}</span>
                )}
              </button>
              {!isCollapsed && (
                <div className="px-3 pb-3">
                  {activeTypes.length === 0 ? (
                    <p className="text-xs text-muted-foreground/40 italic">No meals</p>
                  ) : (
                    <div className="space-y-2">
                      {activeTypes.map(type => (
                        <div key={type}>
                          <div className={cn("text-[10px] font-semibold uppercase tracking-wide mb-1", MEAL_TYPE_COLORS[type] || "text-foreground")}>{type}</div>
                          <div className="space-y-0.5">
                            {byType[type].map(meal => (
                              <SwipeableListItem key={meal.id} onDelete={() => deleteChore(meal.id)}>
                                <Checkbox
                                  checked={meal.status === "completed"}
                                  onCheckedChange={() => toggleChore(meal)}
                                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                                />
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span
                                    className={cn("text-sm leading-tight cursor-pointer select-none", meal.status === "completed" && "line-through text-muted-foreground")}
                                    onDoubleClick={() => setSelectedMeal(meal)}
                                    onClick={() => handleMealTap(meal)}
                                    title="Double-tap for notes"
                                  >
                                    {meal.title}
                                    {meal.notes && <span className="text-primary ml-1">•</span>}
                                  </span>
                                  {(!filterUser || filterUser === "__all__") && meal.assigned_to && (
                                    <span className="text-muted-foreground/60 text-[10px] leading-tight">{getUserName(meal.assigned_to)}</span>
                                  )}
                                </div>
                              </SwipeableListItem>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Deduplicate chores by title+room+frequency, merging assignees into a list
  const deduplicateChores = (choresToRender) => {
    const map = {};
    choresToRender.forEach(c => {
      const key = `${c.title}||${c.room}||${c.frequency}`;
      if (!map[key]) {
        map[key] = { ...c, _assignees: [c.assigned_to], _ids: [c.id] };
      } else {
        if (!map[key]._assignees.includes(c.assigned_to)) {
          map[key]._assignees.push(c.assigned_to);
          map[key]._ids.push(c.id);
        }
      }
    });
    return Object.values(map);
  };

  const renderChoreRow = (chore, showAssignees = false, hiddenLabels = []) => {
    const choreId = chore._ids?.[0] || chore.id;
    const assigneeNames = showAssignees && chore._assignees?.length
      ? chore._assignees.map(id => users.find(u => u.id === id)?.name || id).filter(Boolean)
      : [];
    const showRoom = chore.room && !hiddenLabels.includes("room");
    return (
      <SwipeableListItem
        key={choreId}
        onDelete={() => (chore._ids || [chore.id]).forEach(id => deleteChore(id))}
        isBatchMode={bulkMode}
        isSelected={bulkSelected.has(choreId)}
        onBatchToggle={() => toggleBulkSelect(choreId)}
      >
        {!bulkMode && <Checkbox checked={chore.status === "completed"} onCheckedChange={() => toggleChore(chore)} />}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onDoubleClick={() => !bulkMode && openEditChore(chore)}
          onClick={() => bulkMode ? toggleBulkSelect(choreId) : handleChoreTap(chore)}
        >
          <div className={cn("text-sm font-medium leading-snug", chore.status === "completed" && "line-through text-muted-foreground")}>
            {chore.title}
          </div>
          {(showRoom || chore.time_estimate > 0 || chore.day_of_week?.length > 0 || assigneeNames.length > 0 || chore.last_completed_date) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              {showRoom && chore.room && (
                <span className="text-[11px] text-muted-foreground/70">{chore.room}</span>
              )}
              {chore.time_estimate > 0 && (
                <span className="text-[11px] text-muted-foreground/60">{chore.time_estimate}min</span>
              )}
              {chore.day_of_week?.length > 0 && (
                <span className="text-[11px] text-muted-foreground/60">{chore.day_of_week.map((d) => d.slice(0, 2)).join(" · ")}</span>
              )}
              {assigneeNames.length > 0 && (
                <span className="text-[11px] text-primary/60 font-medium">{assigneeNames.join(", ")}</span>
              )}
              {chore.last_completed_date && (
                <span className="text-[11px] text-green-500/60">✓ {chore.last_completed_date}</span>
              )}
            </div>
          )}
        </div>
      </SwipeableListItem>
    );
  };

  const renderChoresByFrequency = (choresToRender, groupPrefix = "", dedupe = false, hiddenLabels = []) => {
    const chores_ = dedupe ? deduplicateChores(choresToRender) : choresToRender;
    const grouped = {};
    const knownFreqs = ['once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'as_needed'];
    chores_.forEach((c) => {
      const freq = knownFreqs.includes(c.frequency) ? c.frequency : 'other';
      if (!grouped[freq]) grouped[freq] = [];
      grouped[freq].push(c);
    });
    const frequencies = [...knownFreqs, 'other'];
    return (
      <div className="space-y-1.5">
        {frequencies.map((freq) => grouped[freq]?.length > 0 && (() => {
          const key = `${groupPrefix}-${freq}`;
          const isCollapsed = allCollapsed ? !collapsedGroups.includes(key) : collapsedGroups.includes(key);
          const freqIds = grouped[freq].flatMap(c => c._ids || [c.id]);
          const allFreqSelected = freqIds.length > 0 && freqIds.every(id => bulkSelected.has(id));
          const someFreqSelected = freqIds.some(id => bulkSelected.has(id));
          return (
            <div key={freq} className="rounded-lg border border-border/30 bg-muted/20 overflow-hidden">
              <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5", !isCollapsed && "border-b border-border/20")}>
                {bulkMode && (
                  <Checkbox
                    checked={allFreqSelected}
                    data-state={someFreqSelected && !allFreqSelected ? "indeterminate" : undefined}
                    onCheckedChange={() => toggleGroupBulkSelect(freqIds)}
                    className="shrink-0 h-3.5 w-3.5"
                  />
                )}
                <button
                  onClick={() => toggleGroup(key)}
                  className="flex items-center gap-1.5 flex-1 text-left group"
                >
                  {isCollapsed ? <ChevronRight className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                    {frequencyLabels[freq]} <span className="font-normal normal-case opacity-70">({grouped[freq].length})</span>
                  </span>
                </button>
              </div>
              {!isCollapsed && (
                <div className="p-1.5 space-y-1">
                  {grouped[freq].map((chore) => renderChoreRow(chore, dedupe, hiddenLabels))}
                </div>
              )}
            </div>
          );
        })())}
      </div>
    );
  };

  // Cascading grouped render based on filterOrder
  const renderCascaded = () => {
    if (filteredChores.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No chores</p>;

    const firstFilter = filterOrder[0];

    // Helper to render a collapsible group header + content
    // groupChoreIds: flat array of chore IDs in this group (for bulk select)
    const renderGroup = (groupKey, label, choresInGroup, depth = 0, count = null, groupChoreIds = []) => {
      const isCollapsed = allCollapsed ? !collapsedGroups.includes(groupKey) : collapsedGroups.includes(groupKey);
      const allGroupSelected = groupChoreIds.length > 0 && groupChoreIds.every(id => bulkSelected.has(id));
      const someGroupSelected = groupChoreIds.some(id => bulkSelected.has(id));
      return (
        <div key={groupKey} className="rounded-xl border border-border/50 bg-card/60 shadow-sm overflow-hidden">
          <div className={cn("flex items-center gap-1.5 px-3 py-2.5 bg-muted/30 border-b border-border/40", isCollapsed && "border-b-0")}>
            {bulkMode && groupChoreIds.length > 0 && (
              <Checkbox
                checked={allGroupSelected}
                data-state={someGroupSelected && !allGroupSelected ? "indeterminate" : undefined}
                onCheckedChange={() => toggleGroupBulkSelect(groupChoreIds)}
                className="shrink-0"
              />
            )}
            <button onClick={() => toggleGroup(groupKey)} className="flex items-center gap-2 flex-1 text-left group">
              {isCollapsed
                ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              <span className="text-sm font-semibold group-hover:text-primary transition-colors">
                {label}
              </span>
              <span className="text-xs text-muted-foreground font-normal">({count !== null ? count : choresInGroup.length})</span>
            </button>
          </div>
          {!isCollapsed && (
            <div className="p-2 space-y-1">
              {choresInGroup}
            </div>
          )}
        </div>
      );
    };

    if (firstFilter === "user" || (!firstFilter && !filterUser)) {
      const byUser = {};
      filteredChores.forEach(c => {
        const k = c.assigned_to;
        if (!byUser[k]) byUser[k] = [];
        byUser[k].push(c);
      });
      return (
        <div className="space-y-3">
          {Object.entries(byUser).map(([uid, uChores]) => {
            const matchedUser = users.find(u => u.id === uid) || users.find(u => u.name === uid);
            const displayName = matchedUser?.name || "Unassigned";
            const content = renderChoresByFrequency(uChores, `person-${uid}`, false, []);
            const groupIds = uChores.map(c => c.id);
            return renderGroup(`person-${uid}`, displayName, [content], 0, uChores.length, groupIds);
          })}
        </div>
      );
    }

    if (firstFilter === "room") {
      const byRoom = {};
      filteredChores.forEach(c => {
        const k = c.room || "No Room";
        if (!byRoom[k]) byRoom[k] = [];
        byRoom[k].push(c);
      });
      return (
        <div className="space-y-3">
          {Object.entries(byRoom).map(([room, rChores]) => {
            const content = renderChoresByFrequency(rChores, `room-${room}`, true, ["room"]);
            const groupIds = rChores.map(c => c.id);
            return renderGroup(`room-${room}`, room, [content], 0, rChores.length, groupIds);
          })}
        </div>
      );
    }

    if (firstFilter === "category") {
      const byCategory = {};
      filteredChores.forEach(c => {
        const k = c.chore_type || "Uncategorized";
        if (!byCategory[k]) byCategory[k] = [];
        byCategory[k].push(c);
      });
      return (
        <div className="space-y-3">
          {Object.entries(byCategory).map(([cat, cChores]) => {
            const content = renderChoresByFrequency(cChores, `cat-${cat}`, true, ["category"]);
            const groupIds = cChores.map(c => c.id);
            return renderGroup(`cat-${cat}`, cat, [content], 0, cChores.length, groupIds);
          })}
        </div>
      );
    }

    if (firstFilter === "frequency") {
      return renderChoresByFrequency(filteredChores, "freq", true);
    }

    // No filter selected — flat list deduped by frequency
    return renderChoresByFrequency(filteredChores, "all", false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <div className="flex gap-2 flex-wrap">
           <ChoreGenerator choreUsers={users} onChoresCreated={loadData} />
           <ChoreLibraryDialog choreUsers={users} onChoresAssigned={loadData} />
           <Dialog open={userDialog} onOpenChange={setUserDialog}>
            <DialogTrigger asChild><Button variant="outline" size="icon" title="Manage household members" className="bg-secondary/50"><Users className="w-4 h-4" /></Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Household Members</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-3">Add New Member</p>
                  <div><Label>Name</Label><Input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} /></div>
                  <Button onClick={createUser} className="w-full mt-3">Add Person</Button>
                </div>
                {users.filter(u => u.name !== UNASSIGNED_NAME).length > 0 && (
                 <div className="border-t pt-4 space-y-1 max-h-48 overflow-y-auto">
                   {users.filter(u => u.name !== UNASSIGNED_NAME).map(u => (
                     <SwipeableListItem key={u.id} onDelete={() => deleteUser(u.id)}>
                       <span className="text-sm cursor-pointer hover:opacity-70" onClick={() => openEditUser(u)}>{u.name}</span>
                     </SwipeableListItem>
                   ))}
                 </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={choreDialog} onOpenChange={setChoreDialog}>
            <DialogTrigger asChild>
              <Button
                onClick={users.length === 0 ? (e) => { e.preventDefault(); alert("Please add a household member first before creating chores."); } : undefined}
                disabled={false}
              >
                <Plus className="w-4 h-4 mr-2" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>New Chore</DialogTitle></DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <Label>Type <span className="text-destructive">*</span></Label>
                  <div className="flex gap-2 mt-1">
                    {["Chore", "Meal"].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({ ...form, chore_type: type })}
                        className={cn("flex-1 py-2 rounded-md text-sm font-medium border transition-colors", form.chore_type === type ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 border-border text-muted-foreground hover:bg-muted")}
                      >
                        {type === "Meal" ? "Menu / Meal" : "Chore"}
                      </button>
                    ))}
                  </div>
                  {!form.chore_type && <p className="text-xs text-destructive mt-1">Please select a type</p>}
                </div>
                <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Assign To <span className="text-destructive">*</span></Label>
                    <div className={cn("mt-1 border rounded-md p-2 space-y-1 max-h-32 overflow-y-auto bg-transparent", (!form.assigned_to_ids?.length) && "border-destructive/50", "border-input")}>
                      {users.filter(u => u.name !== UNASSIGNED_NAME).map((u) => (
                        <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                          <Checkbox
                            checked={(form.assigned_to_ids || []).includes(u.id)}
                            onCheckedChange={(checked) => {
                              setForm(f => ({
                                ...f,
                                assigned_to_ids: checked
                                  ? [...(f.assigned_to_ids || []), u.id]
                                  : (f.assigned_to_ids || []).filter(id => id !== u.id)
                              }));
                            }}
                          />
                          <span className="text-sm">{u.name}</span>
                        </label>
                      ))}
                    </div>
                    {!form.assigned_to_ids?.length && <p className="text-xs text-destructive mt-1">Select at least one person</p>}
                  </div>
                  <div>
                    <Label>Frequency</Label>
                    <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Once</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="as_needed">As Needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Room</Label>
                    <Select
                      value={form._customRoom ? "__custom__" : (form.room || "")}
                      onValueChange={v => {
                        if (v === "__custom__") setForm(f => ({ ...f, _customRoom: true, room: "" }));
                        else setForm(f => ({ ...f, _customRoom: false, room: v }));
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
                      <SelectContent>
                        {allRooms.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        <SelectItem value="__custom__">Other (custom)…</SelectItem>
                      </SelectContent>
                    </Select>
                    {form._customRoom && (
                      <Input
                        className="mt-2"
                        placeholder="Enter custom room name…"
                        value={form.room}
                        onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                      />
                    )}
                  </div>
                  <div><Label>Time (min)</Label><Input type="number" value={form.time_estimate} onChange={(e) => setForm({ ...form, time_estimate: parseInt(e.target.value) || 0 })} /></div>
                </div>
                {(form.frequency === "weekly" || form.frequency === "biweekly") && (
                <div>
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {daysOfWeek.map((day) => (
                      <button key={day} type="button" onClick={() => toggleDay(day)} className={cn("px-3 py-1 rounded-full text-xs border transition-colors", form.day_of_week.includes(day) ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80")}>
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                )}
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <div className="flex items-center gap-2 p-3 rounded-md bg-muted/40 border border-border">
                  <Checkbox id="save-new-to-library" checked={saveNewToLibrary} onCheckedChange={setSaveNewToLibrary} />
                  <label htmlFor="save-new-to-library" className="text-sm cursor-pointer select-none">Save to library for future use</label>
                </div>
                <Button onClick={createChore} className="w-full">Create Chore</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>



      <ChoresOnboarding
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onDontRemind={() => { setShowOnboarding(false); localStorage.setItem("chores_onboarded", "1"); }}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chores">Chores</TabsTrigger>
          <TabsTrigger value="meals">Menu</TabsTrigger>
        </TabsList>

        <TabsContent value="chores">
          <WidgetCard title="" id="chores-list" headerRight={(
            <div className="flex items-center gap-1 no-print">
              <Button size="icon" variant={bulkMode ? "default" : "ghost"} className="h-8 w-8 bg-secondary/50" onClick={() => bulkMode ? exitBulkMode() : setBulkMode(true)} title={bulkMode ? "Exit bulk select" : "Bulk select"}>
                <CheckSquare className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 bg-secondary/50" onClick={toggleAllCollapsed} title={allCollapsed ? "Expand all" : "Collapse all"}>
                {allCollapsed ? <ChevronsUpDown className="w-4 h-4" /> : <ChevronsDownUp className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handlePrint(false)} title="Print chores">
                <Printer className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleEmail} title="Email chores">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          )}>
            {/* Stats pills + user filter inside widget */}
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { key: "all", label: "All", value: baseFilteredChores.filter(c => c.status !== "completed").length, color: "text-foreground" },
                  { key: "due", label: "Due Today", value: baseFilteredChores.filter(c => isChoresDueToday(c)).length, color: "text-blue-400" },
                  { key: "completed", label: "Done", value: baseFilteredChores.filter(c => c.status === "completed").length, color: "text-green-400" },
                ].map(pill => (
                  <button
                    key={pill.key}
                    onClick={() => setFilterStatus(pill.key)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm transition-colors border",
                      filterStatus === pill.key
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : "bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted/70"
                    )}
                  >
                    <span className={filterStatus === pill.key ? "" : pill.color}>{pill.value}</span>
                    <span>{pill.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap items-center">
                {users.length >= 1 && (
                  <Select
                    value={filterUser === null ? "__none__" : filterUser}
                    onValueChange={v => {
                      if (v === "__none__") {
                        setFilterUser(null);
                        setFilterOrder(prev => prev.filter(k => k !== "user"));
                      } else if (v === "__all__") {
                        setFilterUser("__all__");
                        setFilterOrder(prev => prev.includes("user") ? prev : [...prev, "user"]);
                      } else {
                        setFilterWithOrder("user", v, setFilterUser);
                      }
                    }}
                  >
                    <SelectTrigger className={cn("w-36 h-7 text-xs border", filterUser ? "bg-primary/20 border-primary/50 text-primary" : "bg-secondary/50 border-border/40")}>
                      <SelectValue placeholder="Member…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Member…</SelectItem>
                      <SelectItem value="__all__">All Members</SelectItem>
                      {users.filter(u => u.name !== UNASSIGNED_NAME).map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {allRooms.length > 0 && (
                <Select
                  value={filterRoom === null ? "__none__" : filterRoom}
                  onValueChange={v => {
                    if (v === "__none__") { setFilterRoom(null); setFilterOrder(prev => prev.filter(k => k !== "room")); }
                    else if (v === "__all__") { setFilterRoom("__all__"); setFilterOrder(prev => prev.includes("room") ? prev : [...prev, "room"]); setFilterStatus("all"); }
                    else { setFilterWithOrder("room", v, setFilterRoom); setFilterStatus("all"); }
                  }}
                 >
                   <SelectTrigger className={cn("w-32 h-7 text-xs border", filterRoom ? "bg-primary/20 border-primary/50 text-primary" : "bg-secondary/50 border-border/40")}>
                     <SelectValue placeholder="Location…">
                       {filterRoom === "__all__" ? "All Locations" : filterRoom || "Location…"}
                     </SelectValue>
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="__none__"><span className="text-muted-foreground italic">Clear</span></SelectItem>
                     <SelectItem value="__all__">All Locations</SelectItem>
                     {allRooms.map(r => (
                       <SelectItem key={r} value={r}>{r}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                )}

                <Select
                 value={filterFrequency === null ? "__none__" : filterFrequency}
                 onValueChange={v => {
                   if (v === "__none__") { setFilterFrequency(null); setFilterOrder(prev => prev.filter(k => k !== "frequency")); }
                   else if (v === "__all__") { setFilterFrequency("__all__"); setFilterOrder(prev => prev.includes("frequency") ? prev : [...prev, "frequency"]); }
                   else { setFilterWithOrder("frequency", v, setFilterFrequency); }
                 }}
                >
                 <SelectTrigger className={cn("w-32 h-7 text-xs border", filterFrequency ? "bg-primary/20 border-primary/50 text-primary" : "bg-secondary/50 border-border/40")}>
                   <SelectValue placeholder="Frequency…">
                     {filterFrequency === "__all__" ? "All Frequencies" : filterFrequency === "weekdays" ? "Weekdays" : filterFrequency === "weekends" ? "Weekends" : filterFrequency ? (frequencyLabels[filterFrequency] || filterFrequency) : "Frequency…"}
                   </SelectValue>
                 </SelectTrigger>
                 <SelectContent>
                 <SelectItem value="__none__"><span className="text-muted-foreground italic">Clear</span></SelectItem>
                 <SelectItem value="__all__">All Frequencies</SelectItem>
                 {allFrequencies.map(k => <SelectItem key={k} value={k}>{frequencyLabels[k] || k}</SelectItem>)}
                 <SelectItem value="weekdays">Weekdays</SelectItem>
                 <SelectItem value="weekends">Weekends</SelectItem>
                 </SelectContent>
                </Select>
                <Select
                  value={filterTime === null ? "__none__" : filterTime}
                  onValueChange={v => {
                    if (v === "__none__") { setFilterTime(null); }
                    else { setFilterTime(v); }
                  }}
                >
                  <SelectTrigger className={cn("w-32 h-7 text-xs border", filterTime ? "bg-primary/20 border-primary/50 text-primary" : "bg-secondary/50 border-border/40")}>
                    <SelectValue placeholder="Duration…">
                      {filterTime === "quick" ? "≤ 15 min" : filterTime === "medium" ? "16–30 min" : filterTime === "long" ? "> 30 min" : "Duration…"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__"><span className="text-muted-foreground italic">Clear</span></SelectItem>
                    <SelectItem value="quick">≤ 15 min</SelectItem>
                    <SelectItem value="medium">16–30 min</SelectItem>
                    <SelectItem value="long">&gt; 30 min</SelectItem>
                  </SelectContent>
                </Select>

                {(filterUser || filterRoom || filterFrequency || filterTime) && (
                  <button
                    onClick={() => { setFilterUser(null); setFilterRoom(null); setFilterCategory(null); setFilterFrequency(null); setFilterTime(null); setFilterOrder([]); }}
                    className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-1 rounded hover:bg-muted/50 transition-colors"
                    title="Clear all filters"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {renderCascaded()}
            </div>
          </WidgetCard>
        </TabsContent>

        <TabsContent value="meals">
          {users.length >= 1 && (
            <div className="flex gap-2 flex-wrap no-print mb-3">
              <Select value={filterUser || "__none__"} onValueChange={v => {
                if (v === "__none__") {
                  setFilterUser(null);
                  setFilterOrder(prev => prev.filter(k => k !== "user"));
                } else {
                  setFilterWithOrder("user", v, setFilterUser);
                }
              }}>
                <SelectTrigger className="w-40 bg-primary text-primary-foreground">
                  <SelectValue placeholder="Member…" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="__none__">Member…</SelectItem>
                   {users.filter(u => u.name !== UNASSIGNED_NAME).map((u) => (
                     <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                   ))}
                </SelectContent>
              </Select>
              <Select value={filterMealStatus} onValueChange={setFilterMealStatus}>
                <SelectTrigger className="w-36 bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Upcoming</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost" className="h-9 w-9 bg-secondary/50" onClick={toggleAllMealDays} title={allMealDaysCollapsed ? "Expand all days" : "Collapse all days"}>
                {allMealDaysCollapsed ? <ChevronsUpDown className="w-4 h-4" /> : <ChevronsDownUp className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 bg-secondary/50" onClick={() => handlePrint(true)} title="Print meal schedule">
                <Printer className="w-4 h-4" />
              </Button>
            </div>
          )}
          <WidgetCard title="" id="chores-list-meals">
            {renderMealsWeeklyGrid()}
          </WidgetCard>
        </TabsContent>
      </Tabs>

      {/* Edit Chore Dialog */}
      <Dialog open={!!editingChore} onOpenChange={(o) => !o && setEditingChore(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Chore</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div><Label>Title</Label><Input value={editForm.title || ""} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div>
              <Label>Category</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {[...new Set(["Cleaning", "Organizing", "Maintenance", "Other", ...allCategories])].filter(type => !isMealType(type)).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEditForm(f => ({ ...f, chore_type: type }))}
                    className={cn("px-3 py-1 rounded-full text-xs border transition-colors", editForm.chore_type === type ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 border-border text-muted-foreground hover:bg-muted")}
                  >
                    {type === "Meal" ? "Menu / Meal" : type}
                  </button>
                ))}
              </div>
              <Input
                className="mt-2 h-8 text-xs"
                placeholder="Or type a custom category…"
                value={["Cleaning", "Organizing", "Maintenance", "Other", ...allCategories].includes(editForm.chore_type) ? "" : (editForm.chore_type || "")}
                onChange={e => setEditForm(f => ({ ...f, chore_type: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Assign To</Label>
                <div className="mt-1 border border-input rounded-md p-2 space-y-1 max-h-32 overflow-y-auto bg-transparent">
                  {users.filter(u => u.name !== UNASSIGNED_NAME).map(u => (
                    <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                      <Checkbox
                        checked={(editForm.assigned_to_ids || []).includes(u.id)}
                        onCheckedChange={() => toggleEditAssignedTo(u.id)}
                      />
                      <span className="text-sm">{u.name}</span>
                    </label>
                  ))}
                </div>
                {(editForm.assigned_to_ids?.length ?? 0) > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">Will create a copy for each additional person</p>
                )}
              </div>
              <div>
                <Label>Frequency</Label>
                <Select value={editForm.frequency || "weekly"} onValueChange={v => setEditForm(f => ({ ...f, frequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="as_needed">As Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Room</Label>
                <Input list="room-suggestions" value={editForm.room || ""} onChange={e => setEditForm(f => ({ ...f, room: e.target.value }))} />
              </div>
              <div><Label>Time (min)</Label><Input type="number" value={editForm.time_estimate || 0} onChange={e => setEditForm(f => ({ ...f, time_estimate: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            {(editForm.frequency === "weekly" || editForm.frequency === "biweekly") && (
              <div>
                <Label>Days of Week</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {daysOfWeek.map(day => (
                    <button key={day} type="button" onClick={() => toggleEditDay(day)}
                      className={cn("px-3 py-1 rounded-full text-xs border transition-colors",
                        editForm.day_of_week?.includes(day) ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80")}>
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div><Label>Description</Label><Textarea value={editForm.description || ""} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Notes</Label><Textarea value={editForm.notes || ""} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted/40 border border-border">
              <Checkbox id="edit-save-library" checked={editSaveToLibrary} onCheckedChange={setEditSaveToLibrary} />
              <label htmlFor="edit-save-library" className="text-sm cursor-pointer select-none">Save to library for future use</label>
            </div>
            <Button onClick={saveEditChore} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Bar */}
      {bulkMode && bulkSelected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-card border border-border rounded-full shadow-xl px-4 py-2.5">
          <span className="text-sm font-medium text-muted-foreground mr-1">{bulkSelected.size} selected</span>
          <Button size="sm" variant="outline" className="gap-1.5 rounded-full h-8" onClick={() => { setBulkReassignIds([]); setBulkReassignOpen(true); }}>
            <UserCheck className="w-3.5 h-3.5" />
            Reassign
          </Button>
          <Button size="sm" variant="destructive" className="gap-1.5 rounded-full h-8" onClick={() => setBulkDeleteConfirmOpen(true)}>
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
          <button onClick={exitBulkMode} className="ml-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bulk Reassign Dialog */}
      <Dialog open={bulkReassignOpen} onOpenChange={setBulkReassignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reassign {bulkSelected.size} Chore{bulkSelected.size !== 1 ? "s" : ""}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Select who to assign these chores to:</p>
            <div className="space-y-1 border border-input rounded-md p-2 max-h-48 overflow-y-auto">
              {users.filter(u => u.name !== "UNASSIGNED").map(u => (
                <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 py-1">
                  <Checkbox
                    checked={bulkReassignIds.includes(u.id)}
                    onCheckedChange={(checked) => setBulkReassignIds(prev => checked ? [...prev, u.id] : prev.filter(id => id !== u.id))}
                  />
                  <span className="text-sm">{u.name}</span>
                </label>
              ))}
            </div>
            {bulkReassignIds.length > 1 && <p className="text-xs text-muted-foreground">Will create copies for each additional person.</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setBulkReassignOpen(false)}>Cancel</Button>
              <Button className="flex-1" disabled={bulkReassignIds.length === 0} onClick={() => bulkReassign(bulkReassignIds)}>Apply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Note Dialog */}
      <Dialog open={!!printNoteDialog} onOpenChange={(o) => !o && setPrintNoteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add a Note to Print</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Custom Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                className="mt-1.5"
                placeholder="e.g. Week of June 9 • Great job everyone!"
                value={printNote}
                onChange={e => setPrintNote(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPrintNoteDialog(null)}>Cancel</Button>
              <Button className="flex-1 gap-2" onClick={() => { executePrint(printNote, printNoteDialog === "meals"); setPrintNoteDialog(null); }}>
                <Printer className="w-4 h-4" />
                Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirm Dialog */}
      <Dialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete {bulkSelected.size} Chore{bulkSelected.size !== 1 ? "s" : ""}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setBulkDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={bulkDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={editUserForm.name} onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })} autoFocus />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"].map(color => (
                  <button
                    key={color}
                    onClick={() => setEditUserForm({ ...editUserForm, color })}
                    className={cn("w-8 h-8 rounded-full border-2 transition-all", editUserForm.color === color ? "border-foreground" : "border-border")}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1">Cancel</Button>
              <Button onClick={saveEditUser} disabled={!editUserForm.name} className="flex-1">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meal Notes Dialog */}
      <Dialog open={!!selectedMeal} onOpenChange={(o) => !o && setSelectedMeal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedMeal?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {selectedMeal?.room && (
              <div><span className="text-muted-foreground font-medium">Type: </span>{selectedMeal.room}</div>
            )}
            {selectedMeal?.description && (
              <div><span className="text-muted-foreground font-medium">Description: </span>{selectedMeal.description}</div>
            )}
            {selectedMeal?.notes ? (
              <div>
                <div className="text-muted-foreground font-medium mb-1">Notes / Directions:</div>
                <div className="bg-muted/50 rounded-md p-3 whitespace-pre-wrap leading-relaxed">{selectedMeal.notes}</div>
              </div>
            ) : (
              <p className="text-muted-foreground italic">No notes or directions saved.</p>
            )}
            {selectedMeal?.time_estimate > 0 && (
              <div><span className="text-muted-foreground font-medium">Time: </span>{selectedMeal.time_estimate} min</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}