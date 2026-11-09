/* ============================================================
 *  PAINEL ADMIN - Sistema E-Multi SME (CORRIGIDO)
 * ============================================================ */

let currentUserAdmin = null;
let allUsers = [];
let currentFieldsConfig = [];

// Elementos da UI
const btnLogout = document.getElementById('btnLogout');
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const usersList = document.getElementById('usersList');
const modalUser = document.getElementById('modalUser');

// Inicialização e Proteção de Rota
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const doc = await db.collection(COLLECTION_USERS).doc(user.uid).get();
    if (!doc.exists || doc.data().role !== 'admin') {
      alert('Acesso negado. Apenas administradores.');
      await auth.signOut();
      window.location.href = 'index.html';
      return;
    }
    
    currentUserAdmin = { uid: user.uid, ...doc.data() };
    
    // Carrega dados iniciais
    loadUsers();
    loadFieldsConfig();

  } catch (err) {
    console.error('Erro ao verificar perfil admin:', err);
    window.location.href = 'index.html';
  }
});

// Logout
btnLogout.addEventListener('click', () => {
  auth.signOut().then(() => window.location.href = 'index.html');
});

/* ------------------------------------------------------------
 * NAVEGAÇÃO DE ABAS
 * ---------------------------------------------------------- */
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

/* ------------------------------------------------------------
 * ABA 1: GERENCIAR PROFISSIONAIS
 * ---------------------------------------------------------- */
/* ------------------------------------------------------------
 * ABA 1: GERENCIAR PROFISSIONAIS E ESTATÍSTICAS
 * ---------------------------------------------------------- */
