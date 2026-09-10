import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { diasDesde, estaAtrasado, formatarData } from '../lib/helpers'

const vazio = { nome: '', tipo: 'comprador', telefone: '', email: '', cidade: '', observacoes: '' }

export default function Cadastro() {
  const [contatos, setContatos] = useState([])
  const [ultimoContato, setUltimoContato] = useState({}) // { contato_id: dataISO }
  const [aba, setAba] = useState('comprador')
  const [carregando, setCarregando] = useState(true)
  const [form, setForm] = useState(vazio)
  const [editandoId, setEditandoId] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    setCarregando(true)
    const { data: cData } = await supabase.from('contatos').select('*').order('nome')
    const { data: vData } = await supabase
      .from('visitas')
      .select('contato_id, data_visita')
      .not('contato_id', 'is', null)
      .order('data_visita', { ascending: false })
    const { data: vendaData } = await supabase
      .from('vendas')
      .select('contato_id, data_venda')
      .order('data_venda', { ascending: false })

    const ultimos = {}
    ;[...(vData || []), ...(vendaData || [])].forEach((r) => {
      const data = r.data_visita || r.data_venda
      if (!ultimos[r.contato_id] || new Date(data) > new Date(ultimos[r.contato_id])) {
        ultimos[r.contato_id] = data
      }
    })

    setContatos(cData || [])
    setUltimoContato(ultimos)
    setCarregando(false)
  }

  function abrirNovo() {
    setForm({ ...vazio, tipo: aba })
    setEditandoId(null)
    setMostrarForm(true)
  }

  function abrirEdicao(c) {
    setForm({ ...c })
    setEditandoId(c.id)
    setMostrarForm(true)
  }

  async function salvar(e) {
    e.preventDefault()
    if (editandoId) {
      await supabase.from('contatos').update(form).eq('id', editandoId)
    } else {
      await supabase.from('contatos').insert(form)
    }
    setMostrarForm(false)
    carregar()
  }

  async function excluir(id) {
    if (!confirm('Excluir este cadastro?')) return
    await supabase.from('contatos').delete().eq('id', id)
    carregar()
  }

  const listaFiltrada = contatos.filter((c) => c.tipo === aba)

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-3xl text-mata-ink">Cadastro</h2>
          <p className="text-mata-ink/50 text-sm mt-1">Compradoras e revendedoras</p>
        </div>
        <button
          onClick={abrirNovo}
          className="bg-mata-copper text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-mata-clay"
        >
          + Novo cadastro
        </button>
      </div>

      <div className="flex gap-1 mb-5 border-b border-mata-sand">
        {['comprador', 'revendedor'].map((t) => (
          <button
            key={t}
            onClick={() => setAba(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              aba === t ? 'border-mata-copper text-mata-copper' : 'border-transparent text-mata-ink/50'
            }`}
          >
            {t === 'comprador' ? 'Compradoras' : 'Revendedoras'}
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="text-mata-ink/50 text-sm">Carregando…</p>
      ) : listaFiltrada.length === 0 ? (
        <p className="text-mata-ink/50 text-sm">Nenhum cadastro ainda nesta categoria.</p>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden border border-mata-sand">
          <table className="w-full text-sm">
            <thead className="bg-mata-sand/50 text-mata-ink/60 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">Contato</th>
                <th className="text-left px-4 py-3">Cidade</th>
                <th className="text-left px-4 py-3">Último contato</th>
                <th className="text-right px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.map((c) => {
                const ultima = ultimoContato[c.id]
                const atrasado = estaAtrasado(ultima)
                return (
                  <tr key={c.id} className="border-t border-mata-sand/70">
                    <td className="px-4 py-3 font-medium">{c.nome}</td>
                    <td className="px-4 py-3 text-mata-ink/70">{c.telefone || c.email || '—'}</td>
                    <td className="px-4 py-3 text-mata-ink/70">{c.cidade || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={atrasado ? 'text-red-600 font-medium' : 'text-mata-ink/70'}>
                        {ultima ? `${formatarData(ultima)} (${diasDesde(ultima)}d)` : 'Sem registro'}
                      </span>
                      {atrasado && (
                        <span className="ml-2 inline-block text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          +30 dias
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button onClick={() => abrirEdicao(c)} className="text-mata-copper hover:underline">
                        Editar
                      </button>
                      <button onClick={() => excluir(c.id)} className="text-mata-ink/40 hover:text-red-600">
                        Excluir
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 bg-mata-ink/40 flex items-center justify-center p-6 z-20">
          <form onSubmit={salvar} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-display text-xl">{editandoId ? 'Editar cadastro' : 'Novo cadastro'}</h3>

            <div className="flex gap-2">
              {['comprador', 'revendedor'].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setForm({ ...form, tipo: t })}
                  className={`flex-1 py-2 rounded-lg text-sm border ${
                    form.tipo === t
                      ? 'bg-mata-copper text-white border-mata-copper'
                      : 'border-mata-sand text-mata-ink/60'
                  }`}
                >
                  {t === 'comprador' ? 'Compradora' : 'Revendedora'}
                </button>
              ))}
            </div>

            <input
              required
              placeholder="Nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full border border-mata-sand rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Telefone"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              className="w-full border border-mata-sand rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-mata-sand rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Cidade"
              value={form.cidade}
              onChange={(e) => setForm({ ...form, cidade: e.target.value })}
              className="w-full border border-mata-sand rounded-lg px-3 py-2 text-sm"
            />
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
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
