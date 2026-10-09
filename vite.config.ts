/// <reference types="vitest/config" />
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    // O único arquivo acima de 500 KB é o gerador de PDF (@react-pdf), baixado só quando alguém
    // clica em "Baixar PDF". O limite cobre ele; qualquer outro arquivo que passe disso ainda avisa.
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        // Bibliotecas grandes em arquivos próprios: mudam pouco, então ficam no cache do navegador
        // entre um deploy e outro, e telas que não usam (ex.: gráficos) não as baixam.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          motion: ['motion/react'],
          graficos: ['recharts'],
          formularios: ['react-hook-form', 'zod', '@hookform/resolvers'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
