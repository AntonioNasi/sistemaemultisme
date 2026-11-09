/* ============================================================
 *  AUTENTICAÇÃO - Sistema E-Multi SME
 * ============================================================ */

const loginForm     = document.getElementById('loginForm');
const loginError    = document.getElementById('loginError');
const loginBtn      = document.getElementById('loginBtn');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const emailInput    = document.getElementById('email');
const forgotBtn     = document.getElementById('forgotPassword');

/* ------------------------------------------------------------
 * Mostrar / ocultar senha
 * ---------------------------------------------------------- */
togglePassword.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  togglePassword.textContent = isPassword ? '🙈' : '👁';
});

/* ------------------------------------------------------------
 * Mostrar mensagem de erro
 * ---------------------------------------------------------- */
function showError(msg) {
  loginError.textContent = msg;
  loginError.classList.add('visible');
}

function clearError() {
  loginError.textContent = '';
  loginError.classList.remove('visible');
}

/* ------------------------------------------------------------
 * Redirecionamento por perfil
 * ---------------------------------------------------------- */
async function redirectByRole(user) {
  try {
    const doc = await db.collection(COLLECTION_USERS).doc(user.uid).get();

    if (!doc.exists) {
      showError('Usuário não encontrado na base. Contate o administrador.');
      await auth.signOut();
      return;
    }

    const data = doc.data();

    if (data.ativo === false) {
      showError('Sua conta está desativada. Contate o administrador.');
      await auth.signOut();
      return;
    }

    if (data.role === 'admin') {
      window.location.href = 'admin.html';
    } else if (data.role === 'profissional') {
      window.location.href = 'professional.html';
    } else if (data.role === 'escola') { // <-- NOVA CONDIÇÃO
      window.location.href = 'school.html';
    } else {
      showError('Perfil de usuário inválido.');
      await auth.signOut();
    }
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    showError('Erro ao carregar seu perfil. Tente novamente.');
    await auth.signOut();
  }
}

/* ------------------------------------------------------------
 * Login
 * ---------------------------------------------------------- */
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const email    = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError('Preencha e-mail e senha.');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Entrando...';

  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    await redirectByRole(cred.user);
  } catch (err) {
    console.error('Erro login:', err.code, err.message);
    const mensagens = {
      'auth/user-not-found':       'Usuário não encontrado.',
      'auth/wrong-password':       'Senha incorreta.',
      'auth/invalid-credential':   'E-mail ou senha inválidos.',
      'auth/invalid-email':        'E-mail inválido.',
      'auth/too-many-requests':    'Muitas tentativas. Aguarde e tente novamente.',
      'auth/network-request-failed': 'Falha de conexão. Verifique sua internet.'
    };
    showError(mensagens[err.code] || 'Não foi possível entrar. Tente novamente.');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Entrar';
  }
});

/* ------------------------------------------------------------
 * Recuperar senha
 * ---------------------------------------------------------- */
forgotBtn.addEventListener('click', async () => {
  clearError();
  const email = emailInput.value.trim();

  if (!email) {
    showError('Digite seu e-mail para recuperar a senha.');
    emailInput.focus();
    return;
  }

  try {
    await auth.sendPasswordResetEmail(email);
    alert(`Enviamos um link de redefinição de senha para ${email}. Verifique sua caixa de entrada.`);
  } catch (err) {
    console.error('Erro recuperação:', err.code);
    showError('Não foi possível enviar o e-mail de recuperação.');
  }
});

/* ------------------------------------------------------------
 * Se já estiver logado, redireciona direto
 * ---------------------------------------------------------- */
auth.onAuthStateChanged((user) => {
  if (user) {
    redirectByRole(user);
  }
});