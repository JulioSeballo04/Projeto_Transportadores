import { auth, db, signOut, onAuthStateChanged, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from './firebase.js';

// ── Verifica autenticação ──
onAuthStateChanged(auth, user => {
  if (!user) { window.location.href = 'login.html'; return; }
  const nome = sessionStorage.getItem('balofinho_nome') || user.email.split('@')[0];
  document.getElementById('user-name-display').textContent = nome.charAt(0).toUpperCase() + nome.slice(1);
  document.getElementById('user-avatar').textContent = nome[0].toUpperCase();
  init();
});

window.logout = async function() {
  await signOut(auth);
  window.location.href = 'login.html';
};

// ── Lista de transportadores (para o drawer) ──
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

// Cache local dos registros deste transportador
let registrosCache = [];
let editDocId = null;

// ── Init ──
async function init() {
  document.getElementById('manut-data').value = new Date().toISOString().split('T')[0];
  await carregarRegistros();
  buildDrawer();
}

// ── Drawer ──
window.openDrawer = function() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('hamburger-btn').classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeDrawer = function() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('hamburger-btn').classList.remove('open');
  document.body.style.overflow = '';
};

window.toggleDrawer = function() {
  document.getElementById('drawer').classList.contains('open') ? window.closeDrawer() : window.openDrawer();
};

document.getElementById('drawer-overlay').addEventListener('click', window.closeDrawer);
document.addEventListener('keydown', e => { if (e.key === 'Escape') window.closeDrawer(); });

