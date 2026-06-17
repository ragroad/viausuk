import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import { useUIStore } from '../../store';

// Screens
import Dashboard from '../screens/Dashboard';
import Inspections from '../screens/Inspections';
import Cases from '../screens/Cases';
import VinLookup from '../screens/VinLookup';
import DocReader from '../screens/DocReader';
import PhotoAI from '../screens/PhotoAI';
import Billing from '../screens/Billing';
import Integrations from '../screens/Integrations';
import Team from '../screens/Team';
import NewInspectionWizard from '../screens/Wizard';

export default function AppShell() {
  const { screen } = useUIStore();
  return (
    <div className="flex min-h-screen bg-[#F7FAFA]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-[220px] pb-16 md:pb-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Routes>
            <Route path="/"             element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"     element={<Dashboard />} />
            <Route path="inspections"   element={<Inspections />} />
            <Route path="cases/*"       element={<Cases />} />
            <Route path="vin"           element={<VinLookup />} />
            <Route path="doc-reader"    element={<DocReader />} />
            <Route path="photo-ai"      element={<PhotoAI />} />
            <Route path="billing"       element={<Billing />} />
            <Route path="integrations"  element={<Integrations />} />
            <Route path="team"          element={<Team />} />
            <Route path="new-inspection"element={<NewInspectionWizard />} />
          </Routes>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
