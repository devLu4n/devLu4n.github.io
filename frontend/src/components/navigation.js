export function initNavigation() {
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
    tab.addEventListener('click', () => tabList?.querySelectorAll('[role="tab"]').forEach((item) => { item.tabIndex = item === tab ? 0 : -1 }))
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      const tabs = [...tabList.querySelectorAll('[role="tab"]')]
      const currentIndex = tabs.indexOf(tab)
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
      tabs[nextIndex].focus()
      tabs[nextIndex].click()
    })
  })
}
