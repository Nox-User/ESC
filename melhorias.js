import { firebaseService, initializeFirebase} from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  // ⚠️ substitua pelos dados do seu projeto Firebase
  initializeFirebase({
    apiKey: "AIzaSyD53Q57GFkGSYH1p5mAfsxZIGBKnp8AEG8",
    authDomain: "ferramentaria-d120f.firebaseapp.com",
    databaseURL: "https://ferramentaria-d120f-default-rtdb.firebaseio.com",
    projectId: "ferramentaria-d120f",
    storageBucket: "ferramentaria-d120f.firebasestorage.app",
    messagingSenderId: "227336233826",
    appId: "1:227336233826:web:0fa15161281a6d896a823b",
    measurementId: "G-2EVDBKX8S6"
  });

  renderApp();       
  carregarMelhorias();
});

// Data Atual
const now = new Date();
const month = now.toLocaleString('default', { month: 'long' }).toUpperCase();
const monthnumber = now.getMonth() + 1;
const year = now.getFullYear(); 
const day = now.getDate();

const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const clsx = (...parts) => parts.filter(Boolean).join(' ');

// Estado da aplicação
let melhorias = [];
let melhoriaEditando = null;

// Funções para interagir com o Firebase
const melhoriaService = {
  async getMelhorias() {
    try {
      return await firebaseService.getMelhorias();
    } catch (error) {
      console.error("Erro ao buscar melhorias:", error);
      return [];
    }
  },

  async addMelhoria(melhoria) {
    try {
      return await firebaseService.addMelhoria(melhoria);
    } catch (error) {
      console.error("Erro ao adicionar melhoria:", error);
      throw error;
    }
  },

  async updateMelhoria(id, dados) {
    try {
      return await firebaseService.updateMelhoria(id, dados);
    } catch (error) {
      console.error("Erro ao atualizar melhoria:", error);
      throw error;
    }
  },

  async deleteMelhoria(id) {
    try {
      return await firebaseService.deleteMelhoria(id);
    } catch (error) {
      console.error("Erro ao deletar melhoria:", error);
      throw error;
    }
  }
};

// Função para renderizar a aplicação
// Função para renderizar a aplicação
function renderApp() {
  const root = $('#root');
  root.innerHTML = `
    <div class="flex h-screen bg-gray-50">
      <aside id="sidebar" class="fixed inset-y-0 left-0 bg-white w-full sm:w-20 xl:w-60 sm:flex flex-col z-10 hidden shadow-lg"></aside>
      <main class="flex w-full">
        <div class="w-full h-screen hidden sm:block sm:w-20 xl:w-60 flex-shrink-0">.</div>
        <div id="content" class="h-screen flex-grow overflow-x-hidden overflow-auto p-6">
          <!-- Conteúdo principal será inserido aqui -->
        </div>
      </main>
    </div>
  `;

  // Inicializar sidebar e conteúdo
  Sidebar({ mount: $('#sidebar') });
  renderMainContent();
}

