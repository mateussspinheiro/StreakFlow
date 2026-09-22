import { Outlet } from "react-router";
import Sidebar from "../components/Sidebar";
import type { DashboardContext } from '../lib/dashboard';

function DashboardLayout({ profile, onProfileChange, onLogout }: DashboardContext & { onLogout: () => void }) {
  return (
    <div className="dashboard-shell">
      <a className="skip-link" href="#main-content">Ir para o conteúdo</a>
      <Sidebar onLogout={onLogout} profile={profile} />

      <main className="dashboard-main" id="main-content">
        <Outlet context={{ profile, onProfileChange } satisfies DashboardContext} />
      </main>
    </div>
  );
}

export default DashboardLayout;
