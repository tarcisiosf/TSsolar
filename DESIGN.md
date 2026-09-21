# DESIGN.md — TS Solar

Guia visual e de interação do sistema de propostas e gestão da TS Solar.
Este arquivo define a **identidade** (cores, tipografia, componentes). O **comportamento** (movimento, toque, resposta, acessibilidade) segue a skill `apple-design`. Em caso de conflito sobre movimento e interação, vale a skill. Em caso de conflito sobre visual da marca, vale este arquivo.

Nome do estilo: **Sol & Grafite**. Premium, acolhedor, calmo e confiável. A emoção que buscamos é *confiança*: o cliente precisa sentir que os números são honestos.

---

## 1. Cores

Defina todas como variáveis CSS em `:root` e como tokens no Tailwind (`theme.extend.colors`). Nunca use hex solto nos componentes.

| Token | Hex | Uso |
|---|---|---|
| `graphite` | `#0F1B2D` | Base da marca: texto principal, fundos escuros (hero, sidebar, card destaque) |
| `ivory` | `#F7F4EE` | Fundo do app e da proposta (nunca branco puro no fundo) |
| `surface` | `#FFFFFF` | Cards sobre o fundo marfim |
| `sun` | `#F2A516` | Destaque único: logo, botão principal, validade, barra de geração. Texto sobre ele sempre `graphite` |
| `sun-soft` | `#FDF3DC` | Caixa de destaque (ex.: "parcela menor que sua conta") |
| `sun-ink` | `#5A3D00` | Texto dentro de `sun-soft` |
| `muted` | `#5B6472` | Texto secundário, legendas, rótulos |
| `muted-dark` | `#C9CFD8` | Texto secundário sobre fundo `graphite` |
| `line` | `#E6E1D7` | Divisórias e eixos de gráfico |
| `line-soft` | `#EFEAE0` | Divisórias internas de listas |
| `chip` | `#F1EDE4` | Fundo de pílulas neutras e trilhos de barra |
| `bar-neutral` | `#CFD5DE` | Barras de consumo e custo nos gráficos |
| `success` | `#1E7A50` | Lucro, "Incluso", indicadores positivos |
| `success-soft` | `#E3F2EA` | Fundo de chip de sucesso e card de lucro |
| `danger` | `#9A3412` | Perda, "Não incluso", custos negativos |
| `danger-soft` | `#F6E7E2` | Fundo de chip de perda |
| `info` | `#1D4ED8` / soft `#E6EEF9` | Status "Instalação" |
| `neutral-chip` | `#3A4758` / soft `#EEF1F5` | "Fornecido pelo cliente", "Homologação" |

**Regras**
- O âmbar `sun` é raro de propósito. No máximo um botão âmbar por tela.
- Verde só significa dinheiro positivo ou item incluso. Vermelho-terracota só significa perda ou item fora.
- Contraste mínimo 4.5:1 para texto (3:1 acima de 24px). Não clareie o `muted`.
- **Modo escuro** no painel administrativo: fundo `#0B1422`, superfícies `#132238`, texto `ivory`, mesmos acentos. A proposta do cliente fica sempre no tema claro (é documento comercial).
- Transição claro↔escuro suave (200ms em cor), nunca um salto de brilho.

## 2. Tipografia

- Fonte: **Plus Jakarta Sans** (auto-hospedada via `@fontsource/plus-jakarta-sans`, pesos 400, 500, 600, 700, 800), com fallback `system-ui, sans-serif`.
- Números sempre com `font-variant-numeric: tabular-nums` (valores alinham em tabelas e cards).
- Tamanhos em `rem`, respeitando o tamanho de fonte do aparelho.

| Estilo | Tamanho | Peso | Line-height | Letter-spacing |
|---|---|---|---|---|
| Display (hero) | `clamp(2.1rem, 4.5vw, 3.25rem)` | 800 | 1.05 | -0.035em |
| H1 | 2.125rem | 800 | 1.1 | -0.03em |
| Número grande (KPI) | 1.75–2rem | 800 | 1.1 | -0.03em |
| H2 / título de card | 1.125–1.25rem | 700 | 1.25 | -0.01em |
| Corpo | 0.9375–1rem | 400–600 | 1.5 | 0 |
| Legenda | 0.75–0.8125rem | 500–600 | 1.45 | 0 |
| Eyebrow (rótulo de seção) | 0.8125rem | 700, MAIÚSCULAS | 1.2 | +0.06em |

Hierarquia se constrói com **peso + tamanho + espaçamento juntos**, não só tamanho.

## 3. Espaçamento, raio e sombra

- Escala de espaçamento (base 4px): 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64.
- Gap padrão entre cards: 12px (celular), 16px (tablet e computador).
- Padding de card: 18–20px (celular), 22–28px (computador).
- Raios: pílula `999px`; botão 16–18px; card 20–24px; hero 28–32px; campo de formulário 14px.
- Sombra única de card: `0 1px 2px rgba(15,27,45,0.06)`. Sem sombras pesadas. Profundidade vem de camadas de cor, não de sombra.
- Botão de segmentos (Mês/Trimestre/Ano): trilho `#EDE8DE`, item ativo branco com sombra `0 1px 2px rgba(15,27,45,0.08)`.

## 4. Layout e responsividade

Mobile-first. O cliente abre a proposta pelo WhatsApp, então o celular é o tamanho principal.

