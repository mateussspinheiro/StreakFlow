import { Outlet } from "react-router";
import Sidebar from "../components/Sidebar";
import type { DashboardContext } from '../lib/dashboard';

function DashboardLayout({ profile, onProfileChange, onLogout }: DashboardContext & { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <Sidebar onLogout={onLogout} />

      <main className="min-w-0 flex-1 overflow-auto">
        <Outlet context={{ profile, onProfileChange } satisfies DashboardContext} />
      </main>
    </div>
  );
}

export default DashboardLayout;
