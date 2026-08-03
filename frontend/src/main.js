import './style.css'
import { apiRequest } from './api.js'

window.aladinApi = { request: apiRequest }

const EMPRESA_ONLY_PATHS = [
  '/src/pages/main/empresa/painel-empresa.html',
  '/src/pages/main/empresa/publicar-vaga.html',
  '/src/pages/main/empresa/candidatos-vaga.html',
  '/src/pages/main/user/gerenciar-vagas.html',
]
const CANDIDATO_ONLY_PATHS = [
  '/src/pages/main/user/minhas-candidaturas.html',
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

function hideCandidateNavigationLinks() {
  document.querySelectorAll('nav[aria-label="Navegação principal"] a[href*="minhas-candidaturas.html"], nav[aria-label="Navegação principal"] a[href*="empresas.html"]').forEach((link) => {
    const item = link.closest('li')
    if (item) item.style.display = 'none'
    else link.style.display = 'none'
  })
}

function applyCompanyNavigation() {
  document.querySelectorAll('nav[aria-label="Navegação principal"] a').forEach((link) => {
    if (link.textContent.trim().toLowerCase() === 'vagas') {
      link.href = '/src/pages/main/empresa/painel-empresa.html'
    }
  })
}

function applyAuthenticatedLogoLinks(user) {
  if (!user?.usuario) return
  const destination = isEmpresaUser(user)
    ? '/src/pages/main/empresa/painel-empresa.html'
    : '/src/pages/main/user/vagas.html'
  document.querySelectorAll('a[href="/"]').forEach((link) => {
    if (link.querySelector('img[src*="aladin-logo"], img[src*="white-logo"]') || /aladin/i.test(link.getAttribute('aria-label') || '')) {
      link.href = destination
    }
  })
}

async function applyEmpresaAccessRules() {
  const user = await getCurrentUser()
  renderProfileAvatars(user)
  applyAuthenticatedLogoLinks(user)
  if (isEmpresaUser(user)) {
    hideCandidateNavigationLinks()
    applyCompanyNavigation()
  } else {
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

async function guardCandidatoPage() {
  const user = await getCurrentUser()
  if (user?.usuario?.role !== 'CANDIDATO') {
    location.replace(user ? '/src/pages/main/empresa/painel-empresa.html' : '/src/pages/login/login.html')
  }
}

async function initPageSecurity() {
  await applyEmpresaAccessRules()
  if (EMPRESA_ONLY_PATHS.some((path) => location.pathname.endsWith(path))) {
    await guardEmpresaPage()
  }
  if (CANDIDATO_ONLY_PATHS.some((path) => location.pathname.endsWith(path))) {
    await guardCandidatoPage()
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
      window.location.replace('/')
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
        tipoConta: loginForm.elements.tipo_conta.value,
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
        foto: getStoredUserPhoto(),
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

const deleteAccountButton = document.getElementById('delete-account')
deleteAccountButton?.addEventListener('click', async () => {
  const confirmation = window.prompt('Esta ação é permanente e removerá todos os dados vinculados à conta. Digite EXCLUIR para confirmar:')
  if (confirmation !== 'EXCLUIR') return

  deleteAccountButton.disabled = true
  deleteAccountButton.textContent = 'Excluindo conta...'
  try {
    await apiRequest('/auth/me', { method: 'DELETE' })
    currentUserCache = null
    try {
      localStorage.removeItem('aladin-user-photo')
    } catch {
      // A conta já foi excluída; falhas no armazenamento local não impedem a saída.
    }
    window.location.replace('/')
  } catch (error) {
    deleteAccountButton.disabled = false
    deleteAccountButton.textContent = 'Excluir conta'
    window.alert(error.message)
  }
})

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
        <img src="${escapeHtml(vaga.empresa?.foto || '/assets/empresa.png')}" alt="Foto de ${escapeHtml(vaga.empresa?.nome || 'empresa')}" class="h-12 w-12 rounded-xl border border-white/90 object-cover shadow-sm">
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

async function loadCompanies() {
  const grid = document.getElementById('companies-grid')
  if (!grid) return
  const empty = document.getElementById('companies-empty')
  const search = document.getElementById('company-search')

  try {
    const companies = await apiRequest('/empresas')
    grid.innerHTML = companies.map((company) => {
      const openJobs = company._count?.vagas || 0
      const biography = company.descricao?.trim() || 'Esta empresa ainda não adicionou uma apresentação ao perfil.'
      return `<article class="company-card glass-card flex min-h-[285px] flex-col items-center rounded-[22px] p-5 text-center" data-id="${company.id}" data-search="${escapeHtml(`${company.nome} ${company.cidade || ''} ${biography}`.toLowerCase())}">
        <img src="${escapeHtml(company.foto || '/assets/empresa.png')}" alt="Foto de perfil de ${escapeHtml(company.nome)}" class="h-16 w-16 rounded-2xl border border-white/90 object-cover shadow-sm">
        <h2 class="mt-3 text-lg font-bold text-navy">${escapeHtml(company.nome)}</h2>
        <p class="mt-1 text-sm text-navy/70">⌖ ${escapeHtml(company.cidade || 'Localização não informada')}</p>
        <p class="mt-3 line-clamp-2 text-sm leading-relaxed text-mutedCustom">${escapeHtml(biography)}</p>
        <span class="mt-4 rounded-full px-3 py-1 text-xs font-semibold ${openJobs ? 'bg-orangeCustom text-white' : 'bg-slate-200/80 text-navy/70'}">${openJobs ? `${openJobs} ${openJobs === 1 ? 'vaga aberta' : 'vagas abertas'}` : 'Sem vagas abertas'}</span>
        <button class="company-details-api orange-button mt-auto w-full rounded-xl py-2.5 text-sm font-semibold text-white">Ver perfil</button>
      </article>`
    }).join('')

    function filterCompanies() {
      const term = search.value.trim().toLowerCase()
      let visible = 0
      grid.querySelectorAll('.company-card').forEach((card) => {
        const show = !term || card.dataset.search.includes(term)
        card.classList.toggle('hidden', !show)
        if (show) visible += 1
      })
      empty.classList.toggle('hidden', visible > 0)
    }
    search.addEventListener('input', filterCompanies)
    filterCompanies()

    grid.addEventListener('click', (event) => {
      const button = event.target.closest('.company-details-api')
      if (!button) return
      const company = companies.find((item) => String(item.id) === button.closest('.company-card').dataset.id)
      if (!company) return
      document.getElementById('company-modal-title').textContent = company.nome
      document.getElementById('company-modal-text').textContent = company.descricao || 'Esta empresa ainda não adicionou uma apresentação ao perfil.'
      const jobsLink = document.querySelector('#company-modal a[href*="vagas.html"]')
      if (jobsLink) jobsLink.href = `vagas.html?empresa=${company.id}`
      document.getElementById('company-modal').showModal()
    })
  } catch (error) {
    grid.innerHTML = `<p class="sm:col-span-2 lg:col-span-3 py-8 text-center text-red-600">${escapeHtml(error.message)}</p>`
  }
}

loadCompanies()

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
    const [vaga, currentUser] = await Promise.all([
      apiRequest(`/vagas/${vagaId}`),
      getCurrentUser(),
    ])
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
    const companyAvatar = document.getElementById('company-initials')
    const companyPhoto = document.createElement('img')
    companyPhoto.id = 'company-initials'
    companyPhoto.src = vaga.empresa?.foto || '/assets/empresa.png'
    companyPhoto.alt = `Foto de perfil de ${vaga.empresa?.nome || 'empresa'}`
    companyPhoto.className = 'h-14 w-14 shrink-0 rounded-2xl border border-white/90 object-cover shadow-sm'
    companyPhoto.addEventListener('error', () => {
      companyPhoto.src = '/assets/empresa.png'
    }, { once: true })
    companyAvatar.replaceWith(companyPhoto)
    document.getElementById('company-description').textContent = vaga.empresa?.descricao || 'Conheça a empresa responsável por esta oportunidade.'
    document.getElementById('company-link').href = `empresas.html?id=${vaga.empresaId}`
    document.getElementById('apply-dialog-title').textContent = vaga.titulo
    document.getElementById('apply-dialog-description').textContent = `Confirme o envio do seu perfil para ${vaga.empresa?.nome || 'a empresa responsável'}.`
    document.getElementById('apply-form').dataset.vagaId = vaga.id

    const applyButton = document.getElementById('apply-button')
    if (vaga.status === 'FECHADA') {
      applyButton.textContent = 'Vaga encerrada'
      applyButton.disabled = true
      applyButton.classList.add('cursor-not-allowed', 'opacity-65')
    } else if (currentUser?.usuario?.role === 'CANDIDATO') {
      const applications = await apiRequest('/candidaturas/minhas').catch(() => [])
      const existingApplication = applications.find((application) => String(application.vaga?.id) === String(vaga.id))
      if (existingApplication) {
        const [statusLabel] = applicationStatus(existingApplication.status)
        applyButton.textContent = `Candidatura enviada · ${statusLabel}`
        applyButton.disabled = true
        applyButton.classList.add('cursor-not-allowed', 'opacity-65')
      }
    }
  } catch (error) {
    if (page) page.innerHTML = `<p class="p-10 text-center text-red-600">${escapeHtml(error.message)}</p>`
  }
}

loadVacancyDetails()

function applicationStatus(status) {
  const statuses = {
    PENDENTE: ['Novo candidato', 'bg-blueCustom/10 text-blueCustom'],
    EM_ANALISE: ['Em análise', 'bg-amber-100 text-amber-700'],
    ENTREVISTA: ['Entrevista', 'bg-orangeCustom/12 text-orangeDark'],
    APROVADO: ['Aprovado', 'bg-emerald-100 text-emerald-700'],
    REJEITADO: ['Não selecionado', 'bg-slate-200 text-slate-600'],
  }
  return statuses[status] || statuses.PENDENTE
}

function candidateWorkflowActions(status, vacancyClosed = false) {
  if (vacancyClosed) return '<button type="button" class="rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500" disabled>Vaga fechada</button>'
  const actions = {
    PENDENTE: '<button type="button" data-next-status="EM_ANALISE" class="orange-button rounded-xl px-4 py-3 text-sm font-semibold text-white">Mover para análise</button>',
    EM_ANALISE: '<button type="button" data-next-status="ENTREVISTA" class="orange-button rounded-xl px-4 py-3 text-sm font-semibold text-white">Chamar para entrevista</button>',
    ENTREVISTA: '<button type="button" data-next-status="APROVADO" class="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">Aprovar</button><button type="button" data-next-status="REJEITADO" class="rounded-xl border border-red-500 bg-white/60 px-4 py-3 text-sm font-semibold text-red-600">Rejeitar</button>',
    APROVADO: '<button type="button" class="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-700" disabled>Processo concluído</button>',
    REJEITADO: '<button type="button" class="rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-600" disabled>Processo concluído</button>',
  }
  return actions[status] || actions.PENDENTE
}

async function loadVacancyCandidates() {
  const grid = document.getElementById('candidates-grid')
  if (!grid) return
  const vagaId = new URLSearchParams(location.search).get('vaga')
  if (!vagaId || !/^\d+$/.test(vagaId)) {
    grid.innerHTML = '<p class="lg:col-span-2 text-center text-red-600">Vaga inválida ou não informada.</p>'
    return
  }

  try {
    const [vaga, candidaturas] = await Promise.all([
      apiRequest(`/vagas/${vagaId}`),
      apiRequest(`/candidaturas/vagas/${vagaId}`),
    ])
    document.getElementById('candidatos-title').textContent = vaga.titulo
    document.getElementById('candidate-count').textContent = candidaturas.length
    document.getElementById('vacancy-technologies').innerHTML = technologyTags(vaga.tecnologias)
    const vacancyClosed = vaga.status === 'FECHADA'
    if (vacancyClosed) {
      document.getElementById('candidatos-title').insertAdjacentHTML('afterend', '<span class="mt-2 inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">Vaga fechada</span>')
    }
    const closeVacancyButton = document.getElementById('close-vacancy-after-interview')
    if (closeVacancyButton) closeVacancyButton.classList.toggle('hidden', vacancyClosed)

    const byId = new Map(candidaturas.map((item) => [String(item.id), item]))
    grid.innerHTML = candidaturas.length ? candidaturas.map((item) => {
      const candidate = item.candidato
      const name = candidate.usuario?.nome || 'Candidato'
      const initials = name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
      const [statusLabel, statusClasses] = applicationStatus(item.status)
      return `<article class="candidate-card glass-card rounded-[24px] p-5 transition md:p-6 ${vacancyClosed ? 'opacity-55 grayscale-[.25]' : ''}" data-application-id="${item.id}" data-status="${item.status.toLowerCase()}">
        <div class="flex items-start gap-4"><div class="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-100 to-orange-100 text-lg font-extrabold text-navy">${escapeHtml(initials)}</div>
        <div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2"><h2 class="truncate text-lg font-bold text-navy">${escapeHtml(name)}</h2><span class="status-badge rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses}">${statusLabel}</span></div>
        <p class="mt-0.5 text-sm text-navy/80">${escapeHtml(candidate.cargo || 'Cargo não informado')}</p><p class="mt-4 text-sm leading-relaxed text-navy/78">${escapeHtml(candidate.bio || 'O candidato ainda não adicionou um resumo profissional.')}</p>
        <div class="mt-3 flex flex-wrap gap-2">${technologyTags(candidate.tecnologias)}</div></div></div>
        <div class="mt-5 grid gap-3 sm:grid-cols-2"><button type="button" class="view-real-profile rounded-xl border border-orangeCustom bg-white/45 px-4 py-3 text-sm font-semibold text-orangeDark">Ver perfil</button>
        <button type="button" class="download-resume rounded-xl border border-blueCustom bg-white/45 px-4 py-3 text-sm font-semibold text-blueCustom">Baixar currículo</button></div>
        <div class="candidate-workflow-actions mt-3 flex flex-wrap gap-3">${candidateWorkflowActions(item.status, vacancyClosed)}</div>
      </article>`
    }).join('') : '<p class="lg:col-span-2 rounded-2xl bg-white/55 p-8 text-center text-mutedCustom">Nenhum candidato se inscreveu nesta vaga ainda.</p>'

    if (closeVacancyButton && candidaturas.some((item) => item.status === 'ENTREVISTA')) closeVacancyButton.disabled = false

    let activeApplication = null
    grid.addEventListener('click', async (event) => {
      const card = event.target.closest('.candidate-card')
      if (!card) return
      const application = byId.get(card.dataset.applicationId)
      if (!application) return

      if (event.target.closest('.download-resume')) {
        try {
          const resume = JSON.parse(application.candidato.curriculo || '{}')
          if (!resume.dados) throw new Error('Currículo não encontrado.')
          const link = document.createElement('a')
          link.href = resume.dados
          link.download = resume.nome || 'curriculo'
          link.click()
        } catch (error) {
          window.alert(error.message || 'Não foi possível baixar o currículo.')
        }
        return
      }

      if (event.target.closest('.view-real-profile')) {
        activeApplication = application
        const candidate = application.candidato
        document.getElementById('candidate-modal-name').textContent = candidate.usuario?.nome || 'Candidato'
        document.getElementById('candidate-modal-role').textContent = candidate.cargo || candidate.usuario?.email || ''
        document.getElementById('candidate-modal-bio').textContent = candidate.bio || 'Resumo profissional não informado.'
        const details = String(candidate.tecnologias || '').split(',').map((item) => item.trim()).filter(Boolean)
        document.getElementById('candidate-modal-skills').innerHTML = details.map((value) => `<span class="tag">${escapeHtml(value)}</span>`).join('') || '<span class="text-xs text-mutedCustom">Informações adicionais não cadastradas.</span>'
        document.getElementById('candidate-modal-score').textContent = '—'
        document.getElementById('candidate-modal-ring').style.setProperty('--score', 0)
        const modalButton = document.getElementById('modal-interview-button')
        const nextStatus = application.status === 'PENDENTE' ? 'EM_ANALISE' : application.status === 'EM_ANALISE' ? 'ENTREVISTA' : ''
        modalButton.dataset.nextStatus = nextStatus
        modalButton.disabled = !nextStatus || vacancyClosed
        modalButton.textContent = vacancyClosed ? 'Vaga fechada' : nextStatus === 'EM_ANALISE' ? 'Mover para análise' : nextStatus === 'ENTREVISTA' ? 'Chamar para entrevista' : 'Use as ações no card'
        document.getElementById('candidate-modal').showModal()
        return
      }

      const workflowButton = event.target.closest('[data-next-status]')
      if (workflowButton) await updateApplicationStatus(application, card, workflowButton, workflowButton.dataset.nextStatus)
    })

    document.getElementById('modal-interview-button').addEventListener('click', async () => {
      if (!activeApplication) return
      const card = grid.querySelector(`[data-application-id="${activeApplication.id}"]`)
      const button = document.getElementById('modal-interview-button')
      if (button.dataset.nextStatus) await updateApplicationStatus(activeApplication, card, button, button.dataset.nextStatus)
      document.getElementById('candidate-modal').close()
    })

    async function updateApplicationStatus(application, card, button, nextStatus) {
      if (!nextStatus) return
      if (button) button.disabled = true
      try {
        await apiRequest(`/candidaturas/${application.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) })
        application.status = nextStatus
        card.dataset.status = nextStatus.toLowerCase()
        const [statusLabel, statusClasses] = applicationStatus(nextStatus)
        const badge = card.querySelector('.status-badge')
        badge.textContent = statusLabel
        badge.className = `status-badge rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses}`
        card.querySelector('.candidate-workflow-actions').innerHTML = candidateWorkflowActions(nextStatus)
        if (nextStatus === 'ENTREVISTA') {
          const closeButton = document.getElementById('close-vacancy-after-interview')
          if (closeButton) {
            closeButton.disabled = false
            closeButton.title = ''
          }
        }
      } catch (error) {
        if (button) button.disabled = false
        window.alert(error.message)
      }
    }
  } catch (error) {
    grid.innerHTML = `<p class="lg:col-span-2 text-center text-red-600">${escapeHtml(error.message)}</p>`
  }
}

loadVacancyCandidates()

async function loadCandidateApplications() {
  const list = document.getElementById('candidate-applications')
  if (!list) return
  const empty = document.getElementById('candidate-applications-empty')

  try {
    const applications = await apiRequest('/candidaturas/minhas')
    list.innerHTML = applications.map((application) => {
      const vacancy = application.vaga
      const closed = vacancy.status === 'FECHADA'
      const [statusLabel, statusClasses] = applicationStatus(application.status)
      return `<article class="candidate-application glass-card rounded-[22px] p-5 transition ${closed ? 'opacity-55 grayscale-[.2]' : ''}" data-closed="${closed}" data-search="${escapeHtml(`${vacancy.titulo} ${vacancy.empresa?.nome || ''}`.toLowerCase())}">
        <div class="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2"><h2 class="text-lg font-bold">${escapeHtml(vacancy.titulo)}</h2>
          <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold ${closed ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}">${closed ? 'Vaga fechada' : 'Vaga aberta'}</span></div>
          <p class="mt-1 text-sm font-medium text-orangeDark">${escapeHtml(vacancy.empresa?.nome || 'Empresa')}</p>
          <p class="mt-2 text-xs text-mutedCustom">${escapeHtml(vacancy.modalidade === 'REMOTO' ? 'Remoto' : vacancy.cidade)} · Candidatura em ${new Date(application.createdAt).toLocaleDateString('pt-BR')}</p>
        </div><div class="flex flex-wrap items-center gap-3"><span class="rounded-full px-3 py-2 text-xs font-semibold ${statusClasses}">${statusLabel}</span>
          <a href="detalhes-vaga.html?id=${vacancy.id}" class="rounded-xl border border-blueCustom px-4 py-2.5 text-sm font-semibold text-blueCustom">Ver vaga</a>
        </div></div>
      </article>`
    }).join('')

    const search = document.getElementById('application-search')
    const filter = document.getElementById('application-filter')
    function filterApplications() {
      const term = search.value.trim().toLowerCase()
      let visible = 0
      list.querySelectorAll('.candidate-application').forEach((card) => {
        const statusMatches = filter.value === 'todas' || (filter.value === 'fechadas') === (card.dataset.closed === 'true')
        const show = statusMatches && (!term || card.dataset.search.includes(term))
        card.classList.toggle('hidden', !show)
        if (show) visible += 1
      })
      empty.classList.toggle('hidden', visible > 0)
    }
    search.addEventListener('input', filterApplications)
    filter.addEventListener('change', filterApplications)
    filterApplications()
  } catch (error) {
    list.innerHTML = `<p class="py-8 text-center text-red-600">${escapeHtml(error.message)}</p>`
  }
}

loadCandidateApplications()

function initInterviewVacancyClosure() {
  if (!location.pathname.endsWith('/empresa/candidatos-vaga.html')) return
  const vagaId = new URLSearchParams(location.search).get('vaga')
  if (!vagaId) return

  const main = document.querySelector('main')
  const button = document.createElement('button')
  button.id = 'close-vacancy-after-interview'
  button.type = 'button'
  button.className = 'fixed bottom-6 left-6 z-40 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-card disabled:cursor-not-allowed disabled:opacity-50'
  button.textContent = 'Encerrar vaga'
  button.disabled = !document.querySelector('.candidate-card[data-status="entrevista"]')
  button.title = button.disabled ? 'Convide um candidato para entrevista antes de encerrar' : ''
  main?.appendChild(button)

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
