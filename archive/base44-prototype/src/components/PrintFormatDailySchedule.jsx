const fmtTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${hr} ${suffix}` : `${hr}:${String(m).padStart(2, "0")} ${suffix}`;
};

const sourceLabels = {
  calendar: "Calendar", event: "Calendar", task: "Task",
  education: "Education", chore: "Chore", goal: "Goal", custom: "Custom",
};

const priorityDot = { urgent: "#dc2626", high: "#f97316", medium: "#eab308", low: "#16a34a" };

export default function PrintFormatDailySchedule({ scheduleItems = [], todoItems = [], date, mode = "both" }) {
  const dateLabel = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const sorted = [...scheduleItems]
    .filter(i => i.start_time && !i.hidden_from_grid)
    .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

  const todoVisible = [...todoItems].sort((a, b) => {
    const ta = a.start_time || "99:99";
    const tb = b.start_time || "99:99";
    return ta.localeCompare(tb);
  });

  const showSchedule = mode === "schedule" || mode === "both";
  const showTodo = mode === "todo" || mode === "both";

  const trStyle = { borderBottom: "1px solid #e0e0e0", pageBreakInside: "avoid" };
  const tdCheck = { padding: "7px 4px 7px 0", verticalAlign: "top", width: "26px" };
  const tdTime = { padding: "7px 8px 7px 0", verticalAlign: "top", fontSize: "11px", color: "#777", whiteSpace: "nowrap", width: "80px" };
  const tdMain = { padding: "7px 8px 7px 0", verticalAlign: "top" };
  const tdBadge = { padding: "7px 0", verticalAlign: "top", textAlign: "right", fontSize: "10px", color: "#999", whiteSpace: "nowrap" };

  const checkbox = (checked) => (
    <div style={{
      width: "15px", height: "15px", border: "2px solid #555", borderRadius: "3px",
      display: "inline-block", backgroundColor: checked ? "#555" : "transparent", marginTop: "1px",
    }} />
  );

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "24px 40px", maxWidth: "820px", margin: "0 auto", color: "#111" }}>
      <h1 style={{ fontSize: "26px", fontWeight: "bold", textAlign: "center", marginBottom: "4px" }}>
        Daily Schedule
      </h1>
      <p style={{ textAlign: "center", color: "#888", fontSize: "12px", marginBottom: "28px" }}>
        {dateLabel}
      </p>

      {showSchedule && (
        <div style={{ marginBottom: mode === "both" ? "32px" : "0" }}>
          <h2 style={{
            fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.6px",
            color: "#444", borderBottom: "2px solid #333", paddingBottom: "5px", marginBottom: "8px",
          }}>
            Hourly Schedule <span style={{ fontWeight: "400", color: "#999" }}>({sorted.length} items)</span>
          </h2>
          {sorted.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: "12px", fontStyle: "italic" }}>No scheduled items for this day.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ccc" }}>
                  <th style={{ ...tdTime, fontWeight: "600", color: "#555", fontSize: "10px", textTransform: "uppercase" }}>Time</th>
                  <th style={{ ...tdMain, fontWeight: "600", color: "#555", fontSize: "10px", textTransform: "uppercase" }}>Item</th>
                  <th style={{ ...tdBadge, fontWeight: "600", color: "#555", fontSize: "10px", textTransform: "uppercase" }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((item) => (
                  <tr key={item.id} style={{ ...trStyle, opacity: item.completed ? 0.5 : 1 }}>
                    <td style={tdTime}>
                      <div>{fmtTime(item.start_time)}</div>
                      {item.end_time && <div style={{ color: "#bbb" }}>→ {fmtTime(item.end_time)}</div>}
                    </td>
                    <td style={tdMain}>
                      <div style={{
                        fontSize: "13px", fontWeight: "500",
                        textDecoration: item.completed ? "line-through" : "none",
                        color: item.completed ? "#999" : "#111",
                      }}>
                        {item.priority && priorityDot[item.priority] && (
                          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: priorityDot[item.priority], marginRight: "6px", verticalAlign: "middle" }} />
                        )}
                        {item.title}
                      </div>
                      {item.notes && <div style={{ fontSize: "11px", color: "#777", marginTop: "2px" }}>{item.notes}</div>}
                    </td>
                    <td style={tdBadge}>
                      {sourceLabels[item.source_type] || item.source_type}
                      {item.completed && <div style={{ color: "#16a34a", fontWeight: "600" }}>✓ Done</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showTodo && (
        <div>
          <h2 style={{
            fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.6px",
            color: "#444", borderBottom: "2px solid #333", paddingBottom: "5px", marginBottom: "8px",
          }}>
            To Do <span style={{ fontWeight: "400", color: "#999" }}>({todoVisible.length} items)</span>
          </h2>
          {todoVisible.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: "12px", fontStyle: "italic" }}>No to-do items for this day.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {todoVisible.map((item) => (
                  <tr key={item.id} style={trStyle}>
                    <td style={tdCheck}>{checkbox(item.completed)}</td>
                    <td style={tdTime}>
                      {item.start_time && <span>{fmtTime(item.start_time)}</span>}
                    </td>
                    <td style={tdMain}>
                      <div style={{
                        fontSize: "13px", fontWeight: "500",
                        textDecoration: item.completed ? "line-through" : "none",
                        color: item.completed ? "#999" : "#111",
                      }}>
                        {item.priority && priorityDot[item.priority] && (
                          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: priorityDot[item.priority], marginRight: "6px", verticalAlign: "middle" }} />
                        )}
                        {item.title}
                      </div>
                      {item.notes && <div style={{ fontSize: "11px", color: "#777", marginTop: "2px" }}>{item.notes}</div>}
                    </td>
                    <td style={tdBadge}>
                      {sourceLabels[item.source_type] || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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