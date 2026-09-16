import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '../supabaseClient'
import { formatarMoeda, diasDesde, formatarData, categoriaRelacionamento, LABEL_CATEGORIA } from '../lib/helpers'
import { exportarParaExcel } from '../lib/excel'

const CORES = ['#B0673A', '#C9A15A', '#5C6E4A', '#8C5A3C', '#3B2417']

const ESTILO_CATEGORIA = {
  em_dia: { emoji: '🟢', cor: 'text-mata-moss', bg: 'bg-mata-moss/10' },
  atencao: { emoji: '🟡', cor: 'text-amber-600', bg: 'bg-amber-50' },
  precisa_contato: { emoji: '🔴', cor: 'text-red-600', bg: 'bg-red-50' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [contatos, setContatos] = useState([])
  const [visitas, setVisitas] = useState([])
  const [vendas, setVendas] = useState([])
  const [itensPorVenda, setItensPorVenda] = useState({})
  const [categoriaPorProduto, setCategoriaPorProduto] = useState({})
  const [metaMes, setMetaMes] = useState(null)
  const [categoriaAberta, setCategoriaAberta] = useState(null) // 'em_dia' | 'atencao' | 'precisa_contato' | null

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    setCarregando(true)
    const { data: cData } = await supabase.from('contatos').select('*')
    const { data: vData } = await supabase.from('visitas').select('*, contatos(nome)').order('data_visita', { ascending: false })
    const { data: vendaData } = await supabase.from('vendas').select('*, contatos(nome)').order('data_venda', { ascending: false })
    const { data: iData } = await supabase.from('itens_venda').select('*')
    const { data: prodData } = await supabase.from('produtos').select('id, categoria')

    const catPorProduto = {}
    ;(prodData || []).forEach((p) => {
      catPorProduto[p.id] = p.categoria || 'Outros'
    })

    const primeiroDiaMes = new Date()
    primeiroDiaMes.setDate(1)
    const mesISO = primeiroDiaMes.toISOString().slice(0, 10)
    const { data: metaData } = await supabase
      .from('metas_mensais')
      .select('valor_meta')
      .eq('mes', mesISO)
      .maybeSingle()
    setMetaMes(metaData?.valor_meta ?? null)

    const agrupado = {}
    ;(iData || []).forEach((i) => {
      if (!agrupado[i.venda_id]) agrupado[i.venda_id] = []
      agrupado[i.venda_id].push(i)
    })

    setContatos(cData || [])
    setVisitas(vData || [])
    setVendas(vendaData || [])
    setItensPorVenda(agrupado)
    setCategoriaPorProduto(catPorProduto)
    setCarregando(false)
  }

  if (carregando) return <div className="p-8 text-mata-ink/50 text-sm">Carregando…</div>

  // -------- filtro base: relacionamento considera SÓ contatos ativos hoje --------
  const contatosAtivos = contatos.filter((c) => c.ativo !== false)
  const idsAtivos = new Set(contatosAtivos.map((c) => c.id))
  const visitasAtivas = visitas.filter((v) => !v.contato_id || idsAtivos.has(v.contato_id))
  const vendasAtivasHoje = vendas.filter((v) => idsAtivos.has(v.contato_id))

  // -------- filtro para indicadores financeiros: conta vendas de contatos
  // ativos normalmente, e de contatos inativos até a data em que ficaram
  // inativos (vendas feitas antes da desativação continuam no histórico) --------
  const contatosPorId = {}
  contatos.forEach((c) => {
    contatosPorId[c.id] = c
  })

  function vendaContaNoHistorico(v) {
    const c = contatosPorId[v.contato_id]
    if (!c) return false
    if (c.ativo !== false) return true
    if (!c.data_inativacao) return false // inativo sem data registrada: não conta, por segurança
    return new Date(v.data_venda) <= new Date(c.data_inativacao)
  }

  const vendasParaIndicadores = vendas.filter(vendaContaNoHistorico)

  // -------- cálculos financeiros (contatos ativos + inativos até a data de inativação) --------
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  let rendaMes = 0
  let rendaAcumulada = 0
  const vendasPorMes = {}
  const produtoVendas = {}
  const clienteTotais = {}

  vendasParaIndicadores.forEach((v) => {
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

  // -------- vendas por categoria de produto (quantidade de itens) --------
  const categoriaQtd = {}
  let totalItensVendidos = 0
  vendasParaIndicadores.forEach((v) => {
    const itens = itensPorVenda[v.id] || []
    itens.forEach((i) => {
      const cat = (i.produto_id && categoriaPorProduto[i.produto_id]) || 'Outros'
      categoriaQtd[cat] = (categoriaQtd[cat] || 0) + i.quantidade
      totalItensVendidos += i.quantidade
    })
  })
  const vendasPorCategoria = Object.entries(categoriaQtd)
    .sort((a, b) => b[1] - a[1])
    .map(([categoria, qtd]) => ({
      categoria,
      qtd,
      pct: totalItensVendidos ? Math.round((qtd / totalItensVendidos) * 100) : 0,
    }))

  // -------- meta x realizado --------
  const percentualMeta = metaMes ? Math.min(100, Math.round((rendaMes / metaMes) * 100)) : null

  // -------- relacionamento: último contato (visita ou venda) por contato --------
  // considerando somente visitas/vendas ligadas a contatos ativos
  const ultimoContato = {}
  ;[...visitasAtivas.filter((v) => v.contato_id), ...vendasAtivasHoje].forEach((r) => {
    const data = r.data_visita || r.data_venda
    const id = r.contato_id
    if (!ultimoContato[id] || new Date(data) > new Date(ultimoContato[id])) {
      ultimoContato[id] = data
    }
  })

  // classifica cada contato ativo em em_dia / atencao / precisa_contato
  const porCategoria = { em_dia: [], atencao: [], precisa_contato: [] }
  contatosAtivos.forEach((c) => {
    const cat = categoriaRelacionamento(ultimoContato[c.id])
    porCategoria[cat].push(c)
  })

  // lista "precisa de contato" ordenada pelo maior número de dias sem contato primeiro
  // (nunca contatado conta como o maior atraso possível)
  function ordenarPorDiasDesc(lista) {
    return [...lista].sort((a, b) => {
      const diasA = diasDesde(ultimoContato[a.id])
      const diasB = diasDesde(ultimoContato[b.id])
      if (diasA === null && diasB === null) return 0
      if (diasA === null) return -1
      if (diasB === null) return 1
      return diasB - diasA
    })
  }

  const listaCategoriaAberta = categoriaAberta
    ? categoriaAberta === 'precisa_contato'
      ? ordenarPorDiasDesc(porCategoria[categoriaAberta])
      : porCategoria[categoriaAberta]
    : []

  function verCliente(id) {
    setCategoriaAberta(null)
    navigate('/cadastro', { state: { editarContatoId: id } })
  }

  function registrarContato(id) {
    setCategoriaAberta(null)
    navigate('/visitas', { state: { novoContatoId: id } })
  }

  return (
    <div className="p-4 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display text-xl text-mata-ink">Dashboard</h2>
          <p className="text-mata-ink/50 text-xs mt-0.5">Visão geral do negócio</p>
        </div>
        <button
          onClick={() => exportarParaExcel({ contatos, visitas, vendas, itensPorVenda })}
          className="bg-mata-ink text-mata-cream px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-mata-bark"
        >
          Exportar para Excel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div className="bg-white border border-mata-sand rounded-xl px-4 py-2.5">
          <p className="text-[11px] text-mata-ink/50 uppercase tracking-wide">Renda do mês</p>
          <p className="font-display text-lg text-mata-copper leading-tight">{formatarMoeda(rendaMes)}</p>
        </div>
        <div className="bg-white border border-mata-sand rounded-xl px-4 py-2.5">
          <p className="text-[11px] text-mata-ink/50 uppercase tracking-wide">Renda acumulada</p>
          <p className="font-display text-lg text-mata-copper leading-tight">{formatarMoeda(rendaAcumulada)}</p>
        </div>
      </div>

      {/* Indicador de relacionamento — só contatos ativos, clicável */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        {['em_dia', 'atencao', 'precisa_contato'].map((cat) => {
          const estilo = ESTILO_CATEGORIA[cat]
          return (
            <button
              key={cat}
              onClick={() => setCategoriaAberta(cat)}
              className={`text-left bg-white border border-mata-sand rounded-xl px-4 py-2.5 hover:shadow-md transition-shadow ${estilo.bg}`}
            >
              <p className="text-[11px] text-mata-ink/50 uppercase tracking-wide">
                {estilo.emoji} {LABEL_CATEGORIA[cat]}
              </p>
              <p className={`font-display text-lg leading-tight mt-0.5 ${estilo.cor}`}>{porCategoria[cat].length}</p>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3 flex-1 min-h-0">
        <div className="bg-white border border-mata-sand rounded-xl p-3 flex flex-col">
          <p className="text-sm font-medium mb-1 shrink-0">Vendas por mês</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDE3D3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={36} />
                <Tooltip formatter={(v) => formatarMoeda(v)} />
                <Bar dataKey="total" fill="#B0673A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-mata-sand rounded-xl p-3 flex flex-col">
          <p className="text-sm font-medium mb-1">Meta x realizado</p>
          {metaMes === null ? (
            <div className="flex-1 flex items-center justify-center text-sm text-mata-ink/40 text-center px-4">
              Meta não definida para este mês.
              <br />
              Cadastre em <code className="text-xs bg-mata-sand/50 px-1 rounded">metas_mensais</code> no Supabase.
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-5 px-2 min-h-0">
              <div className="flex-1 flex items-end gap-4 h-full">
                <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full bg-mata-sand rounded-t-lg" style={{ height: '85%' }} />
                  <p className="text-xs text-mata-ink/50">Meta</p>
                  <p className="text-sm font-medium">{formatarMoeda(metaMes)}</p>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className="w-full bg-mata-copper rounded-t-lg"
                    style={{ height: `${Math.min(85, (rendaMes / metaMes) * 85)}%` }}
                  />
                  <p className="text-xs text-mata-ink/50">Realizado</p>
                  <p className="text-sm font-medium">{formatarMoeda(rendaMes)}</p>
                </div>
              </div>
              <div className="text-center shrink-0">
                <p className="font-display text-2xl text-mata-copper">{percentualMeta}%</p>
                <p className="text-xs text-mata-ink/50 mt-1">da meta<br />alcançada</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 shrink-0" style={{ height: '150px' }}>
        <div className="bg-white border border-mata-sand rounded-xl p-3 flex flex-col">
          <p className="text-sm font-medium mb-1 shrink-0">Produtos mais vendidos</p>
          {topProdutos.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-mata-ink/40 text-center px-4">
              Ainda não há vendas de produtos.
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topProdutos} dataKey="qtd" nameKey="nome" outerRadius={45}>
                    {topProdutos.map((_, i) => (
                      <Cell key={i} fill={CORES[i % CORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white border border-mata-sand rounded-xl p-3 flex flex-col">
          <p className="text-sm font-medium mb-1">Vendas por categoria</p>
          {vendasPorCategoria.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-mata-ink/40">
              Sem vendas de produtos ainda.
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-4 min-h-0">
              <div className="relative shrink-0 h-full aspect-square">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vendasPorCategoria}
                      dataKey="qtd"
                      nameKey="categoria"
                      innerRadius="55%"
                      outerRadius="90%"
                    >
                      {vendasPorCategoria.map((_, i) => (
                        <Cell key={i} fill={CORES[i % CORES.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="font-display text-base text-mata-ink leading-none">{totalItensVendidos}</p>
                  <p className="text-[9px] text-mata-ink/50">itens</p>
                </div>
              </div>
              <ul className="flex-1 space-y-1 text-xs">
                {vendasPorCategoria.map((c, i) => (
                  <li key={c.categoria} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: CORES[i % CORES.length] }}
                      />
                      {c.categoria}
                    </span>
                    <span className="text-mata-ink/60">{c.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Modal com a lista detalhada da categoria clicada */}
      {categoriaAberta && (
        <div className="fixed inset-0 bg-mata-ink/40 flex items-center justify-center p-6 z-20">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl">
                {ESTILO_CATEGORIA[categoriaAberta].emoji} {LABEL_CATEGORIA[categoriaAberta]}{' '}
                <span className="text-mata-ink/40 text-sm font-sans">({listaCategoriaAberta.length})</span>
              </h3>
              <button onClick={() => setCategoriaAberta(null)} className="text-mata-ink/40 hover:text-mata-ink text-sm">
                Fechar ✕
              </button>
            </div>

            {listaCategoriaAberta.length === 0 ? (
              <p className="text-sm text-mata-ink/40">Nenhum contato ativo nessa categoria.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-mata-ink/50 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left py-2">Nome</th>
                    <th className="text-left py-2">Tipo</th>
                    <th className="text-left py-2">Último contato</th>
                    <th className="text-left py-2">Dias</th>
                    <th className="text-right py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {listaCategoriaAberta.map((c) => {
                    const ultima = ultimoContato[c.id]
                    const dias = diasDesde(ultima)
                    return (
                      <tr key={c.id} className="border-t border-mata-sand/70">
                        <td className="py-2.5 font-medium">{c.nome}</td>
                        <td className="py-2.5 text-mata-ink/60">{c.tipo === 'comprador' ? 'Compradora' : 'Revendedora'}</td>
                        <td className="py-2.5 text-mata-ink/60">{ultima ? formatarData(ultima) : '—'}</td>
                        <td className="py-2.5 text-mata-ink/60">{dias === null ? 'Nunca contatado' : `${dias}d`}</td>
                        <td className="py-2.5 text-right space-x-3">
                          <button onClick={() => verCliente(c.id)} className="text-mata-copper hover:underline">
                            👁 Ver cliente
                          </button>
                          <button onClick={() => registrarContato(c.id)} className="text-mata-copper hover:underline">
                            📝 Registrar contato
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
