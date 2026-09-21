# TS Solar — Sistema de propostas e gestão

Sistema web da TS Solar (Goiânia-GO, em parceria com a TechSolar): gerador de propostas comerciais para clientes e um painel privado de gestão. Veja `DESIGN.md` para o guia visual e a skill `apple-design` para o padrão de movimento/interação.

Esta é a **Fase 1**: cadastro, orçamento, geração de proposta (link público + PDF) e configurações. O financeiro (Fase 2) e a operação (Fase 3) ainda não estão implementados — os tipos em `src/types/firestore.ts` já preveem os dados (`projects`, `fixedCosts`).

## Stack

Vite + React 18 + TypeScript (strict) · Tailwind CSS · Firebase (Auth, Firestore, Storage, Hosting) · React Router · Motion · Recharts · react-hook-form + zod · @react-pdf/renderer · date-fns (ptBR) · lucide-react.

## 1. Criar o projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e crie um projeto novo (ex.: `tssolar-app`).
2. **Authentication** → Sign-in method → ative **E-mail/senha**.
3. **Authentication** → Users → adicione o usuário admin (seu e-mail e uma senha). Esse é o e-mail que vai identificar o dono do sistema.
4. **Firestore Database** → crie o banco (modo produção, região `southamerica-east1` ou a mais próxima de Goiânia).
5. **Storage** → ative o Storage (mesma região).
6. **Configurações do projeto** → Geral → em "Seus apps", crie um app da Web e copie as credenciais (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).

## 2. Configurar o ambiente local

```bash
npm install
cp .env.example .env.local
```

Preencha o `.env.local` com as credenciais do passo anterior e o e-mail do admin:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_ADMIN_EMAIL=seuemail@tssolar.com.br
```

**Importante:** as regras do Firestore (`firestore.rules`) e do Storage (`storage.rules`) não leem variáveis de ambiente — abra os dois arquivos e troque `ADMIN_EMAIL_PLACEHOLDER` pelo mesmo e-mail que você colocou em `VITE_ADMIN_EMAIL`.

## 3. Rodar localmente

```bash
npm run dev
```

Abra `http://localhost:5173/login` e entre com o e-mail/senha criados no passo 1. Na primeira vez que você abrir **Configurações**, o sistema cria automaticamente os documentos `settings/company` e `settings/calc` com os valores padrão (você pode e deve revisá-los — principalmente a tarifa, o Fio B e o WhatsApp da empresa).

Cadastre pelo menos um módulo e um inversor em **Catálogo** antes de criar a primeira proposta, para poder dimensionar o sistema.

## 4. Publicar (deploy)

Instale a CLI do Firebase se ainda não tiver, faça login e associe o projeto:

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # selecione o projeto criado no passo 1
```

Depois, publique as regras e o site:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
npm run deploy        # roda "npm run build" e depois "firebase deploy" (Hosting)
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor local com hot reload |
| `npm run build` | Checa os tipos (`tsc -b`) e gera o build de produção |
| `npm run lint` | Lint (oxlint) |
| `npm run test` | Roda os testes (Vitest) uma vez |
| `npm run test:watch` | Testes em modo watch |
| `npm run deploy` | Build + `firebase deploy` |

## Testando a Fase 1

1. **Login** (`/login`) — só entra o e-mail configurado como admin; qualquer outro é recusado pelas regras do Firestore mesmo que a senha esteja certa.
2. **Configurações** (`/app/configuracoes`) — confirme os dados da empresa e os parâmetros de cálculo (a tarifa e o Fio B **precisam** ser conferidos contra uma fatura real da Equatorial Goiás antes de qualquer proposta valer para um cliente de verdade).
3. **Catálogo** (`/app/catalogo`) — cadastre módulo(s) e inversor(es) com potência e custo.
4. **Clientes** (`/app/clientes`) — cadastre um cliente (ou crie um durante o passo 1 do editor de proposta).
5. **Nova proposta** (`/app/propostas/nova`) — percorra os 7 passos; o resumo (preço, lucro, margem, R$/Wp, payback) atualiza em tempo real. Ao clicar em **Gerar proposta**, o número é atribuído, o link público é criado e aparecem os botões Copiar link / WhatsApp / Baixar PDF.
6. Abra o link público (`/p/:publicId`) em uma janela anônima — confirme que **nenhum custo, margem ou comissão aparece** e que a página funciona em 375px, 768px e 1280px de largura.
7. Baixe o PDF e confira que o link público está no rodapé.
8. **Propostas** (`/app/propostas`) — teste o filtro por status, a troca rápida de status e "Duplicar".

## O que ainda falta configurar

- **Índices do Firestore**: se alguma consulta pedir um índice composto ao rodar, o console do Firebase mostra um link para criá-lo automaticamente (já deixamos os previsíveis em `firestore.indexes.json`, rode `firebase deploy --only firestore:indexes` para aplicá-los).
- **Domínio próprio**: configure em Hosting → Domínio personalizado, se for usar um domínio da TS Solar em vez do `*.web.app`.
- **Logo da empresa**: opcional — sem ela, o sistema usa o sol de `DESIGN.md` como logo.
- **Fase 2 (Financeiro)** e **Fase 3 (Operação)**: os tipos de dados já existem (`ProjectRecord`, `FixedCost`) mas as telas ainda não foram construídas.

## Limitações conhecidas desta fase

- O cálculo da conta com sistema é uma **aproximação** do Fio B/compensação de créditos (ver comentário em `src/lib/calc/contaComSistema.ts`) — valide contra faturas reais antes de confiar nos números com um cliente.
- A área estimada do sistema usa uma média de 2,1 m² por módulo (o catálogo ainda não guarda as dimensões físicas de cada módulo).
- O PDF não reproduz o gráfico de consumo × geração (mostra os mesmos números em cenários e equipamentos); a página pública tem o gráfico completo em Recharts.
- O bundle de produção ainda não está com code-splitting por rota — funciona bem, mas há espaço para reduzir o tamanho do JS inicial mais adiante.
