export function diasDesde(dataISO) {
  if (!dataISO) return null
  const data = new Date(dataISO)
  const hoje = new Date()
  const diffMs = hoje - data
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export function formatarData(dataISO) {
  if (!dataISO) return '—'
  return new Date(dataISO).toLocaleDateString('pt-BR')
}

export function formatarDataHora(dataISO) {
  if (!dataISO) return '—'
  return new Date(dataISO).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export function formatarMoeda(valor) {
  return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Retorna true se o contato está "atrasado" (30+ dias sem contato/venda)
export function estaAtrasado(ultimoContatoISO, limite = 30) {
  const dias = diasDesde(ultimoContatoISO)
  if (dias === null) return true
  return dias > limite
}
