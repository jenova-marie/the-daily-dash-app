export default function PrintFormatEducation({ learner, subject, plans, activities, frequencyLabels }) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '40px', maxWidth: '850px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
        {learner} - {subject}
      </h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px', fontSize: '12px' }}>
        Generated: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {/* Plans Section */}
      {plans.length > 0 && (
        <div style={{ marginBottom: '35px', pageBreakInside: 'avoid' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', borderBottom: '3px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
            Learning Plans
          </h2>
          {plans.map(plan => (
            <div key={plan.id} style={{ marginBottom: '18px', paddingBottom: '15px', borderBottom: '1px solid #e0e0e0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#333' }}>
                {plan.title}
              </h3>
              {plan.description && (
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '6px', lineHeight: '1.5' }}>
                  {plan.description}
                </p>
              )}
              <div style={{ fontSize: '11px', color: '#888', lineHeight: '1.6' }}>
                {plan.materials && <div><strong>Materials:</strong> {plan.materials}</div>}
                {plan.due_date && <div><strong>Target Date:</strong> {plan.due_date}</div>}
                {plan.notes && <div><strong>Notes:</strong> {plan.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activities/Assignments Section */}
      {activities.length > 0 && (
        <div style={{ marginBottom: '35px', pageBreakInside: 'avoid' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', borderBottom: '3px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
            Activities & Assignments
          </h2>

          {['assignment', 'activity'].map(type => {
            const typeItems = activities.filter(a => a.type === type);
            return typeItems.length > 0 && (
              <div key={type} style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', color: '#555', marginBottom: '12px' }}>
                  {type === 'activity' ? 'Activities' : 'Assignments'}
                </h3>

                {['once', 'daily', 'weekly', 'biweekly', 'monthly'].map(freq => {
                  const freqItems = typeItems.filter(a => a.frequency === freq);
                  return freqItems.length > 0 && (
                    <div key={freq} style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: '600', color: '#777', marginBottom: '10px', textTransform: 'uppercase' }}>
                        {freq === 'once' ? 'One-Time' : frequencyLabels[freq]}
                      </h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {freqItems.map(act => (
                            <tr key={act.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                              <td style={{ padding: '8px 0', verticalAlign: 'top', width: '5%' }}>
                                <input type="checkbox" style={{ marginRight: '8px' }} />
                              </td>
                              <td style={{ padding: '8px 15px 8px 0', verticalAlign: 'top' }}>
                                <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '3px' }}>
                                  {act.title}
                                </div>
                                {act.notes && (
                                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>
                                    {act.notes}
                                  </div>
                                )}
                                <div style={{ fontSize: '10px', color: '#999', lineHeight: '1.4' }}>
                                  {act.due_date && <div>Due: {act.due_date}</div>}
                                  {act.days_of_week?.length > 0 && <div>Days: {act.days_of_week.join(', ')}</div>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
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