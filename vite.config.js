import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Netlify'de ortam değişkenlerini (API anahtarları gibi)
  // doğru bir şekilde kullanabilmek için bu ayar önemlidir.
  // Bu, 'VITE_' önekine sahip tüm ortam değişkenlerini kod içinde
  // import.meta.env.VITE_VARIABLE_NAME olarak erişilebilir kılar.
  define: {
    'process.env': process.env
  }
})
