/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Q.Poker',
        short_name: 'Q.Poker',
        description: 'Home-game poker session tracker',
        display: 'standalone',
        start_url: '/',
        // Manifest colours must be literal hex by format; keep in sync with the
        // dark-theme tokens in src/index.css. Real icons land in milestone 6.
        theme_color: '#101114',
        background_color: '#101114',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
