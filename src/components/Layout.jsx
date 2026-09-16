import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import sidebarLeaves from '../assets/sidebar-leaves.png'
import bannerCabecalho from '../assets/banner_cabecalho.png'
import bannerRodape from '../assets/banner_rodape.png'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/visitas', label: 'Agenda' },
  { to: '/cadastro', label: 'Clientes' },
  { to: '/vendas', label: 'Vendas' },
  { to: '/produtos', label: 'Produtos' },
  { to: '/relatorios', label: 'Relatórios' },
  { to: '/configuracoes', label: 'Configurações' },
]

function IconeMarca() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <path
        d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"
        fill="currentColor"
      />
    </svg>
  )
}

function nomeExibicao(session) {
  const meta = session?.user?.user_metadata
  return meta?.full_name || meta?.name || session?.user?.email || ''
}

function iniciais(nome) {
  if (!nome) return '?'
  const partes = nome.trim().split(/\s+/)
  const primeira = partes[0]?.[0] || ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}

export default function Layout() {
  const { session, sair } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const [pageHeader, setPageHeader] = useState({ title: '', subtitle: '', actions: null })
  const nome = nomeExibicao(session)

  return (
    <div className="h-screen bg-mata-cream flex overflow-hidden">
      <aside
        className="w-60 text-mata-cream flex flex-col shrink-0 relative overflow-hidden bg-mata-bark"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(20,10,4,0.75), rgba(20,10,4,0.92)), url(${sidebarLeaves})`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom left',
        }}
      >
        <div className="px-6 py-6 relative z-10">
          <div className="flex items-center gap-2 text-mata-gold">
            <IconeMarca />
          </div>
          <h1 className="font-display text-2xl mt-2">LuzDaMata</h1>
          <p className="uppercase tracking-widest text-mata-gold text-[10px] mt-0.5">Ilumine sua beleza</p>
        </div>

        <nav className="flex-1 px-3 space-y-1 relative z-10">
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

        <div className="px-6 py-6 relative z-10 text-mata-sand/70">
          <p className="text-[11px] uppercase tracking-wide leading-relaxed">
            Mais que cosméticos,
            <br />
            conquistas reais.
          </p>
          <p className="font-display text-sm mt-3 text-mata-cream/90">Beleza que conecta pessoas.</p>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <header
          className="h-16 shrink-0 border-b border-mata-sand bg-mata-cream flex items-center justify-between px-6 gap-4 relative overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(250,246,238,1) 40%, rgba(250,246,238,0.4)), url(${bannerCabecalho})`,
            backgroundSize: 'cover',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="min-w-0">
            {pageHeader.title && (
              <h2 className="font-display text-lg text-mata-ink leading-tight truncate">{pageHeader.title}</h2>
            )}
            {pageHeader.subtitle && (
              <p className="text-mata-ink/50 text-xs truncate">{pageHeader.subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {pageHeader.actions}

            <button
              type="button"
              className="text-mata-ink/50 hover:text-mata-ink"
              title="Notificações"
            >
              🔔
            </button>

            <button
              type="button"
              onClick={() => setMenuAberto((v) => !v)}
              className="flex items-center gap-2"
            >
              <span className="w-8 h-8 rounded-full bg-mata-copper text-white text-xs font-medium flex items-center justify-center">
                {iniciais(nome)}
              </span>
              <span className="text-left leading-tight hidden sm:block">
                <span className="block text-sm font-medium text-mata-ink truncate max-w-[160px]">{nome}</span>
                <span className="block text-[11px] text-mata-ink/50">Equipe LuzDaMata</span>
              </span>
              <span className="text-mata-ink/40 text-xs">▾</span>
            </button>
          </div>

          {menuAberto && (
            <div className="absolute top-14 right-6 bg-white border border-mata-sand rounded-lg shadow-lg py-1 w-40 z-30">
              <button
                onClick={sair}
                className="w-full text-left px-4 py-2 text-sm text-mata-ink/70 hover:bg-mata-sand/40"
              >
                Sair
              </button>
            </div>
          )}
        </header>

        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto">
          <Outlet context={{ setPageHeader }} />
        </main>

        <footer
          className="h-11 shrink-0 border-t border-mata-sand bg-mata-cream flex items-center justify-between px-6 text-xs text-mata-ink/50 relative overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(250,246,238,1) 55%, rgba(250,246,238,0.5)), url(${bannerRodape})`,
            backgroundSize: 'cover',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-mata-gold shrink-0">
              <IconeMarca />
            </span>
            <span className="font-display text-sm text-mata-ink shrink-0">LuzDaMata</span>
            <span className="text-mata-sand shrink-0">|</span>
            <span className="truncate">Conexões que transformam resultados.</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span>v1.0.0</span>
            <span className="text-mata-sand">|</span>
            <button type="button" className="hover:text-mata-ink">Ajuda</button>
            <span className="text-mata-sand">|</span>
            <button type="button" className="hover:text-mata-ink">Termos de Uso</button>
            <span className="text-mata-sand">|</span>
            <button type="button" className="hover:text-mata-ink">Privacidade</button>
          </div>
        </footer>
      </div>
    </div>
  )
}
