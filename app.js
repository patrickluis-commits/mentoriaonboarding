/* ============================================
   MENTORIA CLÍNICA COM IA 1:1 - SISTEMA ONBOARDING
   JavaScript Completo
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================
  // UTILIDADES
  // ==========================================================
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function showToast(msg, icon = '✅') {
    const toast = $('#toast');
    const msgEl = $('#toastMessage');
    const iconEl = $('.toast-icon');
    if (!toast) return;
    msgEl.textContent = msg;
    if (iconEl) iconEl.textContent = icon;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function saveLocal(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function loadLocal(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }

  // ==========================================================
  // NAVEGAÇÃO ENTRE SEÇÕES
  // ==========================================================
  const sections = $$('.section');
  const navLinks = $$('.nav-link');
  const pageTitle = $('#pageTitle');

  function showSection(id) {
    sections.forEach(sec => sec.classList.remove('active'));
    navLinks.forEach(link => link.classList.remove('active'));

    const target = $(`#${id}`);
    if (target) target.classList.add('active');

    const nav = $(`.nav-link[data-section="${id}"]`);
    if (nav) nav.classList.add('active');

    const titles = {
      home: 'Início',
      fluxo: 'Fluxo Operacional',
      questionario: 'Diagnóstico',
      ficha: 'Ficha Estratégica',
      kit: 'Kit Onboarding',
      trilha: 'Trilha 5 Dias',
      indicadores: 'Indicadores',
      recursos: 'Recursos'
    };
    if (pageTitle) pageTitle.textContent = titles[id] || 'Início';

    // Fecha menu mobile ao navegar
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      showSection(link.dataset.section);
    });
  });

  // Links internos de seção (.nav-link-sec)
  $$('.nav-link-sec').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      showSection(link.dataset.section);
    });
  });

  // ==========================================================
  // MENU MOBILE
  // ==========================================================
  const sidebar = $('#sidebar');
  const overlay = $('#overlay');
  const menuToggle = $('#menuToggle');
  const closeMenu = $('#closeMenu');

  if (menuToggle) menuToggle.addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('show'); });
  if (closeMenu) closeMenu.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); });
  if (overlay) overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); });

  // ==========================================================
  // TEMA ESCURO / CLARO
  // ==========================================================
  const themeToggles = $$('#themeToggle, #themeToggleDesktop');
  function applyTheme(dark) {
    document.body.classList.toggle('dark', dark);
    themeToggles.forEach(t => { if (t) t.querySelector('.theme-icon').textContent = dark ? '☀️' : '🌙'; });
    saveLocal('theme-dark', dark);
  }
  themeToggles.forEach(t => {
    if (!t) return;
    t.addEventListener('click', () => applyTheme(!document.body.classList.contains('dark')));
  });
  applyTheme(loadLocal('theme-dark', false));

  // ==========================================================
  // WIZARD DO QUESTIONÁRIO
  // ==========================================================
  const blocks = $$('.form-block');
  const totalBlocks = blocks.length;
  let currentBlock = 0;
  const prevBtn = $('#prevBlock');
  const nextBtn = $('#nextBlock');
  const wizardBar = $('#wizardBar');
  const wizardText = $('#wizardText');
  const wizardDots = $('#wizardDots');

  function updateWizard() {
    blocks.forEach((b, i) => b.classList.toggle('active', i === currentBlock));
    if (prevBtn) prevBtn.disabled = currentBlock === 0;
    if (nextBtn) nextBtn.textContent = currentBlock === totalBlocks - 1 ? 'Finalizar →' : 'Próximo →';
    if (wizardBar) wizardBar.style.width = `${((currentBlock + 1) / totalBlocks) * 100}%`;
    if (wizardText) wizardText.textContent = `Bloco ${String.fromCharCode(65 + currentBlock)} de ${String.fromCharCode(65 + totalBlocks - 1)}`;
    if (wizardDots) {
      wizardDots.innerHTML = '';
      for (let i = 0; i < totalBlocks; i++) {
        const d = document.createElement('span');
        d.className = 'dot' + (i === currentBlock ? ' active' : '');
        wizardDots.appendChild(d);
      }
    }
  }

  if (prevBtn) prevBtn.addEventListener('click', () => { if (currentBlock > 0) { currentBlock--; updateWizard(); } });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    if (currentBlock < totalBlocks - 1) { currentBlock++; updateWizard(); }
    else { $('#btnFinalizarDiagnostico')?.click(); }
  });
  updateWizard();

  // ==========================================================
  // SALVAR / CARREGAR DIAGNÓSTICO
  // ==========================================================
  const diagForm = $('#diagnosticoForm');

  function gatherFormData(form) {
    const data = {};
    const elements = form.querySelectorAll('input, textarea, select');
    elements.forEach(el => {
      if (!el.name && !el.id) return;
      const key = el.name || el.id;
      if (el.type === 'checkbox') {
        if (!data[key]) data[key] = [];
        if (el.checked) data[key].push(el.value);
      } else if (el.type === 'radio') {
        if (el.checked) data[key] = el.value;
      } else {
        data[key] = el.value;
      }
    });
    return data;
  }

  function populateForm(form, data) {
    const elements = form.querySelectorAll('input, textarea, select');
    elements.forEach(el => {
      const key = el.name || el.id;
      if (!key || !(key in data)) return;
      const val = data[key];
      if (el.type === 'checkbox') {
        el.checked = Array.isArray(val) && val.includes(el.value);
      } else if (el.type === 'radio') {
        el.checked = val === el.value;
      } else {
        el.value = val || '';
      }
    });
    // Atualiza rating scales visuais
    $$('.rating-scale').forEach(scale => {
      const inputId = scale.dataset.rating;
      const input = $(`#${inputId}`);
      if (input && input.value) updateRatingVisual(scale, input.value);
    });
  }

  function loadDiagnostico() {
    const data = loadLocal('diagnostico-data', {});
    if (diagForm) populateForm(diagForm, data);
    const savedBlock = loadLocal('diagnostico-block', 0);
    if (typeof savedBlock === 'number') { currentBlock = savedBlock; updateWizard(); }
  }
  loadDiagnostico();

  if ($('#btnSalvarRascunho')) {
    $('#btnSalvarRascunho').addEventListener('click', () => {
      if (diagForm) saveLocal('diagnostico-data', gatherFormData(diagForm));
      saveLocal('diagnostico-block', currentBlock);
      showToast('Rascunho salvo com sucesso!', '💾');
    });
  }

  if ($('#btnFinalizarDiagnostico')) {
    $('#btnFinalizarDiagnostico').addEventListener('click', () => {
      if (diagForm) saveLocal('diagnostico-data', gatherFormData(diagForm));
      const summary = $('#formSummary');
      const content = $('#summaryContent');
      if (summary && content) {
        const data = loadLocal('diagnostico-data', {});
        const labels = {
          q1:'Nome', q2:'Profissão', q3:'Especialidade', q4:'Localização', q5:'Instituição', q6:'Regime',
          q7:'Contexto', q8:'Fase da carreira', q9:'Desafios', q10:'Tempo/Energia', q11:'Produtividade',
          q12:'Automatização', q13:'Maturidade IA', q14:'Ferramentas usadas', q15:'Uso atual IA',
          q16:'Dificuldades', q17:'Trava principal', q18:'Motivação', q19:'Expectativa 6 semanas',
          q20:'Resultado excelente', q21:'Metas prioritárias', q22:'Projeto específico',
          q23:'Aplicações desejadas', q24:'Tarefas a melhorar', q25:'Material para sistema',
          q26:'Uso de IA', q27:'Serviços vendidos', q28:'Fortalecer posicionamento',
          q29:'Autoridade digital', q30:'Ferramentas dia a dia', q31:'Ferramentas utilizadas',
          q32:'Equipe', q33:'Disponibilidade', q34:'Depende de você', q35:'Expectativa mentor',
          q36:'Formato aprendizagem', q37:'Comprometimento', q38:'Limitação', q39:'Materiais',
          q40:'Evitar/foco'
        };
        content.innerHTML = Object.entries(data)
          .filter(([k,v]) => v && (Array.isArray(v) ? v.length : String(v).trim()))
          .map(([k,v]) => `<div class="summary-item"><strong>${labels[k] || k}</strong><span>${Array.isArray(v) ? v.join(', ') : v}</span></div>`)
          .join('') || '<p style="color:var(--text-2)">Nenhuma resposta preenchida ainda.</p>';
        summary.style.display = 'block';
        summary.scrollIntoView({ behavior: 'smooth' });
      }
      showToast('Diagnóstico finalizado!', '✅');
    });
  }

  // Auto-salvar rascunho ao alterar campos
  if (diagForm) {
    diagForm.addEventListener('change', () => {
      saveLocal('diagnostico-data', gatherFormData(diagForm));
      saveLocal('diagnostico-block', currentBlock);
    });
  }

  // ==========================================================
  // RATING SCALES
  // ==========================================================
  function updateRatingVisual(scale, value) {
    const buttons = $$('button', scale);
    buttons.forEach(btn => btn.classList.toggle('selected', btn.dataset.value === value));
    const inputId = scale.dataset.rating;
    const input = $(`#${inputId}`);
    if (input) input.value = value;
  }

  $$('.rating-scale').forEach(scale => {
    $$('button', scale).forEach(btn => {
      btn.addEventListener('click', () => updateRatingVisual(scale, btn.dataset.value));
    });
  });

  // ==========================================================
  // FICHA ESTRATÉGICA
  // ==========================================================
  const fichaForm = $('#fichaForm');
  function loadFicha() {
    const data = loadLocal('ficha-data', {});
    Object.entries(data).forEach(([id, val]) => {
      const el = $(`#${id}`);
      if (el) el.value = val || '';
    });
  }
  loadFicha();

  if ($('#btnSalvarFicha')) {
    $('#btnSalvarFicha').addEventListener('click', () => {
      const data = {};
      $$('#fichaForm input, #fichaForm textarea, #fichaForm select').forEach(el => { if (el.id) data[el.id] = el.value; });
      saveLocal('ficha-data', data);
      showToast('Ficha salva com sucesso!', '💾');
    });
  }

  if ($('#btnExportarFicha')) {
    $('#btnExportarFicha').addEventListener('click', () => {
      window.print();
    });
  }

  // ==========================================================
  // CHECKLISTS - Salvar estado
  // ==========================================================
  const checklistKeys = ['step1','step3','step6','tecnico','dia1','dia2','dia3','dia4','dia5'];
  checklistKeys.forEach(key => {
    const container = $(`[data-checklist="${key}"]`);
    if (!container) return;
    const checkboxes = $$('input[type="checkbox"]', container);
    const saved = loadLocal(`check-${key}`, []);
    checkboxes.forEach((cb, i) => { cb.checked = saved.includes(i); });
    container.addEventListener('change', () => {
      const checked = checkboxes.map((cb, i) => cb.checked ? i : -1).filter(i => i !== -1);
      saveLocal(`check-${key}`, checked);
    });
  });

  // Barra de progresso do Fluxo Operacional
  function updateFluxoProgress() {
    const steps = $$('.fluxo-steps .step-card');
    let total = 0, checked = 0;
    steps.forEach(step => {
      const list = step.querySelector('.checklist');
      if (list) {
        const boxes = $$('input[type="checkbox"]', list);
        total += boxes.length;
        checked += boxes.filter(b => b.checked).length;
      }
    });
    const bar = $('#fluxoProgress');
    if (bar && total > 0) bar.style.width = `${(checked / total) * 100}%`;
  }
  updateFluxoProgress();
  $$('.fluxo-steps .checklist').forEach(list => list.addEventListener('change', updateFluxoProgress));

  // ==========================================================
  // ACCORDION - FLUXO OPERACIONAL STEPS
  // ==========================================================
  $$('.step-card').forEach(card => {
    const header = card.querySelector('.step-header');
    if (header) header.addEventListener('click', () => card.classList.toggle('open'));
  });

  // ==========================================================
  // KIT ONBOARDING - TABS
  // ==========================================================
  const kitTabs = $$('.kit-tab');
  const kitPanels = $$('.kit-panel');
  kitTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      kitTabs.forEach(t => t.classList.remove('active'));
      kitPanels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = $(`#panel-${tab.dataset.tab}`);
      if (panel) panel.classList.add('active');
    });
  });

  // ==========================================================
  // INDICADORES - TABS
  // ==========================================================
  const indTabs = $$('.ind-tab');
  const indPanels = $$('.ind-panel');
  indTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      indTabs.forEach(t => t.classList.remove('active'));
      indPanels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = $(`#ind-${tab.dataset.ind}`);
      if (panel) panel.classList.add('active');
    });
  });

  // ==========================================================
  // INDICADORES - Dashboard
  // ==========================================================
  function updateDashboard() {
    const dash = $('#dashGrid');
    if (!dash) return;
    const kpi1 = Number($('#kpi1')?.value || 0);
    const kpi2 = Number($('#kpi2')?.value || 0);
    const kpi3 = Number($('#kpi3')?.value || 0);
    const kpi4 = Number($('#kpi4')?.value || 0);
    const kpi5 = Number($('#kpi5')?.value || 0);
    const kpi6 = Number($('#kpi6')?.value || 0);

    const fe1 = Number($('#fe1')?.value || 0);
    const fe2 = Number($('#fe2')?.value || 0);
    const fe3 = Number($('#fe3')?.value || 0);
    const fe4 = Number($('#fe4')?.value || 0);
    const expAvg = fe1 && fe2 && fe3 && fe4 ? ((fe1+fe2+fe3+fe4)/4).toFixed(1) : '-';

    dash.innerHTML = `
      <div class="dash-item"><span class="dash-value">${kpi1 || '-'}%</span><span class="dash-label">Preenchimento</span></div>
      <div class="dash-item"><span class="dash-value">${kpi2 || '-'}</span><span class="dash-label">Dias Onboarding</span></div>
      <div class="dash-item"><span class="dash-value">${kpi3 || '-'}%</span><span class="dash-label">Presença Kickoff</span></div>
      <div class="dash-item"><span class="dash-value">${kpi4 || '-'}%</span><span class="dash-label">Início com Tarefa</span></div>
      <div class="dash-item"><span class="dash-value">${kpi5 || '-'}/10</span><span class="dash-label">Clareza</span></div>
      <div class="dash-item"><span class="dash-value">${kpi6 || '-'}/10</span><span class="dash-label">Confiança IA</span></div>
      <div class="dash-item"><span class="dash-value">${expAvg}</span><span class="dash-label">Experiência Média</span></div>
    `;
  }

  $$('#indicadores input[type="number"], #indicadores .rating-scale').forEach(el => {
    el.addEventListener('change', updateDashboard);
    el.addEventListener('click', () => setTimeout(updateDashboard, 50));
  });
  updateDashboard();

  // ==========================================================
  // RESETAR DADOS
  // ==========================================================
  if ($('#btnResetar')) {
    $('#btnResetar').addEventListener('click', () => {
      if (confirm('Tem certeza que deseja apagar todos os dados salvos?')) {
        localStorage.removeItem('diagnostico-data');
        localStorage.removeItem('diagnostico-block');
        localStorage.removeItem('ficha-data');
        checklistKeys.forEach(k => localStorage.removeItem(`check-${k}`));
        showToast('Dados resetados. Recarregando...', '🗑️');
        setTimeout(() => location.reload(), 800);
      }
    });
  }

  // ==========================================================
  // INICIALIZAÇÃO
  // ==========================================================
  // Abre o primeiro step do fluxo para demonstrar accordion
  const firstStep = $('.fluxo-steps .step-card');
  if (firstStep) firstStep.classList.add('open');
});
