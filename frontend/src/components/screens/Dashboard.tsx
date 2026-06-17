import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { inspectionsApi } from '../../lib/api';
import { Inspection } from '../../types';

const WEEK_DATA = [
  {d:'Mon',v:38},{d:'Tue',v:52},{d:'Wed',v:44},{d:'Thu',v:67},{d:'Fri',v:59},{d:'Sat',v:81},{d:'Sun',v:74},
];
const AREA_DATA = [
  {day:'Apr 1',v:38},{day:'Apr 5',v:52},{day:'Apr 9',v:44},{day:'Apr 13',v:67},{day:'Apr 17',v:59},{day:'Apr 21',v:81},{day:'Apr 25',v:74},
];

function StatusBadge({ status }: { status: string }) {
  const m: Record<string,string> = {
    Passed:'bg-[#E0FDF6] text-[#007D5C]', Failed:'bg-[#FEF2F2] text-[#991B1B]',
    'In Review':'bg-[#FEF3C7] text-[#92400E]', Pending:'bg-[#F3F4F6] text-[#374151]',
    PASSED:'bg-[#E0FDF6] text-[#007D5C]', FAILED:'bg-[#FEF2F2] text-[#991B1B]',
    IN_REVIEW:'bg-[#FEF3C7] text-[#92400E]', PENDING:'bg-[#F3F4F6] text-[#374151]',
  };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${m[status] || 'bg-[#F3F4F6] text-[#374151]'}`}>{status.replace('_',' ')}</span>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    inspectionsApi.list({ limit: '6' })
      .then(r => setInspections(r.data.inspections || []))
      .catch(() => {});
  }, []);

  const STATS = [
    { label:'Inspections this month', value:'1,284', change:'↑ 12%', up:true },
    { label:'Pass rate',              value:'87.3%', change:'↑ 2.1%', up:true },
    { label:'Avg inspection time',    value:'4m 32s',change:'↓ 18s',  up:true },
    { label:'Active cases',           value:'23',    change:'3 urgent', up:false },
  ];

  return (
    <div className="fade-up">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-[18px] font-extrabold">Dashboard</h1>
          <p className="text-sm text-[#4B6B63] mt-0.5">{new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        {STATS.map(s => (
          <div key={s.label} className="bg-white border border-[#E5EDEB] rounded-[10px] p-4">
            <div className="text-xs text-[#4B6B63] mb-1">{s.label}</div>
            <div className="text-2xl font-extrabold">{s.value}</div>
            <div className={`text-[11px] flex items-center gap-1 mt-1 ${s.up ? 'text-[#00C795]' : 'text-[#EF4444]'}`}>{s.change}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {isMobile ? (
        <div className="bg-white border border-[#E5EDEB] rounded-[10px] p-4 mb-3">
          <div className="flex justify-between mb-2.5"><span className="font-semibold text-sm">This week</span><span className="text-xs text-[#4B6B63]">Volume</span></div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={WEEK_DATA} barSize={18}>
              <XAxis dataKey="d" tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="v" radius={[3,3,0,0]}>
                {WEEK_DATA.map((_,i) => <Cell key={i} fill={i < 6 ? '#00C795' : '#E0FDF6'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="col-span-2 bg-white border border-[#E5EDEB] rounded-[10px] p-4">
            <div className="flex justify-between mb-3"><span className="font-semibold">Inspection volume</span><span className="text-xs text-[#4B6B63]">Last 30 days</span></div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={AREA_DATA}>
                <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00C795" stopOpacity={0.15}/><stop offset="95%" stopColor="#00C795" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="day" tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="v" stroke="#00C795" strokeWidth={2} fill="url(#cg)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white border border-[#E5EDEB] rounded-[10px] p-4">
            <div className="font-semibold text-sm mb-3">Quick actions</div>
            <div className="space-y-2">
              {[{l:'New inspection',p:'/app/new-inspection',p2:true},{l:'VIN lookup',p:'/app/vin'},{l:'Doc reader',p:'/app/doc-reader'},{l:'Photo AI',p:'/app/photo-ai'}].map(a=>(
                <button key={a.l} onClick={() => navigate(a.p)} className={`w-full text-sm font-semibold py-2 rounded-[7px] ${a.p2 ? 'bg-[#00C795] text-white' : 'border border-[#E5EDEB] bg-white hover:bg-[#F7FAFA]'}`}>{a.l}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent inspections */}
      <div className="bg-white border border-[#E5EDEB] rounded-[10px] overflow-hidden mb-3">
        <div className="flex justify-between items-center p-4 border-b border-[#E5EDEB]">
          <span className="font-semibold">Recent inspections</span>
          <button onClick={() => navigate('/app/inspections')} className="text-xs text-[#4B6B63] hover:text-[#0B1B18]">View all →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead><tr className="bg-[#F7FAFA]"><th className="text-left px-3 py-2 text-[11px] font-semibold text-[#4B6B63]">ID</th><th className="text-left px-3 py-2 text-[11px] font-semibold text-[#4B6B63]">Vehicle</th><th className="hidden md:table-cell text-left px-3 py-2 text-[11px] font-semibold text-[#4B6B63]">Type</th><th className="text-left px-3 py-2 text-[11px] font-semibold text-[#4B6B63]">Status</th><th className="hidden md:table-cell text-left px-3 py-2 text-[11px] font-semibold text-[#4B6B63]">Date</th></tr></thead>
            <tbody>
              {inspections.map(r => (
                <tr key={r.id} className="border-t border-[#E5EDEB] hover:bg-[#F7FAFA] cursor-pointer" onClick={() => navigate(`/app/inspections`)}>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-[#00C795]">{r.id.slice(0,12)}</td>
                  <td className="px-3 py-2.5"><div className="font-medium">{r.vehicleMake} {r.vehicleModel} {r.vehicleYear}</div><div className="text-[10px] text-[#4B6B63] font-mono">{r.vin?.slice(0,12)}…</div></td>
                  <td className="hidden md:table-cell px-3 py-2.5 text-[#4B6B63]">{r.type?.replace('_',' ')}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                  <td className="hidden md:table-cell px-3 py-2.5 text-[#4B6B63] text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Failure reasons */}
      <div className="bg-white border border-[#E5EDEB] rounded-[10px] p-4">
        <div className="font-semibold mb-3">Top failure reasons</div>
        {[['Brakes',34],['Lights',28],['Tyres',19],['Emissions',12],['Bodywork',7]].map(([r,p]) => (
          <div key={r} className="mb-2.5">
            <div className="flex justify-between text-xs mb-1"><span>{r}</span><span className="font-semibold">{p}%</span></div>
            <div className="h-1.5 bg-[#E5EDEB] rounded-full overflow-hidden"><div className="h-full bg-[#00C795] rounded-full" style={{ width:`${(p as number)*2.5}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