// Função para renderizar o sidebar
function Sidebar({ mount }) {
  let selected = '0';
  const sidebarItems = [
    [
      { id: '0', title: 'Dashboard', notifications: false },
      { id: '1', title: 'Lista de Melhorias', notifications: false },
      { id: '2', title: 'Relatórios', notifications: false },
      { id: '3', title: 'Configurações', notifications: false },
    ],
    [
      { id: '4', title: 'Ajuda', notifications: false },
      { id: '5', title: 'Suporte', notifications: false },
    ],
  ];

  function render() {
    mount.innerHTML = `
      <div class="flex-shrink-0 overflow-hidden p-2 mt-12">
        <div class="flex items-center h-full sm:justify-center xl:justify-start p-2 border-b border-gray-200">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
            </svg>
          </div>
          <div class="block sm:hidden xl:block ml-2 font-bold text-xl text-gray-900">MELHORIAS</div>
          <div class="flex-grow sm:hidden xl:block"></div>
          <button onclick="__onSidebarHide()" class="block sm:hidden p-1 rounded-md hover:bg-gray-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="flex-grow overflow-x-hidden overflow-y-auto flex flex-col">
        ${sidebarItems[0].map(i => MenuItem({ item: i, selected })).join('')}
        <div class="mt-8 mb-0 font-bold px-3 block sm:hidden xl:block text-gray-500 text-sm uppercase">ATALHOS</div>
        ${sidebarItems[1].map(i => MenuItem({ item: i, selected })).join('')}
        <div class="flex-grow"></div>
      </div>
      <div class="flex-shrink-0 overflow-hidden p-2">
        <div class="flex items-center h-full sm:justify-center xl:justify-start p-2 border-t border-gray-200">
          <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div class="block sm:hidden xl:block ml-2 font-medium text-gray-700">Usuário</div>
          <div class="flex-grow block sm:hidden xl:block"></div>
          <button class="block sm:hidden xl:block p-1 rounded-md hover:bg-gray-100">
            <svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Bind clicks
    $$('.js-menu').forEach(el => {
      el.addEventListener('click', () => {
        selected = el.dataset.id;
        render();
        
        // Renderizar conteúdo baseado na seleção
        const content = document.getElementById("content");
        if (selected === '1') {
          renderListaMelhorias(content);
        } else if (selected === '2') {
          renderRelatorios(content);
        } else if (selected === '3') {
          renderConfiguracoes(content);
        } else {
          renderMainContent();
          atualizarDashboard();  // <--- adiciona isso
          renderizarGraficos();  // <--- e isso
        }
      });
    });
  }

  function MenuItem({ item: { id, title, notifications }, selected }) {
    return `
      <div data-id="${id}" class="js-menu w-full mt-2 flex items-center px-3 sm:px-0 xl:px-3 justify-start sm:justify-center xl:justify-start sm:mt-6 xl:mt-3 cursor-pointer rounded-lg transition-colors ${selected === id ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} py-2">
        ${SidebarIcon(id)}
        <div class="block sm:hidden xl:block ml-3 font-medium">${title}</div>
        <div class="block sm:hidden xl:block flex-grow"></div>
        ${notifications ? `<div class='flex sm:hidden xl:flex bg-red-500 w-5 h-5 items-center justify-center rounded-full mr-2'><div class='text-white text-xs'>${notifications}</div></div>` : ''}
      </div>
    `;
  }

  function SidebarIcon(id) {
    const icons = {
      0: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path></svg>`,
      1: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" clip-rule="evenodd"></path></svg>`,
      2: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path></svg>`,
      3: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path></svg>`,
      4: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path></svg>`,
      5: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>`,
    };
    return icons[id] || '';
  }

  // Funções globais para controle do sidebar
  window.__onSidebarHide = () => {
    $('#sidebar').classList.add('hidden');
  };
  window.__onSidebarOpen = () => {
    $('#sidebar').classList.remove('hidden');
  };
  window.__onSidebarToggle = () => {
    const sidebar = $('#sidebar');
    sidebar.classList.toggle('hidden');
  };

  render();
}

function renderMainContent() {
  const content = $('#content');
  content.innerHTML = `
    <div class="max-w-7xl mx-auto p-2 mt-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 rounded-lg">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Total de Melhorias</p>
                <p class="text-2xl font-semibold text-gray-900" id="totalMelhorias">0</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 rounded-lg">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Implementadas</p>
                <p class="text-2xl font-semibold text-gray-900" id="melhoriasConcluidas">0</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <div class="flex items-center">
              <div class="p-2 bg-yellow-100 rounded-lg">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Em Andamento</p>
                <p class="text-2xl font-semibold text-gray-900" id="melhoriasEmAndamento">0</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <div class="flex items-center">
              <div class="p-2 bg-red-100 rounded-lg">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Pendentes</p>
                <p class="text-2xl font-semibold text-gray-900" id="melhoriasPendentes">0</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Gráficos -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Status das Melhorias</h3>
            <canvas id="statusChart" width="400" height="200"></canvas>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Melhorias por Mês</h3>
            <canvas id="monthChart" width="400" height="200"></canvas>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Melhorias por Pilar</h3>
            <canvas id="pilaresChart" width="400" height="200"></canvas>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Melhorias por Processo</h3>
            <canvas id="processosChart" width="400" height="200"></canvas>
          </div>
        </div>

        <!-- Gráficos de Comparativo de Tempo -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Comparativo de Tempo - Antes vs Depois</h3>
            <canvas id="comparativoTempoChart" width="400" height="300"></canvas>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Status dos Comparativos</h3>
            <canvas id="statusComparativoChart" width="400" height="200"></canvas>
          </div>
        </div>
      </div>
  `;
}