| Faixa | Largura | Comportamento |
|---|---|---|
| Celular | < 640px | Uma coluna, padding lateral 20px, hero com cantos inferiores arredondados |
| Tablet | 640–1023px | Duas colunas nos grids de cards, padding 32px |
| Computador | ≥ 1024px | Grid de 12 colunas, largura máxima 1200px centralizada, padding 64px |

**Proposta (cliente):**
- Celular: hero escuro, 4 stats em grade 2×2, gráfico, cenários empilhados, equipamentos, investimento, incluso, garantias, botões empilhados.
- Computador: hero em duas colunas (título à esquerda, comparação "hoje × com solar" à direita), 4 stats em linha, gráfico (2/3) + cenários (1/3), equipamentos + investimento lado a lado, botões lado a lado e centralizados.

**Painel administrativo:**
- Computador: sidebar fixa `graphite` de 248px.
- Tablet: sidebar recolhida só com ícones (72px).
- Celular: barra de abas inferior translúcida (5 itens principais + "Mais"), com `env(safe-area-inset-bottom)`.
- Tabelas viram lista de cards no celular.
- Nada rola na horizontal, exceto dentro de um container de tabela com `overflow-x: auto`.

Use `viewport-fit=cover` e respeite `safe-area-inset-*` no topo e na base.

## 5. Componentes

**Botões**
- Primário: fundo `sun`, texto `graphite`, peso 800, altura 56px (celular) / 52px (computador), raio 18px.
- Secundário: fundo `surface`, borda 1px `#D9D3C7`, texto `graphite`, peso 700.
- Escuro: fundo `graphite`, texto `ivory`.
- Alvo de toque mínimo 44×44px. Feedback no `pointerdown` (escala 0.97), nunca só no clique.

**Chips de status (pílula, 12px, peso 700, padding 5×10)**
- Incluso → `success-soft` / `success`
- Fornecido pelo cliente → `#EEF1F5` / `#3A4758`
- Não incluso → `danger-soft` / `danger`
- Proposta enviada → `sun-soft` / `#7A5200`
- Negociação → `chip` / `graphite`
- Fechada / Concluído → `success-soft` / `success`
- Homologação → `#EEF1F5` / `#3A4758`
- Instalação → `#E6EEF9` / `#1D4ED8`
- Perdida → `danger-soft` / `danger`

**Cards de KPI:** rótulo (13px, `muted`), valor (28px, 800), nota (12px). O card de lucro usa fundo `success-soft`.

**Campos de formulário:** altura 48px, raio 14px, fundo `surface`, borda `#D9D3C7`, foco com anel `sun` de 2px. Rótulo sempre visível acima (nunca só placeholder). Validação inline enquanto digita, não só ao salvar. Campos de dinheiro com máscara `R$ 0.000,00`, e de potência com sufixo (`kWp`, `W`, `m`).

**Seletor de status do item** (Incluso / Fornecido pelo cliente / Não incluso): controle segmentado de 3 opções em cada linha de material.

**Logo:** sol âmbar (círculo + 8 raios) e o texto "TS Solar" em 800, com a linha "em parceria com TechSolar" (11–12px, `muted`) embaixo. O arquivo da logo é configurável; o SVG do sol é o fallback.

## 6. Gráficos (Recharts)

- Barras com cantos superiores arredondados (4px), sem grade vertical, uma linha de base `line`.
- Consumo e custo em `bar-neutral`; geração em `sun`; receita em `graphite`; lucro em `success`.
- Legenda pequena (12px) no topo direito; valores em tooltip com formato brasileiro.
- Barras animam crescendo com mola ao aparecer (desligado com reduced-motion).

## 7. Movimento (resumo da skill `apple-design`)

- Biblioteca: **Motion** (`motion/react`). Molas em tudo que o usuário toca.
- Padrão: amortecimento 1.0 (sem quique), resposta 0.3–0.4s.
- Sheets e drawers (ex.: editar item no celular): amortecimento 0.8, resposta 0.3, arrastáveis para fechar, respeitando a velocidade do gesto.
- Animações interrompíveis: sempre partem do valor atual na tela.
- Nada de spinner longo: skeletons com a forma do conteúdo.
- Troca de aba: cross-fade curto + leve deslocamento (8px).
- `prefers-reduced-motion`: só fade de opacidade, sem deslizes nem molas.
- `prefers-reduced-transparency`: barra inferior e toolbars viram sólidas.
- Material translúcido só em barras flutuantes (toolbar, abas inferiores): `rgba(247,244,238,0.72)` + `backdrop-filter: blur(20px) saturate(180%)` + borda superior clara.

## 8. Escrita (UX copy)

- Português do Brasil, direto e humano. Fale "você".
- Formatos: `R$ 12.990,00` (ou `R$ 12.990` em destaques), `4,35 kWp`, `513 kWh`, datas `06/10/2026`.
- Títulos específicos: "Propostas", "Catálogo", "Custos fixos". Evite "Home" ou "Geral".
- Mensagens de erro dizem o que fazer: "Informe o consumo médio em kWh" em vez de "Campo inválido".
- Nunca prometa números inflados na proposta. Sempre mostre as premissas (reajuste, Fio B, degradação).

## 9. Acessibilidade

- Elementos reais: `<button>`, `<a href>`, `<input>` com `<label>`.
- `aria-label` em botões só com ícone.
- Foco visível em todos os controles (anel `sun`).
- Toda cor com significado também tem texto (chips sempre têm rótulo).
- Ícones: `lucide-react`, traço 2px. Nunca emoji na interface.
