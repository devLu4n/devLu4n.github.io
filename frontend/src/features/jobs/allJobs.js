import { apiRequest } from '../../api.js'
import '../../core/pageLoader.js'

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
    .map((item) => `<span class="rounded-md bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-blueCustom ring-1 ring-inset ring-sky-100">${escapeHtml(item)}</span>`).join('')
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
    <article class="motion-interactive group flex min-h-[300px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-soft hover:border-sky-300 hover:shadow-card">
      <header class="flex items-start gap-4">
        <img src="${escapeHtml(job.empresa?.foto || '/assets/empresa.png')}" alt="Foto de ${escapeHtml(job.empresa?.nome || 'empresa')}" class="h-12 w-12 shrink-0 rounded-xl border border-slate-200 bg-slate-50 object-cover" onerror="this.onerror=null;this.src='/assets/empresa.png'">
        <div class="min-w-0 flex-1"><p class="truncate text-xs font-bold text-blueCustom">${escapeHtml(job.empresa?.nome || 'Empresa')}</p><h2 class="mt-1 line-clamp-2 text-lg font-extrabold leading-6 tracking-[-.015em] text-navy">${escapeHtml(job.titulo)}</h2></div>
        <span class="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">${escapeHtml(modalityLabel(job.modalidade))}</span>
      </header>
      <div class="mt-5 flex min-h-7 flex-wrap gap-2">${technologyTags(job.tecnologias) || '<span class="text-xs text-slate-400">Tecnologias não informadas</span>'}</div>
      <div class="mt-5 grid gap-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 sm:grid-cols-2">
        <p class="flex items-center gap-2"><svg class="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg><strong class="truncate font-semibold text-navy/80">${escapeHtml(job.modalidade === 'REMOTO' ? 'Remoto' : job.cidade)}</strong></p>
        <p class="flex items-center gap-2 sm:justify-end"><svg class="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg><strong class="truncate font-semibold text-navy/80">${escapeHtml(job.area)}</strong></p>
      </div>
      <footer class="mt-auto flex items-end justify-between gap-3 border-t border-slate-200 pt-5"><div><span class="block text-[11px] font-semibold uppercase tracking-[.08em] text-slate-400">Faixa salarial</span><strong class="mt-1 block text-sm text-navy">${escapeHtml(salaryLabel(job))}</strong></div><a href="/src/pages/signup/signup.html?tipo=candidato" class="motion-interactive inline-flex min-h-11 items-center rounded-lg bg-blueCustom px-4 text-sm font-bold text-white shadow-button hover:bg-blueDark">Ver vaga</a></footer>
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
