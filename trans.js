// ── Sessão ──
const userData = sessionStorage.getItem('balofinho_user');
if (!userData) window.location.href = 'login.html';
const user = JSON.parse(userData || '{}');
const nome = user.nome || 'Operador';
document.getElementById('user-name-display').textContent = nome.charAt(0).toUpperCase() + nome.slice(1);
document.getElementById('user-avatar').textContent = nome[0].toUpperCase();

function logout() {
  sessionStorage.removeItem('balofinho_user');
  window.location.href = 'login.html';
}

// ── Lista de transportadores ──
const TRANSPORTADORES = [
  { id: 'guardanapo',      nome: 'Guardanapo',             arquivo: 'trans-guardanapo.html' },
  { id: 'professional',    nome: 'Professional',            arquivo: 'trans-professional.html' },
  { id: 'guardanapo-prof', nome: 'Guardanapo/Professional', arquivo: 'trans-guardanapo-prof.html' },
  { id: '800-abs',         nome: '800/ABS',                arquivo: 'trans-800-abs.html' },
  { id: 'caixaria',        nome: 'Caixaria',               arquivo: 'trans-caixaria.html' },
  { id: '600',             nome: '600',                    arquivo: 'trans-600.html' },
  { id: '900',             nome: '900',                    arquivo: 'trans-900.html' },
  { id: '600-900',         nome: '600/900',                arquivo: 'trans-600-900.html' },
  { id: '200',             nome: '200',                    arquivo: 'trans-200.html' },
  { id: '400',             nome: '400',                    arquivo: 'trans-400.html' },
  { id: '500',             nome: '500',                    arquivo: 'trans-500.html' },
  { id: '700',             nome: '700',                    arquivo: 'trans-700.html' },
  { id: '800r',            nome: '800 R',                  arquivo: 'trans-800r.html' },
  { id: '850',             nome: '850',                    arquivo: 'trans-850.html' },
  { id: '950',             nome: '950',                    arquivo: 'trans-950.html' },
];

// ── Monta o drawer ──
function buildDrawer() {
  const body = document.getElementById('drawer-body');
  if (!body) return;

  const registros = carregarRegistros();

  // Link para menu principal
  body.innerHTML = `
    <div class="drawer-section-title">Navegação</div>
    <a class="drawer-item" href="app.html">
      <span class="drawer-item-icon">🏠</span>
      Menu Principal
    </a>
    <div class="drawer-divider"></div>
    <div class="drawer-section-title">Transportadores</div>
  `;

  TRANSPORTADORES.forEach(t => {
    const count = registros.filter(r => r.transId === t.id).length;
    const isActive = t.id === TRANS_ID;
    const item = document.createElement('a');
    item.className = 'drawer-item' + (isActive ? ' active' : '');
    item.href = t.arquivo;
    item.innerHTML = `
      <span class="drawer-item-icon">${isActive ? '📍' : '🔧'}</span>
      Transp. ${t.nome}
      ${count > 0 ? `<span class="drawer-item-dot" title="${count} registros"></span>` : ''}
    `;
    body.appendChild(item);
  });
}

// ── Controle do drawer ──
function openDrawer() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('hamburger-btn').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('hamburger-btn').classList.remove('open');
  document.body.style.overflow = '';
}

function toggleDrawer() {
  const isOpen = document.getElementById('drawer').classList.contains('open');
  isOpen ? closeDrawer() : openDrawer();
}

// Fecha ao clicar fora
document.getElementById('drawer-overlay').addEventListener('click', closeDrawer);

// Fecha com ESC
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

// ── Storage ──
const STORAGE_KEY = 'balofinho_registros';

function carregarRegistros() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function salvarRegistros(registros) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
}

// ── Sub-abas ──
function showSubPage(id) {
  document.querySelectorAll('.sub-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sub-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sub-' + id).classList.add('active');
  document.querySelector(`[data-tab="${id}"]`).classList.add('active');
  if (id === 'info') {
    renderInfoTable(carregarRegistros().filter(r => r.transId === TRANS_ID));
    atualizarStats();
  }
}

// ── Checkboxes ──
function toggleCk(label) {
  const cb = label.querySelector('input[type=checkbox]');
  cb.checked = !cb.checked;
  label.classList.toggle('checked', cb.checked);
}

// ── Limpar form ──
function limparForm() {
  document.querySelectorAll('#sub-manutencao .ck').forEach(l => {
    l.classList.remove('checked');
    l.querySelector('input').checked = false;
  });
  document.getElementById('esteira-select').value = '';
  document.getElementById('manut-data').value = new Date().toISOString().split('T')[0];
  document.getElementById('manut-descricao').value = '';
  document.getElementById('manut-quem').value = '';
}

// ── Salvar manutenção ──
function salvarManutencao() {
  const tipos     = ['t1','t2','t3'].filter(t => document.getElementById('tipo-' + t).checked).map(t => t.toUpperCase());
  const esteira   = document.getElementById('esteira-select').value;
  const data      = document.getElementById('manut-data').value;
  const descricao = document.getElementById('manut-descricao').value.trim();
  const quem      = document.getElementById('manut-quem').value;

  if (!data || !descricao || !quem) {
    showToast('Preencha data, descrição e técnico.', 'err');
    return;
  }

  const registros = carregarRegistros();
  registros.push({
    id: Date.now(),
    transId: TRANS_ID,
    transNome: TRANS_NOME,
    tipos, esteira, data, descricao, quem,
    anotacoes: ''
  });
  salvarRegistros(registros);
  limparForm();
  atualizarStats();
  showToast('Manutenção registrada!', 'ok');
}

