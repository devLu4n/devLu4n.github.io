import { apiRequest } from '../../api.js'
import { clearCurrentUser } from '../../core/auth.js'

function feedbackFor(form) {
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

function submitting(form, active) {
  const button = form.querySelector('[type="submit"]')
  if (!button) return
  button.disabled = active
  button.classList.toggle('cursor-wait', active)
  button.classList.toggle('opacity-70', active)
}

export function initAuthForms() {
  document.querySelectorAll('#profile-menu button').forEach((logoutButton) => {
    logoutButton.addEventListener('click', async () => {
      const originalText = logoutButton.textContent
      logoutButton.disabled = true
      logoutButton.textContent = 'Saindo...'
      try {
        await apiRequest('/auth/logout', { method: 'POST' })
        clearCurrentUser()
        window.location.replace('/')
      } catch (error) {
        logoutButton.disabled = false
        logoutButton.textContent = originalText
        window.alert(error.message === 'Failed to fetch' ? 'Não foi possível acessar o servidor.' : error.message)
      }
    })
  })

  const loginForm = document.getElementById('login-form')
  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const feedback = feedbackFor(loginForm)
    feedback.textContent = ''
    submitting(loginForm, true)
    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginForm.elements.email.value,
          senha: loginForm.elements.password.value,
          tipoConta: loginForm.elements.tipo_conta.value,
        }),
      })
      window.location.href = result.usuario.role === 'EMPRESA' ? '/src/pages/main/empresa/painel-empresa.html' : '/src/pages/main/user/vagas.html'
    } catch (error) {
      feedback.className = 'text-center text-sm font-medium text-red-600'
      feedback.textContent = error.message
    } finally {
      submitting(loginForm, false)
    }
  })

  const registerForm = document.getElementById('register-form')
  registerForm?.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (!registerForm.checkValidity()) return registerForm.reportValidity()
    const password = registerForm.elements.password.value
    if (password !== registerForm.elements.confirmar_senha.value) return
    const feedback = feedbackFor(registerForm)
    feedback.textContent = ''
    submitting(registerForm, true)
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
      window.location.href = accountType === 'empresa' ? '/src/pages/main/empresa/painel-empresa.html' : '/src/pages/main/user/vagas.html'
    } catch (error) {
      feedback.className = 'text-center text-sm font-medium text-red-600'
      feedback.textContent = error.message
    } finally {
      submitting(registerForm, false)
    }
  })
}
