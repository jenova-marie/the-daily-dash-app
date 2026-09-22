const fmtTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${hr} ${suffix}` : `${hr}:${String(m).padStart(2, "0")} ${suffix}`;
};

const fmtDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

const sourceLabels = {
  calendar: "Calendar", event: "Event", task: "Task",
  education: "Education", chore: "Chore", goal: "Goal", custom: "Custom",
};

const sourceColors = {
  calendar: "#3b82f6", event: "#2563eb", task: "#10b981",
  education: "#a855f7", chore: "#f59e0b", custom: "#6b7280",
};

export default function PrintFormatCalendar({ events = [], title = "Calendar" }) {
  const byDate = {};
  events.forEach((e) => {
    if (!e.date) return;
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });

  const dates = Object.keys(byDate).sort();
  const dateNow = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const trStyle = { borderBottom: "1px solid #e0e0e0", pageBreakInside: "avoid" };
  const tdTime = { padding: "7px 10px 7px 0", verticalAlign: "top", fontSize: "12px", color: "#555", whiteSpace: "nowrap", width: "110px" };
  const tdMain = { padding: "7px 10px 7px 0", verticalAlign: "top" };
  const tdBadge = { padding: "7px 0", verticalAlign: "top", textAlign: "right", fontSize: "10px", whiteSpace: "nowrap" };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "24px 40px", maxWidth: "820px", margin: "0 auto", color: "#111" }}>
      <h1 style={{ fontSize: "26px", fontWeight: "bold", textAlign: "center", marginBottom: "4px" }}>{title}</h1>
      <p style={{ textAlign: "center", color: "#888", fontSize: "12px", marginBottom: "28px" }}>
        Generated: {dateNow} &nbsp;·&nbsp; {events.length} event{events.length !== 1 ? "s" : ""}
      </p>

      {dates.length === 0 ? (
        <p style={{ textAlign: "center", color: "#aaa", fontSize: "13px", fontStyle: "italic" }}>No events to display.</p>
      ) : (
        dates.map((date) => {
          const dayItems = byDate[date].sort((a, b) => (a.start_time || "99:99").localeCompare(b.start_time || "99:99"));
          return (
            <div key={date} style={{ marginBottom: "24px", pageBreakInside: "avoid" }}>
              <h2 style={{
                fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px",
                color: "#333", borderBottom: "2px solid #333", paddingBottom: "6px", marginBottom: "10px",
              }}>
                {fmtDate(date)} <span style={{ fontWeight: "400", color: "#999" }}>({dayItems.length})</span>
              </h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {dayItems.map((item) => (
                    <tr key={item.id} style={{ ...trStyle, opacity: item.deleted_from_app ? 0.5 : 1 }}>
                      <td style={tdTime}>
                        <div>{fmtTime(item.start_time)}</div>
                        {item.end_time && <div style={{ color: "#bbb" }}>→ {fmtTime(item.end_time)}</div>}
                      </td>
                      <td style={tdMain}>
                        <div style={{ fontSize: "13px", fontWeight: "500", color: "#111" }}>{item.title}</div>
                        {item.notes && <div style={{ fontSize: "11px", color: "#777", marginTop: "2px" }}>{item.notes}</div>}
                      </td>
                      <td style={tdBadge}>
                        <span style={{
                          display: "inline-block", padding: "2px 8px", borderRadius: "10px",
                          color: "#fff", backgroundColor: sourceColors[item.source_type] || sourceColors.custom,
                          fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.4px",
                        }}>
                          {sourceLabels[item.source_type] || item.source_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}

      <style>{`@media print { body { margin: 0; padding: 0; } .no-print { display: none !important; } }`}</style>
    </div>
  );
}