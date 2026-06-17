import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

const ITEMS = [
  { path: 'dashboard',   label: 'Home',    icon: '▦' },
  { path: 'inspections', label: 'Inspect', icon: '📋' },
  { path: null,          label: '',        fab: true },
  { path: 'cases',       label: 'Cases',   icon: '📁' },
  { path: 'billing',     label: 'More',    icon: '≡' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const current  = location.pathname.split('/app/')[1]?.split('/')[0] || 'dashboard';

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-[#E5EDEB] flex items-center justify-around px-1 z-50">
      {ITEMS.map((item, i) =>
        item.fab ? (
          <button key={i} onClick={() => navigate('/app/new-inspection')}
            className="w-11 h-11 rounded-full bg-[#00C795] flex items-center justify-center -mt-2.5 shadow-lg shadow-[#00C795]/40">
            <span className="text-white text-xl font-bold leading-none">+</span>
          </button>
        ) : (
          <button key={i} onClick={() => item.path && navigate(`/app/${item.path}`)}
            className={clsx('flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium',
              current === item.path ? 'text-[#00C795]' : 'text-[#9CA3AF]')}>
            <span className="text-[20px] leading-none">{item.icon}</span>
            {item.label}
          </button>
        )
      )}
    </nav>
  );
}
