import './style.css'
import { apiRequest } from './api.js'

window.aladinApi = { request: apiRequest }

const EMPRESA_ONLY_PATHS = [
  '/src/pages/main/empresa/painel-empresa.html',
  '/src/pages/main/empresa/publicar-vaga.html',
  '/src/pages/main/empresa/candidatos-vaga.html',
  '/src/pages/main/user/gerenciar-vagas.html',
]

let currentUserCache

async function fetchCurrentUser() {
  try {
    return await apiRequest('/auth/me')
  } catch {
    return null
  }
}

async function getCurrentUser() {
  if (currentUserCache !== undefined) return currentUserCache
  currentUserCache = await fetchCurrentUser()
  return currentUserCache
}

function isEmpresaUser(user) {
  return user?.usuario?.role === 'EMPRESA'
}

function getUserPhotoUrl(user) {
  return user?.usuario?.foto
    || user?.usuario?.avatarUrl
    || user?.usuario?.avatar
    || '/assets/user.png'
}

function renderProfileAvatars(user) {
  const photoUrl = getUserPhotoUrl(user)
  const profileButton = document.querySelector('#profile-menu-button')
  const avatarContainer = profileButton?.querySelector('img') || profileButton?.querySelector('span')

  if (avatarContainer) {
    if (avatarContainer.tagName === 'IMG') {
      avatarContainer.src = photoUrl
      return
    }

    const img = document.createElement('img')
    img.src = photoUrl
    img.alt = 'Foto de perfil'
    img.className = 'h-10 w-10 rounded-full border border-white/80 object-cover shadow-sm'
    avatarContainer.replaceWith(img)
  }

  const profileAvatarImage = document.getElementById('profile-avatar')
  if (profileAvatarImage) {
    profileAvatarImage.src = photoUrl
  }
}

function hideEmpresaLinks() {
  document.querySelectorAll('a[href*="painel-empresa.html"], a[href*="gerenciar-vagas.html"]').forEach((link) => {
    link.style.display = 'none'
  })
}

async function applyEmpresaAccessRules() {
  const user = await getCurrentUser()
  renderProfileAvatars(user)
  if (!isEmpresaUser(user)) {
    hideEmpresaLinks()
  }
}

async function guardEmpresaPage() {
  const user = await getCurrentUser()
  if (!isEmpresaUser(user)) {
    const redirectTo = user
      ? '/src/pages/main/user/vagas.html'
      : '/src/pages/login/login.html?tipo=empresa'
    location.replace(redirectTo)
  }
}

async function initPageSecurity() {
  await applyEmpresaAccessRules()
  if (EMPRESA_ONLY_PATHS.some((path) => location.pathname.endsWith(path))) {
    await guardEmpresaPage()
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPageSecurity)
} else {
  initPageSecurity()
}

document.querySelectorAll('nav[aria-label="Navegação principal"]').forEach((nav) => {
  const links = nav.querySelector(':scope > ul')
  if (!links) return

  nav.classList.add('relative')
  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.className = 'mobile-nav-button'
  toggle.setAttribute('aria-label', 'Abrir menu de navegação')
  toggle.setAttribute('aria-expanded', 'false')
  toggle.textContent = '☰'
  nav.insertBefore(toggle, links)

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('is-mobile-open')
    toggle.setAttribute('aria-expanded', String(isOpen))
    toggle.setAttribute('aria-label', isOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação')
    toggle.textContent = isOpen ? '×' : '☰'
  })

  links.addEventListener('click', () => {
    links.classList.remove('is-mobile-open')
    toggle.setAttribute('aria-expanded', 'false')
    toggle.setAttribute('aria-label', 'Abrir menu de navegação')
    toggle.textContent = '☰'
  })
})

