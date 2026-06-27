import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base is set for GitHub Pages project-site hosting (https://<user>.github.io/pose/).
// Override with VITE_BASE when deploying elsewhere.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'gh' ? '/pose/' : '/',
}))