// ── Stats ──
function atualizarStats() {
  const todos  = carregarRegistros().filter(r => r.transId === TRANS_ID);
  const mes    = new Date().toISOString().slice(0, 7);
  const mesCt  = todos.filter(r => (r.data || '').startsWith(mes)).length;
  const ultima = todos.length
    ? todos.slice().sort((a, b) => (b.data || '').localeCompare(a.data || ''))[0]
    : null;

  document.getElementById('stat-total').textContent  = todos.length;
  document.getElementById('stat-mes').textContent    = mesCt;
  document.getElementById('stat-ultima').textContent = ultima ? formatDate(ultima.data) : '—';
  document.getElementById('trans-sub').textContent   =
    todos.length === 0
      ? 'Nenhum registro ainda'
      : todos.length + (todos.length === 1 ? ' registro' : ' registros') + ' de manutenção';
}

// ── Tabela Info ──
let editIndex = null;

function renderInfoTable(dados) {
  const tbody = document.getElementById('info-table-body');
  const empty = document.getElementById('info-empty');
  tbody.innerHTML = '';

  if (!dados.length) { empty.style.display = ''; return; }
  empty.style.display = 'none';

  const todos = carregarRegistros();
  dados.forEach(r => {
    const i = todos.indexOf(r);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span style="font-family:'Space Mono',monospace;font-size:.78rem">${formatDate(r.data)}</span></td>
      <td>${tiposBadges(r.tipos)}</td>
      <td style="color:var(--text2)">${r.esteira || '—'}</td>
      <td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text2)">${r.descricao}</td>
      <td>${r.quem}</td>
      <td>
        <div style="display:flex;gap:.3rem">
          <button class="btn btn-ghost btn-sm" onclick="abrirAnotacoes(${i})">📝</button>
          <button class="btn btn-ghost btn-sm" onclick="abrirEdicao(${i})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="excluir(${i})">×</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

function filtrarInfo() {
  const de   = document.getElementById('info-de').value;
  const ate  = document.getElementById('info-ate').value;
  const tipo = document.getElementById('info-tipo').value;
  const f = carregarRegistros().filter(r => {
    if (r.transId !== TRANS_ID)              return false;
    if (de  && r.data < de)                  return false;
    if (ate && r.data > ate)                 return false;
    if (tipo && !(r.tipos||[]).includes(tipo)) return false;
    return true;
  });
  renderInfoTable(f);
}

// ── CRUD ──
function excluir(i) {
  if (!confirm('Excluir este registro?')) return;
  const registros = carregarRegistros();
  registros.splice(i, 1);
  salvarRegistros(registros);
  renderInfoTable(carregarRegistros().filter(r => r.transId === TRANS_ID));
  atualizarStats();
  showToast('Registro excluído.', 'ok');
}

function abrirEdicao(i) {
  editIndex = i;
  const r = carregarRegistros()[i];
  document.getElementById('edit-data').value      = r.data || '';
  document.getElementById('edit-descricao').value = r.descricao;
  document.getElementById('edit-quem').value      = r.quem;
  document.getElementById('modal-editar').classList.add('open');
}

function salvarEdicao() {
  const registros = carregarRegistros();
  registros[editIndex].data      = document.getElementById('edit-data').value;
  registros[editIndex].descricao = document.getElementById('edit-descricao').value;
  registros[editIndex].quem      = document.getElementById('edit-quem').value;
  salvarRegistros(registros);
  fecharModal();
  renderInfoTable(carregarRegistros().filter(r => r.transId === TRANS_ID));
  atualizarStats();
  showToast('Registro atualizado!', 'ok');
}

function abrirAnotacoes(i) {
  editIndex = i;
  document.getElementById('anotacoes-text').value = carregarRegistros()[i].anotacoes || '';
  document.getElementById('modal-anotacoes').classList.add('open');
}

function salvarAnotacao() {
  const registros = carregarRegistros();
  registros[editIndex].anotacoes = document.getElementById('anotacoes-text').value;
  salvarRegistros(registros);
  fecharModal();
  showToast('Anotação salva!', 'ok');
}

function fecharModal() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
}

// ── PDF ──
function gerarPDF() {
  showToast('Abrindo impressão…', 'ok');
  setTimeout(() => window.print(), 400);
}

// ── Helpers ──
function tiposBadges(tipos) {
  if (!tipos || !tipos.length) return '<span style="color:var(--text3);font-size:.78rem">—</span>';
  return tipos.map(t => `<span class="badge badge-${t.toLowerCase()}">${t}</span>`).join(' ');
}

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = type + ' show';
  setTimeout(() => t.className = '', 3000);
}

// ── Init ──
document.getElementById('manut-data').value = new Date().toISOString().split('T')[0];
atualizarStats();
buildDrawer();
