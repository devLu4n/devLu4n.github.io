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

function getStoredUserPhoto() {
  try {
    return localStorage.getItem('aladin-user-photo')
  } catch {
    return null
  }
}

function setStoredUserPhoto(photoDataUrl) {
  try {
    localStorage.setItem('aladin-user-photo', photoDataUrl)
  } catch {
    // ignoring localStorage failures
  }
}

function getUserPhotoUrl(user) {
  const stored = getStoredUserPhoto()
  if (stored) return stored
  const fromServer = user?.usuario?.foto || user?.usuario?.avatarUrl || user?.usuario?.avatar
  if (fromServer) return fromServer
  return isEmpresaUser(user) ? '/assets/empresa.png' : '/assets/user.png'
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
  const profilePhotoInput = document.getElementById('profile-photo-input')
  const profileStatus = document.getElementById('profile-save-status')
  let profileExists = false
  let registeredUser = null
  let userIsEmpresa = false

  function renderProfile(profile = {}) {
    profileTitle.textContent = registeredUser?.nome || 'Usuário'

    if (userIsEmpresa) {
      const nomeEmpresa = profile.nome?.trim() || ''
      profileRole.textContent = nomeEmpresa
      profileRole.classList.toggle('hidden', !nomeEmpresa)

      const city = profile.cidade?.trim() || ''
      profileCity.querySelector('span:last-child').textContent = city
      profileCity.classList.toggle('hidden', !city)
      profileCity.classList.toggle('flex', Boolean(city))

      profileAbout.textContent = profile.descricao?.trim() || ''
      profileForm.elements.nome.value = registeredUser?.nome || ''
      profileForm.elements.email.value = registeredUser?.email || ''
      profileForm.elements.cargo.value = nomeEmpresa
      profileForm.elements.cidade.value = city
      profileForm.elements.bio.value = profile.descricao || ''
    } else {
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
  }

  async function loadProfile() {
    const currentUser = await getCurrentUser()
    if (!currentUser?.usuario) {
      location.replace('/src/pages/login/login.html')
      return
    }

    registeredUser = currentUser.usuario
    userIsEmpresa = isEmpresaUser(currentUser)
    renderProfileAvatars(currentUser)

    const endpoint = userIsEmpresa ? '/empresas/me' : '/candidatos/me'

    try {
      const profile = await apiRequest(endpoint)
      profileExists = true
      renderProfile(profile)
    } catch (error) {
      if (error.status !== 404) {
        profileStatus.className = 'mt-3 text-sm font-medium text-red-600'
        profileStatus.textContent = error.message
      }
      renderProfile()
    }
  }

  profilePhotoInput?.addEventListener('change', (event) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result
      if (typeof url === 'string') {
        setStoredUserPhoto(url)
        document.getElementById('profile-avatar').src = url
        renderProfileAvatars({ usuario: registeredUser })
      }
    }
    reader.readAsDataURL(file)
  })

  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    profileStatus.textContent = ''
    setSubmitting(profileForm, true)

    let payload
    let createEndpoint
    let updateEndpoint

    if (userIsEmpresa) {
      payload = {
        nome: profileForm.elements.cargo.value.trim(),
        descricao: profileForm.elements.bio.value.trim(),
        cidade: profileForm.elements.cidade.value.trim(),
      }
      createEndpoint = '/empresas'
      updateEndpoint = '/empresas/me'
    } else {
      payload = {
        cargo: profileForm.elements.cargo.value.trim(),
        cidade: profileForm.elements.cidade.value.trim(),
        bio: profileForm.elements.bio.value.trim(),
      }
      createEndpoint = '/candidatos'
      updateEndpoint = '/candidatos/me'
    }

    try {
      const profile = await apiRequest(profileExists ? updateEndpoint : createEndpoint, {
        method: profileExists ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      profileExists = true
      renderProfile(profile)
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

  loadProfile()
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

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character])
}

function technologyTags(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 5)
    .map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join('')
}

function normalizeArea(value = '') {
  const normalized = String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const aliases = {
    frontend: 'front-end', backend: 'back-end', 'ux-ui': 'ui-ux', uiux: 'ui-ux', uxui: 'ui-ux', fullstack: 'full-stack',
  }
  return aliases[normalized] || normalized
}

