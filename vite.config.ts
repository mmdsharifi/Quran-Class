import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
)

const getLastUpdate = () => {
  try {
    const iso = execSync('git log -1 --format=%cI', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()

    return new Date(iso).toLocaleString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'unknown'
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_LAST_UPDATE__: JSON.stringify(getLastUpdate()),
  },
})
