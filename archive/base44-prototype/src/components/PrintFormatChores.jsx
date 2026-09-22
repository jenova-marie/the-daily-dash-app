export default function PrintFormatChores({ chores, filterLabel, users }) {
  const frequencyLabels = { daily: "Daily", weekly: "Weekly", biweekly: "Bi-Weekly", monthly: "Monthly" };
  
  const groupByUser = () => {
    const grouped = {};
    users.forEach(user => {
      grouped[user.id] = { name: user.name, chores: chores.filter(c => c.assigned_to === user.id) };
    });
    return grouped;
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px 40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px', textAlign: 'center' }}>
        Weekly Chore Schedule
      </h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '12px', fontSize: '12px' }}>
        Generated: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {Object.entries(groupByUser()).map(([userId, userData]) => 
        userData.chores.length > 0 && (
          <div key={userId} style={{ marginBottom: '15px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '2px solid #333', paddingBottom: '6px', marginBottom: '8px' }}>
              {userData.name}
            </h2>
            
            {['daily', 'weekly', 'biweekly', 'monthly'].map(freq => {
              const freqChores = userData.chores.filter(c => c.frequency === freq);
              return freqChores.length > 0 && (
                <div key={freq} style={{ marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    {frequencyLabels[freq]}
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {freqChores.map((chore, idx) => (
                        <tr key={chore.id} style={{ borderBottom: '1px solid #ddd' }}>
                          <td style={{ padding: '6px 0', verticalAlign: 'top', width: '5%' }}>
                            <input type="checkbox" style={{ marginRight: '8px' }} />
                          </td>
                          <td style={{ padding: '6px 15px 6px 0', verticalAlign: 'top', width: '60%' }}>
                            <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '2px' }}>
                              {chore.title}
                            </div>
                            {chore.description && (
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                {chore.description}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '6px 0', textAlign: 'right', fontSize: '11px', color: '#666' }}>
                            {chore.room && <div>{chore.room}</div>}
                            {chore.time_estimate > 0 && <div>{chore.time_estimate}min</div>}
                            {chore.day_of_week?.length > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}>
                                {chore.day_of_week.map(day => (
                                  <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px' }}>
                                    <input type="checkbox" style={{ width: '12px', height: '12px', margin: 0 }} />
                                    <span>{day.slice(0, 2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )
      )}

      <style>
        {`
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
          }
        `}
      </style>
    </div>
  );
}