document.querySelectorAll('[role="tab"]').forEach((tab) => {
  const tabList = tab.parentElement
  tabList?.setAttribute('role', 'tablist')
  tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1

  tab.addEventListener('click', () => {
    tabList?.querySelectorAll('[role="tab"]').forEach((item) => {
      item.tabIndex = item === tab ? 0 : -1
    })
  })

  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const tabs = [...tabList.querySelectorAll('[role="tab"]')]
    const currentIndex = tabs.indexOf(tab)
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
    tabs[nextIndex].focus()
    tabs[nextIndex].click()
  })
})

function getFormFeedback(form) {
  let feedback = form.querySelector('[data-form-feedback]')
  if (!feedback) {
    feedback = document.createElement('p')
    feedback.dataset.formFeedback = ''
    feedback.className = 'text-center text-sm font-medium'
    feedback.setAttribute('role', 'status')
    feedback.setAttribute('aria-live', 'polite')
    form.appendChild(feedback)
  }
  return feedback
}

function setSubmitting(form, submitting) {
  const submitButton = form.querySelector('[type="submit"]')
  if (!submitButton) return
  submitButton.disabled = submitting
  submitButton.classList.toggle('cursor-wait', submitting)
  submitButton.classList.toggle('opacity-70', submitting)
}

document.querySelectorAll('#profile-menu button').forEach((logoutButton) => {
  logoutButton.addEventListener('click', async () => {
    const originalText = logoutButton.textContent
    logoutButton.disabled = true
    logoutButton.textContent = 'Saindo...'

    try {
      await apiRequest('/auth/logout', { method: 'POST' })
      currentUserCache = null
      window.location.replace('/src/pages/login/login.html')
    } catch (error) {
      logoutButton.disabled = false
      logoutButton.textContent = originalText
      window.alert(error.message === 'Failed to fetch'
        ? 'Não foi possível acessar o servidor. Verifique se o backend está rodando.'
        : error.message)
    }
  })
})

const loginForm = document.getElementById('login-form')
loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault()
  const feedback = getFormFeedback(loginForm)
  feedback.textContent = ''
  setSubmitting(loginForm, true)

  try {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: loginForm.elements.email.value,
        senha: loginForm.elements.password.value,
      }),
    })

    window.location.href = result.usuario.role === 'EMPRESA'
      ? '/src/pages/main/empresa/painel-empresa.html'
      : '/src/pages/main/user/vagas.html'
  } catch (error) {
    feedback.className = 'text-center text-sm font-medium text-red-600'
    feedback.textContent = error.message
  } finally {
    setSubmitting(loginForm, false)
  }
})

const registerForm = document.getElementById('register-form')
registerForm?.addEventListener('submit', async (event) => {
  event.preventDefault()
  if (!registerForm.checkValidity()) {
    registerForm.reportValidity()
    return
  }

  const password = registerForm.elements.password.value
  const confirmation = registerForm.elements.confirmar_senha.value
  if (password !== confirmation) return

  const feedback = getFormFeedback(registerForm)
  feedback.textContent = ''
  setSubmitting(registerForm, true)

  try {
    const accountType = registerForm.elements.tipo_conta.value
    await apiRequest('/auth/registro', {
      method: 'POST',
      body: JSON.stringify({
        nome: registerForm.elements.nome.value,
        email: registerForm.elements.email.value,
        senha: password,
        role: accountType === 'empresa' ? 'EMPRESA' : 'CANDIDATO',
      }),
    })

    window.location.href = accountType === 'empresa'
      ? '/src/pages/main/empresa/painel-empresa.html'
      : '/src/pages/main/user/vagas.html'
  } catch (error) {
    feedback.className = 'text-center text-sm font-medium text-red-600'
    feedback.textContent = error.message
  } finally {
    setSubmitting(registerForm, false)
  }
})

