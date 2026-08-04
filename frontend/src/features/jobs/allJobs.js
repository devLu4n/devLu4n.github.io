import { apiRequest } from '../../api.js'

const PAGE_SIZE = 8
const state = { jobs: [], page: 1, area: '', modality: '', salary: 0, search: '', city: '', sort: 'recent' }
const grid = document.getElementById('all-jobs-grid')
const empty = document.getElementById('jobs-empty')
const pagination = document.getElementById('jobs-pagination')

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])
}

function normalize(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function salaryValue(job) {
  return Number(job.salarioMin || job.salarioMax || 0)
}

function salaryLabel(job) {
  if (!job.salarioMin && !job.salarioMax) return 'A combinar'
  const money = (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  if (job.salarioMin && job.salarioMax) return `${money(job.salarioMin)} – ${money(job.salarioMax)}`
  return money(job.salarioMin || job.salarioMax)
}

function modalityLabel(value) {
  return { REMOTO: 'Remoto', HIBRIDO: 'Híbrido', PRESENCIAL: 'Presencial' }[value] || value
}

function technologyTags(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 4)
    .map((item) => `<span class="rounded-lg bg-blueLt px-2.5 py-1 text-xs font-semibold text-blueCustom">${escapeHtml(item)}</span>`).join('')
}

function filteredJobs() {
  return state.jobs.filter((job) => {
    const searchable = normalize(`${job.titulo} ${job.empresa?.nome || ''} ${job.tecnologias || ''}`)
    return (!state.area || normalize(job.area) === normalize(state.area))
      && (!state.modality || job.modalidade === state.modality)
      && (!state.salary || salaryValue(job) >= state.salary)
      && (!state.search || searchable.includes(normalize(state.search)))
      && (!state.city || normalize(job.cidade).includes(normalize(state.city)))
  }).sort((first, second) => {
    if (state.sort === 'salary-desc') return salaryValue(second) - salaryValue(first)
    if (state.sort === 'salary-asc') return salaryValue(first) - salaryValue(second)
    if (state.sort === 'title') return first.titulo.localeCompare(second.titulo, 'pt-BR')
    return new Date(second.createdAt) - new Date(first.createdAt)
  })
}

function renderPagination(totalPages) {
  pagination.innerHTML = ''
  if (totalPages <= 1) return
  for (let page = 1; page <= totalPages; page += 1) {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = page
    button.className = page === state.page ? 'grid h-10 w-10 place-items-center rounded-xl bg-blueCustom text-sm font-bold text-white' : 'grid h-10 w-10 place-items-center rounded-xl border border-borderColor bg-white text-sm font-semibold text-mutedCustom hover:border-blueCustom hover:text-blueCustom'
    if (page === state.page) button.setAttribute('aria-current', 'page')
    button.addEventListener('click', () => { state.page = page; render(); document.getElementById('main-content').scrollIntoView({ behavior: 'smooth' }) })
    pagination.appendChild(button)
  }
}

function render() {
  const jobs = filteredJobs()
  const totalPages = Math.ceil(jobs.length / PAGE_SIZE)
  if (state.page > Math.max(totalPages, 1)) state.page = 1
  const visible = jobs.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE)
  grid.innerHTML = visible.map((job) => `
    <article class="group flex min-h-[285px] flex-col rounded-[24px] border border-borderColor bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-blueCustom hover:shadow-card">
      <header class="flex items-center gap-4"><img src="${escapeHtml(job.empresa?.foto || '/assets/empresa.png')}" alt="Foto de ${escapeHtml(job.empresa?.nome || 'empresa')}" class="h-12 w-12 shrink-0 rounded-xl border border-borderColor object-cover" onerror="this.onerror=null;this.src='/assets/empresa.png'"><div class="min-w-0"><p class="truncate text-xs font-bold uppercase tracking-[.08em] text-orangeCustom">${escapeHtml(job.empresa?.nome || 'Empresa')}</p><h2 class="mt-1 line-clamp-2 font-extrabold leading-6">${escapeHtml(job.titulo)}</h2></div></header>
      <div class="mt-5 flex flex-wrap gap-2">${technologyTags(job.tecnologias)}<span class="rounded-lg bg-orangeLt px-2.5 py-1 text-xs font-semibold text-orangeCustom">${escapeHtml(modalityLabel(job.modalidade))}</span></div>
      <div class="mt-5 grid gap-2 text-sm text-mutedCustom sm:grid-cols-2"><p>Local: <strong class="font-semibold text-navy/80">${escapeHtml(job.modalidade === 'REMOTO' ? 'Remoto' : job.cidade)}</strong></p><p class="sm:text-right">Área: <strong class="font-semibold text-navy/80">${escapeHtml(job.area)}</strong></p></div>
      <footer class="mt-auto flex items-center justify-between gap-3 border-t border-borderColor pt-5"><strong class="text-sm text-orangeCustom">${escapeHtml(salaryLabel(job))}</strong><a href="/src/pages/main/user/detalhes-vaga.html?id=${encodeURIComponent(job.id)}" class="rounded-xl bg-blueCustom px-4 py-2.5 text-sm font-bold text-white">Ver vaga</a></footer>
    </article>`).join('')
  empty.classList.toggle('hidden', jobs.length !== 0)
  grid.classList.toggle('hidden', jobs.length === 0)
  document.getElementById('showing-count').textContent = visible.length
  document.getElementById('filtered-count').textContent = jobs.length
  document.getElementById('total-count').textContent = state.jobs.length
  renderPagination(totalPages)
}

function selectSingleFilter(containerId, dataKey, stateKey) {
  document.getElementById(containerId).addEventListener('click', (event) => {
    const button = event.target.closest(`[data-${dataKey}]`)
    if (!button) return
    const selected = button.dataset[dataKey]
    state[stateKey] = state[stateKey] === selected ? '' : selected
    document.querySelectorAll(`#${containerId} [data-${dataKey}]`).forEach((item) => item.classList.toggle('active', item === button && state[stateKey] === selected))
    state.page = 1
    render()
  })
}

selectSingleFilter('area-filters', 'area', 'area')
selectSingleFilter('modality-filters', 'modality', 'modality')
document.getElementById('jobs-search-form').addEventListener('submit', (event) => { event.preventDefault(); state.search = document.getElementById('job-search').value; state.city = document.getElementById('city-search').value; state.page = 1; render() })
document.getElementById('salary-filter').addEventListener('input', (event) => { state.salary = Number(event.target.value); document.getElementById('salary-label').textContent = state.salary ? `R$ ${state.salary.toLocaleString('pt-BR')}+` : 'Qualquer valor'; state.page = 1; render() })
document.getElementById('jobs-sort').addEventListener('change', (event) => { state.sort = event.target.value; render() })
document.getElementById('clear-filters').addEventListener('click', () => {
  Object.assign(state, { page: 1, area: '', modality: '', salary: 0, search: '', city: '', sort: 'recent' })
  document.getElementById('jobs-search-form').reset(); document.getElementById('salary-filter').value = 0; document.getElementById('salary-label').textContent = 'Qualquer valor'; document.getElementById('jobs-sort').value = 'recent'
  document.querySelectorAll('.filter-chip').forEach((item) => item.classList.remove('active'))
  render()
})

async function loadJobs() {
  try {
    const response = await apiRequest('/vagas?limit=100')
    state.jobs = Array.isArray(response) ? response : response.dados || []
    render()
  } catch (error) {
    grid.innerHTML = `<div class="col-span-full rounded-[24px] border border-red-200 bg-red-50 p-8 text-center text-sm font-semibold text-red-700">${escapeHtml(error.message)}</div>`
  }
}

loadJobs()
