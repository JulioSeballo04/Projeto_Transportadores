function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((b, i) =>
    b.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'register' && i === 1))
  );
  document.getElementById('panel-login').classList.toggle('active', tab === 'login');
  document.getElementById('panel-register').classList.toggle('active', tab === 'register');
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  if (!email) {
    showToast('Informe seu e-mail.', 'err');
    return;
  }
  sessionStorage.setItem('balofinho_user', JSON.stringify({
    nome: email.split('@')[0],
    email
  }));
  window.location.href = 'app.html';
}

function doRegister() {
  const nome  = document.getElementById('reg-nome').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const senha = document.getElementById('reg-senha').value;

  if (!nome || !email || !senha) {
    showToast('Preencha todos os campos.', 'err');
    return;
  }
  if (senha.length < 8) {
    showToast('Senha deve ter mínimo 8 caracteres.', 'err');
    return;
  }

  sessionStorage.setItem('balofinho_user', JSON.stringify({ nome, email }));
  showToast('Conta criada!', 'ok');
  setTimeout(() => window.location.href = 'app.html', 900);
}

function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = type + ' show';
  setTimeout(() => t.className = '', 3000);
}

// Enter nos campos
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-email').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
});