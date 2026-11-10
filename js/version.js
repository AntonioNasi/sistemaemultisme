/* ============================================================
 *  RODAPÉ PADRÃO - Sistema E-Multi SME
 * ============================================================ */
(function() {
  // CONFIGURAÇÕES DO SISTEMA (Altere aqui quando necessário)
  const APP_VERSION = "1.0.0";
  const APP_YEAR = new Date().getFullYear();
  const APP_NAME = "Sistema E-Multi SME";
  const APP_ORG = "Toim Nasi DevOps";

  // Cria o elemento do rodapé
  const footer = document.createElement('footer');
  footer.className = 'app-footer no-print'; // no-print para não sair no PDF
  footer.innerHTML = `
    <p>© ${APP_YEAR} ${APP_ORG} · ${APP_NAME} · v${APP_VERSION}</p>
  `;

  // Injeta o rodapé no final do body quando a página carregar
  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(footer);
  });
})();