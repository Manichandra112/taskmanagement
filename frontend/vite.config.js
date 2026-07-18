import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // bind to 0.0.0.0 so ngrok can reach it
    allowedHosts: true,  // allow any tunnel/proxy hostname (Vite 8+)
  },
})
