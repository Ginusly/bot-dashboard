import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            external: [
                'firebase/app',
                'firebase/firestore',
                'firebase/auth',
                'firebase/storage',
                'firebase/database',
                'firebase/analytics'
            ]
        }
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
