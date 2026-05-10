import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from './firebase.js';

// Se já estiver logado, vai direto para o app
onAuthStateChanged(auth, user => {
  if (user) window.location.href = 'app.html';
});

// ── Abas ──
window.switchTab = function(tab) {
  document.querySelectorAll('.auth-tab').forEach((b, i) =>
    b.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'register' && i === 1))
  );
  document.getElementById('panel-login').classList.toggle('active', tab === 'login');
  document.getElementById('panel-register').classList.toggle('active', tab === 'register');
};

// ── Login ──
window.doLogin = async function() {
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-password').value;

  if (!email || !senha) { showToast('Preencha e-mail e senha.', 'err'); return; }

  try {
    showToast('Entrando…', 'ok');
    await signInWithEmailAndPassword(auth, email, senha);
    // onAuthStateChanged redireciona automaticamente
  } catch (e) {
    const msgs = {
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/user-not-found':     'Usuário não encontrado.',
      'auth/wrong-password':     'Senha incorreta.',
      'auth/too-many-requests':  'Muitas tentativas. Tente mais tarde.',
    };
    showToast(msgs[e.code] || 'Erro ao entrar. Tente novamente.', 'err');
  }
};

// ── Registro ──
window.doRegister = async function() {
  const nome  = document.getElementById('reg-nome').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const senha = document.getElementById('reg-senha').value;

  if (!nome || !email || !senha) { showToast('Preencha todos os campos.', 'err'); return; }
  if (senha.length < 8) { showToast('Senha deve ter mínimo 8 caracteres.', 'err'); return; }

  try {
    showToast('Criando conta…', 'ok');
    await createUserWithEmailAndPassword(auth, email, senha);
    // Salva o nome na sessão para exibir no app
    sessionStorage.setItem('balofinho_nome', nome);
    // onAuthStateChanged redireciona automaticamente
  } catch (e) {
    const msgs = {
      'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
      'auth/invalid-email':        'E-mail inválido.',
      'auth/weak-password':        'Senha muito fraca.',
    };
    showToast(msgs[e.code] || 'Erro ao criar conta.', 'err');
  }
};

// ── Toast ──
function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = type + ' show';
  setTimeout(() => t.className = '', 3000);
}

// Enter nos campos
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-email')?.addEventListener('keydown', e => { if (e.key === 'Enter') window.doLogin(); });
  document.getElementById('login-password')?.addEventListener('keydown', e => { if (e.key === 'Enter') window.doLogin(); });
});
