import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { AdminShell } from '@/components/layout/AdminShell'
import { LoginPage } from '@/features/auth/LoginPage'
import { OverviewPage } from '@/features/overview/OverviewPage'
import { ProposalsListPage } from '@/features/proposals/list/ProposalsListPage'
import { ProposalEditorPage } from '@/features/proposals/editor/ProposalEditorPage'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { CatalogPage } from '@/features/catalog/CatalogPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { PublicProposalPage } from '@/features/public/PublicProposalPage'

export function App() {
  return (
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
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}
