import { SunLogo } from './SunLogo'

/** Enquanto o arquivo de uma tela é baixado. `cheia` ocupa a tela toda; senão, só a área de conteúdo. */
export function CarregandoTela({ cheia = true }: { cheia?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${cheia ? 'min-h-screen bg-ivory' : 'min-h-[60vh]'}`} role="status" aria-label="Carregando">
      <SunLogo size={36} className="animate-pulse" />
    </div>
  )
}
