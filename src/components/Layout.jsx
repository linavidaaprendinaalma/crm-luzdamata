import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/visitas', label: 'Visitas' },
  { to: '/cadastro', label: 'Cadastro' },
  { to: '/vendas', label: 'Vendas' },
]

export default function Layout() {
  const { session, sair } = useAuth()

  return (
    <div className="min-h-screen bg-mata-cream flex">
      <aside className="w-56 bg-mata-bark text-mata-cream flex flex-col shrink-0">
        <div className="px-6 py-6">
          <p className="uppercase tracking-widest text-mata-gold text-[10px]">Ilumine sua beleza</p>
          <h1 className="font-display text-2xl mt-1">LuzDaMata</h1>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-mata-copper text-white' : 'text-mata-sand/80 hover:bg-white/5'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-5 border-t border-white/10">
          <p className="px-3 text-xs text-mata-sand/50 truncate">{session?.user?.email}</p>
          <button
            onClick={sair}
            className="w-full text-left px-3 py-2 mt-1 rounded-lg text-sm text-mata-sand/80 hover:bg-white/5"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