const quickVacancyForm = document.getElementById('quick-vacancy-form')
quickVacancyForm?.addEventListener('submit', async (event) => {
  event.preventDefault()
  const feedback = getFormFeedback(quickVacancyForm)
  feedback.textContent = ''
  setSubmitting(quickVacancyForm, true)

  try {
    const formData = new FormData(quickVacancyForm)
    await apiRequest('/vagas', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData)),
    })
    feedback.className = 'text-center text-sm font-medium text-emerald-700'
    feedback.textContent = 'Vaga publicada com sucesso.'
    quickVacancyForm.reset()
    window.setTimeout(() => quickVacancyForm.closest('dialog')?.close(), 700)
  } catch (error) {
    feedback.className = 'text-center text-sm font-medium text-red-600'
    feedback.textContent = error.message
  } finally {
    setSubmitting(quickVacancyForm, false)
  }
})

const profileForm = document.getElementById('profile-form')
if (profileForm) {
  const profileTitle = document.getElementById('profile-title')
  const profileRole = document.getElementById('profile-role')
  const profileCity = document.getElementById('profile-city')
  const profileAbout = document.getElementById('profile-about')
  const profileStatus = document.getElementById('profile-save-status')
  let profileExists = false
  let registeredUser = null

  function renderCandidateProfile(profile = {}) {
    profileTitle.textContent = registeredUser?.nome || 'Usuário'

    const role = profile.cargo?.trim() || ''
    profileRole.textContent = role
    profileRole.classList.toggle('hidden', !role)

    const city = profile.cidade?.trim() || ''
    profileCity.querySelector('span:last-child').textContent = city
    profileCity.classList.toggle('hidden', !city)
    profileCity.classList.toggle('flex', Boolean(city))

    profileAbout.textContent = profile.bio?.trim() || ''
    profileForm.elements.nome.value = registeredUser?.nome || ''
    profileForm.elements.email.value = registeredUser?.email || ''
    profileForm.elements.cargo.value = role
    profileForm.elements.cidade.value = city
    profileForm.elements.bio.value = profile.bio || ''
  }

  async function loadCandidateProfile() {
    const currentUser = await getCurrentUser()
    if (!currentUser?.usuario) {
      location.replace('/src/pages/login/login.html?tipo=candidato')
      return
    }

    registeredUser = currentUser.usuario

    try {
      const profile = await apiRequest('/candidatos/me')
      profileExists = true
      renderCandidateProfile(profile)
    } catch (error) {
      if (error.status !== 404) {
        profileStatus.className = 'mt-3 text-sm font-medium text-red-600'
        profileStatus.textContent = error.message
      }
      renderCandidateProfile()
    }
  }

  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    profileStatus.textContent = ''
    setSubmitting(profileForm, true)

    const payload = {
      cargo: profileForm.elements.cargo.value.trim(),
      cidade: profileForm.elements.cidade.value.trim(),
      bio: profileForm.elements.bio.value.trim(),
    }

    try {
      const profile = await apiRequest(profileExists ? '/candidatos/me' : '/candidatos', {
        method: profileExists ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      profileExists = true
      renderCandidateProfile(profile)
      profileStatus.className = 'mt-3 text-sm font-medium text-emerald-700'
      profileStatus.textContent = 'Perfil salvo com sucesso.'
      document.getElementById('profile-modal')?.close()
    } catch (error) {
      const feedback = getFormFeedback(profileForm)
      feedback.className = 'text-center text-sm font-medium text-red-600'
      feedback.textContent = error.message
    } finally {
      setSubmitting(profileForm, false)
    }
  })

  loadCandidateProfile()
}

document.querySelectorAll('dialog').forEach((dialog) => {
  if (!dialog.hasAttribute('aria-labelledby')) {
    const heading = dialog.querySelector('h1, h2, h3')
    if (heading) {
      heading.id ||= `${dialog.id || 'dialog'}-title`
      dialog.setAttribute('aria-labelledby', heading.id)
    }
  }

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close()
  })
})

document.querySelectorAll('.toast, [id$="-toast"]').forEach((toast) => {
  toast.setAttribute('role', 'status')
  toast.setAttribute('aria-live', 'polite')
  toast.setAttribute('aria-atomic', 'true')
})

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => button.closest('dialog')?.close())
})
