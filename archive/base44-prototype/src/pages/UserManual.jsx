import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, LayoutDashboard, CheckSquare, ListTodo, Calendar, Clock, Sparkles, GraduationCap, Target, Quote, Library, Palette, Settings, BookOpen, Eye } from "lucide-react";
import { useHeader } from "@/lib/HeaderContext";
import { cn } from "@/lib/utils";

const sections = [
  {
    id: "overview",
    icon: BookOpen,
    title: "App Overview",
    color: "text-blue-500",
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p><strong>Dash it, Dash it ALL!</strong> is a personal productivity dashboard designed to keep your whole life organized in one place. It brings together your schedule, tasks, chores, education plans, goals, daily checklist, motivational quotes, and saved links — all with optional Google Calendar and Google Tasks sync.</p>
        <p>Use the <strong>sidebar</strong> on the left to navigate between sections. On mobile, tap the hamburger menu (☰) in the top-left to open the sidebar.</p>
        <p>The sidebar can be <strong>collapsed</strong> to icon-only mode on desktop by clicking the arrow (‹) at the top of the sidebar.</p>
      </div>
    )
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard",
    color: "text-indigo-500",
    content: (
      <div className="space-y-4 text-sm text-foreground/80">
        <p>The Dashboard is your home base — a customizable summary of everything happening today with real-time updates across all your data sources.</p>
        <div className="space-y-3">
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-1">Dashboard Customization</h4>
            <ul className="list-disc list-inside space-y-1.5 ml-2 mt-2">
              <li>Click the <strong>⇅ reorder icon</strong> in the top-right to drag and rearrange any widget into your preferred order.</li>
              <li>Customize the <strong>dashboard header greeting</strong> name in Theme Editor settings.</li>
              <li>Toggle features on/off (Education, Chores, Vision Board) in Settings to show/hide their dashboard widgets.</li>
              <li>Your layout and preferences are <strong>saved automatically</strong> across all devices and sessions.</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-1">Vision Slideshow Button</h4>
            <p>Click the <strong>Vision</strong> button to launch an inspirational slideshow using your Vision Board images and affirmations. Choose <strong>Auto-Generated</strong> (AI-curated based on your lowest-scoring health pillars) or <strong>Custom</strong> (your selected images and saved affirmations).</p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-1">Today's Schedule Widget</h4>
            <p>Shows upcoming events for today from your synced Google Calendar and manually added schedule items, in chronological order.</p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-1">Today's Tasks Widget</h4>
            <p>Displays pending and in-progress tasks due today. Check tasks off directly here. Tasks are color-coded by priority.</p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-1">Goals Overview Widget</h4>
            <p>A summary of active goals with progress bars. Goals due today can be checked off with the checkmark button. Click through to the Goals page for full detail.</p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-1">Weather Widget</h4>
            <p>Shows current weather for your location. Requires browser location permission on first load. Displays temperature, conditions, and a short forecast.</p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-1">Daily Checklist Widget</h4>
            <p>Shows active checklist items for today. Check items off directly here. Completions reset each day automatically.</p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-1">Daily Quote Widget</h4>
            <p>Displays an AI-generated motivational quote. Click <strong>"New Quote"</strong> to generate a fresh one. Quotes can be saved and reflected on in the full <strong>Daily Quotes</strong> page.</p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-1">Focal Areas Widget</h4>
            <p>Shows your lowest-performing health pillars based on your most recent daily evaluation. Click the <strong>target icon</strong> (blue when no evaluation done today) to go directly to the Daily Evaluation.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "checklist",
    icon: CheckSquare,
    title: "Daily Checklist",
    color: "text-green-500",
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>The Daily Checklist is for recurring routines — things you want to do every day like morning habits, evening wind-down, or anytime tasks. Access this guide anytime via the Guide button on the Daily Checklist page.</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li><strong>Add items</strong> using the "Add Item" button — give each item a title, optional time, category (morning / afternoon / evening / anytime), and a color label.</li>
          <li><strong>Check off items</strong> by clicking the checkbox. Completions are tracked per day.</li>
          <li>Items <strong>reset automatically</strong> each new day — completion is date-specific.</li>
          <li><strong>Edit items</strong> by double-clicking or clicking and holding on an item.</li>
          <li><strong>Delete items</strong> by swiping left (mobile) or using the delete button on hover. Use the "Select" button for batch deletion.</li>
          <li>Items are grouped by category: Morning (🌅), Afternoon (☀️), Evening (🌙), and Anytime (⏰).</li>
          <li>A <strong>progress bar</strong> at the top shows how many items you've completed today.</li>
        </ul>
      </div>
    )
  },
  {
    id: "tasks",
    icon: ListTodo,
    title: "Tasks",
    color: "text-orange-500",
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>Tasks are one-time or recurring to-dos with due dates, priorities, categories, and optional Google Tasks sync for seamless productivity.</p>
        <div className="space-y-3">
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-2">Creating & Managing Tasks</h4>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Click <strong>"Add Task"</strong> to create a new task — fill in title, description, due date, due time, priority (low / medium / high / urgent), and category label.</li>
              <li><strong>Priority color coding:</strong> Low (gray), Medium (blue), High (orange), Urgent (red).</li>
              <li><strong>Task status workflow:</strong> Pending → In Progress → Completed. Click the status circle to advance through states.</li>
              <li><strong>Category labels:</strong> Assign custom color-coded categories to organize tasks (e.g., Work, Personal, Shopping, etc.).</li>
              <li><strong>Edit tasks</strong> by clicking the task row to open the detail editor where you can modify all fields including dates, times, and links.</li>
              <li><strong>Delete tasks</strong> via the action menu — deleted tasks can be recovered from the Trash Bin in Settings within 30 days.</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-2">Recurring Tasks</h4>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Toggle <strong>"Is Recurring"</strong> when creating a task to enable repeat patterns.</li>
              <li>Set frequency to <strong>Daily, Weekly</strong> (choose specific days), or <strong>Monthly</strong>.</li>
              <li>Recurring tasks <strong>reset automatically</strong> at the start of the next cycle after completion.</li>
              <li>Edit the recurrence pattern anytime without affecting completion history.</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-2">Filtering & Syncing</h4>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li><strong>Filter & sort</strong> by status, priority, due date, or category using the controls at the top.</li>
              <li><strong>Search tasks</strong> by keyword to quickly find what you need.</li>
              <li><strong>Google Tasks sync:</strong> Connect Google Tasks in Settings, then use the "Sync" button to pull tasks in bidirectionally. Matched tasks update automatically.</li>
              <li>Set a <strong>default sync category</strong> in Settings to apply automatically to newly synced Google Tasks.</li>
              <li><strong>Add to Schedule:</strong> Push tasks with a due date to your Daily Schedule by selecting a specific time slot from the task editor.</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "calendar",
    icon: Calendar,
    title: "Calendar",
    color: "text-blue-500",
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>The Calendar shows a monthly view of all your scheduled events, with the ability to add custom events and sync from Google Calendar.</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li><strong>Click a day</strong> to see all events for that date in the side panel.</li>
          <li><strong>Add an event</strong> by clicking the "+" button or the "Add Event" button — fill in title, start/end time, notes, and color.</li>
          <li><strong>Delete an event</strong> by swiping left on it (mobile) or hovering and clicking the trash icon. If the event came from Google Calendar, it will also be deleted there.</li>
          <li><strong>Google Calendar Sync:</strong> Connect your Google Calendar in Settings, select which calendars to sync, then click "Sync Google Calendar" to import events. Events sync for the past 30 days and forward.</li>
          <li>Events from Google Calendar are shown with a calendar icon and cannot be fully edited — edit them in Google Calendar directly.</li>
          <li>Use the <strong>Print</strong> or <strong>Email</strong> icons in the widget header to export your schedule.</li>
        </ul>
      </div>
    )
  },
  {
    id: "schedule",
    icon: Clock,
    title: "Daily Schedule",
    color: "text-purple-500",
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>The Daily Schedule is a time-grid view of a single day. Items are loaded only for the selected date, so the grid populates quickly.</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li><strong>Navigate dates</strong> using the arrow buttons or clicking the date picker at the top.</li>
          <li><strong>Auto-population:</strong> The schedule automatically pulls in calendar events, tasks with a scheduled time, education activities, and chores due that day — filtered by date for speed.</li>
          <li><strong>Add a custom time block</strong> using the "+" button — specify title, start/end time, color, and notes.</li>
          <li><strong>Item Library:</strong> The side panel contains all your unscheduled tasks and goal milestone tasks. Items due today appear in blue; overdue in red. Already-scheduled items are highlighted. Pin items to the top for quick access.</li>
          <li><strong>Schedule from library:</strong> Tap any library item, choose a start time and duration, and it drops onto the timeline.</li>
          <li><strong>Mark complete:</strong> Click the checkbox on any grid block to mark it done. Completion syncs back to Tasks automatically.</li>
          <li><strong>Overlapping events</strong> are displayed side-by-side in columns automatically.</li>
          <li><strong>Hide/show:</strong> Toggle the eye icon to hide completed items. Hide individual items from the grid without deleting them — restore from the hidden panel at any time.</li>
          <li><strong>Adjust hours:</strong> Use the clock icon in the header to set your active day start/end hours.</li>
          <li>Use the <strong>print or email</strong> icons to export your daily schedule.</li>
        </ul>
      </div>
    )
  },
  {
    id: "chores",
    icon: Sparkles,
    title: "Chores",
    color: "text-yellow-500",
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>Track household chores with frequency schedules and assignments. Use AI-powered chore generation or manually create tasks for your household.</p>
        <div className="space-y-3">
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-2">Core Features</h4>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li><strong>Add a chore</strong> — give it a title, description, room, frequency (daily / weekly / biweekly / monthly), day(s) of week, priority, and assign it to a household member. Frequency can be assigned after creation.</li>
              <li><strong>Household members</strong> are managed via the "Members" tab — add people with a name and color.</li>
              <li><strong>Mark complete</strong> by clicking the checkmark on a chore. It records the completion date.</li>
              <li><strong>Overdue chores</strong> are automatically highlighted so nothing gets missed.</li>
              <li>Filter chores by <strong>room, member, or status</strong> using the filter controls.</li>
              <li>Chores can be set to recur automatically — after completion, the next due date is calculated based on the frequency.</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-2">AI Chore Generator</h4>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Click the <strong>"Generate with AI"</strong> button to create chores automatically based on your household.</li>
              <li>Select a <strong>room</strong> (Kitchen, Bathroom, Bedroom, Living Room, Outdoor, or General).</li>
              <li>Choose an <strong>age group</strong> (Adults, Teens, Older Children, Younger Children, or Mixed) to generate age-appropriate tasks.</li>
              <li>Select a <strong>chore type</strong> from predefined options (Cleaning, Organizing, Maintenance) or choose "Other" to specify a custom type.</li>
              <li>When "Other" is selected, enter a custom chore type (e.g., "Yard Work", "Pet Care", etc.).</li>
              <li>Set the <strong>quantity</strong> of chores to generate (default: 5).</li>
              <li>Review AI-generated suggestions, select which ones you want to assign, choose household members to assign them to, and optionally save new chores to your Chore Library for future reuse.</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-2">Chore Library</h4>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Access saved chore templates from the <strong>Library tab</strong>.</li>
              <li><strong>Add chores from the library</strong> by selecting them and assigning to household members quickly.</li>
              <li>Save frequently-used chores to the library when generating with AI for faster setup in the future.</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "education",
    icon: GraduationCap,
    title: "Education",
    color: "text-teal-500",
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>Plan and track homeschool, tutoring, or extracurricular learning for multiple learners with AI-powered activity generation and scheduling.</p>
        <div className="space-y-3">
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-2">Setting Up Learners & Plans</h4>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li><strong>Create learners</strong> first via the <strong>Learners tab</strong> — give each a name, grade level, and color for easy visual identification.</li>
              <li><strong>Create education plans</strong> per learner — assign a subject, title, description, due date, materials link, and notes.</li>
              <li>Each learner can have <strong>multiple plans</strong> for different subjects or courses running simultaneously.</li>
              <li><strong>Plan status:</strong> Not Started → In Progress → Completed. Track progress with manual updates.</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-2">Activities & Assignments</h4>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li><strong>Add activities</strong> within a plan — specify type (assignment or activity), frequency (once, daily, weekly, biweekly, monthly), and specific days.</li>
              <li><strong>One-time activities</strong> complete once and are archived.</li>
              <li><strong>Recurring activities</strong> automatically reset on their next scheduled day after completion.</li>
              <li><strong>Mark activities complete</strong> by clicking the checkbox. Completion dates are tracked per activity.</li>
              <li>Add <strong>resource links</strong> to activities for easy access to learning materials.</li>
              <li><strong>Add to Schedule:</strong> Push activities to Daily Schedule with a specific time slot for time-blocked learning sessions.</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-2">AI Activity Generator & Library</h4>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Click <strong>"Generate with AI"</strong> to create activities based on learner age, subject, and activity type.</li>
              <li>AI generates <strong>age-appropriate, hands-on activities</strong> tailored to specific learning goals.</li>
              <li>Review suggestions, select which activities to assign, choose target plans, and optionally <strong>save to Activity Library</strong> for future reuse.</li>
              <li>Access the <strong>Activity Library</strong> tab to browse saved favorite activities and quickly assign them to new plans.</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-2">Filtering & Organization</h4>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Filter plans and activities by <strong>learner or subject</strong> using the controls at the top.</li>
              <li>View all learners' plans in a combined view or filter to a specific learner for focused lesson planning.</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "goals",
    icon: Target,
    title: "Goals",
    color: "text-rose-500",
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>Set and track personal or family goals across different timeframes with milestone tracking, progress monitoring, and integration with your Vision Board health pillars.</p>
        <div className="space-y-3">
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-2">Creating & Managing Goals</h4>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Click <strong>"Add Goal"</strong> to create — fill in title, description, timeframe (daily / weekly / monthly / annual / 3-year / 5-year), and target date.</li>
              <li>Assign goals to a <strong>member name</strong> (personal or family member) for accountability and tracking.</li>
              <li>Set <strong>occurrences count</strong> — the number of times the goal must be completed (e.g., "Run 5K" = 1 occurrence, "Exercise 30 days" = 30 occurrences).</li>
              <li><strong>Goal status workflow:</strong> Not Started → In Progress → Completed → On Hold. Track which goals are active or on hold.</li>
              <li><strong>Progress slider</strong> (0–100%) to manually update progress toward completion — reflects partial progress toward multi-occurrence goals.</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-2">Milestone Tasks</h4>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li><strong>Add milestone tasks</strong> within a goal — smaller action items with their own frequency (once / daily / weekly / biweekly / monthly).</li>
              <li>Milestone tasks appear automatically in the <strong>Daily Schedule item library</strong> for time-blocked scheduling.</li>
              <li>Mark milestones complete to track incremental progress toward the overall goal.</li>
              <li>Recurring milestone tasks reset on their scheduled day and can contribute to goal completion tracking.</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-2">Vision Board Integration</h4>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>After completing a <strong>Daily Evaluation</strong> on the Vision Board, low-scoring pillars (rated 1–3) are highlighted as focal areas.</li>
              <li><strong>Auto-convert focal areas to goals</strong> — directly create goals from low-scoring pillars to address wellness gaps.</li>
              <li>Track goals tied to specific health pillars to improve overall well-being.</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-2">Dashboard & Archiving</h4>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li><strong>Dashboard Goals Widget:</strong> Shows active goals with progress bars. Goals due today can be checked off directly.</li>
              <li><strong>Archive completed goals</strong> to keep your active list clean and focused.</li>
              <li>Use the <strong>restore button</strong> (⟲) in the <strong>Archive tab</strong> to move goals back to In Progress status.</li>
              <li>Filter goals by <strong>timeframe or member</strong> using the tabs and controls at the top.</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "quotes",
    icon: Quote,
    title: "Daily Quotes",
    color: "text-amber-500",
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>A space for daily inspiration and personal reflection.</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li>Each day, an <strong>AI-generated motivational quote</strong> is displayed automatically.</li>
          <li>Click <strong>"New Quote"</strong> to generate a fresh quote for today.</li>
          <li>Write a <strong>personal reflection</strong> in the text area below the quote and save it.</li>
          <li><strong>Favorite a quote</strong> by clicking the heart icon — favorited quotes appear in a separate section.</li>
          <li>Past quotes are saved in <strong>Quote History</strong> — scroll down to browse previous days.</li>
          <li><strong>Delete</strong> individual quotes from your history using the trash icon.</li>
          <li><strong>Export reflections</strong> via print or email using the icons in the widget header.</li>
        </ul>
      </div>
    )
  },
  {
    id: "links",
    icon: Library,
    title: "Link Library",
    color: "text-cyan-500",
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>Save and organize frequently used links and bookmarks in one place.</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li><strong>Add a link</strong> — provide a title, URL, and optional category. The app will attempt to auto-fetch a thumbnail image.</li>
          <li>Links are displayed as <strong>cards with thumbnails</strong> for easy visual recognition.</li>
          <li><strong>Filter by category</strong> using the tabs at the top to quickly find the link you need.</li>
          <li><strong>Click a link card</strong> to open the URL in a new tab.</li>
          <li><strong>Delete a link</strong> using the trash icon on the card.</li>
        </ul>
      </div>
    )
  },
  {
    id: "visionboard",
    icon: Eye,
    title: "Vision Board",
    color: "text-violet-500",
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>Create an inspirational vision collage with health pillars, daily evaluations, affirmations, and automated slideshows.</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li><strong>Health Pillars:</strong> Manage 13 core wellness areas (Nutrition, Fitness, Mindset, Rest, etc.) organized by Maslow's hierarchy. Each pillar can have a description, activities, and a visibility toggle. The Guide button re-shows the onboarding walkthrough.</li>
          <li><strong>Daily Evaluation:</strong> Rate each pillar 1–5 daily. Record activities completed and personal notes. After rating, you can optionally convert low-scoring pillars into tracked Goals. Use the calendar icon to view or edit evaluations for past dates — days with existing evaluations are marked with a dot.</li>
          <li><strong>Weekly Review:</strong> See performance trends with bar charts and a daily breakdown. Switch between This Week, 3 Months, and All Time views. Focal areas show average scores per pillar. Print or email your review.</li>
          <li><strong>Affirmation Manager:</strong> Create custom affirmations or generate them via AI for specific pillars. Star favorites for quick access. Select multiple affirmations to apply to your custom slideshow.</li>
          <li><strong>Vision Collage:</strong> Upload public images (URL-based) or private images (securely stored, only visible to you). Toggle individual images to show or hide them from the slideshow. Private images are displayed via time-limited signed URLs.</li>
          <li><strong>Slideshow — Auto-Generated:</strong> Launches with all collage images. AI generates affirmations specifically for pillars you rated 3 or below in your most recent evaluation, interleaved in round-robin order so every focus area is represented. Also accessible from the Dashboard Vision button.</li>
          <li><strong>Slideshow — Custom:</strong> Select exactly which images to include and uses your saved affirmations. Launch from the Collage tab or Dashboard.</li>
          <li><strong>Slideshow Controls:</strong> Ken Burns zoom animation per slide. Adjust speed (3–30 seconds per slide). Toggle affirmation overlay on/off. Navigate manually with arrow buttons. Choose from ambient audio presets (rain, ocean, music, etc.), shuffle audio, favorite and set a default track. Double-tap/double-click to show/hide controls on mobile.</li>
          <li><strong>Reminders:</strong> Set daily reminders to review your vision board using the bell icon.</li>
        </ul>
      </div>
    )
  },
  {
    id: "theme",
    icon: Palette,
    title: "Theme Editor",
    color: "text-pink-500",
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>Customize the look and feel of your entire dashboard.</p>
        <ul className="list-disc list-inside space-y-1.5 ml-2">
          <li><strong>Primary color:</strong> Changes the main accent color used for buttons, active nav items, and highlights.</li>
          <li><strong>Accent color:</strong> Secondary highlight color used for badges and decorative elements.</li>
          <li><strong>Background image:</strong> Upload a photo or paste a URL to set a full-screen background. Multiple images can be saved to a history and randomized on each load.</li>
          <li><strong>Widget opacity:</strong> Adjust how transparent or opaque the widget cards appear over the background.</li>
          <li><strong>Widget border radius:</strong> Control how rounded the widget card corners are.</li>
          <li><strong>Fonts:</strong> Choose heading and body fonts from Google Fonts.</li>
          <li><strong>Dark mode:</strong> Toggle the entire app between light and dark themes.</li>
          <li><strong>Dashboard header name:</strong> Customize the greeting name shown on the Dashboard.</li>
          <li>All theme changes are <strong>saved automatically</strong> and applied app-wide instantly.</li>
        </ul>
      </div>
    )
  },
  {
    id: "settings",
    icon: Settings,
    title: "Settings",
    color: "text-slate-500",
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>Manage your account, integrations, and data.</p>
        <div className="space-y-3">
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-1">Account</h4>
            <p>View your name and email. Delete your account permanently (cannot be undone).</p>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-1">Google Calendar Integration</h4>
            <ul className="list-disc list-inside space-y-1 mt-1 ml-2">
              <li>Click <strong>Connect Google Calendar</strong> to authorize access.</li>
              <li>Once connected, click <strong>Manage Calendars</strong> to toggle which calendars to sync.</li>
              <li>Click <strong>Sync Now</strong> to pull events (past 30 days and forward). Invalid calendars are auto-deselected.</li>
              <li>Set <strong>Auto-Sync times</strong> to have the app sync automatically at specific times each day.</li>
              <li><strong>Disconnect</strong> at any time to remove access.</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-1">Google Tasks Integration</h4>
            <ul className="list-disc list-inside space-y-1 mt-1 ml-2">
              <li>Connect Google Tasks to sync task lists from Google into the app.</li>
              <li>Use the <strong>Sync Tasks</strong> button to pull tasks in. Existing tasks matched by Google Task ID are updated; new ones are created.</li>
              <li>Set a default <strong>task category label and color</strong> to apply automatically to synced tasks.</li>
            </ul>
          </div>
          <div className="border border-border rounded-lg p-3">
            <h4 className="font-semibold text-foreground mb-1">Data Management</h4>
            <p>Delete all synced calendar or task data from the app without affecting your actual Google data. Useful for re-syncing from scratch. You can also review and manage <strong>deleted sync items</strong> to prevent unwanted re-imports.</p>
          </div>
        </div>
      </div>
    )
  }
];

