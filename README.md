# 🌟 Aladin — Plataforma de Vagas de TI do Estado de Alagoas
## 📋 Sobre o projeto
 
O Aladin é uma plataforma web voltada para a contratação de profissionais de TI no Estado de Alagoas, desenvolvida como projeto prático durante a formação no OxeTech Academy — programa do Governo de Alagoas que forma e qualifica talentos da área de tecnologia no estado.
O objetivo da plataforma é conectar profissionais de TI às oportunidades disponíveis em órgãos públicos estaduais e empresas do ecossistema tech alagoano, com transparência salarial e foco na simplicidade.
O projeto está em constante evolução: novas funcionalidades serão adicionadas ao longo da formação, como sistema de autenticação, painel do candidato, anúncio de vagas por empresas, e muito mais. Acompanhe o repositório para ver as novidades! 🚀
 
---
 
## ✨ Funcionalidades
 
- 🔎 **Busca de vagas** por cargo/palavra-chave e cidade
- 🏷️ **Filtros rápidos** por área (Front-end, Back-end, DevOps, Dados, UX/UI, Mobile, IA)
- 📋 **Cards de vagas** com tecnologias, localização, faixa salarial e modalidade (Remoto/Híbrido/Presencial)
- 📊 **Painel de estatísticas** com vagas ativas, órgãos parceiros e contratações realizadas
- ⚡ **Seção de diferenciais** da plataforma
- 📬 **Formulário de inscrição** para participar do projeto, com feedback de sucesso acessível
- 🚧 **Página "Em breve"** para funcionalidades ainda em desenvolvimento
---
 
## 🗂️ Estrutura do projeto
 
```
aladin/
├── public/
│   ├── index.html          # Página principal
│   └── notready.html       # Página de funcionalidade em desenvolvimento
├── assets/
│   ├── aladin-logo.svg     # Logo colorida
│   ├── white-logo.svg      # Logo branca (usada no footer e favicon)
│   └── js/
│       └── participacao.js # Script do formulário de inscrição
├── src/
│   └── main.js             # Entry point JS (Vite)
├── tailwind.config.js      # Configuração do Tailwind com tokens de design
└── README.md
```

## 🚀 Como rodar
 
O projeto usa **Vite** como bundler e **Tailwind CSS** com configuração customizada.
 
### Pré-requisitos
 
- Node.js 18+
- npm ou yarn
### Instalação
 
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/aladin.git
cd aladin
 
# Instale as dependências
npm install
 
# Rode o servidor de desenvolvimento
npm run dev
```
 
> O projeto abrirá em `http://localhost:5173` por padrão.
 
### Build para produção
 
```bash
npm run build
```
 
---
## 📄 Páginas
 
| Página | Arquivo | Descrição |
|---|---|---|
| Home | `index.html` | Página principal com hero, busca, vagas, features, CTA e formulário |
| Em breve | `notready.html` | Exibida ao clicar em funcionalidades ainda não implementadas |
 
---
 
## 🛠️ Tecnologias
 
- **HTML5** semântico
- **Tailwind CSS** com tokens customizados via `tailwind.config.js`
- **JavaScript** vanilla para interações do formulário
- **Vite** como bundler
- **Google Fonts** — Poppins (400, 500, 600, 700, 800)
---
 
## 👨‍💻 Autor
 
Feito por [@luanviilela](https://www.linkedin.com/in/luanviilela/)
 
---
## 📝 Licença
 
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
