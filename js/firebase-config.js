/**
 * ============================================================
 *  CONFIGURAÇÃO DO FIREBASE
 * ============================================================
 *  Este arquivo usa a sintaxe COMPAT (global `firebase`).
 *  NÃO usar `import`/`export` aqui.
 * ============================================================
 */

// Suas credenciais reais
const firebaseConfig = {
  apiKey:            "AIzaSyAihbFhmwFx38rUEQTg1VdM9YtR8wNngng",
  authDomain:        "sistemae-multisme.firebaseapp.com",
  projectId:         "sistemae-multisme",
  storageBucket:     "sistemae-multisme.firebasestorage.app",
  messagingSenderId: "895430772377",
  appId:             "1:895430772377:web:b96ab2bdb0e449e8ab9a08"
};

// Inicializa o Firebase (sintaxe compat)
firebase.initializeApp(firebaseConfig);

// Serviços disponíveis globalmente
const auth    = firebase.auth();
const db      = firebase.firestore();
const storage = firebase.storage();

// Coleções
const COLLECTION_USERS   = "users";
const COLLECTION_REPORTS = "reports";

// Lista de escolas de Capistrano-CE (⚠️ valide/edite conforme lista oficial da SME)
const SEED_ESCOLAS = [
  "EEF Israel Ferreira Lima",
  "EEF Jorge Furtado Leite nº 03",
  "EEF Jorge Furtado Leite nº 04",
  "EEF José Cavalcante Romano",
  "EEF Padre José de Anchieta",
  "EEF José Saraiva Sobrinho",
  "EEF Nossa Senhora de Lourdes",
  "EEF Marieta Cals",
  "EEF Raimundo Alves Cassemiro",
  "EEF Fernando Cavalcante Mota",
  "EEF Coronel Francisco Nunes Cavalcante",
  "EEF Maria de Lourdes e Barbosa",
  "CEI Maria Antonieta Santos",
  "CEI Profª Cláudia Matos Maciel",
  "Centro Educacional Infantil Diretora Terezinha Lima Freitas"
];

// Tipos de atividade (dropdown fixo)
const TIPOS_ATIVIDADE = [
  "Reunião",
  "Acolhimento psicológico",
  "Intervenção",
  "Observação de sala de aula",
  "Observação de rotina de coordenação pedagógica",
  "Pesagem",
  "Palestra",
  "Outro"
];

// Campos padrão de relatório (que o admin pode manter, alterar ou remover)
const CAMPOS_PADRAO = [
  { key: "escola",           label: "Escola",                tipo: "escola",     obrigatorio: true },
  { key: "tipoAtividade",    label: "Tipo de atividade",     tipo: "atividade",  obrigatorio: true },
  { key: "descricao",        label: "Descrição detalhada",   tipo: "textarea",   obrigatorio: true },
  { key: "encaminhamentos",  label: "Encaminhamentos",       tipo: "textarea",   obrigatorio: false }
];