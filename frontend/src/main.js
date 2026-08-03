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

function hideEmpresaLinks() {
  document.querySelectorAll('a[href*="painel-empresa.html"], a[href*="gerenciar-vagas.html"]').forEach((link) => {
    link.style.display = 'none'
  })
}

async function applyEmpresaAccessRules() {
  const user = await getCurrentUser()
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
