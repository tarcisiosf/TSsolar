import { LogOut, Menu, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { BrandLogo } from '@/components/ui/SunLogo'
import { Sheet } from '@/components/ui/Sheet'
import { maisItems, navItems, tabItems, type NavItem } from './navItems'

function useAdminTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('ts-solar-admin-theme') as 'light' | 'dark' | null) ?? 'light'
  })

  useEffect(() => {
    localStorage.setItem('ts-solar-admin-theme', theme)
  }, [theme])

  return { theme, toggle: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')) }
}

function NavItemLink({ item, iconOnly }: { item: NavItem; iconOnly?: boolean }) {
  const Icon = item.icon

  if (item.emBreve) {
    return (
      <div
        className="flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-semibold text-muted-dark/60 cursor-not-allowed"
        title="Em breve"
      >
        <Icon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
        {!iconOnly && (
          <span className="flex-1">
            {item.label} <span className="text-[10px] font-bold uppercase tracking-wide">· Em breve</span>
          </span>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      end={item.to === '/app'}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-semibold transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun
        ${isActive ? 'bg-white/10 text-ivory' : 'text-muted-dark hover:bg-white/5 hover:text-ivory'}`
      }
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
      {!iconOnly && <span>{item.label}</span>}
    </NavLink>
  )
}

export function AdminShell() {
  const { signOut } = useAuth()
  const { theme, toggle } = useAdminTheme()
  const [maisOpen, setMaisOpen] = useState(false)

  return (
    <div data-theme={theme} className="min-h-screen bg-ivory md:flex">
      {/* Sidebar — computador */}
      <aside className="hidden md:flex md:w-[248px] md:shrink-0 md:flex-col md:bg-graphite md:px-4 md:py-6">
        <div className="px-2 pb-6">
          <BrandLogo tone="dark" />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
        </nav>
        <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
          <button
            onClick={toggle}
            className="flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-semibold text-muted-dark hover:bg-white/5 hover:text-ivory"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" strokeWidth={2} /> : <Moon className="h-5 w-5" strokeWidth={2} />}
            <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
          </button>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-semibold text-muted-dark hover:bg-white/5 hover:text-ivory"
          >
            <LogOut className="h-5 w-5" strokeWidth={2} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Rail — tablet */}
      <aside className="hidden sm:flex md:hidden sm:w-[72px] sm:shrink-0 sm:flex-col sm:items-center sm:bg-graphite sm:py-6 sm:gap-1">
        <div className="mb-4">
          <BrandLogo tone="dark" className="[&>div]:hidden" />
        </div>
        <nav className="flex flex-1 flex-col items-center gap-1">
          {navItems.map((item) => (
            <NavItemLink key={item.to} item={item} iconOnly />
          ))}
        </nav>
        <button
          onClick={() => signOut()}
          className="rounded-field p-2.5 text-muted-dark hover:bg-white/5 hover:text-ivory"
          aria-label="Sair"
        >
          <LogOut className="h-5 w-5" strokeWidth={2} />
        </button>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 pb-24 sm:pb-8">
        <div className="mx-auto max-w-[1200px] px-5 py-6 sm:px-8 md:px-16 md:py-10">
          <Outlet />
        </div>
      </main>

      {/* Tab bar — celular */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-white/40 bg-ivory/72 px-2 pt-2 backdrop-blur-chrome backdrop-saturate-150 sm:hidden [-webkit-backdrop-filter:blur(20px)_saturate(180%)]"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))' }}
      >
        {tabItems.map((item) => (
          <TabBarLink key={item.to} item={item} />
        ))}
        <button
          onClick={() => setMaisOpen(true)}
          className="flex min-w-[44px] flex-col items-center gap-1 rounded-field px-2 py-1.5 text-muted"
        >
          <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />
          <span className="text-[11px] font-semibold">Mais</span>
        </button>
      </nav>

      <Sheet open={maisOpen} onClose={() => setMaisOpen(false)} title="Mais">
        <div className="flex flex-col gap-1">
          {maisItems.map((item) => (
            <div key={item.to} onClick={() => setMaisOpen(false)}>
              <MaisItemLink item={item} />
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  )
}

function TabBarLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/app'}
      className={({ isActive }) =>
        `flex min-w-[44px] flex-col items-center gap-1 rounded-field px-2 py-1.5
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun
        ${isActive ? 'text-graphite' : 'text-muted'}`
      }
    >
      <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
      <span className="text-[11px] font-semibold">{item.label}</span>
    </NavLink>
  )
}

function MaisItemLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  if (item.emBreve) {
    return (
      <div className="flex items-center gap-3 rounded-field px-3 py-3 text-sm font-semibold text-muted/60">
        <Icon className="h-5 w-5" strokeWidth={2} />
        {item.label} <span className="text-[10px] font-bold uppercase">· Em breve</span>
      </div>
    )
  }
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-field px-3 py-3 text-sm font-semibold ${isActive ? 'bg-chip text-graphite' : 'text-graphite'}`
      }
    >
      <Icon className="h-5 w-5" strokeWidth={2} />
      {item.label}
    </NavLink>
  )
}
