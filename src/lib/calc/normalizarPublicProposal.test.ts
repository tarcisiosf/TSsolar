import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'
import type { PublicProposal } from '@/types/firestore'
import { normalizarPublicProposal } from './normalizarPublicProposal'

function buildLegacyRaw(): PublicProposal {
  const agora = Timestamp.now()
  const legado = {
    publicId: 'public-abc-123',
    numero: 'TS-2025-001',
    versao: 1,
    status: 'enviada',
    clienteNome: 'João da Silva',
    criadoEm: agora,
    atualizadoEm: agora,
    validaAte: null,
    entrada: {
      consumoMedioKwh: 500,
      consumoMensalKwh: null,
      contaAtual: 495,
      ligacao: 'mono',
      tipoTelhado: 'ceramico',
    },
    sistema: { potenciaKwp: 4.4, qtdModulos: 8, moduloId: 'mod-1', inversorId: 'inv-1', areaM2: 24 },
    itens: [],
    resultados: {
      precoPorWp: 5,
      geracaoMediaMensalKwh: 500,
      economiaAno1Conservador: 5000,
      economiaAno1Otimista: 5200,
      economia25AnosConservador: 150000,
      economia25AnosOtimista: 180000,
      paybackMesesConservador: 45,
      paybackMesesOtimista: 42,
      custoKwhGerado: 0.15,
      relacaoCcCa: 1.1,
      contaAntesMediaMensal: 495,
      contaDepoisMediaMensal: 55,
      percentualEconomiaMensal: 0.888,
      geracaoMensalKwh: new Array(12).fill(500),
      // pesoEstimado ausente — plano ainda não existia
    },
    precoFinal: 25000,
    condicoesPagamento: 'A combinar',
    // pagamento ausente
    empresa: {
      nome: 'TS Solar',
      parceria: { nome: 'TechSolar', cnpj: '33.146.037/0001-81' },
      cnpj: '',
      cidade: 'Goiânia, GO',
      whatsapp: '',
      instagram: '',
      logoUrl: null,
    },
    validadeDias: 15,
    prazoInstalacao: 'até 45 dias',
    garantias: { paineis: '25 anos', inversor: '10 anos', instalacao: '' },
    servicosInclusos: ['Projeto', 'Instalação'],
    exclusoes: 'Não inclui reforço de padrão de entrada.',
    // observacaoPreliminar, garantiaDemaisEquipamentos, responsavelTecnico ausentes
    // cliente ausente
  }
  return legado as unknown as PublicProposal
}

function buildNewFormatRaw(): PublicProposal {
  const agora = Timestamp.now()
  return {
    publicId: 'public-def-456',
    numero: 'TS-2026-014',
    versao: 1,
    status: 'enviada',
    clienteNome: 'Maria Souza',
    cliente: { cpfCnpj: '111.444.777-35', telefone: '5562988887777', endereco: 'Rua das Flores, 123', cidade: 'Goiânia, GO' },
    criadoEm: agora,
    atualizadoEm: agora,
    validaAte: null,
    entrada: {
      consumoMedioKwh: 500,
      consumoMensalKwh: null,
      contaAtual: 495,
      ligacao: 'mono',
      tipoTelhado: 'ceramico',
      tipoImovel: 'residencial',
      alturaInstalacao: 'ate_5m',
      inclinacaoGraus: 15,
      orientacaoTelhado: 'norte',
      distribuidora: 'Equatorial Goiás',
      unidadeConsumidora: '12345',
      coordenadas: { lat: -16.6, lng: -49.3 },
    },
    sistema: { potenciaKwp: 4.4, qtdModulos: 8, moduloId: 'mod-1', inversorId: 'inv-1', areaM2: 24 },
    itens: [],
    resultados: {
      precoPorWp: 5,
      geracaoMediaMensalKwh: 500,
      economiaAno1Conservador: 5000,
      economiaAno1Otimista: 5200,
      economia25AnosConservador: 150000,
      economia25AnosOtimista: 180000,
      paybackMesesConservador: 45,
      paybackMesesOtimista: 42,
      custoKwhGerado: 0.15,
      relacaoCcCa: 1.1,
      contaAntesMediaMensal: 495,
      contaDepoisMediaMensal: 55,
      percentualEconomiaMensal: 0.888,
      geracaoMensalKwh: new Array(12).fill(500),
      pesoEstimado: { totalKg: 324, kgPorM2: 13.5, estimativa: true },
    },
    precoFinal: 25000,
    condicoesPagamento: 'A combinar',
    pagamento: { cartao: { parcelas: 12, valor: 2200 }, financiamento: { parcelas: 60, valor: 550 } },
    empresa: {
      nome: 'TS Solar',
      parceria: { nome: 'TechSolar', cnpj: '33.146.037/0001-81' },
      cnpj: '',
      cidade: 'Goiânia, GO',
      whatsapp: '',
      instagram: '',
      logoUrl: null,
    },
    validadeDias: 15,
    prazoInstalacao: 'até 45 dias',
    garantias: { paineis: '25 anos', inversor: '10 anos', instalacao: '' },
    garantiaDemaisEquipamentos: '1 ano',
    servicosInclusos: ['Projeto', 'Instalação'],
    exclusoes: ['Não inclui reforço de padrão de entrada.'],
    observacaoPreliminar: 'Orçamento preliminar.',
    responsavelTecnico: { nome: 'Fulano', titulo: 'Engenheiro', crea: '123' },
  }
}

describe('normalizarPublicProposal', () => {
  it('preenche com o padrão os campos ausentes em snapshots publicados antes deste plano', () => {
    const result = normalizarPublicProposal(buildLegacyRaw())

    expect(Array.isArray(result.exclusoes)).toBe(true)
    expect(result.exclusoes).toEqual(['Não inclui reforço de padrão de entrada.'])
    expect(result.cliente.cpfCnpj).toBe('')
    expect(result.resultados.pesoEstimado.totalKg).toBe(0)
    expect(result.pagamento.cartao.parcelas).toBe(0)
    expect(result.responsavelTecnico.nome).toBe('')
  })

  it('mantém inalterado um snapshot que já tem todos os campos novos', () => {
    const raw = buildNewFormatRaw()
    const result = normalizarPublicProposal(raw)

    expect(result.exclusoes).toEqual(raw.exclusoes)
    expect(result.exclusoes).toBe(raw.exclusoes)
    expect(result.cliente).toEqual(raw.cliente)
  })
})
