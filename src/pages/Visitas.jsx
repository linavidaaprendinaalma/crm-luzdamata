import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { formatarDataHora } from '../lib/helpers'

const vazio = {
  nome_lead: '',
  contato_id: '',
  data_visita: new Date().toISOString().slice(0, 16),
  tipo_contato: 'presencial',
  observacoes: '',
}

export default function Visitas() {
  const location = useLocation()
  const navigate = useNavigate()
  const [visitas, setVisitas] = useState([])
  const [contatos, setContatos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [form, setForm] = useState(vazio)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [convertendo, setConvertendo] = useState(null) // visita sendo convertida
  const [busca, setBusca] = useState('')

  useEffect(() => {
    carregar()
  }, [])

  // Se chegou aqui vindo do Dashboard (clique em "Registrar contato/visita"),
  // já abre o formulário com o cliente pré-selecionado.
  useEffect(() => {
    const idPreSelecionado = location.state?.novoContatoId
    if (idPreSelecionado) {
      setForm({ ...vazio, contato_id: idPreSelecionado })
      setMostrarForm(true)
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function carregar() {
    setCarregando(true)
    const { data: vData } = await supabase
      .from('visitas')
      .select('*, contatos(nome)')
      .order('data_visita', { ascending: false })
    const { data: cData } = await supabase.from('contatos').select('id, nome, tipo, ativo').order('nome')
    setVisitas(vData || [])
    // Contatos inativos não devem aparecer como opção para registrar nova visita/contato
    setContatos((cData || []).filter((c) => c.ativo !== false))
    setCarregando(false)
  }

  async function salvar(e) {
    e.preventDefault()
    const payload = {
      ...form,
      contato_id: form.contato_id || null,
      nome_lead: form.contato_id ? null : form.nome_lead,
    }
    await supabase.from('visitas').insert(payload)
    setForm(vazio)
    setMostrarForm(false)
    carregar()
  }

  async function confirmarConversao(tipo) {
    const v = convertendo
    const { data: novoContato } = await supabase
      .from('contatos')
      .insert({ nome: v.nome_lead || v.contatos?.nome, tipo })
      .select()
      .single()

    await supabase
      .from('visitas')
      .update({ convertido: true, tipo_conversao: tipo, contato_id: novoContato.id })
      .eq('id', v.id)

    setConvertendo(null)
    carregar()
  }

  async function marcarNaoConvertido(v) {
    await supabase.from('visitas').update({ convertido: false, tipo_conversao: null }).eq('id', v.id)
    carregar()
  }

  const totalVisitas = visitas.length
  const videoconferencias = visitas.filter((v) => v.tipo_contato === 'videoconferencia').length
  const presenciais = visitas.filter((v) => v.tipo_contato === 'presencial').length
  const convertidas = visitas.filter((v) => v.convertido).length

  const buscaNormalizada = busca.trim().toLowerCase()
  const visitasFiltradas = visitas.filter((v) => {
    if (!buscaNormalizada) return true
    const nome = v.nome_lead || v.contatos?.nome || ''
    return nome.toLowerCase().includes(buscaNormalizada)
  })

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-3xl text-mata-ink">Visitas</h2>
          <p className="text-mata-ink/50 text-sm mt-1">Agendamentos presenciais e por videoconferência</p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-mata-copper text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-mata-clay"
        >
          + Agendar visita
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-mata-sand rounded-xl p-5">
          <p className="text-xs text-mata-ink/50 uppercase tracking-wide">Agendadas</p>
          <p className="font-display text-2xl text-mata-ink mt-1">{totalVisitas}</p>
        </div>
        <div className="bg-white border border-mata-sand rounded-xl p-5">
          <p className="text-xs text-mata-ink/50 uppercase tracking-wide">Videoconferência</p>
          <p className="font-display text-2xl text-mata-ink mt-1">{videoconferencias}</p>
        </div>
        <div className="bg-white border border-mata-sand rounded-xl p-5">
          <p className="text-xs text-mata-ink/50 uppercase tracking-wide">Presenciais</p>
          <p className="font-display text-2xl text-mata-ink mt-1">{presenciais}</p>
        </div>
        <div className="bg-white border border-mata-sand rounded-xl p-5">
          <p className="text-xs text-mata-ink/50 uppercase tracking-wide">Convertidas em negócio</p>
          <p className="font-display text-2xl text-mata-moss mt-1">{convertidas}</p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Localizar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full sm:w-80 border border-mata-sand rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {carregando ? (
        <p className="text-mata-ink/50 text-sm">Carregando…</p>
      ) : visitasFiltradas.length === 0 ? (
        <p className="text-mata-ink/50 text-sm">
          {busca ? 'Nenhum resultado para essa busca.' : 'Nenhuma visita agendada ainda.'}
        </p>
      ) : (
        <div className="space-y-3">
          {visitasFiltradas.map((v) => (
            <div key={v.id} className="bg-white border border-mata-sand rounded-xl p-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{v.nome_lead || v.contatos?.nome}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    v.tipo_contato === 'presencial' ? 'bg-mata-moss/10 text-mata-moss' : 'bg-mata-gold/20 text-mata-clay'
                  }`}>
                    {v.tipo_contato === 'presencial' ? 'Presencial' : 'Videoconferência'}
                  </span>
                  {v.convertido && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Convertido em {v.tipo_conversao === 'comprador' ? 'compradora' : 'revendedora'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-mata-ink/50 mt-1">{formatarDataHora(v.data_visita)}</p>
                {v.observacoes && <p className="text-sm text-mata-ink/70 mt-2">{v.observacoes}</p>}
              </div>
              <div className="shrink-0 text-right space-x-3 text-sm">
                {!v.convertido ? (
                  <button onClick={() => setConvertendo(v)} className="text-mata-copper hover:underline">
                    Converter em negócio
                  </button>
                ) : (
                  <button onClick={() => marcarNaoConvertido(v)} className="text-mata-ink/40 hover:text-red-600">
                    Desfazer conversão
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 bg-mata-ink/40 flex items-center justify-center p-6 z-20">
          <form onSubmit={salvar} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-display text-xl">Agendar visita / contato</h3>

            <div>
              <label className="text-xs text-mata-ink/60">Contato já cadastrado (opcional)</label>
              <select
                value={form.contato_id}
                onChange={(e) => setForm({ ...form, contato_id: e.target.value })}
                className="w-full border border-mata-sand rounded-lg px-3 py-2 text-sm mt-1"
              >
                <option value="">— Novo lead (ainda não cadastrado) —</option>
                {contatos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.tipo === 'comprador' ? 'compradora' : 'revendedora'})
                  </option>
                ))}
              </select>
            </div>

            {!form.contato_id && (
              <input
                required
                placeholder="Nome do lead"
                value={form.nome_lead}
                onChange={(e) => setForm({ ...form, nome_lead: e.target.value })}
                className="w-full border border-mata-sand rounded-lg px-3 py-2 text-sm"
              />
            )}

            <input
              type="datetime-local"
              required
              value={form.data_visita}
              onChange={(e) => setForm({ ...form, data_visita: e.target.value })}
              className="w-full border border-mata-sand rounded-lg px-3 py-2 text-sm"
            />

            <div className="flex gap-2">
              {[
                { v: 'presencial', l: 'Presencial' },
                { v: 'videoconferencia', l: 'Videoconferência' },
              ].map((op) => (
                <label
                  key={op.v}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm border cursor-pointer ${
                    form.tipo_contato === op.v
                      ? 'bg-mata-copper text-white border-mata-copper'
                      : 'border-mata-sand text-mata-ink/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.tipo_contato === op.v}
                    onChange={() => setForm({ ...form, tipo_contato: op.v })}
                    className="hidden"
                  />
                  {op.l}
                </label>
              ))}
            </div>

            <textarea
              placeholder="Observações"
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="w-full border border-mata-sand rounded-lg px-3 py-2 text-sm"
              rows={3}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="px-4 py-2 text-sm text-mata-ink/60"
              >
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 text-sm bg-mata-copper text-white rounded-lg">
                Agendar
              </button>
            </div>
          </form>
        </div>
      )}

      {convertendo && (
        <div className="fixed inset-0 bg-mata-ink/40 flex items-center justify-center p-6 z-20">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4 text-center">
            <h3 className="font-display text-xl">Converter em negócio</h3>
            <p className="text-sm text-mata-ink/60">
              {convertendo.nome_lead || convertendo.contatos?.nome} vira um cadastro de:
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => confirmarConversao('comprador')}
                className="flex-1 py-2 rounded-lg text-sm border border-mata-copper text-mata-copper hover:bg-mata-copper/10"
              >
                Compradora
              </button>
              <button
                onClick={() => confirmarConversao('revendedor')}
                className="flex-1 py-2 rounded-lg text-sm border border-mata-copper text-mata-copper hover:bg-mata-copper/10"
              >
                Revendedora
              </button>
            </div>
            <button onClick={() => setConvertendo(null)} className="text-xs text-mata-ink/40">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