async function loadPublicVacancies() {
  const grid = document.getElementById('jobs-grid')
  if (!grid) return

  try {
    const result = await apiRequest('/vagas?limit=50')
    grid.innerHTML = result.dados.map((vaga) => `
      <article class="job-card glass-card rounded-[22px] p-4" data-area="${escapeHtml(normalizeArea(vaga.area))}" data-date="${new Date(vaga.createdAt).getTime()}" data-search="${escapeHtml(`${vaga.titulo} ${vaga.empresa?.nome || ''} ${vaga.tecnologias}`.toLowerCase())}">
        <div class="grid h-12 w-12 place-items-center rounded-xl bg-white/80 text-sm font-extrabold text-blueCustom">TI</div>
        <h2 class="mt-3 text-base font-bold text-navy">${escapeHtml(vaga.titulo)}</h2>
        <p class="mt-1 text-xs font-semibold text-orangeCustom">${escapeHtml(vaga.empresa?.nome || 'Empresa')}</p>
        <p class="mt-1 flex items-center gap-1.5 text-sm text-navy/75"><span aria-hidden="true">⌖</span> ${escapeHtml(vaga.modalidade === 'REMOTO' ? 'Remoto' : vaga.cidade)}</p>
        <div class="mt-4 flex flex-wrap gap-2">${technologyTags(vaga.tecnologias)}</div>
        <a class="job-details orange-button mt-4 block w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white" href="/src/pages/main/user/detalhes-vaga.html?id=${vaga.id}">Ver vaga</a>
      </article>`).join('')
    document.getElementById('jobs-empty')?.classList.toggle('hidden', result.dados.length > 0)
  } catch (error) {
    grid.innerHTML = `<p class="sm:col-span-2 lg:col-span-3 text-center text-red-600">${escapeHtml(error.message)}</p>`
  }
}

async function loadCompanyVacancies() {
  const list = document.getElementById('company-vacancies')
  if (!list) return

  try {
    const empresa = await apiRequest('/empresas/me')
    list.innerHTML = empresa.vagas.map((vaga) => {
      const aberta = vaga.status === 'ABERTA'
      return `<article class="vacancy-card glass-card rounded-[22px] p-5" data-id="${vaga.id}" data-status="${aberta ? 'ativa' : 'encerrada'}" data-search="${escapeHtml(`${vaga.titulo} ${vaga.tecnologias}`.toLowerCase())}">
        <div class="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center"><div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2"><h2 class="text-lg font-bold">${escapeHtml(vaga.titulo)}</h2><span class="rounded-full px-2.5 py-1 text-[11px] font-semibold ${aberta ? 'bg-emerald-100/80 text-emerald-700' : 'bg-slate-200/90 text-slate-600'}">${aberta ? 'Ativa' : 'Encerrada'}</span></div>
          <p class="mt-1 text-xs text-mutedCustom">Publicado em ${new Date(vaga.createdAt).toLocaleDateString('pt-BR')}</p><div class="mt-4 flex flex-wrap gap-2">${technologyTags(vaga.tecnologias)}</div>
        </div><div class="flex flex-wrap items-center justify-center gap-3"><div class="text-center"><strong class="block text-2xl font-extrabold">${vaga._count?.candidaturas || 0}</strong><span class="text-xs text-mutedCustom">Candidatos</span></div>
          <a href="/src/pages/main/empresa/candidatos-vaga.html?vaga=${vaga.id}" class="orange-button rounded-xl px-5 py-3 text-sm font-semibold">Ver candidatos</a>
          ${aberta ? `<button type="button" class="close-vacancy rounded-xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-600">Encerrar vaga</button>` : ''}
        </div></div></article>`
    }).join('')
    document.getElementById('empty-state')?.classList.toggle('hidden', empresa.vagas.length > 0)

    list.addEventListener('click', async (event) => {
      const button = event.target.closest('.close-vacancy')
      if (!button) return
      const card = button.closest('.vacancy-card')
      if (!window.confirm('Encerrar esta vaga? Ela deixará de aparecer para os candidatos.')) return
      await apiRequest(`/vagas/${card.dataset.id}`, { method: 'PUT', body: JSON.stringify({ status: 'FECHADA' }) })
      await loadCompanyVacancies()
    }, { once: true })
  } catch (error) {
    list.innerHTML = `<p class="text-center text-red-600">${escapeHtml(error.message)}</p>`
  }
}

