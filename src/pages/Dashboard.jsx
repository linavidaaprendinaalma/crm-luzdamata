import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '../supabaseClient'
import { formatarMoeda, diasDesde, estaAtrasado, formatarData } from '../lib/helpers'
import { exportarParaExcel } from '../lib/excel'

const CORES = ['#B0673A', '#C9A15A', '#5C6E4A', '#8C5A3C', '#3B2417']

export default function Dashboard() {
  const [carregando, setCarregando] = useState(true)
  const [contatos, setContatos] = useState([])
  const [visitas, setVisitas] = useState([])
  const [vendas, setVendas] = useState([])
  const [itensPorVenda, setItensPorVenda] = useState({})

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    setCarregando(true)
    const { data: cData } = await supabase.from('contatos').select('*')
    const { data: vData } = await supabase.from('visitas').select('*, contatos(nome)').order('data_visita', { ascending: false })
    const { data: vendaData } = await supabase.from('vendas').select('*, contatos(nome)').order('data_venda', { ascending: false })
    const { data: iData } = await supabase.from('itens_venda').select('*')

    const agrupado = {}
    ;(iData || []).forEach((i) => {
      if (!agrupado[i.venda_id]) agrupado[i.venda_id] = []
      agrupado[i.venda_id].push(i)
    })

    setContatos(cData || [])
    setVisitas(vData || [])
    setVendas(vendaData || [])
    setItensPorVenda(agrupado)
    setCarregando(false)
  }

  if (carregando) return <div className="p-8 text-mata-ink/50 text-sm">Carregando…</div>

  // -------- cálculos --------
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  let rendaMes = 0
  let rendaAcumulada = 0
  const vendasPorMes = {}
  const produtoVendas = {}
  const clienteTotais = {}

  vendas.forEach((v) => {
    const itens = itensPorVenda[v.id] || []
    const totalVenda = itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0)
    rendaAcumulada += totalVenda
    if (new Date(v.data_venda) >= inicioMes) rendaMes += totalVenda

    const mesLabel = new Date(v.data_venda).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    vendasPorMes[mesLabel] = (vendasPorMes[mesLabel] || 0) + totalVenda

    const nomeCliente = v.contatos?.nome || 'Desconhecido'
    clienteTotais[nomeCliente] = (clienteTotais[nomeCliente] || 0) + totalVenda

    itens.forEach((i) => {
      produtoVendas[i.produto_nome] = (produtoVendas[i.produto_nome] || 0) + i.quantidade
    })
  })

  const graficoMensal = Object.entries(vendasPorMes)
    .slice(-6)
    .map(([mes, total]) => ({ mes, total }))

  const topProdutos = Object.entries(produtoVendas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, qtd]) => ({ nome, qtd }))

  const topClientes = Object.entries(clienteTotais)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, total]) => ({ nome, total }))

  // último contato (visita ou venda) por contato_id
  const ultimoContato = {}
  ;[...visitas.filter((v) => v.contato_id), ...vendas].forEach((r) => {
    const data = r.data_visita || r.data_venda
    const id = r.contato_id
    if (!ultimoContato[id] || new Date(data) > new Date(ultimoContato[id])) {
      ultimoContato[id] = data
    }
  })
  const atrasados = contatos.filter((c) => estaAtrasado(ultimoContato[c.id]))

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-3xl text-mata-ink">Dashboard</h2>
          <p className="text-mata-ink/50 text-sm mt-1">Visão geral do negócio</p>
        </div>
        <button
          onClick={() => exportarParaExcel({ contatos, visitas, vendas, itensPorVenda })}
          className="bg-mata-ink text-mata-cream px-4 py-2 rounded-lg text-sm font-medium hover:bg-mata-bark"
        >
          Exportar para Excel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-mata-sand rounded-xl p-5">
          <p className="text-xs text-mata-ink/50 uppercase tracking-wide">Renda do mês</p>
          <p className="font-display text-2xl text-mata-copper mt-1">{formatarMoeda(rendaMes)}</p>
        </div>
        <div className="bg-white border border-mata-sand rounded-xl p-5">
          <p className="text-xs text-mata-ink/50 uppercase tracking-wide">Renda acumulada</p>
          <p className="font-display text-2xl text-mata-copper mt-1">{formatarMoeda(rendaAcumulada)}</p>
        </div>
        <div className="bg-white border border-mata-sand rounded-xl p-5">
          <p className="text-xs text-mata-ink/50 uppercase tracking-wide">Contatos atrasados (+30d)</p>
          <p className="font-display text-2xl text-red-600 mt-1">{atrasados.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-mata-sand rounded-xl p-5">
          <p className="text-sm font-medium mb-3">Vendas por mês</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={graficoMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE3D3" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatarMoeda(v)} />
              <Bar dataKey="total" fill="#B0673A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-mata-sand rounded-xl p-5">
          <p className="text-sm font-medium mb-3">Produtos mais vendidos</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={topProdutos} dataKey="qtd" nameKey="nome" outerRadius={80}>
                {topProdutos.map((_, i) => (
                  <Cell key={i} fill={CORES[i % CORES.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-mata-sand rounded-xl p-5">
          <p className="text-sm font-medium mb-3">Clientes que mais compram</p>
          <ul className="space-y-2">
            {topClientes.map((c) => (
              <li key={c.nome} className="flex justify-between text-sm">
                <span>{c.nome}</span>
                <span className="text-mata-copper font-medium">{formatarMoeda(c.total)}</span>
              </li>
            ))}
            {topClientes.length === 0 && <p className="text-sm text-mata-ink/40">Sem vendas ainda.</p>}
          </ul>
        </div>

        <div className="bg-white border border-mata-sand rounded-xl p-5">
          <p className="text-sm font-medium mb-3">Precisam de contato (+30 dias)</p>
          <ul className="space-y-2">
            {atrasados.slice(0, 8).map((c) => (
              <li key={c.id} className="flex justify-between text-sm">
                <span>{c.nome} <span className="text-xs text-mata-ink/40">({c.tipo === 'comprador' ? 'compradora' : 'revendedora'})</span></span>
                <span className="text-red-600 text-xs">
                  {ultimoContato[c.id] ? `${diasDesde(ultimoContato[c.id])}d — ${formatarData(ultimoContato[c.id])}` : 'nunca contatada'}
                </span>
              </li>
            ))}
            {atrasados.length === 0 && <p className="text-sm text-mata-ink/40">Tudo em dia 🌿</p>}
          </ul>
        </div>
      </div>
    </div>
  )
}
