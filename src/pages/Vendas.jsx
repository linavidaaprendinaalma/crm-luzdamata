import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { formatarData, formatarMoeda } from '../lib/helpers'

const vendaVazia = { contato_id: '', data_venda: new Date().toISOString().slice(0, 10), forma_pagamento: '', observacoes: '' }

export default function Vendas() {
  const [vendas, setVendas] = useState([])
  const [contatos, setContatos] = useState([])
  const [produtos, setProdutos] = useState([])
  const [itensPorVenda, setItensPorVenda] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(vendaVazia)
  const [itensForm, setItensForm] = useState([{ produto_id: '', produto_nome: '', quantidade: 1, valor_unitario: 0 }])

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    setCarregando(true)
    const { data: vData } = await supabase
      .from('vendas')
      .select('*, contatos(nome)')
      .order('data_venda', { ascending: false })
    const { data: cData } = await supabase.from('contatos').select('id, nome').order('nome')
    const { data: pData } = await supabase.from('produtos').select('*').eq('ativo', true).order('nome')
    const { data: iData } = await supabase.from('itens_venda').select('*')

    const agrupado = {}
    ;(iData || []).forEach((i) => {
      if (!agrupado[i.venda_id]) agrupado[i.venda_id] = []
      agrupado[i.venda_id].push(i)
    })

    setVendas(vData || [])
    setContatos(cData || [])
    setProdutos(pData || [])
    setItensPorVenda(agrupado)
    setCarregando(false)
  }

  function atualizarItem(idx, campo, valor) {
    const novos = [...itensForm]
    if (campo === 'produto_id') {
      const produto = produtos.find((p) => p.id === valor)
      novos[idx] = { ...novos[idx], produto_id: valor, produto_nome: produto?.nome || '', valor_unitario: produto?.preco || 0 }
    } else {
      novos[idx] = { ...novos[idx], [campo]: valor }
    }
    setItensForm(novos)
  }

  function adicionarLinha() {
    setItensForm([...itensForm, { produto_id: '', produto_nome: '', quantidade: 1, valor_unitario: 0 }])
  }

  function removerLinha(idx) {
    setItensForm(itensForm.filter((_, i) => i !== idx))
  }

  async function salvar(e) {
    e.preventDefault()
    const { data: novaVenda } = await supabase.from('vendas').insert(form).select().single()
    const itensValidos = itensForm.filter((i) => i.produto_nome && i.quantidade > 0)
    if (itensValidos.length > 0) {
      await supabase.from('itens_venda').insert(
        itensValidos.map((i) => ({ ...i, venda_id: novaVenda.id }))
      )
    }
    setForm(vendaVazia)
    setItensForm([{ produto_id: '', produto_nome: '', quantidade: 1, valor_unitario: 0 }])
    setMostrarForm(false)
    carregar()
  }

  const totalForm = itensForm.reduce((s, i) => s + (i.quantidade || 0) * (i.valor_unitario || 0), 0)

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-3xl text-mata-ink">Vendas</h2>
          <p className="text-mata-ink/50 text-sm mt-1">Registro de vendas de produtos</p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-mata-copper text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-mata-clay"
        >
          + Nova venda
        </button>
      </div>

      {carregando ? (
        <p className="text-mata-ink/50 text-sm">Carregando…</p>
      ) : vendas.length === 0 ? (
        <p className="text-mata-ink/50 text-sm">Nenhuma venda registrada ainda.</p>
      ) : (
        <div className="space-y-3">
          {vendas.map((v) => {
            const itens = itensPorVenda[v.id] || []
            const total = itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0)
            return (
              <div key={v.id} className="bg-white border border-mata-sand rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{v.contatos?.nome}</span>
                    <span className="text-xs text-mata-ink/50 ml-2">{formatarData(v.data_venda)}</span>
                    {v.forma_pagamento && (
                      <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-mata-sand text-mata-ink/60">
                        {v.forma_pagamento}
                      </span>
                    )}
                  </div>
                  <span className="font-display text-lg text-mata-copper">{formatarMoeda(total)}</span>
                </div>
                <ul className="mt-2 text-sm text-mata-ink/70 space-y-0.5">
                  {itens.map((i) => (
                    <li key={i.id}>
                      {i.quantidade}x {i.produto_nome} — {formatarMoeda(i.valor_unitario)}
                    </li>
                  ))}
                </ul>
                {v.observacoes && <p className="text-xs text-mata-ink/50 mt-2">{v.observacoes}</p>}
              </div>
            )
          })}
        </div>
      )}

      {mostrarForm && (
        <div className="fixed inset-0 bg-mata-ink/40 flex items-center justify-center p-6 z-20 overflow-y-auto">
          <form onSubmit={salvar} className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4 my-8">
            <h3 className="font-display text-xl">Nova venda</h3>

            <select
              required
              value={form.contato_id}
              onChange={(e) => setForm({ ...form, contato_id: e.target.value })}
              className="w-full border border-mata-sand rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Selecione o cliente</option>
              {contatos.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="date"
                required
                value={form.data_venda}
                onChange={(e) => setForm({ ...form, data_venda: e.target.value })}
                className="flex-1 border border-mata-sand rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Forma de pagamento"
                value={form.forma_pagamento}
                onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })}
                className="flex-1 border border-mata-sand rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-mata-ink/60">Itens</label>
              {itensForm.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={item.produto_id}
                    onChange={(e) => atualizarItem(idx, 'produto_id', e.target.value)}
                    className="flex-1 border border-mata-sand rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="">Produto</option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantidade}
                    onChange={(e) => atualizarItem(idx, 'quantidade', Number(e.target.value))}
                    className="w-16 border border-mata-sand rounded-lg px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={item.valor_unitario}
                    onChange={(e) => atualizarItem(idx, 'valor_unitario', Number(e.target.value))}
                    className="w-24 border border-mata-sand rounded-lg px-2 py-1.5 text-sm"
                  />
                  <button type="button" onClick={() => removerLinha(idx)} className="text-mata-ink/40 hover:text-red-600 text-sm">
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" onClick={adicionarLinha} className="text-xs text-mata-copper hover:underline">
                + adicionar item
              </button>
            </div>

            <p className="text-right text-sm font-medium">Total: {formatarMoeda(totalForm)}</p>

            <textarea
              placeholder="Observações"
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="w-full border border-mata-sand rounded-lg px-3 py-2 text-sm"
              rows={2}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="px-4 py-2 text-sm text-mata-ink/60">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 text-sm bg-mata-copper text-white rounded-lg">
                Salvar venda
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
