import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { getCalcSettings, getCompanySettings } from '@/lib/data/settings'
import type { CalcSettings, CompanySettings } from '@/types/firestore'
import { CompanyForm } from './CompanyForm'
import { CalcForm } from './CalcForm'

export function SettingsPage() {
  const [company, setCompany] = useState<CompanySettings | null>(null)
  const [calc, setCalc] = useState<CalcSettings | null>(null)

  useEffect(() => {
    getCompanySettings().then(setCompany)
    getCalcSettings().then(setCalc)
  }, [])

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Dados da empresa e parâmetros usados em todos os cálculos." />
      <div className="flex flex-col gap-6">
        {company ? <CompanyForm initial={company} /> : <SkeletonCard />}
        {calc ? <CalcForm initial={calc} /> : <SkeletonCard />}
      </div>
    </div>
  )
}
