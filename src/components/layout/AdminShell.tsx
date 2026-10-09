import { LogOut, Menu, Moon, Sun } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { BrandLogo } from '@/components/ui/SunLogo'
import { Sheet } from '@/components/ui/Sheet'
import { ToastProvider } from '@/components/ui/Toast'
import { CarregandoTela } from '@/components/ui/CarregandoTela'
import { maisItems, navItems, tabItems, type NavItem } from './navItems'

function useAdminTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('ts-solar-admin-theme') as 'light' | 'dark' | null) ?? 'light'
  })

  useEffect(() => {
    localStorage.setItem('ts-solar-admin-theme', theme)
    // O tema vai no <html> para valer também nas janelas abertas em portal (sheets, confirmações,
    // avisos), que ficam fora da árvore do painel. Ao sair do painel (login, link público) volta ao claro.
    document.documentElement.dataset.theme = theme
    return () => {
      delete document.documentElement.dataset.theme
    }
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
        `relative flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-semibold transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun
        ${isActive ? 'text-on-dark' : 'text-muted-dark hover:bg-white/5 hover:text-on-dark'}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId={iconOnly ? 'rail-ativo' : 'sidebar-ativo'}
              className="absolute inset-0 rounded-field bg-white/10"
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            >
              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-pill bg-sun" />
            </motion.span>
          )}
          <Icon className={`relative h-5 w-5 shrink-0 ${isActive ? 'text-sun' : ''}`} strokeWidth={2} aria-hidden />
          {!iconOnly && <span className="relative">{item.label}</span>}
        </>
      )}
    </NavLink>
  )
}

export function AdminShell() {
  const { signOut } = useAuth()
  const { theme, toggle } = useAdminTheme()
  const [maisOpen, setMaisOpen] = useState(false)

  return (
    <ToastProvider>
    <div data-theme={theme} className="min-h-screen bg-ivory md:flex">
      {/* Sidebar — computador */}
      <aside className="relative hidden overflow-hidden md:sticky md:top-0 md:flex md:h-screen md:w-[248px] md:shrink-0 md:flex-col md:bg-graphite md:px-4 md:py-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(242,165,22,0.22) 0%, rgba(242,165,22,0) 70%)' }}
        />
        <div className="relative px-2 pb-6">
          <BrandLogo tone="dark" />
        </div>
        <nav className="relative flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
        </nav>
        <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
          <button
            onClick={toggle}
            className="flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-semibold text-muted-dark hover:bg-white/5 hover:text-on-dark"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" strokeWidth={2} /> : <Moon className="h-5 w-5" strokeWidth={2} />}
            <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
          </button>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-semibold text-muted-dark hover:bg-white/5 hover:text-on-dark"
          >
            <LogOut className="h-5 w-5" strokeWidth={2} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Rail — tablet */}
      <aside className="hidden sm:sticky sm:top-0 sm:flex sm:h-screen md:hidden sm:w-[72px] sm:shrink-0 sm:flex-col sm:items-center sm:bg-graphite sm:py-6 sm:gap-1">
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
          className="rounded-field p-2.5 text-muted-dark hover:bg-white/5 hover:text-on-dark"
          aria-label="Sair"
        >
          <LogOut className="h-5 w-5" strokeWidth={2} />
        </button>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 pb-24 sm:pb-8">
        <div className="mx-auto max-w-[1200px] px-5 py-6 sm:px-8 md:px-16 md:py-10">
          <TransicaoPagina />
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
    </ToastProvider>
  )
}

function TabBarLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/app'}
      className={({ isActive }) =>
        `relative flex min-w-[56px] flex-col items-center gap-1 rounded-field px-2 py-1.5 transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun
        ${isActive ? 'text-graphite' : 'text-muted'}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span layoutId="tab-ativa" className="absolute inset-0 rounded-field bg-chip" transition={{ type: 'spring', bounce: 0, duration: 0.35 }} />
          )}
          <Icon className={`relative h-5 w-5 ${isActive ? 'text-graphite' : ''}`} strokeWidth={isActive ? 2.4 : 2} aria-hidden />
          <span className="relative text-[11px] font-semibold">{item.label}</span>
        </>
      )}
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

/** Troca de página: cross-fade curto + leve subida de 8px (DESIGN.md §7). Sem saída bloqueante —
 * a nova página entra imediatamente, então a navegação nunca espera a animação. */
function TransicaoPagina() {
  const location = useLocation()
  const reduzir = useReducedMotion()
  return (
    <motion.div
      key={location.pathname}
      initial={reduzir ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduzir ? { duration: 0.15 } : { type: 'spring', bounce: 0, duration: 0.35 }}
    >
      {/* Suspense aqui dentro: ao trocar de tela, o menu fica e só o conteúdo espera o arquivo. */}
      <Suspense fallback={<CarregandoTela cheia={false} />}>
        <Outlet />
      </Suspense>
    </motion.div>
  )
}
