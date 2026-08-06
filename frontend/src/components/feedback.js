export function announce(message, type = 'error') {
  let region = document.getElementById('global-feedback')
  if (!region) {
    region = document.createElement('div')
    region.id = 'global-feedback'
    region.setAttribute('role', type === 'error' ? 'alert' : 'status')
    region.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite')
    region.setAttribute('aria-atomic', 'true')
    region.className = 'global-feedback max-w-[calc(100%_-_2rem)] rounded-xl px-5 py-3 text-center text-sm font-semibold text-white shadow-card'
    region.hidden = true
    document.body.appendChild(region)
  }

  window.clearTimeout(Number(region.dataset.stayTimer || 0))
  window.clearTimeout(Number(region.dataset.closeTimer || 0))

  region.setAttribute('role', type === 'error' ? 'alert' : 'status')
  region.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite')
  region.classList.toggle('bg-red-700', type === 'error')
  region.classList.toggle('bg-emerald-700', type !== 'error')
  region.textContent = message || 'Não foi possível concluir a operação.'
  region.hidden = false
  void region.offsetWidth
  region.classList.add('is-visible')

  const stayTimer = window.setTimeout(() => {
    region.classList.remove('is-visible')
    const closeTimer = window.setTimeout(() => {
      region.hidden = true
    }, 200)
    region.dataset.closeTimer = String(closeTimer)
  }, 5000)
  region.dataset.stayTimer = String(stayTimer)
}
