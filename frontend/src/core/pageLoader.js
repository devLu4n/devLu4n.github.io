let navigationPending = false

function revealPage() {
  navigationPending = false
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      document.body.classList.add('page-ready')
      document.body.setAttribute('aria-busy', 'false')
    })
  })
}

function showPageLoader() {
  navigationPending = true
  document.body.classList.remove('page-ready')
  document.body.setAttribute('aria-busy', 'true')
}

document.body.setAttribute('aria-busy', 'true')
if (document.readyState === 'complete') revealPage()
else window.addEventListener('load', revealPage, { once: true })

window.addEventListener('pageshow', revealPage)
window.addEventListener('beforeunload', showPageLoader)

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]')
  if (!link || event.defaultPrevented || event.button !== 0 || navigationPending) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  if (link.target && link.target !== '_self') return
  if (link.hasAttribute('download') || link.dataset.noPageLoader !== undefined) return

  const url = new URL(link.href, window.location.href)
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== window.location.origin) return
  if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return

  event.preventDefault()
  showPageLoader()
  window.setTimeout(() => window.location.assign(url.href), 120)
})