loadPublicVacancies()
loadCompanyVacancies()

function formatSalary(minimum, maximum) {
  const currency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
  if (minimum != null && maximum != null) return `${currency(minimum)} – ${currency(maximum)}`
  if (minimum != null) return `A partir de ${currency(minimum)}`
  if (maximum != null) return `Até ${currency(maximum)}`
  return 'Salário a combinar'
}

async function loadVacancyDetails() {
  if (!location.pathname.endsWith('/user/detalhes-vaga.html')) return
  const vagaId = new URLSearchParams(location.search).get('id')
  const page = document.querySelector('[aria-labelledby="job-title"]')
  if (!vagaId || !/^\d+$/.test(vagaId)) {
    if (page) page.innerHTML = '<p class="p-10 text-center text-red-600">Vaga inválida ou não informada.</p>'
    return
  }
  try {
    const vaga = await apiRequest(`/vagas/${vagaId}`)
    const technologies = String(vaga.tecnologias || '').split(',').map((item) => item.trim()).filter(Boolean)
    document.title = `${vaga.titulo} — Aladin`
    document.getElementById('job-title').textContent = vaga.titulo
    document.getElementById('job-company').textContent = vaga.empresa?.nome || 'Empresa'
    document.getElementById('job-location').textContent = vaga.cidade
    document.getElementById('job-modality').textContent = `Modalidade: ${vaga.modalidade.charAt(0) + vaga.modalidade.slice(1).toLowerCase()}`
    document.getElementById('job-salary').textContent = formatSalary(vaga.salarioMin, vaga.salarioMax)
    document.getElementById('job-description').textContent = vaga.descricao
    document.getElementById('job-technologies').innerHTML = technologies.length ? technologies.map((item) => `<span class="technology">${escapeHtml(item)}</span>`).join('') : '<span class="text-sm text-mutedCustom">Tecnologias não informadas.</span>'
    document.getElementById('company-title').textContent = vaga.empresa?.nome || 'Empresa'
    document.getElementById('company-initials').textContent = (vaga.empresa?.nome || 'E').split(/\s+/).slice(0, 3).map((word) => word[0]).join('').toUpperCase()
    document.getElementById('company-description').textContent = vaga.empresa?.descricao || 'Conheça a empresa responsável por esta oportunidade.'
    document.getElementById('company-link').href = `empresas.html?id=${vaga.empresaId}`
    document.getElementById('apply-dialog-title').textContent = vaga.titulo
    document.getElementById('apply-dialog-description').textContent = `Confirme o envio do seu perfil para ${vaga.empresa?.nome || 'a empresa responsável'}.`
    document.getElementById('apply-form').dataset.vagaId = vaga.id
  } catch (error) {
    if (page) page.innerHTML = `<p class="p-10 text-center text-red-600">${escapeHtml(error.message)}</p>`
  }
}

loadVacancyDetails()

function initInterviewVacancyClosure() {
  if (!location.pathname.endsWith('/empresa/candidatos-vaga.html')) return
  const vagaId = new URLSearchParams(location.search).get('vaga')
  if (!vagaId) return

  const main = document.querySelector('main')
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'fixed bottom-6 left-6 z-40 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-card disabled:cursor-not-allowed disabled:opacity-50'
  button.textContent = 'Encerrar vaga'
  button.disabled = !document.querySelector('.candidate-card[data-status="entrevista"]')
  button.title = button.disabled ? 'Convide um candidato para entrevista antes de encerrar' : ''
  main?.appendChild(button)

  document.addEventListener('click', (event) => {
    if (event.target.closest('.move-interview, #modal-interview-button')) {
      window.setTimeout(() => {
        button.disabled = false
        button.title = ''
      })
    }
  })

  button.addEventListener('click', async () => {
    if (!window.confirm('Encerrar esta vaga agora? Novas candidaturas serão bloqueadas.')) return
    button.disabled = true
    try {
      await apiRequest(`/vagas/${vagaId}`, { method: 'PUT', body: JSON.stringify({ status: 'FECHADA' }) })
      window.location.href = '/src/pages/main/user/gerenciar-vagas.html'
    } catch (error) {
      button.disabled = false
      window.alert(error.message)
    }
  })
}

initInterviewVacancyClosure()
