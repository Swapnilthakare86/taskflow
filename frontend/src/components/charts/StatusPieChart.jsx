// Purpose: Renders data-visualization components for reporting and dashboards.
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * StatusPieChart Component
 * 
 * Displays a donut chart with a legend showing task status distribution.
 * Renders zero-count statuses in the legend while the donut uses only non-zero slices.
 * 
 */
export default function StatusPieChart({ data = [] }) {
  const valid = data.filter(d => d.value > 0);
  const legendItems = data.length ? data : [];
  
  return (
    <div className="d-flex align-items-center gap-3">
      {/* Donut Chart Container */}
      <div style={{flexShrink:0}}>
        {valid.length ? (
          <PieChart width={156} height={156}>
            {/* Pie component configured as donut chart with inner and outer radius */}
            <Pie data={valid} cx={75} cy={75} innerRadius={44} outerRadius={72} dataKey="value" paddingAngle={3} startAngle={90} endAngle={450}>
              {/* Map colors to each pie segment */}
              {valid.map((e, i) => <Cell key={i} fill={e.color} strokeWidth={0} />)}
            </Pie>
            {/* Tooltip displays on hover with styled background */}
            <Tooltip contentStyle={{ background:'white', border:'1px solid #E2E8F0', borderRadius:10, fontSize:12 }} />
          </PieChart>
        ) : (
          <div className="d-flex align-items-center justify-content-center" style={{ width: 156, height: 156, color: '#CBD5E1', fontSize: 13 }}>
            No data yet
          </div>
        )}
      </div>
      
      {/* Legend Container - displays status categories with color indicators and values */}
      <div style={{ minWidth: 150, maxWidth: 220 }}>
        {legendItems.map(d => (
          <div key={d.name} className="d-flex align-items-center mb-2" style={{ gap: 10 }}>
            {/* Legend item with color dot and status name */}
            <div className="d-flex align-items-center gap-2" style={{ minWidth: 92 }}>
              <span style={{width:8,height:8,borderRadius:'50%',background:d.color,display:'inline-block'}}/>
              <span style={{fontSize:12,color:'#475569'}}>{d.name}</span>
            </div>
            {/* Display count value aligned to the right */}
            <span style={{fontSize:12,fontWeight:700,color:'#0F172A', marginLeft: 'auto', minWidth: 16, textAlign: 'right'}}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

