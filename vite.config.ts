import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // ← LAN 全体からアクセス可能
    port: 5173,        // ポート指定（必要なら変更可）
    strictPort: true   // ポートが埋まっていたらエラーにする
  }

})
