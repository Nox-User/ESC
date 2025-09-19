// controleAtividade.js
import { initializeFirebase } from './firebase-config.js';

// ---------- helpers ----------
const STORAGE_KEY = 'activities_v1';
const $ = id => document.getElementById(id);
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function now() { return Date.now(); }

function formatDuration(ms) {
  if (!ms || ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return String(hh).padStart(2, '0') + ':' +
         String(mm).padStart(2, '0') + ':' +
         String(ss).padStart(2, '0');
}

function loadActivities() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch (e) { console.error(e); return []; }
}
function saveActivities(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
function totalTimeMs(activity) {
  if (!activity.intervals || activity.intervals.length === 0) return 0;
  return activity.intervals.reduce((acc, it) => {
    const s = it.start || 0;
    const e = (it.end != null) ? it.end : now();
    return acc + Math.max(0, e - s);
  }, 0);
}

// ---------- estado ----------
let activities = [];
let timers = {}; // id -> intervalId

// ---------- render ----------
export function renderControleAtividade() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <div class="max-w-7xl mx-auto mt-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">Controle de Atividade</h1>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Formulário -->
        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <form id="formActivity">
            <label class="block mb-2 text-sm font-medium">Nome</label>
            <input id="name" type="text" class="w-full border rounded-md p-2 mb-3" required />

            <label class="block mb-2 text-sm font-medium">Data de Desenvolvimento</label>
            <input id="devDate" type="date" class="w-full border rounded-md p-2 mb-3" />

            <label class="block mb-2 text-sm font-medium">Descrição</label>
            <textarea id="description" class="w-full border rounded-md p-2 mb-3"></textarea>

            <div class="flex gap-3 mb-3">
              <div class="flex-1">
                <label class="block mb-2 text-sm font-medium">Prioridade</label>
                <select id="priority" class="w-full border rounded-md p-2">
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
              <div class="w-40">
                <label class="block mb-2 text-sm font-medium">Status</label>
                <select id="status" class="w-full border rounded-md p-2">
                  <option value="Aberta">Aberta</option>
                  <option value="Em Progresso">Em Progresso</option>
                  <option value="Pausada">Pausada</option>
                  <option value="Finalizada">Finalizada</option>
                </select>
              </div>
            </div>

            <label class="block mb-2 text-sm font-medium">Imagem</label>
            <input id="image" type="file" accept="image/*" class="mb-3" />
            <div id="fileName" class="text-xs text-gray-500 mb-3"></div>

            <div class="flex gap-3">
              <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                Cadastrar atividade
              </button>
              <button type="button" id="clearAll" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium">
                Limpar tudo
              </button>
            </div>
          </form>
          <div class="mt-6" id="activitiesList"></div>
        </div>

        <!-- Visualizador -->
        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Visualizador / Export</h3>
          <p class="text-sm text-gray-500 mb-3">Clique em qualquer atividade para ver detalhes. Você também pode exportar/importar JSON.</p>
          <button id="exportBtn" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg mr-2">Exportar JSON</button>
          <input id="importFile" type="file" accept="application/json" style="display:none" />
          <button id="importBtn" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">Importar JSON</button>
          <div id="detail" class="text-sm text-gray-500 mt-6">Selecione uma atividade para ver detalhes.</div>
        </div>
      </div>
    </div>
  `;

  // iniciar dados
  activities = loadActivities();
  bindEvents();
  renderActivities();
}

// ---------- lógica UI ----------
function bindEvents() {
  $('formActivity').onsubmit = e => {
    e.preventDefault();
    const file = $('image').files[0];
    const reader = new FileReader();
    reader.onload = ev => {
      const newAct = {
        id: uid(),
        name: $('name').value,
        devDate: $('devDate').value,
        description: $('description').value,
        priority: $('priority').value,
        status: $('status').value,
        imageData: ev.target.result || null,
        imageName: file ? file.name : null,
        createdAt: now(),
        intervals: []
      };
      activities.push(newAct);
      saveActivities(activities);
      renderActivities();
      e.target.reset();
      $('fileName').textContent = '';
    };
    if (file) reader.readAsDataURL(file);
    else reader.onload({ target: { result: null }});
  };

  $('clearAll').onclick = () => {
    if (confirm('Tem certeza que deseja limpar todas as atividades?')) {
      activities = [];
      saveActivities(activities);
      renderActivities();
    }
  };

  $('image').onchange = e => {
    $('fileName').textContent = e.target.files[0] ? e.target.files[0].name : '';
  };

  $('exportBtn').onclick = () => {
    const blob = new Blob([JSON.stringify(activities)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'atividades.json';
    a.click();
  };

  $('importBtn').onclick = () => $('importFile').click();
  $('importFile').onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        activities = JSON.parse(ev.target.result);
        saveActivities(activities);
        renderActivities();
      } catch {
        alert('Arquivo inválido.');
      }
    };
    reader.readAsText(file);
  };
}

function renderActivities() {
  const wrap = $('activitiesList');
  wrap.innerHTML = '';
  if (activities.length === 0) {
    wrap.innerHTML = '<div class="text-sm text-gray-500">Nenhuma atividade cadastrada.</div>';
    return;
  }
  activities.sort((a, b) => b.createdAt - a.createdAt);
  activities.forEach(act => {
    const card = document.createElement('div');
    card.className = 'rounded-lg border p-3 mb-3 shadow-sm flex gap-3';

    const img = document.createElement('img');
    img.className = 'w-20 h-16 rounded border object-cover';
    img.src = act.imageData || '';
    card.appendChild(img);

    const body = document.createElement('div');
    body.className = 'flex-1';
    body.innerHTML = `
      <div><strong>${act.name}</strong> <span class="text-xs text-gray-500">${act.priority} • ${act.status}</span></div>
      <div class="text-xs text-gray-500">${act.description || ''}</div>
      <div class="font-mono font-semibold">${formatDuration(totalTimeMs(act))}</div>
      <div class="text-xs text-gray-400">Criado: ${new Date(act.createdAt).toLocaleString()}</div>
    `;
    card.appendChild(body);

    // botões
    const controls = document.createElement('div');
    controls.className = 'flex flex-col gap-1';
    controls.innerHTML = `
      <button class="bg-blue-600 text-white text-xs px-2 py-1 rounded" onclick="startTimer('${act.id}')">Iniciar</button>
      <button class="bg-gray-200 text-xs px-2 py-1 rounded" onclick="pauseTimer('${act.id}')">Pausar</button>
      <button class="bg-green-500 text-white text-xs px-2 py-1 rounded" onclick="finishActivity('${act.id}')">Finalizar</button>
      <button class="bg-red-500 text-white text-xs px-2 py-1 rounded" onclick="deleteActivity('${act.id}')">Excluir</button>
    `;
    card.appendChild(controls);

    card.onclick = ev => {
      if (ev.target.tagName === 'BUTTON' || ev.target.tagName === 'IMG') return;
      showDetail(act.id);
    };

    wrap.appendChild(card);
  });
}

// ---------- timers ----------
window.startTimer = id => {
  const act = activities.find(a => a.id === id);
  if (!act || act.completedAt) return;
  act.status = 'Em Progresso';
  const running = act.intervals && act.intervals.some(i => i.end == null);
  if (!running) {
    act.intervals = act.intervals || [];
    act.intervals.push({ start: now(), end: null });
  }
  saveActivities(activities);
  renderActivities();
  if (!timers[id]) timers[id] = setInterval(() => renderActivities(), 500);
};

window.pauseTimer = id => {
  const act = activities.find(a => a.id === id);
  if (!act || act.completedAt) return;
  const running = act.intervals && act.intervals.find(i => i.end == null);
  if (running) running.end = now();
  act.status = 'Pausada';
  saveActivities(activities);
  clearInterval(timers[id]); delete timers[id];
  renderActivities();
  showDetail(id);
};

window.finishActivity = id => {
  const act = activities.find(a => a.id === id);
  if (!act) return;
  if (confirm('Finalizar atividade?')) {
    const running = act.intervals && act.intervals.find(i => i.end == null);
    if (running) running.end = now();
    act.completedAt = now();
    act.status = 'Finalizada';
    saveActivities(activities);
    clearInterval(timers[id]); delete timers[id];
    renderActivities();
    showDetail(id);
  }
};

window.deleteActivity = id => {
  if (!confirm('Excluir atividade?')) return;
  activities = activities.filter(a => a.id !== id);
  saveActivities(activities);
  renderActivities();
  $('detail').innerHTML = 'Selecione uma atividade para ver detalhes.';
};

// ---------- detalhe ----------
function showDetail(id) {
  const act = activities.find(a => a.id === id);
  if (!act) return;
  const wrap = $('detail');
  let html = `<h4 class="font-bold">${act.name}</h4>`;
  html += `<div class="text-sm text-gray-500">Prioridade: ${act.priority} • Status: ${act.status}</div>`;
  html += `<p>${act.description || ''}</p>`;
  html += `<div class="text-sm">Desenvolvimento: ${act.devDate || '—'}</div>`;
  html += `<div class="text-sm">Criado: ${new Date(act.createdAt).toLocaleString()}</div>`;
  if (act.completedAt) html += `<div class="text-sm">Finalizado: ${new Date(act.completedAt).toLocaleString()}</div>`;
  html += `<div class="mt-2 font-mono">Tempo total: ${formatDuration(totalTimeMs(act))}</div><hr/>`;

  html += `<div class="text-sm font-bold">Intervalos:</div>`;
  if (!act.intervals || act.intervals.length === 0) html += '<div class="text-xs text-gray-500">Sem intervalos.</div>';
  else {
    html += '<ul class="list-disc ml-4">';
    act.intervals.forEach(it => {
      const s = it.start ? new Date(it.start).toLocaleString() : '—';
      const e = it.end ? new Date(it.end).toLocaleString() : 'EM ANDAMENTO';
      const dur = (it.end ? (it.end - it.start) : (now() - it.start));
      html += `<li class="text-xs">${s} → ${e} (${formatDuration(dur)})</li>`;
    });
    html += '</ul>';
  }

  if (act.imageData) {
    html += `<hr/><div><img src="${act.imageData}" class="rounded border mt-2 max-w-full"/></div>`;
  }
  wrap.innerHTML = html;
}
