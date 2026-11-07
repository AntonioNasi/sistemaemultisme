/* ============================================================
 *  NOVO RELATÓRIO - Sistema E-Multi SME
 * ============================================================ */

let currentUser = null;
let userProfile = null;
let reportFields = [];

const form = document.getElementById('formReport');
const dynamicFields = document.getElementById('dynamicFields');
const btnSubmit = document.getElementById('btnSubmitReport');

// 1. Carrega o perfil e monta o formulário
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const doc = await db.collection(COLLECTION_USERS).doc(user.uid).get();
    if (!doc.exists) throw new Error('Perfil não encontrado.');

    currentUser = user;
    userProfile = doc.data();

    // TRAVA DE SEGURANÇA:
    // Se o Firestore não tiver a lista, se não for um array, ou se estiver vazio,
    // usa a lista padrão do arquivo firebase-config.js
    if (
      !userProfile.camposRelatorio || 
      !Array.isArray(userProfile.camposRelatorio) || 
      userProfile.camposRelatorio.length === 0 ||
      userProfile.camposRelatorio[0].label === undefined
    ) {
      reportFields = CAMPOS_PADRAO;
    } else {
      reportFields = userProfile.camposRelatorio;
    }

    renderForm();
  } catch (err) {
    console.error(err);
    alert('Erro ao carregar dados do perfil.');
  }
});

// 2. Renderiza os campos dinamicamente
function renderForm() {
  dynamicFields.innerHTML = '';

  reportFields.forEach(field => {
    const group = document.createElement('div');
    group.className = 'form-group';

    const label = document.createElement('label');
    label.textContent = field.label + (field.obrigatorio ? ' *' : '');
    group.appendChild(label);

    let input;

    if (field.tipo === 'escola') {
      input = document.createElement('select');
      input.innerHTML = `<option value="">Selecione a escola...</option>`;
      SEED_ESCOLAS.forEach(escola => {
        input.innerHTML += `<option value="${escola}">${escola}</option>`;
      });
    } 
    else if (field.tipo === 'atividade') {
      input = document.createElement('select');
      input.innerHTML = `<option value="">Selecione o tipo...</option>`;
      TIPOS_ATIVIDADE.forEach(tipo => {
        input.innerHTML += `<option value="${tipo}">${tipo}</option>`;
      });
    }
    else if (field.tipo === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 4;
    }
    else if (field.tipo === 'number') {
      input = document.createElement('input');
      input.type = 'number';
      input.step = 'any';
    }
    else if (field.tipo === 'date') {
      input = document.createElement('input');
      input.type = 'date';
    }
    else {
      input = document.createElement('input');
      input.type = 'text';
    }

    input.name = field.key;
    input.id = `field_${field.key}`;
    if (field.obrigatorio) input.required = true;

    group.appendChild(input);
    dynamicFields.appendChild(group);
  });
}

// 3. Salvar Relatório no Firestore
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Salvando...';

  const formData = new FormData(form);
  const reportData = {
    uidProfissional: currentUser.uid,
    nomeProfissional: userProfile.nomeCompleto,
    cargoProfissional: userProfile.cargo,
    fotoProfissional: userProfile.fotoUrl || '',
    camposExtras: {},
    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
  };

  // Separa os campos fixos dos dinâmicos
  const fixedKeys = ['escola', 'tipoAtividade', 'descricao', 'encaminhamentos'];

  for (let [key, value] of formData.entries()) {
    // Ignora campos sem nome (o bug do undefined)
    if (!key || key === 'undefined') continue;

    if (fixedKeys.includes(key)) {
      reportData[key] = value;
    } else {
      reportData.camposExtras[key] = value;
    }
  }

  try {
    await db.collection(COLLECTION_REPORTS).add(reportData);
    alert('Relatório salvo com sucesso!');
    window.location.href = 'report-history.html';
  } catch (err) {
    console.error('Erro ao salvar:', err);
    alert('Erro ao salvar o relatório: ' + err.message);
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Salvar Relatório';
  }
});