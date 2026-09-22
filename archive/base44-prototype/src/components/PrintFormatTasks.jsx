const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
const priorityLabels = { urgent: "Urgent", high: "High", medium: "Medium", low: "Low" };

export default function PrintFormatTasks({ tasks, groupBy = "priority" }) {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const activeTasks = tasks.filter(t => t.status !== "completed");
  const completedTasks = tasks.filter(t => t.status === "completed");

  const buildGroups = () => {
    if (groupBy === "label") {
      const grouped = {};
      activeTasks.forEach(t => {
        const key = t.category || "(No Label)";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(t);
      });
      return Object.entries(grouped).sort(([a], [b]) =>
        a === "(No Label)" ? 1 : b === "(No Label)" ? -1 : a.localeCompare(b)
      );
    }
    // default: priority
    const grouped = { urgent: [], high: [], medium: [], low: [] };
    activeTasks.forEach(t => {
      const p = t.priority || "medium";
      if (grouped[p]) grouped[p].push(t);
      else grouped.medium.push(t);
    });
    return ["urgent", "high", "medium", "low"]
      .map(p => [priorityLabels[p], grouped[p]])
      .filter(([, list]) => list.length > 0);
  };

  const groups = buildGroups();

  const rowStyle = { borderBottom: "1px solid #e0e0e0", pageBreakInside: "avoid" };
  const tdCheck = { padding: "7px 4px 7px 0", verticalAlign: "top", width: "28px" };
  const tdMain = { padding: "7px 12px 7px 0", verticalAlign: "top" };
  const tdMeta = { padding: "7px 0", textAlign: "right", verticalAlign: "top", fontSize: "11px", color: "#666", whiteSpace: "nowrap" };

  const renderRow = (task) => (
    <tr key={task.id} style={rowStyle}>
      <td style={tdCheck}>
        <div style={{
          width: "16px", height: "16px", border: "2px solid #555",
          borderRadius: "3px", display: "inline-block", marginTop: "1px",
          backgroundColor: task.status === "completed" ? "#555" : "transparent",
        }} />
      </td>
      <td style={tdMain}>
        <div style={{
          fontSize: "13px", fontWeight: "500",
          textDecoration: task.status === "completed" ? "line-through" : "none",
          color: task.status === "completed" ? "#999" : "#111",
        }}>
          {task.title}
        </div>
        {task.description && (
          <div style={{ fontSize: "11px", color: "#777", marginTop: "2px" }}>{task.description}</div>
        )}
        {task.is_recurring && task.recurrence_pattern && (
          <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px", textTransform: "capitalize" }}>
            ↻ {task.recurrence_pattern.replace(/_/g, " ")}
          </div>
        )}
      </td>
      <td style={tdMeta}>
        {task.due_date && (
          <div>Due: {new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
        )}
        {task.due_time && <div>{task.due_time}</div>}
        {task.category && (
          <div style={{ color: task.category_color || "#888", fontWeight: "600", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.4px", marginTop: "2px" }}>
            {task.category}
          </div>
        )}
      </td>
    </tr>
  );

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "24px 40px", maxWidth: "820px", margin: "0 auto", color: "#111" }}>
      <h1 style={{ fontSize: "26px", fontWeight: "bold", textAlign: "center", marginBottom: "4px" }}>
        Task List
      </h1>
      <p style={{ textAlign: "center", color: "#888", fontSize: "12px", marginBottom: "28px" }}>
        Generated: {date} &nbsp;·&nbsp; {activeTasks.length} active task{activeTasks.length !== 1 ? "s" : ""}
      </p>

      {groups.map(([label, list]) => (
        <div key={label} style={{ marginBottom: "20px" }}>
          <h2 style={{
            fontSize: "13px", fontWeight: "700", textTransform: "uppercase",
            letterSpacing: "0.6px", color: "#444", borderBottom: "2px solid #333",
            paddingBottom: "5px", marginBottom: "8px",
          }}>
            {label} <span style={{ fontWeight: "400", color: "#999" }}>({list.length})</span>
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>{list.map(renderRow)}</tbody>
          </table>
        </div>
      ))}

      {completedTasks.length > 0 && (
        <div style={{ marginBottom: "20px", opacity: 0.6 }}>
          <h2 style={{
            fontSize: "13px", fontWeight: "700", textTransform: "uppercase",
            letterSpacing: "0.6px", color: "#888", borderBottom: "1px solid #ccc",
            paddingBottom: "5px", marginBottom: "8px",
          }}>
            Completed <span style={{ fontWeight: "400" }}>({completedTasks.length})</span>
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>{completedTasks.map(renderRow)}</tbody>
          </table>
        </div>
      )}

      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}