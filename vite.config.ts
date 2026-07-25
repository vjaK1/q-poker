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
        // Manifest colours must be literal hex by format; matched to the
        // logo's own background so the splash blends into the icon.
        theme_color: '#030209',
        background_color: '#030209',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
