// ════════════════════════════════════════════════════════
//  trans.js — Lógica compartilhada de TODAS as páginas
//             de transportador (trans-200.html, trans-700.html, etc.)
//  Cada página define window.TRANS_ID e window.TRANS_NOME
//  antes de carregar este arquivo
// ════════════════════════════════════════════════════════

import {
  auth, db, signOut, onAuthStateChanged,
  collection, addDoc, getDocs,
  doc, updateDoc, deleteDoc,
  query, where
} from './firebase.js';

// ── VERIFICAÇÃO DE AUTENTICAÇÃO ──
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

// ── LISTA DE TRANSPORTADORES (para o drawer) ──
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

let registrosCache = [];
let editDocId = null;

// ── INIT ──
async function init() {
  document.getElementById('manut-data').value = new Date().toISOString().split('T')[0];
  await carregarRegistros();
  buildDrawer();
}

// ════════════════════════════════════════
//  DRAWER
// ════════════════════════════════════════

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
  document.getElementById('drawer').classList.contains('open')
    ? window.closeDrawer()
    : window.openDrawer();
};

document.getElementById('drawer-overlay').addEventListener('click', window.closeDrawer);
document.addEventListener('keydown', e => { if (e.key === 'Escape') window.closeDrawer(); });

async function buildDrawer() {
  const body = document.getElementById('drawer-body');
  if (!body) return;

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

// ════════════════════════════════════════
//  SUB-ABAS
// ════════════════════════════════════════

window.showSubPage = function(id) {
  document.querySelectorAll('.sub-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sub-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sub-' + id).classList.add('active');
  document.querySelector(`[data-tab="${id}"]`).classList.add('active');
  if (id === 'info') renderInfoTable(registrosCache);
};

// ════════════════════════════════════════
//  RADIO BUTTONS ESTILIZADOS (um por vez)
// ════════════════════════════════════════

// Seleciona um radio button estilizado e desmarca os outros do grupo
window.toggleCk = function(label) {
  const rb = label.querySelector('input[type=radio]');
  if (!rb) return;

  // Pega o container pai (.checks) para desmarcar os outros do grupo
  const container = label.closest('.checks');
  if (container) {
    // Remove a classe 'checked' de todos os labels do grupo
    container.querySelectorAll('.ck').forEach(l => l.classList.remove('checked'));
  }

  // Marca este e aplica o estilo visual
  rb.checked = true;
  label.classList.add('checked');
};

// Lê o tipo selecionado de um container (radio = apenas um)
// Retorna array com um elemento para manter compatibilidade com o banco
function lerTipos(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return [];
  // Busca qualquer radio marcado dentro do container (independente do name)
  const rb = container.querySelector('input[type=radio]:checked');
  if (!rb) return [];
  return [rb.id.replace(/^(edit-)?tipo-/, '').toUpperCase()];
}

// Define o tipo selecionado ao abrir o modal de edição
function definirTipos(containerSelector, tipos) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  // Desmarca todos primeiro
  container.querySelectorAll('.ck').forEach(l => l.classList.remove('checked'));
  container.querySelectorAll('input[type=radio]').forEach(rb => rb.checked = false);

  // Marca apenas o tipo correspondente ao primeiro item salvo
  const tipo = tipos && tipos[0]; // Radio = só um valor
  if (!tipo) return;

  container.querySelectorAll('input[type=radio]').forEach(rb => {
    if (rb.id.replace(/^(edit-)?tipo-/, '').toUpperCase() === tipo) {
      rb.checked = true;
      rb.closest('.ck').classList.add('checked');
    }
  });
}

// ════════════════════════════════════════
//  FORMULÁRIO DE MANUTENÇÃO
// ════════════════════════════════════════

window.limparForm = function() {
  // Desmarca todos os radio buttons do formulário de manutenção
  document.querySelectorAll('#sub-manutencao .ck').forEach(l => {
    l.classList.remove('checked');
    const input = l.querySelector('input');
    if (input) input.checked = false;
  });
  document.getElementById('esteira-select').value = '';
  document.getElementById('manut-data').value = new Date().toISOString().split('T')[0];
  document.getElementById('manut-descricao').value = '';
  document.getElementById('manut-quem').value = '';
};

window.salvarManutencao = async function() {
  // Lê os tipos marcados do formulário de manutenção
  const tipos    = lerTipos('#sub-manutencao .checks');
  const esteira  = document.getElementById('esteira-select').value;
  const data     = document.getElementById('manut-data').value;
  const descricao = document.getElementById('manut-descricao').value.trim();
  const quem     = document.getElementById('manut-quem').value;

  if (!data || !descricao || !quem) {
    showToast('Preencha data, descrição e técnico.', 'err');
    return;
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

// ════════════════════════════════════════
//  CARREGAR DO FIRESTORE
// ════════════════════════════════════════

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

// ════════════════════════════════════════
//  ESTATÍSTICAS
// ════════════════════════════════════════

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

// ════════════════════════════════════════
//  TABELA DE HISTÓRICO
// ════════════════════════════════════════

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

// ════════════════════════════════════════
//  CRUD
// ════════════════════════════════════════

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

  // Preenche os campos de texto do modal
  document.getElementById('edit-data').value      = r.data || '';
  document.getElementById('edit-descricao').value = r.descricao;
  document.getElementById('edit-quem').value      = r.quem;

  // Se o modal tiver checkboxes de tipo, pré-marca os tipos salvos
  // Funciona tanto se o modal tiver quanto se não tiver os checkboxes
  definirTipos('#modal-editar .checks', r.tipos || []);

  document.getElementById('modal-editar').classList.add('open');
};

window.salvarEdicao = async function() {
  try {
    // Tenta ler os tipos do modal (se existirem checkboxes lá)
    const tiposModal = lerTipos('#modal-editar .checks');

    // Monta o objeto de atualização
    const atualizacao = {
      data:      document.getElementById('edit-data').value,
      descricao: document.getElementById('edit-descricao').value,
      quem:      document.getElementById('edit-quem').value,
    };

    // Só atualiza os tipos se o modal tiver checkboxes configurados
    if (tiposModal.length > 0 || document.querySelector('#modal-editar .checks')) {
      atualizacao.tipos = tiposModal;
    }

    await updateDoc(doc(db, 'manutencoes', editDocId), atualizacao);

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
  // Garante que a aba de histórico esteja visível na impressão
  // mesmo que o usuário esteja na aba de manutenção
  const subInfo = document.getElementById('sub-info');
  const eraAtiva = subInfo.classList.contains('active');
  subInfo.classList.add('active');

  // Injeta a data atual no body para o rodapé de impressão
  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  document.body.setAttribute('data-print-date', dataFormatada);

  showToast('Abrindo impressão…', 'ok');

  setTimeout(() => {
    window.print();
    // Restaura o estado original após imprimir
    if (!eraAtiva) subInfo.classList.remove('active');
  }, 400);
};

// ════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════

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