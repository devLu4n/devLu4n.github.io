import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3333',
    },
  },
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        sobre: resolve(import.meta.dirname, 'src/pages/sobre.html'),
        todasVagas: resolve(import.meta.dirname, 'src/pages/todas-vagas.html'),
        notready: resolve(import.meta.dirname, 'src/pages/notready.html'),
        login: resolve(import.meta.dirname, 'src/pages/login/login.html'),
        signup: resolve(import.meta.dirname, 'src/pages/signup/signup.html'),
        vagas: resolve(import.meta.dirname, 'src/pages/main/user/vagas.html'),
        perfil: resolve(import.meta.dirname, 'src/pages/main/user/perfil.html'),
        empresas: resolve(import.meta.dirname, 'src/pages/main/user/empresas.html'),
        detalhesVaga: resolve(import.meta.dirname, 'src/pages/main/user/detalhes-vaga.html'),
        gerenciarVagas: resolve(import.meta.dirname, 'src/pages/main/empresa/gerenciar-vagas.html'),
        minhasCandidaturas: resolve(import.meta.dirname, 'src/pages/main/user/minhas-candidaturas.html'),
        painelEmpresa: resolve(import.meta.dirname, 'src/pages/main/empresa/painel-empresa.html'),
        publicarVaga: resolve(import.meta.dirname, 'src/pages/main/empresa/publicar-vaga.html'),
        candidatosVaga: resolve(import.meta.dirname, 'src/pages/main/empresa/candidatos-vaga.html'),
      },
    },
  },
})
