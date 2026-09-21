import { FileText, LayoutDashboard, Package, Receipt, Settings, Users, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  emBreve?: boolean
}

export const navItems: NavItem[] = [
  { to: '/app', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/app/propostas', label: 'Propostas', icon: FileText },
  { to: '/app/clientes', label: 'Clientes', icon: Users },
  { to: '/app/catalogo', label: 'Catálogo', icon: Package },
  { to: '/app/configuracoes', label: 'Configurações', icon: Settings },
  { to: '/app/financeiro', label: 'Financeiro', icon: Wallet, emBreve: true },
  { to: '/app/custos-fixos', label: 'Custos fixos', icon: Receipt, emBreve: true },
]

export const tabItems = navItems.slice(0, 4)
export const maisItems = navItems.slice(4)