function SectionItem({ section }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-muted/90">
      <button
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/95 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <Icon className={cn("w-5 h-5 shrink-0", section.color)} />
        <span className="font-semibold text-foreground flex-1">{section.title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-border">
          {section.content}
        </div>
      )}
    </div>
  );
}

export default function UserManual() {
  const { setTitle } = useHeader();
  useEffect(() => { setTitle("User Manual"); return () => setTitle(""); }, []);
  const [searchQuery, setSearchQuery] = useState("");
  // eslint-disable-next-line no-unused-vars

  const getSearchableText = (section) => {
    // Extract all text from the content JSX
    const extractText = (element) => {
      if (typeof element === 'string') return element;
      if (!element || !element.props) return '';
      let text = '';
      if (typeof element.props.children === 'string') {
        text += element.props.children;
      } else if (Array.isArray(element.props.children)) {
        text += element.props.children.map(extractText).join(' ');
      } else if (typeof element.props.children === 'object') {
        text += extractText(element.props.children);
      }
      return text;
    };
    return `${section.title} ${extractText(section.content)}`.toLowerCase();
  };

  const filtered = sections.filter(s =>
    getSearchableText(s).includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <p className="text-muted-foreground text-sm">Everything you need to know about using Dash it, Dash it ALL!</p>

      <input
        type="text"
        placeholder="Search sections..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />

      <div className="space-y-3">
        {filtered.map(section => (
          <SectionItem key={section.id} section={section} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-10">No sections match your search.</p>
        )}
      </div>

      {/* Support Section */}
      <div className="border border-border rounded-xl overflow-hidden bg-muted/90">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <span className="text-xl">💬</span>
          <span className="font-semibold text-foreground">Help & Support</span>
        </div>
        <div className="px-5 py-5 space-y-3 text-sm text-foreground/80">
          <p>Need help with <strong>The Daily Dash</strong>? We're here for you!</p>
          <p>Reach out to us directly via email and we'll get back to you as soon as possible:</p>
          <a
            href="mailto:Reaginhouse6@gmail.com"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            ✉️ Reaginhouse6@gmail.com
          </a>
          <p className="text-xs text-muted-foreground pt-1">Please include a description of your issue and any relevant details so we can assist you quickly.</p>
        </div>
      </div>
    </div>
  );
}