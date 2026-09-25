import { Font } from '@react-pdf/renderer'
import regular400 from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff?url'
import semibold600 from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff?url'
import bold700 from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff?url'
import extrabold800 from '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff?url'

let registrado = false

/** Registra a Plus Jakarta Sans (mesma fonte da interface) para o PDF da proposta. */
export function registrarFontesPdf() {
  if (registrado) return
  Font.register({
    family: 'Plus Jakarta Sans',
    fonts: [
      { src: regular400, fontWeight: 400 },
      { src: semibold600, fontWeight: 600 },
      { src: bold700, fontWeight: 700 },
      { src: extrabold800, fontWeight: 800 },
    ],
  })
  // O motor de hifenização padrão do react-pdf quebra mal palavras com "fi"/"fl"
  // (ex.: "Perfil" vira "Perfl", "fibrocimento" vira "fbrocimento"). Desliga a
  // quebra silábica por completo — a palavra nunca é dividida no meio de uma linha.
  Font.registerHyphenationCallback((word) => [word])
  registrado = true
}
