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

// ── Transportadores ──
const TRANSPORTADORES = [
  { id: 'guardanapo',      nome: 'Guardanapo',            arquivo: 'trans-guardanapo.html' },
  { id: 'professional',    nome: 'Professional',           arquivo: 'trans-professional.html' },
  { id: 'guardanapo-prof', nome: 'Guardanapo/Professional',arquivo: 'trans-guardanapo-prof.html' },
  { id: '800-abs',         nome: '800/ABS',               arquivo: 'trans-800-abs.html' },
  { id: 'caixaria',        nome: 'Caixaria',              arquivo: 'trans-caixaria.html' },
  { id: '600',             nome: '600',                   arquivo: 'trans-600.html' },
  { id: '900',             nome: '900',                   arquivo: 'trans-900.html' },
  { id: '600-900',         nome: '600/900',               arquivo: 'trans-600-900.html' },
  { id: '200',             nome: '200',                   arquivo: 'trans-200.html' },
  { id: '400',             nome: '400',                   arquivo: 'trans-400.html' },
  { id: '500',             nome: '500',                   arquivo: 'trans-500.html' },
  { id: '700',             nome: '700',                   arquivo: 'trans-700.html' },
  { id: '800r',            nome: '800 R',                 arquivo: 'trans-800r.html' },
  { id: '850',             nome: '850',                   arquivo: 'trans-850.html' },
  { id: '950',             nome: '950',                   arquivo: 'trans-950.html' },
];

// ── Registros ──
const registros = JSON.parse(localStorage.getItem('balofinho_registros') || '[]');

// ── Stats gerais ──
const mes = new Date().toISOString().slice(0, 7);
document.getElementById('stat-total').textContent = registros.length;
document.getElementById('stat-mes').textContent   = registros.filter(r => (r.data || '').startsWith(mes)).length;

if (registros.length) {
  const ultima = registros.slice().sort((a, b) => (b.data || '').localeCompare(a.data || ''))[0];
  const [y, m2, d] = (ultima.data || '').split('-');
  document.getElementById('stat-ultima').textContent =
    d ? `${d}/${m2}/${y} — ${ultima.transNome || ultima.transId}` : '—';
}

// ── Monta grid ──
const grid = document.getElementById('trans-grid');

TRANSPORTADORES.forEach(t => {
  const count = registros.filter(r => r.transId === t.id).length;

  const card = document.createElement('a');
  card.className = 'trans-card' + (count > 0 ? ' has-records' : '');
  card.href = t.arquivo;
  card.innerHTML = `
    <span class="trans-card-dot"></span>
    <div class="trans-card-name">Transportador ${t.nome}</div>
    <div class="trans-card-count">${count > 0 ? count + (count === 1 ? ' registro' : ' registros') : 'Sem registros'}</div>
    <div class="trans-card-arrow">Abrir →</div>
  `;
  grid.appendChild(card);
});
