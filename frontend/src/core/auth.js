import { apiRequest } from '../api.js'

const EMPRESA_ONLY_PATHS = [
  '/src/pages/main/empresa/painel-empresa.html',
  '/src/pages/main/empresa/publicar-vaga.html',
  '/src/pages/main/empresa/candidatos-vaga.html',
  '/src/pages/main/empresa/gerenciar-vagas.html',
]
const CANDIDATO_ONLY_PATHS = ['/src/pages/main/user/minhas-candidaturas.html']
const PUBLIC_AUTH_PATHS = [
  '/src/pages/login/login.html',
  '/src/pages/login/esqueci-senha.html',
  '/src/pages/login/redefinir-senha.html',
  '/src/pages/signup/signup.html',
]

let currentUserCache

export async function getCurrentUser() {
  if (currentUserCache !== undefined) return currentUserCache
  try {
    currentUserCache = await apiRequest('/auth/me')
  } catch {
    currentUserCache = null
  }
  return currentUserCache
}

export function clearCurrentUser() {
  currentUserCache = null
}

export function isEmpresaUser(user) {
  return user?.usuario?.role === 'EMPRESA'
}

function getUserPhotoStorageKey(user = currentUserCache) {
  const usuario = user?.usuario || user
  if (!usuario?.id || !usuario?.role) return null
  return `aladin-user-photo:${usuario.role}:${usuario.id}`
}

export function getStoredUserPhoto(user) {
  try {
    localStorage.removeItem('aladin-user-photo')
    const storageKey = getUserPhotoStorageKey(user)
    return storageKey ? localStorage.getItem(storageKey) : null
  } catch {
    return null
  }
}

export function setStoredUserPhoto(photoDataUrl, user) {
  try {
    const storageKey = getUserPhotoStorageKey(user)
    if (storageKey) localStorage.setItem(storageKey, photoDataUrl)
  } catch {
    // O perfil continua funcional quando o armazenamento local está indisponível.
  }
}

function getUserPhotoUrl(user) {
  return getStoredUserPhoto(user)
    || user?.usuario?.candidato?.foto
    || user?.usuario?.empresa?.foto
    || user?.usuario?.foto
    || user?.usuario?.avatarUrl
    || user?.usuario?.avatar
    || (isEmpresaUser(user) ? '/assets/empresa.png' : '/assets/user.png')
}

export function renderProfileAvatars(user) {
  const photoUrl = getUserPhotoUrl(user)
  const profileButton = document.querySelector('#profile-menu-button')
  const avatarContainer = profileButton?.querySelector('img') || profileButton?.querySelector('span')
  if (avatarContainer) {
    if (avatarContainer.tagName === 'IMG') avatarContainer.src = photoUrl
    else {
      const img = document.createElement('img')
      img.src = photoUrl
      img.alt = 'Foto de perfil'
      img.className = 'h-10 w-10 rounded-full border border-white/80 object-cover shadow-sm'
      avatarContainer.replaceWith(img)
    }
  }
  const profileAvatarImage = document.getElementById('profile-avatar')
  if (profileAvatarImage) profileAvatarImage.src = photoUrl
}

function applyAuthenticatedNavigation(user) {
  renderProfileAvatars(user)
  if (user?.usuario) {
    const destination = isEmpresaUser(user)
      ? '/src/pages/main/empresa/painel-empresa.html'
      : '/src/pages/main/user/vagas.html'
    document.querySelectorAll('a[href="/"]').forEach((link) => {
      if (link.querySelector('img[src*="aladin-logo"], img[src*="white-logo"]') || /aladin/i.test(link.getAttribute('aria-label') || '')) link.href = destination
    })
  }

  if (isEmpresaUser(user)) {
    document.querySelectorAll('nav[aria-label="Navegação principal"] a[href*="minhas-candidaturas.html"], nav[aria-label="Navegação principal"] a[href*="empresas.html"]').forEach((link) => {
      const item = link.closest('li')
      if (item) item.style.display = 'none'
      else link.style.display = 'none'
    })
    document.querySelectorAll('nav[aria-label="Navegação principal"] a').forEach((link) => {
      if (link.textContent.trim().toLowerCase() === 'vagas') link.href = '/src/pages/main/empresa/painel-empresa.html'
    })
  } else {
    document.querySelectorAll('a[href*="painel-empresa.html"], a[href*="gerenciar-vagas.html"]').forEach((link) => { link.style.display = 'none' })
  }
}

export async function initAuth() {
  if (PUBLIC_AUTH_PATHS.some((path) => location.pathname.endsWith(path))) return

  const user = await getCurrentUser()
  applyAuthenticatedNavigation(user)

  if (EMPRESA_ONLY_PATHS.some((path) => location.pathname.endsWith(path)) && !isEmpresaUser(user)) {
    location.replace(user ? '/src/pages/main/user/vagas.html' : '/src/pages/login/login.html?tipo=empresa')
    return
  }
  if (CANDIDATO_ONLY_PATHS.some((path) => location.pathname.endsWith(path)) && user?.usuario?.role !== 'CANDIDATO') {
    location.replace(user ? '/src/pages/main/empresa/painel-empresa.html' : '/src/pages/login/login.html')
  }
}
