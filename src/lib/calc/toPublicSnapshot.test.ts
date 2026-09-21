import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'
import type { CompanySettings, Proposal } from '@/types/firestore'
import { toPublicSnapshot } from './toPublicSnapshot'

// Valores-sentinela para custo/margem/comissão: se algum deles aparecer no JSON do
// snapshot público, a allowlist vazou e o teste falha.
const CUSTO_UNITARIO_SENTINELA = 731117
const MARGEM_SENTINELA = 0.417171
const COMISSAO_SENTINELA = 0.033131
const PRECO_FINAL = 25000

function buildProposal(): Proposal {
  const agora = Timestamp.now()
  return {
    id: 'prop-1',
    numero: 'TS-2026-014',
    versao: 1,
    clientId: 'client-1',
    clienteNome: 'João da Silva',
    status: 'enviada',
    criadoEm: agora,
    atualizadoEm: agora,
    enviadaEm: agora,
    validaAte: agora,
    entrada: {
      consumoMedioKwh: 500,
      consumoMensalKwh: null,
      contaAtual: 495,
      tarifaKwh: 0.99,
      ligacao: 'mono',
      tipoTelhado: 'ceramico',
      observacoes: '',
    },
    sistema: { potenciaKwp: 4.4, qtdModulos: 8, moduloId: 'mod-1', inversorId: 'inv-1', areaM2: 24 },
    itens: [
      {
        id: 'item-1',
        catalogId: 'mod-1',
        descricao: 'Módulo 550W',
        especificacao: 'Mono PERC',
        quantidade: 8,
        unidade: 'un',
        custoUnitario: CUSTO_UNITARIO_SENTINELA,
        status: 'incluso',
      },
    ],
    servicos: { projeto: 300, instalacao: 1800, art: 150, frete: 200, homologacao: 250, outros: [] },
    precificacao: { modo: 'margem', margem: MARGEM_SENTINELA, comissao: COMISSAO_SENTINELA, precoFinal: PRECO_FINAL },
    resultados: {
      custoTotal: CUSTO_UNITARIO_SENTINELA * 8,
      lucroEstimado: 12345.67,
      margemResultante: MARGEM_SENTINELA,
      precoPorWp: PRECO_FINAL / 4400,
      geracaoMediaMensalKwh: 500,
      economiaAno1Conservador: 5000,
      economiaAno1Otimista: 5200,
      economia25AnosConservador: 150000,
      economia25AnosOtimista: 180000,
      paybackMesesConservador: 45,
      paybackMesesOtimista: 42,
      custoKwhGerado: 0.15,
      relacaoCcCa: 1.1,
    },
    publicId: 'public-abc-123',
    historicoVersoes: [],
  }
}

function buildCompany(): CompanySettings {
  return {
    nome: 'TS Solar',
    parceria: { nome: 'TechSolar', cnpj: '33.146.037/0001-81' },
    cnpj: '00.000.000/0001-00',
    cidade: 'Goiânia, GO',
    whatsapp: '5562999999999',
    instagram: '@tssolar',
    email: 'contato@tssolar.com.br',
    logoUrl: null,
    validadeDias: 15,
    prazoInstalacao: 'até 45 dias após a aprovação da Equatorial Goiás',
    garantias: { paineis: '25 anos', inversor: '10 anos', instalacao: '' },
    servicosInclusos: ['Projeto', 'Instalação', 'Homologação'],
    exclusoes: 'Não inclui reforço de padrão de entrada.',
  }
}

const FORBIDDEN_KEYS = ['custoUnitario', 'margem', 'comissao', 'modo', 'custoTotal', 'lucroEstimado']

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (value && typeof value === 'object') {
    for (const [key, val] of Object.entries(value)) {
      keys.add(key)
      collectKeys(val, keys)
    }
  }
  return keys
}

describe('toPublicSnapshot — regra de ouro (allowlist)', () => {
  it('nunca inclui campos de custo, margem ou comissão', () => {
    const snapshot = toPublicSnapshot({
      proposal: buildProposal(),
      company: buildCompany(),
      taxaCartaoMensal: 0.0099,
      parcelasCartao: 12,
      taxaFinanciamentoMensal: 0.0149,
      parcelasFinanciamento: 60,
    })

    const keys = collectKeys(snapshot)
    for (const forbidden of FORBIDDEN_KEYS) {
      expect(keys.has(forbidden)).toBe(false)
    }

    const json = JSON.stringify(snapshot)
    expect(json).not.toContain(String(CUSTO_UNITARIO_SENTINELA))
    expect(json).not.toContain(String(MARGEM_SENTINELA))
    expect(json).not.toContain(String(COMISSAO_SENTINELA))
  })

  it('mantém os dados que o cliente precisa ver', () => {
    const snapshot = toPublicSnapshot({
      proposal: buildProposal(),
      company: buildCompany(),
      taxaCartaoMensal: 0.0099,
      parcelasCartao: 12,
      taxaFinanciamentoMensal: 0.0149,
      parcelasFinanciamento: 60,
    })

    expect(snapshot.numero).toBe('TS-2026-014')
    expect(snapshot.precoFinal).toBe(PRECO_FINAL)
    expect(snapshot.itens[0].descricao).toBe('Módulo 550W')
    expect(snapshot.empresa.parceria.nome).toBe('TechSolar')
    expect(snapshot.parcelas.cartao.valor).toBeGreaterThan(0)
  })
})
