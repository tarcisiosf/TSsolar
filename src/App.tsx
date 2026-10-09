import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { CarregandoTela } from '@/components/ui/CarregandoTela'

// Cada tela vira um arquivo separado: o cliente que abre o link da proposta não baixa o painel
// inteiro, e o painel só baixa a tela que está sendo aberta.
const AdminShell = lazy(() => import('@/components/layout/AdminShell').then((m) => ({ default: m.AdminShell })))
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const OverviewPage = lazy(() => import('@/features/overview/OverviewPage').then((m) => ({ default: m.OverviewPage })))
const ProposalsListPage = lazy(() => import('@/features/proposals/list/ProposalsListPage').then((m) => ({ default: m.ProposalsListPage })))
const ProposalEditorPage = lazy(() => import('@/features/proposals/editor/ProposalEditorPage').then((m) => ({ default: m.ProposalEditorPage })))
const ClientsPage = lazy(() => import('@/features/clients/ClientsPage').then((m) => ({ default: m.ClientsPage })))
const CatalogPage = lazy(() => import('@/features/catalog/CatalogPage').then((m) => ({ default: m.CatalogPage })))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const PublicProposalPage = lazy(() => import('@/features/public/PublicProposalPage').then((m) => ({ default: m.PublicProposalPage })))
const LixeiraPage = lazy(() => import('@/features/trash/LixeiraPage').then((m) => ({ default: m.LixeiraPage })))

export function App() {
  return (
    <Suspense fallback={<CarregandoTela />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/p/:publicId" element={<PublicProposalPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/app" element={<AdminShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="propostas" element={<ProposalsListPage />} />
            <Route path="propostas/nova" element={<ProposalEditorPage />} />
            <Route path="propostas/:id" element={<ProposalEditorPage />} />
            <Route path="clientes" element={<ClientsPage />} />
            <Route path="catalogo" element={<CatalogPage />} />
            <Route path="configuracoes" element={<SettingsPage />} />
            <Route path="lixeira" element={<LixeiraPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </Suspense>
  )
}
