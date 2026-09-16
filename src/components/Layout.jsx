import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../AuthContext'

import sidebarLeaves from '../assets/sidebar-leaves.png'
import fundoTitulos from '../assets/fundo_titulos.png'
import bannerRodape from '../assets/banner_rodape.png'

const links = [
  { to: '/', label: 'Dashboard', icon: '⌂', end: true },
  { to: '/visitas', label: 'Agenda', icon: '▣' },
  { to: '/cadastro', label: 'Clientes', icon: '♙' },
  { to: '/vendas', label: 'Vendas', icon: '▥' },
  { to: '/produtos', label: 'Produtos', icon: '◇' },
  { to: '/relatorios', label: 'Relatórios', icon: '◔' },
  { to: '/configuracoes', label: 'Configurações', icon: '⚙' },
]

function IconeMarca() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-7 h-7"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M12 5c1.3 3.2 3.4 5.3 6.5 6.5-3.1 1.2-5.2 3.3-6.5 6.5-1.3-3.2-3.4-5.3-6.5-6.5C8.6 10.3 10.7 8.2 12 5Z"
        fill="currentColor"
      />
    </svg>
  )
}

function nomeExibicao(session) {
  const meta = session?.user?.user_metadata
  return (
    meta?.full_name ||
    meta?.name ||
    session?.user?.email ||
    ''
  )
}

function iniciais(nome) {
  if (!nome) return '?'

  const partes = nome.trim().split(/\s+/)
  const primeira = partes[0]?.[0] || ''
  const ultima =
    partes.length > 1
      ? partes[partes.length - 1][0]
      : ''

  return (primeira + ultima).toUpperCase()
}