async function buildDrawer() {
  const body = document.getElementById('drawer-body');
  if (!body) return;

  // Busca contagens de todos os transportadores
  const snap = await getDocs(collection(db, 'manutencoes'));
  const todos = snap.docs.map(d => d.data());

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
    const count = todos.filter(r => r.transId === t.id).length;
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

// ── Sub-abas ──
window.showSubPage = function(id) {
  document.querySelectorAll('.sub-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sub-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sub-' + id).classList.add('active');
  document.querySelector(`[data-tab="${id}"]`).classList.add('active');
  if (id === 'info') renderInfoTable(registrosCache);
};

// ── Checkboxes ──
window.toggleCk = function(label) {
  const cb = label.querySelector('input[type=checkbox]');
  cb.checked = !cb.checked;
  label.classList.toggle('checked', cb.checked);
};

// ── Limpar form ──
window.limparForm = function() {
  document.querySelectorAll('#sub-manutencao .ck').forEach(l => {
    l.classList.remove('checked');
    l.querySelector('input').checked = false;
  });
  document.getElementById('esteira-select').value = '';
  document.getElementById('manut-data').value = new Date().toISOString().split('T')[0];
  document.getElementById('manut-descricao').value = '';
  document.getElementById('manut-quem').value = '';
};

// ── Salvar manutenção ──
window.salvarManutencao = async function() {
  const tipos     = ['t1','t2','t3'].filter(t => document.getElementById('tipo-' + t).checked).map(t => t.toUpperCase());
  const esteira   = document.getElementById('esteira-select').value;
  const data      = document.getElementById('manut-data').value;
  const descricao = document.getElementById('manut-descricao').value.trim();
  const quem      = document.getElementById('manut-quem').value;

  if (!data || !descricao || !quem) {
    showToast('Preencha data, descrição e técnico.', 'err'); return;
  }

  try {
    showToast('Salvando…', 'ok');
    await addDoc(collection(db, 'manutencoes'), {
      transId: TRANS_ID,
      transNome: TRANS_NOME,
      tipos, esteira, data, descricao, quem,
      anotacoes: '',
      criadoEm: new Date().toISOString()
    });
    window.limparForm();
    await carregarRegistros();
    showToast('Manutenção registrada!', 'ok');
  } catch (e) {
    console.error(e);
    showToast('Erro ao salvar. Tente novamente.', 'err');
  }
};

// ── Carregar registros do Firestore ──
async function carregarRegistros() {
  try {
    const q = query(collection(db, 'manutencoes'), where('transId', '==', TRANS_ID));
    const snap = await getDocs(q);
    registrosCache = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
    registrosCache.sort((a, b) => (b.data || '').localeCompare(a.data || ''));
    atualizarStats();
  } catch (e) {
    console.error('Erro ao carregar:', e);
  }
}

// ── Stats ──
function atualizarStats() {
  const mes   = new Date().toISOString().slice(0, 7);
  const mesCt = registrosCache.filter(r => (r.data || '').startsWith(mes)).length;
  const ultima = registrosCache.length ? registrosCache[0] : null;

  document.getElementById('stat-total').textContent  = registrosCache.length;
  document.getElementById('stat-mes').textContent    = mesCt;
  document.getElementById('stat-ultima').textContent = ultima ? formatDate(ultima.data) : '—';
  document.getElementById('trans-sub').textContent   =
    registrosCache.length === 0
      ? 'Nenhum registro ainda'
      : registrosCache.length + (registrosCache.length === 1 ? ' registro' : ' registros') + ' de manutenção';
}

// ── Tabela Info ──
function renderInfoTable(dados) {
  const tbody = document.getElementById('info-table-body');
  const empty = document.getElementById('info-empty');
  tbody.innerHTML = '';

  if (!dados.length) { empty.style.display = ''; return; }
  empty.style.display = 'none';

  dados.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span style="font-family:'Space Mono',monospace;font-size:.78rem">${formatDate(r.data)}</span></td>
      <td>${tiposBadges(r.tipos)}</td>
      <td style="color:var(--text2)">${r.esteira || '—'}</td>
      <td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text2)">${r.descricao}</td>
      <td>${r.quem}</td>
      <td>
        <div style="display:flex;gap:.3rem">
          <button class="btn btn-ghost btn-sm" onclick="abrirAnotacoes('${r._id}')">📝</button>
          <button class="btn btn-ghost btn-sm" onclick="abrirEdicao('${r._id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="excluir('${r._id}')">×</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

window.filtrarInfo = function() {
  const de   = document.getElementById('info-de').value;
  const ate  = document.getElementById('info-ate').value;
  const tipo = document.getElementById('info-tipo').value;
  const f = registrosCache.filter(r => {
    if (de  && r.data < de)                    return false;
    if (ate && r.data > ate)                   return false;
    if (tipo && !(r.tipos||[]).includes(tipo)) return false;
    return true;
  });
  renderInfoTable(f);
};

// ── CRUD ──
window.excluir = async function(id) {
  if (!confirm('Excluir este registro?')) return;
  try {
    await deleteDoc(doc(db, 'manutencoes', id));
    await carregarRegistros();
    renderInfoTable(registrosCache);
    showToast('Registro excluído.', 'ok');
  } catch (e) {
    showToast('Erro ao excluir.', 'err');
  }
};

window.abrirEdicao = function(id) {
  editDocId = id;
  const r = registrosCache.find(x => x._id === id);
  document.getElementById('edit-data').value      = r.data || '';
  document.getElementById('edit-descricao').value = r.descricao;
  document.getElementById('edit-quem').value      = r.quem;
  document.getElementById('modal-editar').classList.add('open');
};

window.salvarEdicao = async function() {
  try {
    await updateDoc(doc(db, 'manutencoes', editDocId), {
      data:      document.getElementById('edit-data').value,
      descricao: document.getElementById('edit-descricao').value,
      quem:      document.getElementById('edit-quem').value,
    });
    window.fecharModal();
    await carregarRegistros();
    renderInfoTable(registrosCache);
    showToast('Registro atualizado!', 'ok');
  } catch (e) {
    showToast('Erro ao atualizar.', 'err');
  }
};

window.abrirAnotacoes = function(id) {
  editDocId = id;
  const r = registrosCache.find(x => x._id === id);
  document.getElementById('anotacoes-text').value = r.anotacoes || '';
  document.getElementById('modal-anotacoes').classList.add('open');
};

window.salvarAnotacao = async function() {
  try {
    await updateDoc(doc(db, 'manutencoes', editDocId), {
      anotacoes: document.getElementById('anotacoes-text').value
    });
    window.fecharModal();
    await carregarRegistros();
    showToast('Anotação salva!', 'ok');
  } catch (e) {
    showToast('Erro ao salvar anotação.', 'err');
  }
};

window.fecharModal = function() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
};

window.gerarPDF = function() {
  showToast('Abrindo impressão…', 'ok');
  setTimeout(() => window.print(), 400);
};

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
