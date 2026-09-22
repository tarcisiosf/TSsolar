import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Sheet } from '@/components/ui/Sheet'
import { createClient, updateClient, type ClientInput } from '@/lib/data/clients'
import type { Client } from '@/types/firestore'

const VAZIO: ClientInput = { nome: '', telefone: '', email: '', cidade: '', endereco: '', observacoes: '' }

export function ClientSheet({
  open,
  onClose,
  client,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  client: Client | null
  onCreated?: (id: string, input: ClientInput) => void
}) {
  const [form, setForm] = useState<ClientInput>(client ?? VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [dirty, setDirty] = useState(false)

  function set<K extends keyof ClientInput>(key: K, value: ClientInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setDirty(true)
  }

  function handleClose() {
    setForm(client ?? VAZIO)
    setDirty(false)
    onClose()
  }

  async function handleSalvar() {
    if (!form.nome.trim()) {
      alert('Informe o nome do cliente.')
      return
    }
    setSalvando(true)
    try {
      if (client) {
        await updateClient(client.id, form)
      } else {
        const id = await createClient(form)
        onCreated?.(id, form)
      }
      setDirty(false)
      onClose()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title={client ? 'Editar cliente' : 'Novo cliente'}
      isDirty={dirty}
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSalvar} loading={salvando} className="flex-1">
            {client ? 'Salvar alterações' : 'Adicionar cliente'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Nome" value={form.nome} onChange={(e) => set('nome', e.target.value)} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Telefone" value={form.telefone} onChange={(e) => set('telefone', e.target.value)} placeholder="(62) 99999-9999" />
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Cidade" value={form.cidade} onChange={(e) => set('cidade', e.target.value)} />
          <Input label="Endereço" value={form.endereco} onChange={(e) => set('endereco', e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-graphite">Observações</label>
          <textarea
            value={form.observacoes}
            onChange={(e) => set('observacoes', e.target.value)}
            rows={3}
            className="w-full rounded-field border border-[#D9D3C7] bg-surface p-3 text-sm text-graphite outline-none focus:ring-2 focus:ring-sun"
          />
        </div>
      </div>
    </Sheet>
  )
}
