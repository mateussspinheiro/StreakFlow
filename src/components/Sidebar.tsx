import { NavLink } from "react-router";

function Sidebar({ onLogout }: { onLogout: () => void }) {

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
      isActive
        ? "bg-black text-white"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  function sair() {
    onLogout();
  }

  return (
    <aside className="w-full md:w-64 md:min-h-screen shrink-0 border-r bg-white p-5 flex flex-col">
      {/* LOGO */}
      <NavLink
        to="/dashboard"
        className="text-2xl font-bold mb-10"
      >
        StreakFlow
      </NavLink>

      {/* MENU PRINCIPAL */}
      <nav className="flex flex-col gap-2">
        <NavLink
          to="/dashboard"
          end
          className={linkClass}
        >
          <span>▦</span>
          Dashboard
        </NavLink>

        <NavLink
          to="/dashboard/habitos"
          className={linkClass}
        >
          <span>✓</span>
          Meus hábitos
        </NavLink>

        <NavLink
          to="/dashboard/historico"
          className={linkClass}
        >
          <span>◷</span>
          Histórico
        </NavLink>

        <NavLink
          to="/dashboard/progresso"
          className={linkClass}
        >
          <span>↗</span>
          Progresso
        </NavLink>
      </nav>

      {/* CONTA */}
      <div className="mt-10">
        <p className="text-xs uppercase text-gray-400 px-4 mb-3">
          Conta
        </p>

        <nav className="flex flex-col gap-2">
          <NavLink
            to="/dashboard/perfil"
            className={linkClass}
          >
            <span>○</span>
            Meu perfil
          </NavLink>

          <NavLink
            to="/dashboard/configuracoes"
            className={linkClass}
          >
            <span>⚙</span>
            Configurações
          </NavLink>
        </nav>
      </div>

      {/* LOGOUT */}
      <div className="mt-auto">
        <NavLink to="/" className={linkClass}>Página inicial</NavLink>
        <button
          onClick={sair}
          className="w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