async function loadUsers() {
  usersList.innerHTML = '<p class="loading-text">Carregando...</p>';
  
  try {
    // 1. Busca os usuários
    const snapUsers = await db.collection(COLLECTION_USERS).orderBy('nomeCompleto').get();
    allUsers = [];
    snapUsers.forEach(doc => allUsers.push({ id: doc.id, ...doc.data() }));

    // 2. Busca TODAS as demandas
    const snapDemands = await db.collection('demandas').get();
    
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    // 3. Inicializa o objeto de estatísticas para cada usuário
    allUsers.forEach(u => {
      u.stats = {
        abertas: 0,
        concluidasMes: 0,
        concluidasAno: 0,
        tempoTotalMs: 0,
        totalConcluidas: 0
      };
    });

    // 4. Processa cada demanda
    snapDemands.forEach(doc => {
      const data = doc.data();
      const uid = data.uidProfissional;
      
      const userStat = allUsers.find(u => u.id === uid);
      if (!userStat) return;

      if (data.status === 'aberta') {
        userStat.stats.abertas++;
      } 
      else if (data.status === 'concluida') {
        userStat.stats.totalConcluidas++;
        
        if (data.concluidoEm) {
          const dataConclusao = data.concluidoEm.toDate();
          
          if (dataConclusao.getFullYear() === anoAtual) {
            userStat.stats.concluidasAno++;
            if (dataConclusao.getMonth() === mesAtual) {
              userStat.stats.concluidasMes++;
            }
          }
          
          // Calcula tempo de duração
          if (data.criadoEm) {
            const dataAbertura = data.criadoEm.toDate();
            const diffMs = dataConclusao.getTime() - dataAbertura.getTime();
            userStat.stats.tempoTotalMs += diffMs;
          }
        }
      }
    });

    // 5. Calcula a média de tempo
    allUsers.forEach(u => {
      if (u.stats.totalConcluidas > 0) {
        const mediaMs = u.stats.tempoTotalMs / u.stats.totalConcluidas;
        const dias = Math.floor(mediaMs / (1000 * 60 * 60 * 24));
        const horas = Math.floor((mediaMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (dias > 0) {
          u.stats.tempoMedio = `${dias}d ${horas}h`;
        } else {
          u.stats.tempoMedio = `${horas}h`;
        }
      } else {
        u.stats.tempoMedio = '-';
      }
    });
    
    renderUsers();
  } catch (err) {
    console.error(err);
    usersList.innerHTML = '<p class="error-text">Erro ao carregar dados.</p>';
  }
}

function renderUsers() {
  if (allUsers.length === 0) {
    usersList.innerHTML = '<p class="empty-text">Nenhum profissional cadastrado.</p>';
    return;
  }

  usersList.innerHTML = '';
  allUsers.forEach(u => {
    const card = document.createElement('div');
    card.className = `user-card ${u.ativo === false ? 'inactive' : ''}`;
    
    const photoHtml = u.fotoUrl 
      ? `<img src="${u.fotoUrl}" alt="${u.nomeCompleto}" class="user-photo">`
      : `<div class="user-photo-placeholder">${u.nomeCompleto.charAt(0)}</div>`;

    card.innerHTML = `
      <div class="user-card-header">
        ${photoHtml}
        <div class="user-info">
          <h4>${u.nomeCompleto}</h4>
          <span class="user-badge">${u.cargo}</span>
        </div>
      </div>
      
      <!-- ESTATÍSTICAS DO USUÁRIO -->
      <div class="user-stats-grid">
        <div class="stat-box">
          <span class="stat-value text-laranja">${u.stats.abertas}</span>
          <span class="stat-label">Abertas</span>
        </div>
        <div class="stat-box">
          <span class="stat-value text-azul">${u.stats.concluidasMes}</span>
          <span class="stat-label">Mês</span>
        </div>
        <div class="stat-box">
          <span class="stat-value text-verde">${u.stats.concluidasAno}</span>
          <span class="stat-label">Ano</span>
        </div>
        <div class="stat-box">
          <span class="stat-value text-cinza" style="font-size: 1rem;">${u.stats.tempoMedio}</span>
          <span class="stat-label">Tempo Médio</span>
        </div>
      </div>

      <div class="user-card-actions">
        <button class="btn btn-sm btn-primary" onclick="openEditUser('${u.id}')">Editar</button>
        <button class="btn btn-sm ${u.ativo === false ? 'btn-success' : 'btn-warning'}" 
                onclick="toggleUserStatus('${u.id}', ${u.ativo !== false})">
          ${u.ativo === false ? 'Ativar' : 'Desativar'}
        </button>
      </div>
    `;
    usersList.appendChild(card);
  });
}

// Ativar/Desativar usuário
window.toggleUserStatus = async (uid, currentStatus) => {
  if (!confirm(`Deseja ${currentStatus ? 'desativar' : 'ativar'} este profissional?`)) return;
  try {
    await db.collection(COLLECTION_USERS).doc(uid).update({ ativo: !currentStatus });
    loadUsers();
  } catch (err) {
    alert('Erro ao alterar status: ' + err.message);
  }
};

/* ------------------------------------------------------------
 * MODAL NOVO USUÁRIO
 * ---------------------------------------------------------- */
document.getElementById('btnNewUser').addEventListener('click', () => {
  document.getElementById('formNewUser').reset();
  document.getElementById('modalError').classList.remove('visible');
  modalUser.classList.add('visible');
});

document.getElementById('btnCloseModal').addEventListener('click', () => modalUser.classList.remove('visible'));
document.getElementById('btnCancelUser').addEventListener('click', () => modalUser.classList.remove('visible'));

// Cadastro de Usuário (CORRIGIDO COM SECONDARY APP)
document.getElementById('formNewUser').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btnSave = document.getElementById('btnSaveUser');
  const errorDiv = document.getElementById('modalError');
  
  const name = document.getElementById('uName').value.trim();
  const role = document.getElementById('uRole').value;
  const email = document.getElementById('uEmail').value.trim();
  const password = document.getElementById('uPassword').value;
  const photoFile = document.getElementById('uPhoto').files[0];

  btnSave.disabled = true;
  btnSave.textContent = 'Salvando...';
  errorDiv.classList.remove('visible');

  let secondaryApp = null;
  let newUid = null;

  try {
    // 1. Inicializa uma segunda instância do Firebase
    // Isso evita que o admin logado na instância principal seja deslogado
    const secondaryAppName = 'secondary-' + Date.now();
    secondaryApp = firebase.initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = secondaryApp.auth();

    // 2. Cria o usuário na instância secundária
    const userCredential = await secondaryAuth.createUserWithEmailAndPassword(email, password);
    newUid = userCredential.user.uid;

    // 3. Upload Foto (se houver) - usa o storage da instância principal (admin logado)
    let fotoUrl = "";
    if (photoFile) {
      const storageRef = storage.ref(`fotos/${newUid}_3x4.jpg`);
      const snapshot = await storageRef.put(photoFile);
      fotoUrl = await snapshot.ref.getDownloadURL();
    }

    // 4. Salva no Firestore usando a instância principal (admin ainda logado)
    const campos = currentFieldsConfig.length > 0 ? currentFieldsConfig : CAMPOS_PADRAO;

    await db.collection(COLLECTION_USERS).doc(newUid).set({
      nomeCompleto: name,
      cargo: role,
      email: email,
      role: 'profissional',
      ativo: true,
      fotoUrl: fotoUrl,
      camposRelatorio: campos,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    modalUser.classList.remove('visible');
    alert('Profissional cadastrado com sucesso!');
    loadUsers();

  } catch (err) {
    console.error('Erro ao cadastrar:', err);
    const mensagens = {
      'auth/email-already-in-use': 'Este e-mail já está em uso.',
      'auth/invalid-email': 'E-mail inválido.',
      'auth/weak-password': 'A senha é muito fraca.',
      'storage/unauthorized': 'Sem permissão no Storage. Verifique as regras.'
    };
    errorDiv.textContent = mensagens[err.code] || err.message;
    errorDiv.classList.add('visible');
  } finally {
    // 5. Limpa a instância secundária (desloga o usuário criado nela)
    if (secondaryApp) {
      try {
        await secondaryApp.auth().signOut();
        await secondaryApp.delete();
      } catch (cleanupErr) {
        console.warn('Erro ao limpar instância secundária:', cleanupErr);
      }
    }
    
    btnSave.disabled = false;
    btnSave.textContent = 'Cadastrar';
  }
});

/* ------------------------------------------------------------
 * ABA 2: CONFIGURAÇÃO DE CAMPOS DO RELATÓRIO
 * ---------------------------------------------------------- */
async function loadFieldsConfig() {
  try {
    const doc = await db.collection(COLLECTION_USERS).doc(currentUserAdmin.uid).get();
    const data = doc.data();
    
    if (data.camposRelatorio && data.camposRelatorio.length > 0) {
      currentFieldsConfig = data.camposRelatorio;
    } else {
      currentFieldsConfig = JSON.parse(JSON.stringify(CAMPOS_PADRAO));
    }
    renderFieldsConfig();
  } catch (err) {
    console.error('Erro ao carregar campos:', err);
  }
}

function renderFieldsConfig() {
  const list = document.getElementById('fieldsList');
  list.innerHTML = '';

  currentFieldsConfig.forEach((field, index) => {
    const el = document.createElement('div');
    el.className = 'field-item';
    
    const isFixed = ['escola', 'tipoAtividade', 'descricao', 'encaminhamentos'].includes(field.key);
    const typeLabel = {
      escola: 'Dropdown Escola',
      atividade: 'Dropdown Atividade',
      textarea: 'Texto Longo',
      text: 'Texto Curto',
      number: 'Número',
      date: 'Data'
    }[field.tipo];

    el.innerHTML = `
      <div class="field-drag">≡</div>
      <div class="field-inputs">
        <input type="text" value="${field.label}" onchange="updateFieldLabel(${index}, this.value)" placeholder="Rótulo do campo">
        <small>Tipo: ${typeLabel} ${isFixed ? '(Fixo)' : ''}</small>
      </div>
      <div class="field-options">
        <label class="checkbox-label">
          <input type="checkbox" ${field.obrigatorio ? 'checked' : ''} 
                 onchange="updateFieldReq(${index}, this.checked)"> Obrigatório
        </label>
        ${!isFixed ? `<button class="btn-icon text-danger" onclick="removeField(${index})">🗑</button>` : ''}
      </div>
    `;
    list.appendChild(el);
  });
}

window.updateFieldLabel = (index, val) => {
  currentFieldsConfig[index].label = val;
};

window.updateFieldReq = (index, val) => {
  currentFieldsConfig[index].obrigatorio = val;
};

window.removeField = (index) => {
  currentFieldsConfig.splice(index, 1);
  renderFieldsConfig();
};

// Adicionar campo
document.getElementById('btnAddField').addEventListener('click', () => {
  const label = document.getElementById('newFieldLabel').value.trim();
  const type = document.getElementById('newFieldType').value;
  
  if (!label) return alert('Digite o nome do campo.');
  
  const key = 'extra_' + Date.now();
  
  currentFieldsConfig.push({
    key,
    label,
    tipo: type,
    obrigatorio: false
  });

  document.getElementById('newFieldLabel').value = '';
  renderFieldsConfig();
});

// Salvar Configuração
document.getElementById('btnSaveFields').addEventListener('click', async () => {
  try {
    await db.collection(COLLECTION_USERS).doc(currentUserAdmin.uid).update({
      camposRelatorio: currentFieldsConfig
    });
    alert('Configuração de campos salva com sucesso! Novos profissionais herdarão esta estrutura.');
  } catch (err) {
    alert('Erro ao salvar: ' + err.message);
  }
});

// --- LÓGICA DO RELATÓRIO GERAL (ADMIN) ---
document.getElementById('btnReportGeral').addEventListener('click', async () => {
  const ano = prompt("Digite o ano para gerar o relatório (ex: 2026):", new Date().getFullYear());
  if (!ano) return;

  const btn = document.getElementById('btnReportGeral');
  btn.textContent = 'Gerando...';
  btn.disabled = true;

  try {
    // 1. Busca todos os usuários e todas as demandas
    const usersSnap = await db.collection(COLLECTION_USERS).where('role', '==', 'profissional').get();
    const demandsSnap = await db.collection('demandas').get();

    const users = [];
    usersSnap.forEach(doc => users.push({ id: doc.id, ...doc.data() }));

    const demands = [];
    demandsSnap.forEach(doc => demands.push(doc.data()));

    // 2. Filtra e agrupa
    let htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #333;">
        <div style="text-align: center; border-bottom: 2px solid #39a6de; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #39a6de; margin: 0;">Secretaria Municipal de Educação</h1>
          <h2 style="margin: 5px 0;">Capistrano - CE</h2>
          <h3 style="margin: 5px 0;">Relatório Geral de Atividades - ${ano}</h3>
        </div>
    `;

    users.forEach(u => {
      // Filtra demandas do usuário naquele ano
      const userDemands = demands.filter(d => 
        d.uidProfissional === u.id && 
        d.criadoEm && 
        d.criadoEm.toDate().getFullYear() === parseInt(ano)
      );

      const abertas = userDemands.filter(d => d.status === 'aberta').length;
      const concluidas = userDemands.filter(d => d.status === 'concluida').length;

      if (userDemands.length > 0) {
        htmlContent += `
          <div style="margin-bottom: 25px; border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #333;">${u.nomeCompleto} <span style="font-size: 0.8rem; font-weight: normal; color: #666;">(${u.cargo})</span></h3>
            <p style="font-size: 0.9rem; margin-bottom: 10px;">
              <strong>Demandas no ano:</strong> ${userDemands.length} | 
              <strong style="color: #f78620;">Abertas:</strong> ${abertas} | 
              <strong style="color: #5abe64;">Concluídas:</strong> ${concluidas}
            </p>
            <ul style="font-size: 0.85rem; padding-left: 20px; margin: 0;">
        `;
        
        userDemands.filter(d => d.status === 'concluida').forEach(d => {
          htmlContent += `<li>${d.tema} - <em>${d.escola}</em></li>`;
        });

        htmlContent += `</ul></div>`;
      }
    });

    htmlContent += `<div style="margin-top: 50px; text-align: center; font-size: 0.8rem; color: #888;">Gerado em ${new Date().toLocaleDateString('pt-BR')} pelo Sistema E-Multi SME</div></div>`;

    // 3. Gera o PDF usando um elemento temporário
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.style.background = '#fff';
    document.body.appendChild(tempDiv);

    const canvas = await html2canvas(tempDiv, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Relatorio_Geral_${ano}.pdf`);

    document.body.removeChild(tempDiv);

  } catch (err) {
    console.error(err);
    alert('Erro ao gerar relatório geral: ' + err.message);
  } finally {
    btn.textContent = '📊 Relatório Geral (PDF)';
    btn.disabled = false;
  }
});

/* ------------------------------------------------------------
 * MODAL EDITAR USUÁRIO
 * ---------------------------------------------------------- */
window.openEditUser = (uid) => {
  const user = allUsers.find(u => u.id === uid);
  if (!user) return;

  document.getElementById('editUid').value = user.id;
  document.getElementById('editName').value = user.nomeCompleto;
  document.getElementById('editRole').value = user.cargo;
  document.getElementById('editPhoto').value = ''; // Limpa o input de arquivo
  document.getElementById('modalEditError').classList.remove('visible');

  // Preview da foto
  const preview = document.getElementById('editPhotoPreview');
  const status = document.getElementById('editPhotoStatus');
  
  if (user.fotoUrl) {
    preview.src = user.fotoUrl;
    preview.style.display = 'block';
    status.textContent = 'Foto atual carregada.';
  } else {
    preview.style.display = 'none';
    status.textContent = 'Nenhuma foto cadastrada.';
  }

  document.getElementById('modalEditUser').classList.add('visible');
};

document.getElementById('formEditUser').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnSaveEditUser');
  const errorDiv = document.getElementById('modalEditError');
  
  const uid = document.getElementById('editUid').value;
  const name = document.getElementById('editName').value.trim();
  const role = document.getElementById('editRole').value;
  const photoFile = document.getElementById('editPhoto').files[0];

  btn.disabled = true;
  btn.textContent = 'Salvando...';
  errorDiv.classList.remove('visible');

  try {
    let updateData = { nomeCompleto: name, cargo: role };

    // Se o admin selecionou uma nova foto, faz o upload
    if (photoFile) {
      const storageRef = storage.ref(`fotos/${uid}_3x4.jpg`);
      const snapshot = await storageRef.put(photoFile);
      const fotoUrl = await snapshot.ref.getDownloadURL();
      updateData.fotoUrl = fotoUrl;
    }

    // Atualiza no Firestore
    await db.collection(COLLECTION_USERS).doc(uid).update(updateData);
    
    document.getElementById('modalEditUser').classList.remove('visible');
    alert('Profissional atualizado com sucesso!');
    loadUsers(); // Recarrega a lista

  } catch (err) {
    console.error('Erro ao editar:', err);
    errorDiv.textContent = 'Erro ao salvar alterações: ' + err.message;
    errorDiv.classList.add('visible');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar Alterações';
  }
});