function renderListaMelhorias(content) {
  content.innerHTML = `
    <div class="max-w-7xl mx-auto mt-6">
      <!-- Conteúdo Principal -->

        <div class="p-6">
          <!-- Header -->
          <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div class="flex justify-between items-center">
              <div>
                <h1 class="text-3xl font-bold text-gray-900">Gestão de Melhorias</h1>
                <p class="text-gray-600 mt-1">${day} de ${month} de ${year}</p>
              </div>
              <div class="flex gap-3">
                <button id="btnNovaMelhoria" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                  Nova Melhoria
                </button>
                <button id="btnGerarRelatorio" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
                  Gerar Relatório PDF
                </button>
              </div>
            </div>
          </div>

        <!-- Tabela de Melhorias -->
        <div class="bg-white rounded-lg shadow-sm">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Lista de Melhorias</h3>
          </div>
          <div class="table-container">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pilares</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processo</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody id="tabelaMelhorias" class="bg-white divide-y divide-gray-200">
                <!-- Conteúdo será inserido dinamicamente -->
              </tbody>
            </table>
          </div>
        </div>
    </div>
        <!-- Modal para Nova/Editar Melhoria -->
    <div id="modalMelhoria" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4" id="modalTitle">Nova Melhoria</h3>
            <form id="formMelhoria">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Título</label>
                <input type="text" id="titulo" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea id="descricao" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required></textarea>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select id="status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Pendente">Pendente</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Implementada">Implementada</option>
                </select>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
                <select id="prioridade" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Data de Criação</label>
                <input type="date" id="dataCriacao" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Pilares (pode selecionar mais de um)</label>
                <div class="space-y-2">
                  <label class="flex items-center">
                    <input type="checkbox" id="pilarSeguranca" class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm text-gray-700">Segurança</span>
                  </label>
                  <label class="flex items-center">
                    <input type="checkbox" id="pilarCusto" class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm text-gray-700">Custo</span>
                  </label>
                  <label class="flex items-center">
                    <input type="checkbox" id="pilarQualidade" class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm text-gray-700">Qualidade</span>
                  </label>
                  <label class="flex items-center">
                    <input type="checkbox" id="pilarProdutividade" class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <span class="text-sm text-gray-700">Produtividade</span>
                  </label>
                </div>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Processo</label>
                <select id="processo" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecione um processo</option>
                  <option value="Dobra">Dobra</option>
                  <option value="Chanfro">Chanfro</option>
                  <option value="Usinagem">Usinagem</option>
                  <option value="Solda">Solda</option>
                </select>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Comparativo de Tempo</label>
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Part Number</label>
                    <input type="text" id="comparativoPartNumber" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: PN-2024-001">
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Descrição do Comparativo</label>
                    <textarea id="comparativoDescricao" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Descreva o comparativo de tempo"></textarea>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">Tempo Antes (horas)</label>
                      <input type="number" id="tempoAntes" step="0.1" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.0">
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-1">Tempo Depois (horas)</label>
                      <input type="number" id="tempoDepois" step="0.1" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.0">
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Status do Comparativo</label>
                    <select id="statusComparativo" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Não Iniciado">Não Iniciado</option>
                      <option value="Em Andamento">Em Andamento</option>
                      <option value="Finalizado">Finalizado</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="flex justify-end gap-3">
                <button type="button" id="btnCancelar" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                  Cancelar
                </button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  // Event listeners
  $('#btnNovaMelhoria').addEventListener('click', abrirModalNovaMelhoria);
  $('#btnGerarRelatorio').addEventListener('click', gerarRelatorioPDF);
  $('#btnCancelar').addEventListener('click', fecharModal);
  $('#formMelhoria').addEventListener('submit', salvarMelhoria);

  renderizarTabela();
}

function renderRelatorios(content) {
  content.innerHTML = `
    <div class="max-w-7xl mx-auto mt-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">Relatórios</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-sm">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Relatório de Status</h3>
          <p class="text-gray-600 mb-4">Gere um relatório detalhado sobre o status dos projetos.</p>
          <button onclick="gerarRelatorioPDF()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Gerar PDF
          </button>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-sm">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Relatório de Complexidade</h3>
          <p class="text-gray-600 mb-4">Analise a distribuição de complexidade dos projetos.</p>
          <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
            Em Breve
          </button>
        </div>
      </div>
    </div>
  `;
    // Event listeners
    $('#btnNovaMelhoria').addEventListener('click', abrirModalNovaMelhoria);
    $('#btnGerarRelatorio').addEventListener('click', gerarRelatorioPDF);
    $('#btnCancelar').addEventListener('click', fecharModal);
    $('#formMelhoria').addEventListener('submit', salvarMelhoria);

}

function renderConfiguracoes(content) {
  content.innerHTML = `
    <div class="max-w-7xl mx-auto mt-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">Configurações</h1>
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Configurações do Sistema</h3>
        <p class="text-gray-600">Configurações em desenvolvimento...</p>
      </div>
    </div>
    
  `;


  // Event listeners
  $('#btnNovaMelhoria').addEventListener('click', abrirModalNovaMelhoria);
  $('#btnGerarRelatorio').addEventListener('click', gerarRelatorioPDF);
  $('#btnCancelar').addEventListener('click', fecharModal);
  $('#formMelhoria').addEventListener('submit', salvarMelhoria);
}

// Funções de manipulação de dados
async function carregarMelhorias() {
  try {
    melhorias = await melhoriaService.getMelhorias();
    atualizarDashboard();
    renderizarTabela();
    renderizarGraficos();
  } catch (error) {
    console.error('Erro ao carregar melhorias:', error);
  }
}

function atualizarDashboard() {
  const total = melhorias.length;
  const implementadas = melhorias.filter(m => m.status === 'Implementada').length;
  const emAndamento = melhorias.filter(m => m.status === 'Em Andamento').length;
  const pendentes = melhorias.filter(m => m.status === 'Pendente').length;

  $('#totalMelhorias').textContent = total;
  $('#melhoriasConcluidas').textContent = implementadas;
  $('#melhoriasEmAndamento').textContent = emAndamento;
  $('#melhoriasPendentes').textContent = pendentes;
}

function renderizarTabela() {
  const tbody = $('#tabelaMelhorias');
  if (!tbody) return;

  tbody.innerHTML = melhorias.map(melhoria => `
    <tr>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${melhoria.titulo}</td>
      <td class="px-6 py-4 text-sm text-gray-500">${melhoria.descricao.substring(0, 50)}...</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(melhoria.status)}">
          ${melhoria.status}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPrioridadeColor(melhoria.prioridade)}">
          ${melhoria.prioridade}
        </span>
      </td>
      <td class="px-6 py-4 text-sm text-gray-500">${formatarPilares(melhoria.pilares || [])}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${melhoria.processo || '-'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${melhoria.dataCriacao}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button onclick="editarMelhoria('${melhoria.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
        <button onclick="excluirMelhoria('${melhoria.id}')" class="text-red-600 hover:text-red-900">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function getStatusColor(status) {
  switch(status) {
    case 'Implementada': return 'bg-green-100 text-green-800';
    case 'Em Andamento': return 'bg-yellow-100 text-yellow-800';
    case 'Pendente': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getPrioridadeColor(prioridade) {
  switch(prioridade) {
    case 'Alta': return 'bg-red-100 text-red-800';
    case 'Média': return 'bg-yellow-100 text-yellow-800';
    case 'Baixa': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function formatarPilares(pilares) {
  if (!pilares || pilares.length === 0) return '-';
  return pilares.join(', ');
}

let statusChartInstance = null;
let monthChartInstance = null;
let pilaresChartInstance = null;
let processosChartInstance = null;
let comparativoTempoChartInstance = null;
let statusComparativoChartInstance = null;

function renderizarGraficos() {
  if (!$('#statusChart') || !$('#monthChart') || !$('#pilaresChart') || !$('#processosChart') || 
      !$('#comparativoTempoChart') || !$('#statusComparativoChart')) return; // evita recriar sem canvas
  
  if (statusChartInstance) statusChartInstance.destroy();
  if (monthChartInstance) monthChartInstance.destroy();
  if (pilaresChartInstance) pilaresChartInstance.destroy();
  if (processosChartInstance) processosChartInstance.destroy();
  if (comparativoTempoChartInstance) comparativoTempoChartInstance.destroy();
  if (statusComparativoChartInstance) statusComparativoChartInstance.destroy();

  // Gráfico de Status
  const statusCtx = $('#statusChart').getContext('2d');
  const statusData = {
    labels: ['Implementadas', 'Em Andamento', 'Pendentes'],
    datasets: [{
      data: [
        melhorias.filter(m => m.status === 'Implementada').length,
        melhorias.filter(m => m.status === 'Em Andamento').length,
        melhorias.filter(m => m.status === 'Pendente').length
      ],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
    }]
  };

  statusChartInstance = new Chart(statusCtx, {
    type: 'doughnut',
    data: statusData,
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // Gráfico por Mês com linha de valor fixo
  const monthCtx = $('#monthChart').getContext('2d');
  const monthData = agruparMelhoriasPorMes();
  
  monthChartInstance = new Chart(monthCtx, {
    type: 'bar',
    data: {
      labels: monthData.map(m => m.mes),
      datasets: [{
        label: 'Melhorias',
        data: monthData.map(m => m.quantidade),
        backgroundColor: '#3B82F6'
      }, {
        label: 'Meta',
        data: new Array(12).fill(16), // Valor fixo de 16 melhorias por mês
        type: 'line',
        borderColor: '#EF4444',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointBackgroundColor: '#EF4444',
        pointBorderColor: '#EF4444',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Gráfico de Pilares
  const pilaresCtx = $('#pilaresChart').getContext('2d');
  const pilaresData = agruparMelhoriasPorPilar();
  
  pilaresChartInstance = new Chart(pilaresCtx, {
    type: 'bar',
    data: {
      labels: pilaresData.map(p => p.pilar),
      datasets: [{
        label: 'Melhorias',
        data: pilaresData.map(p => p.quantidade),
        backgroundColor: ['#8B5CF6', '#06B6D4', '#84CC16', '#F59E0B']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Gráfico de Processos
  const processosCtx = $('#processosChart').getContext('2d');
  const processosData = agruparMelhoriasPorProcesso();
  
  processosChartInstance = new Chart(processosCtx, {
    type: 'bar',
    data: {
      labels: processosData.map(p => p.processo),
      datasets: [{
        label: 'Melhorias',
        data: processosData.map(p => p.quantidade),
        backgroundColor: ['#F97316', '#10B981', '#3B82F6', '#EF4444']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Gráfico de Comparativo de Tempo (seguindo o modelo da imagem)
  const comparativoCtx = $('#comparativoTempoChart').getContext('2d');
  const comparativoData = obterDadosComparativo();
  
  comparativoTempoChartInstance = new Chart(comparativoCtx, {
    type: 'bar',
    data: {
      labels: comparativoData.labels,
      datasets: [{
        label: 'Antes (horas)',
        data: comparativoData.temposAntes,
        backgroundColor: '#FCD34D',
        borderColor: '#F59E0B',
        borderWidth: 1
      }, {
        label: 'Depois (horas)',
        data: comparativoData.temposDepois,
        backgroundColor: '#34D399',
        borderColor: '#10B981',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            afterLabel: function(context) {
              const index = context.dataIndex;
              const diferenca = comparativoData.temposAntes[index] - comparativoData.temposDepois[index];
              return `Diferença: ${diferenca.toFixed(1)}h`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Tempo (Horas)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Part Numbers'
          }
        }
      }
    }
  });

  // Gráfico de Status dos Comparativos
  const statusComparativoCtx = $('#statusComparativoChart').getContext('2d');
  const statusComparativoData = agruparComparativosPorStatus();
  
  statusComparativoChartInstance = new Chart(statusComparativoCtx, {
    type: 'doughnut',
    data: {
      labels: statusComparativoData.map(s => s.status),
      datasets: [{
        data: statusComparativoData.map(s => s.quantidade),
        backgroundColor: ['#EF4444', '#F59E0B', '#10B981']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function agruparMelhoriasPorMes() {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const resultado = meses.map(mes => ({ mes, quantidade: 0 }));

  melhorias.forEach(melhoria => {
    if (melhoria.dataCriacao) {
      const data = new Date(melhoria.dataCriacao);
      const mesIndex = data.getMonth();
      if (mesIndex >= 0 && mesIndex < 12) {
        resultado[mesIndex].quantidade++;
      }
    }
  });

  return resultado;
}

function agruparMelhoriasPorPilar() {
  const pilares = ['Segurança', 'Custo', 'Qualidade', 'Produtividade'];
  const resultado = pilares.map(pilar => ({ pilar, quantidade: 0 }));

  melhorias.forEach(melhoria => {
    if (melhoria.pilares && Array.isArray(melhoria.pilares)) {
      melhoria.pilares.forEach(pilar => {
        const index = pilares.indexOf(pilar);
        if (index >= 0) {
          resultado[index].quantidade++;
        }
      });
    }
  });

  return resultado;
}

function agruparMelhoriasPorProcesso() {
  const processos = ['Dobra', 'Chanfro', 'Usinagem', 'Solda'];
  const resultado = processos.map(processo => ({ processo, quantidade: 0 }));

  melhorias.forEach(melhoria => {
    if (melhoria.processo) {
      const index = processos.indexOf(melhoria.processo);
      if (index >= 0) {
        resultado[index].quantidade++;
      }
    }
  });

  return resultado;
}

function obterDadosComparativo() {
  const melhoriaComComparativo = melhorias.filter(m => 
    m.comparativo && 
    m.comparativo.partNumber && 
    (m.comparativo.tempoAntes > 0 || m.comparativo.tempoDepois > 0)
  );

  return {
    labels: melhoriaComComparativo.map(m => m.comparativo.partNumber || 'N/A'),
    temposAntes: melhoriaComComparativo.map(m => m.comparativo.tempoAntes || 0),
    temposDepois: melhoriaComComparativo.map(m => m.comparativo.tempoDepois || 0)
  };
}

function agruparComparativosPorStatus() {
  const status = ['Não Iniciado', 'Em Andamento', 'Finalizado'];
  const resultado = status.map(s => ({ status: s, quantidade: 0 }));

  melhorias.forEach(melhoria => {
    if (melhoria.comparativo && melhoria.comparativo.status) {
      const index = status.indexOf(melhoria.comparativo.status);
      if (index >= 0) {
        resultado[index].quantidade++;
      }
    }
  });

  return resultado;
}

// Funções de modal
function abrirModalNovaMelhoria() {
  melhoriaEditando = null;
  $('#modalTitle').textContent = 'Nova Melhoria';
  $('#formMelhoria').reset();
  $('#dataCriacao').value = new Date().toISOString().split('T')[0];
  $('#modalMelhoria').classList.remove('hidden');
}

function fecharModal() {
  $('#modalMelhoria').classList.add('hidden');
  melhoriaEditando = null;
}

async function salvarMelhoria(e) {
  e.preventDefault();
  
  // Coletando os pilares selecionados
  const pilares = [];
  if ($('#pilarSeguranca').checked) pilares.push('Segurança');
  if ($('#pilarCusto').checked) pilares.push('Custo');
  if ($('#pilarQualidade').checked) pilares.push('Qualidade');
  if ($('#pilarProdutividade').checked) pilares.push('Produtividade');
  
  const dados = {
    titulo: $('#titulo').value,
    descricao: $('#descricao').value,
    status: $('#status').value,
    prioridade: $('#prioridade').value,
    dataCriacao: $('#dataCriacao').value,
    pilares: pilares,
    processo: $('#processo').value,
    comparativo: {
      partNumber: $('#comparativoPartNumber').value,
      descricao: $('#comparativoDescricao').value,
      tempoAntes: parseFloat($('#tempoAntes').value) || 0,
      tempoDepois: parseFloat($('#tempoDepois').value) || 0,
      status: $('#statusComparativo').value
    }
  };

  try {
    if (melhoriaEditando) {
      await melhoriaService.updateMelhoria(melhoriaEditando, dados);
    } else {
      await melhoriaService.addMelhoria(dados);
    }
    
    fecharModal();
    carregarMelhorias();
  } catch (error) {
    console.error('Erro ao salvar melhoria:', error);
    alert('Erro ao salvar melhoria. Tente novamente.');
  }
}

// Funções globais para os botões da tabela
window.editarMelhoria = async function(id) {
  const melhoria = melhorias.find(m => m.id === id);
  if (melhoria) {
    melhoriaEditando = id;
    $('#modalTitle').textContent = 'Editar Melhoria';
    $('#titulo').value = melhoria.titulo;
    $('#descricao').value = melhoria.descricao;
    $('#status').value = melhoria.status;
    $('#prioridade').value = melhoria.prioridade;
    $('#dataCriacao').value = melhoria.dataCriacao;
    $('#processo').value = melhoria.processo || '';
    
    // Limpar checkboxes primeiro
    $('#pilarSeguranca').checked = false;
    $('#pilarCusto').checked = false;
    $('#pilarQualidade').checked = false;
    $('#pilarProdutividade').checked = false;
    
    // Marcar os pilares selecionados
    if (melhoria.pilares) {
      if (melhoria.pilares.includes('Segurança')) $('#pilarSeguranca').checked = true;
      if (melhoria.pilares.includes('Custo')) $('#pilarCusto').checked = true;
      if (melhoria.pilares.includes('Qualidade')) $('#pilarQualidade').checked = true;
      if (melhoria.pilares.includes('Produtividade')) $('#pilarProdutividade').checked = true;
    }
    
    // Carregar dados do comparativo
    if (melhoria.comparativo) {
      $('#comparativoPartNumber').value = melhoria.comparativo.partNumber || '';
      $('#comparativoDescricao').value = melhoria.comparativo.descricao || '';
      $('#tempoAntes').value = melhoria.comparativo.tempoAntes || '';
      $('#tempoDepois').value = melhoria.comparativo.tempoDepois || '';
      $('#statusComparativo').value = melhoria.comparativo.status || 'Não Iniciado';
    } else {
      $('#comparativoPartNumber').value = '';
      $('#comparativoDescricao').value = '';
      $('#tempoAntes').value = '';
      $('#tempoDepois').value = '';
      $('#statusComparativo').value = 'Não Iniciado';
    }
    
    $('#modalMelhoria').classList.remove('hidden');
  }
};

window.excluirMelhoria = async function(id) {
  if (confirm('Tem certeza que deseja excluir esta melhoria?')) {
    try {
      await melhoriaService.deleteMelhoria(id);
      carregarMelhorias();
    } catch (error) {
      console.error('Erro ao excluir melhoria:', error);
      alert('Erro ao excluir melhoria. Tente novamente.');
    }
  }
};

// Função para gerar relatório PDF
async function gerarRelatorioPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  
  // Título
  pdf.setFontSize(20);
  pdf.text('Relatório de Melhorias', 20, 30);
  
  // Data
  pdf.setFontSize(12);
  pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 45);
  
  // Estatísticas
  const total = melhorias.length;
  const implementadas = melhorias.filter(m => m.status === 'Implementada').length;
  const emAndamento = melhorias.filter(m => m.status === 'Em Andamento').length;
  const pendentes = melhorias.filter(m => m.status === 'Pendente').length;
  
  pdf.text(`Total de Melhorias: ${total}`, 20, 65);
  pdf.text(`Implementadas: ${implementadas}`, 20, 75);
  pdf.text(`Em Andamento: ${emAndamento}`, 20, 85);
  pdf.text(`Pendentes: ${pendentes}`, 20, 95);
  
  // Lista de melhorias
  let y = 115;
  pdf.text('Lista de Melhorias:', 20, y);
  y += 15;
  
  melhorias.forEach((melhoria, index) => {
    if (y > 270) {
      pdf.addPage();
      y = 30;
    }
    
    pdf.text(`${index + 1}. ${melhoria.titulo}`, 20, y);
    y += 10;
    pdf.text(`   Status: ${melhoria.status} | Prioridade: ${melhoria.prioridade}`, 20, y);
    y += 10;
    pdf.text(`   Data: ${melhoria.dataCriacao}`, 20, y);
    y += 15;
  });
  
  pdf.save('relatorio-melhorias.pdf');
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', renderApp);

