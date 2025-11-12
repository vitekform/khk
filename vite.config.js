import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-js',
      writeBundle() {
        // Ensure dist/js directory exists
        const jsDir = resolve(__dirname, 'dist/js')
        if (!existsSync(jsDir)) {
          mkdirSync(jsDir, { recursive: true })
        }
        // Copy the sablona.js file
        copyFileSync(
          resolve(__dirname, 'js/sablona.js'),
          resolve(__dirname, 'dist/js/sablona.js')
        )
      }
    }
  ],
})
