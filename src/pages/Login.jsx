import { useAuth } from '../AuthContext'

export default function Login() {
  const { entrarComGoogle } = useAuth()

  return (
    <div className="min-h-screen bg-mata-bark flex flex-col lg:flex-row overflow-hidden">
      {/* Painel da foto — o arquivo login-hero.jpg deve estar em public/,
          na raiz do projeto (ao lado de index.html) */}
      <div className="relative w-full h-56 sm:h-72 lg:h-auto lg:w-1/2 shrink-0">
        <img
          src="/login-hero.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-[center_20%] lg:object-[68%_center]"
        />
        {/* Sombra para o texto/card ficarem legíveis nas bordas da foto */}
        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-mata-bark via-mata-bark/10 to-transparent" />
      </div>

      {/* Painel do card */}
      <div className="relative flex-1 flex items-center justify-center lg:justify-end px-6 py-10 lg:pr-16 xl:pr-24">
        {/* Vinheta radial dourada sutil por trás do card */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 55% 42%, rgba(212,175,105,0.12), transparent 55%)',
          }}
        />

        {/* Texto decorativo no canto superior direito */}
        <p className="hidden lg:block absolute top-10 right-10 text-right font-display italic text-mata-gold/80 text-lg leading-snug">
          Beleza que conecta<br />pessoas
        </p>

        <div className="relative z-10 w-full max-w-sm">
          <div className="rounded-3xl border border-mata-gold/30 bg-mata-bark/70 backdrop-blur-md px-8 py-10 text-center shadow-[0_0_60px_-15px_rgba(212,175,105,0.35)]">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full border border-mata-gold/50 flex items-center justify-center">
                <span className="text-mata-gold text-2xl">✳</span>
              </div>
            </div>

            <p className="font-display text-2xl text-mata-cream leading-none">LuzDaMata</p>
            <p className="text-mata-sand/60 text-xs mb-6">Ilumine sua beleza</p>

            <p className="uppercase tracking-widest text-mata-gold text-xs mb-3">Ilumine sua beleza</p>
            <h1 className="font-display text-4xl text-mata-cream mb-2">CRM LuzDaMata</h1>
            <p className="text-mata-sand/70 text-sm mb-10">
              Acompanhe compradoras, revendedoras e visitas em um só lugar.
            </p>

            <button
              onClick={entrarComGoogle}
              className="w-full flex items-center justify-center gap-3 bg-mata-cream text-mata-ink font-medium rounded-full py-3 px-6 hover:bg-white transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.8 2.73v2.27h2.92c1.7-1.57 2.68-3.88 2.68-6.64z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.17l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34C2.44 15.98 5.48 18 9 18z"/>
                <path fill="#FBBC05" d="M3.97 10.72c-.18-.54-.28-1.11-.28-1.72s.1-1.18.28-1.72V4.94H.96C.35 6.17 0 7.55 0 9s.35 2.83.96 4.06l3.01-2.34z"/>
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"/>
              </svg>
              Entrar com Google
            </button>

            <p className="text-mata-sand/40 text-xs mt-8">
              Acesso restrito à equipe LuzDaMata.
            </p>
          </div>

          {/* Faixa de ícones embaixo do card */}
          <div className="flex justify-center gap-10 mt-8 text-mata-gold/80">
            <div className="text-center">
              <p className="text-lg mb-1">◇</p>
              <p className="text-[10px] tracking-wide text-mata-sand/60 leading-tight">
                GESTÃO DE<br />RELACIONAMENTOS
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg mb-1">▲</p>
              <p className="text-[10px] tracking-wide text-mata-sand/60 leading-tight">
                MAIS VENDAS<br />MAIS CONQUISTAS
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg mb-1">♡</p>
              <p className="text-[10px] tracking-wide text-mata-sand/60 leading-tight">
                BELEZA QUE<br />TRANSFORMA
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
