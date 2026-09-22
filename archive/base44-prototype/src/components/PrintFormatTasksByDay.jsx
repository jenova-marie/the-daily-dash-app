const fmtTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${hr} ${suffix}` : `${hr}:${String(m).padStart(2, "0")} ${suffix}`;
};

const fmtDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

const priorityLabels = { urgent: "Urgent", high: "High", medium: "Medium", low: "Low" };
const priorityColors = { urgent: "#dc2626", high: "#f97316", medium: "#eab308", low: "#16a34a" };

export default function PrintFormatTasksByDay({ tasks = [], title = "Tasks" }) {
  const active = tasks.filter((t) => t.status !== "completed");

  const byDate = {};
  const noDate = [];
  active.forEach((t) => {
    if (t.due_date) {
      if (!byDate[t.due_date]) byDate[t.due_date] = [];
      byDate[t.due_date].push(t);
    } else {
      noDate.push(t);
    }
  });

  const dates = Object.keys(byDate).sort();
  const dateNow = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const trStyle = { borderBottom: "1px solid #e0e0e0", pageBreakInside: "avoid" };
  const tdCheck = { padding: "7px 4px 7px 0", verticalAlign: "top", width: "28px" };
  const tdMain = { padding: "7px 12px 7px 0", verticalAlign: "top" };
  const tdMeta = { padding: "7px 0", textAlign: "right", verticalAlign: "top", fontSize: "11px", color: "#666", whiteSpace: "nowrap" };

  const renderRow = (task) => (
    <tr key={task.id} style={trStyle}>
      <td style={tdCheck}>
        <div style={{ width: "16px", height: "16px", border: "2px solid #555", borderRadius: "3px", display: "inline-block", marginTop: "1px" }} />
      </td>
      <td style={tdMain}>
        <div style={{ fontSize: "13px", fontWeight: "500", color: "#111" }}>{task.title}</div>
        {task.description && <div style={{ fontSize: "11px", color: "#777", marginTop: "2px" }}>{task.description}</div>}
        {task.is_recurring && task.recurrence_pattern && (
          <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px", textTransform: "capitalize" }}>
            ↻ {task.recurrence_pattern.replace(/_/g, " ")}
          </div>
        )}
      </td>
      <td style={tdMeta}>
        {task.due_time && <div>{fmtTime(task.due_time)}</div>}
        {task.priority && (
          <div style={{ color: priorityColors[task.priority] || "#888", fontWeight: "600", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
            {priorityLabels[task.priority] || task.priority}
          </div>
        )}
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
      <h1 style={{ fontSize: "26px", fontWeight: "bold", textAlign: "center", marginBottom: "4px" }}>{title}</h1>
      <p style={{ textAlign: "center", color: "#888", fontSize: "12px", marginBottom: "28px" }}>
        Generated: {dateNow} &nbsp;·&nbsp; {active.length} task{active.length !== 1 ? "s" : ""}
      </p>

      {dates.length === 0 && noDate.length === 0 ? (
        <p style={{ textAlign: "center", color: "#aaa", fontSize: "13px", fontStyle: "italic" }}>No tasks to display.</p>
      ) : (
        <>
          {dates.map((date) => {
            const dayTasks = byDate[date];
            return (
              <div key={date} style={{ marginBottom: "20px", pageBreakInside: "avoid" }}>
                <h2 style={{
                  fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px",
                  color: "#333", borderBottom: "2px solid #333", paddingBottom: "6px", marginBottom: "10px",
                }}>
                  {fmtDate(date)} <span style={{ fontWeight: "400", color: "#999" }}>({dayTasks.length})</span>
                </h2>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>{dayTasks.map(renderRow)}</tbody>
                </table>
              </div>
            );
          })}
          {noDate.length > 0 && (
            <div style={{ marginBottom: "20px", pageBreakInside: "avoid" }}>
              <h2 style={{
                fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px",
                color: "#333", borderBottom: "2px solid #333", paddingBottom: "6px", marginBottom: "10px",
              }}>
                No Due Date <span style={{ fontWeight: "400", color: "#999" }}>({noDate.length})</span>
              </h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>{noDate.map(renderRow)}</tbody>
              </table>
            </div>
          )}
        </>
      )}

      <style>{`@media print { body { margin: 0; padding: 0; } .no-print { display: none !important; } }`}</style>
    </div>
  );
}