function dataDeHojeFormatada() {
  const texto = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export default function Layout() {
  const { session, sair } = useAuth()

  const [menuAberto, setMenuAberto] = useState(false)

  const [pageHeader, setPageHeader] = useState({
    title: '',
    subtitle: '',
    actions: null,
  })

  const nome = nomeExibicao(session)
  const dataHoje = dataDeHojeFormatada()

  return (
    <div className="h-screen bg-[#f8f2e8] flex overflow-hidden">

      {/* ===================================================== */}
      {/* SIDEBAR */}
      {/* ===================================================== */}

      <aside
        className="
          hidden md:flex
          w-[220px]
          shrink-0
          text-[#f7ead2]
          flex-col
          relative
          overflow-hidden
          bg-[#351b0c]
        "
        style={{
          backgroundImage: `
            linear-gradient(
              180deg,
              rgba(38,18,7,.82),
              rgba(38,18,7,.92)
            ),
            url(${sidebarLeaves})
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom left',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Marca */}
        <div className="px-8 pt-6 pb-5 relative z-10">
          <div className="text-[#d5a447]">
            <IconeMarca />
          </div>

          <h1 className="font-display text-[27px] mt-2 text-white">
            LuzDaMata
          </h1>

          <p className="
            text-[10px]
            tracking-[0.25em]
            uppercase
            text-[#d8ad5c]
            mt-1
          ">
            Conexões que transformam resultados.
          </p>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 space-y-1 relative z-10">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `
                  flex items-center gap-3
                  px-4 py-3
                  rounded-xl
                  text-[15px]
                  transition-all duration-200
                  ${
                    isActive
                      ? `
                        bg-gradient-to-r
                        from-[#9a5b20]
                        to-[#c39143]
                        text-white
                        shadow-[0_6px_18px_rgba(154,91,32,.25)]
                      `
                      : `
                        text-[#f0dcc0]
                        hover:bg-white/5
                      `
                  }
                `
              }
            >
              <span className="text-xl w-6 text-center">
                {link.icon}
              </span>

              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Texto inferior */}
        <div className="px-8 pb-7 relative z-10">
          <p className="
            text-[11px]
            uppercase
            tracking-[0.16em]
            leading-[1.6]
            text-[#f1dcc0]
          ">
            Natureza que impulsiona
            <br />
            o seu negócio.
          </p>
        </div>
      </aside>

      {/* ===================================================== */}
      {/* CONTEÚDO */}
      {/* ===================================================== */}

      <div className="
        flex-1
        min-w-0
        min-h-0
        flex
        flex-col
      ">

        {/* =================================================== */}
        {/* TOP BAR */}
        {/* =================================================== */}

        <header className="
          h-[76px]
          shrink-0
          bg-[#fbf7f0]
          border-b
          border-[#eadfce]
          flex
          items-center
          justify-between
          px-5
          lg:px-8
        ">
          <div className="
            flex
            items-center
            gap-8
            min-w-0
          ">
            {/* Breadcrumb */}
            <div className="
              flex
              items-center
              gap-2
              text-sm
            ">
              <span className="text-[#9e6427]">
                ⌂
              </span>

              <span className="text-[#58493e]">
                Início
              </span>

              {pageHeader.title && (
                <>
                  <span className="text-[#bfb3a6]">
                    /
                  </span>

                  <span className="
                    font-medium
                    text-[#17120e]
                  ">
                    {pageHeader.title}
                  </span>
                </>
              )}
            </div>

            {/* Data */}
            <div className="
              hidden
              lg:flex
              items-center
              gap-2
              text-sm
              text-[#66584d]
            ">
              <span className="text-[#b07a32]">
                ▣
              </span>

              <span>{dataHoje}</span>
            </div>
          </div>

          {/* Perfil */}
          <div className="
            flex
            items-center
            gap-4
            shrink-0
          ">
            <button
              type="button"
              className="
                relative
                text-xl
                text-[#23180f]
              "
              title="Notificações"
            >
              ♢

              <span className="
                absolute
                -top-1
                -right-2
                w-4
                h-4
                rounded-full
                bg-[#b77725]
                text-white
                text-[9px]
                flex
                items-center
                justify-center
              ">
                3
              </span>
            </button>

            <span className="
              hidden sm:block
              h-8
              w-px
              bg-[#e2d5c4]
            " />

            <button
              type="button"
              onClick={() =>
                setMenuAberto((valor) => !valor)
              }
              className="
                flex
                items-center
                gap-3
              "
            >
              <span className="
                w-10
                h-10
                rounded-full
                bg-[#9b5c2d]
                text-white
                text-sm
                flex
                items-center
                justify-center
                shadow-sm
              ">
                {iniciais(nome)}
              </span>

              <span className="
                hidden
                sm:block
                text-left
                leading-tight
              ">
                <span className="
                  block
                  text-sm
                  font-semibold
                  text-[#1d1713]
                  truncate
                  max-w-[170px]
                ">
                  {nome}
                </span>

                <span className="
                  block
                  text-[11px]
                  text-[#73675e]
                  mt-0.5
                ">
                  Equipe LuzDaMata
                </span>
              </span>

              <span className="
                hidden sm:block
                text-[#4e4239]
              ">
               ⌄
              </span>
            </button>
          </div>

          {/* Menu perfil */}
          {menuAberto && (
            <div className="
              absolute
              top-[68px]
              right-6
              z-50
              w-44
              rounded-xl
              border
              border-[#eadfce]
              bg-white
              shadow-xl
              overflow-hidden
            ">
              <button
                onClick={sair}
                className="
                  w-full
                  text-left
                  px-4
                  py-3
                  text-sm
                  text-[#57483e]
                  hover:bg-[#f7f0e7]
                "
              >
                Sair
              </button>
            </div>
          )}
        </header>

        {/* =================================================== */}
        {/* HERO / TÍTULO DAS PÁGINAS */}
        {/* =================================================== */}

        {pageHeader.title && (
          <section
            className="
              min-h-[118px]
              shrink-0
              px-5
              lg:px-10
              flex
              items-center
              gap-4
              border-b
              border-[#eadfce]
              relative
              overflow-hidden
            "
            style={{
              backgroundImage: `
                linear-gradient(
                  90deg,
                  rgba(250,246,238,.98) 0%,
                  rgba(250,246,238,.88) 25%,
                  rgba(250,246,238,.30) 52%,
                  rgba(250,246,238,.75) 100%
                ),
                url(${fundoTitulos})
              `,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >

            {/* Título */}
            <div className="
              relative
              z-10
              min-w-0
              mr-auto
            ">
              <h2 className="
                font-display
                text-[34px]
                lg:text-[42px]
                leading-none
                text-[#15100c]
              ">
                {pageHeader.title}
              </h2>

              {pageHeader.subtitle && (
                <p className="
                  text-[#3f342d]
                  text-base
                  lg:text-lg
                  mt-2
                ">
                  {pageHeader.subtitle}
                </p>
              )}
            </div>

            {/* Frase */}
            <div className="
              hidden
              xl:block
              relative
              z-10
              text-right
              mr-8
            ">
              <p className="
                font-display
                italic
                text-[22px]
                leading-[1.05]
                text-[#965a26]
              ">
                Conexões que geram
                <br />
                novas histórias.
              </p>
            </div>

            {/* Ações da página */}
            {pageHeader.actions && (
              <div className="
                relative
                z-10
                shrink-0
              ">
                {pageHeader.actions}
              </div>
            )}
          </section>
        )}

        {/* =================================================== */}
        {/* PÁGINA */}
        {/* =================================================== */}

        <main className="
          flex-1
          min-w-0
          min-h-0
          overflow-y-auto
          bg-[#f8f2e8]
        ">
          <Outlet context={{ setPageHeader }} />
        </main>

        {/* =================================================== */}
        {/* RODAPÉ */}
        {/* =================================================== */}

        <footer
          className="
            min-h-[58px]
            shrink-0
            border-t
            border-[#e6dac8]
            flex
            items-center
            justify-between
            px-5
            lg:px-10
            gap-6
            text-xs
            text-[#68594d]
            relative
            overflow-hidden
          "
          style={{
            backgroundImage: `
              linear-gradient(
                90deg,
                rgba(250,246,238,.94),
                rgba(250,246,238,.84)
              ),
              url(${bannerRodape})
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Marca rodapé */}
          <div className="
            flex
            items-center
            gap-3
            min-w-0
          ">
            <span className="
              text-[#a46625]
              shrink-0
            ">
              <IconeMarca />
            </span>

            <span className="
              font-display
              text-lg
              text-[#211810]
              shrink-0
            ">
              LuzDaMata
            </span>

            <span className="
              text-[#c6b394]
              hidden sm:inline
            ">
              |
            </span>

            <span className="
              hidden
              sm:inline
              font-display
              text-base
              text-[#8a5629]
              truncate
            ">
              Conexões que transformam resultados.
            </span>
          </div>

          {/* Links */}
          <div className="
            hidden
            md:flex
            items-center
            gap-3
            shrink-0
          ">
            <span>v1.0.0</span>

            <span className="text-[#c6b394]">
              |
            </span>

            <button
              type="button"
              className="hover:text-[#211810]"
            >
              Ajuda
            </button>

            <span className="text-[#c6b394]">
              |
            </span>

            <button
              type="button"
              className="hover:text-[#211810]"
            >
              Termos de Uso
            </button>

            <span className="text-[#c6b394]">
              |
            </span>

            <button
              type="button"
              className="hover:text-[#211810]"
            >
              Privacidade
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
