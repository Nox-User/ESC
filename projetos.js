import { firebaseService, initializeFirebase } from './firebase-config.js';

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
  carregarProjetos();
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
let projetos = [];
let projetoEditando = null;

// Funções para interagir com o Firebase
const projetoService = {
  async getProjetos() {
    try {
      return await firebaseService.getProjetos();
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
      return [];
    }
  },

  async addProjeto(projeto) {
    try {
      return await firebaseService.addProjeto(projeto);
    } catch (error) {
      console.error("Erro ao adicionar projeto:", error);
      throw error;
    }
  },

  async updateProjeto(id, dados) {
    try {
      return await firebaseService.updateProjeto(id, dados);
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      throw error;
    }
  },

  async deleteProjeto(id) {
    try {
      return await firebaseService.deleteProjeto(id);
    } catch (error) {
      console.error("Erro ao deletar projeto:", error);
      throw error;
    }
  }
};

// Estado da aplicação para OFR
let ofrs = [];
let ofrEditando = null;

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
      { id: '1', title: 'Lista de Projetos', notifications: false },
      { id: '2', title: 'Relatórios', notifications: false },
      { id: '3', title: 'OFR - Gráficos', notifications: false },
      { id: '8', title: 'Controle de Atividade', notifications: false },
      { id: '4', title: 'Lista de OFR', notifications: false },
    ],
    [
      { id: '5', title: 'Ajuda', notifications: false },
      { id: '6', title: 'Suporte', notifications: false },
      { id: '7', title: 'Configurações', notifications: false },
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
          <div class="block sm:hidden xl:block ml-2 font-bold text-xl text-gray-900">PROJETOS</div>
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
          renderListaProjetos(content);
        } else if (selected === '2') {
          renderRelatorios(content);
        } else if (selected === '3') {
          renderOFRGraficos(content);   // OFR - Gráficos
        } else if (selected === '4') {
          renderListaOFR(content);      // Lista de OFR
        } else if (selected === '7') {
          renderConfiguracoes(content);
        } else if (selected === '8') {
          import('./controleAtividade.js').then(module => {
            module.renderControleAtividade();
          });
        }else {
          renderMainContent();
          atualizarDashboard();
          renderizarGraficos();
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
      3: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" clip-rule="evenodd"></path></svg>`,
      4: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path></svg>`,
      5: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path></svg>`,
      6: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>`,
      7: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path></svg>`,
      8: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" clip-rule="evenodd"></path></svg>`,
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

// Função para renderizar o conteúdo principal (dashboard)
function renderMainContent() {
  const content = $('#content');
  content.innerHTML = `
    <div class="max-w-7xl mx-auto p-2 mt-6">
      <!-- Dashboard Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 rounded-lg">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total de Projetos</p>
              <p class="text-2xl font-semibold text-gray-900" id="totalProjetos">0</p>
            </div>
          </div>
        </div>
        
        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <div class="flex items-center">
            <div class="p-2 bg-green-100 rounded-lg">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Concluídos</p>
              <p class="text-2xl font-semibold text-gray-900" id="projetosConcluidos">0</p>
            </div>
          </div>
        </div>
        
        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <div class="flex items-center">
            <div class="p-2 bg-yellow-100 rounded-lg">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Em Andamento</p>
              <p class="text-2xl font-semibold text-gray-900" id="projetosEmAndamento">0</p>
            </div>
          </div>
        </div>
        
        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <div class="flex items-center">
            <div class="p-2 bg-red-100 rounded-lg">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Atrasados</p>
              <p class="text-2xl font-semibold text-gray-900" id="projetosAtrasados">0</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráficos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Status dos Projetos</h3>
          <canvas id="statusChart"></canvas>
        </div>
        
        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Projetos por Mês</h3>
          <canvas id="monthChart"></canvas>
        </div>
      </div>

      <!-- Novos Gráficos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Complexidade dos Projetos</h3>
          <canvas id="complexidadeChart"></canvas>
        </div>
        
        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Projetos por Pilar</h3>
          <canvas id="pilaresChart"></canvas>
        </div>
      </div>
    </div>
  `;
}

// Funções para outras páginas do sidebar
function renderListaProjetos(content) {
  content.innerHTML = `
    <div class="max-w-7xl mx-auto mt-6">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Gestão de Projetos</h1>
            <p class="text-gray-600 mt-1">${day} de ${month} de ${year}</p>
          </div>
          <div class="flex gap-3">
            <button onclick="__onSidebarToggle()" class="sm:hidden bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium">
              Menu
            </button>
            <button id="btnNovoProjeto" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
              Novo Projeto
            </button>
            <button id="btnGerarRelatorio" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
              Gerar Relatório PDF
            </button>
          </div>
        </div>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 mb-6">Lista Completa de Projetos</h1>
      <div class="bg-white rounded-lg shadow-sm">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complexidade</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Number</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pilares</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Início</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Fim</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
            <tbody id="tabelaProjetosCompleta" class="bg-white divide-y divide-gray-200">
              <!-- Conteúdo será inserido dinamicamente -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
        <!-- Modal para Novo/Editar Projeto -->
    <div id="modalProjeto" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4" id="modalTitle">Novo Projeto</h3>
            <form id="formProjeto">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Nome do Projeto</label>
                <input type="text" id="nome" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea id="descricao" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required></textarea>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select id="status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Planejamento">Planejamento</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Cancelado">Cancelado</option>
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
                <label class="block text-sm font-medium text-gray-700 mb-2">Data de Início</label>
                <input type="date" id="dataInicio" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Data de Fim Prevista</label>
                <input type="date" id="dataFim" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Complexidade</label>
                <select id="complexidade" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Muito Alta">Muito Alta</option>
                </select>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Part Number</label>
                <input type="text" id="partNumber" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: PN-2024-001">
              </div>
              
              <div class="mb-6">
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
  $('#btnNovoProjeto').addEventListener('click', abrirModalNovoProjeto);
  $('#btnGerarRelatorio').addEventListener('click', gerarRelatorioPDF);
  $('#btnCancelar').addEventListener('click', fecharModal);
  $('#formProjeto').addEventListener('submit', salvarProjeto);

  renderizarTabela();
}

function renderRelatorios(content) {
  content.innerHTML = `
    <div class="max-w-7xl mx-auto mt-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">Relatórios</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Relatório de Status</h3>
          <p class="text-gray-600 mb-4">Gere um relatório detalhado sobre o status dos projetos.</p>
          <button onclick="gerarRelatorioPDF()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Gerar PDF
          </button>
        </div>
        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Relatório de Complexidade</h3>
          <p class="text-gray-600 mb-4">Analise a distribuição de complexidade dos projetos.</p>
          <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
            Em Breve
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderConfiguracoes(content) {
  content.innerHTML = `
    <div class="max-w-7xl mx-auto mt-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">Configurações</h1>
      <div class="rounded-lg bg-card-content p-4 shadow-lg">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Configurações do Sistema</h3>
        <p class="text-gray-600">Configurações em desenvolvimento...</p>
      </div>
    </div>
  `;

  // Event listeners
  $('#btnNovoProjeto').addEventListener('click', abrirModalNovoProjeto);
  $('#btnGerarRelatorio').addEventListener('click', gerarRelatorioPDF);
  $('#btnCancelar').addEventListener('click', fecharModal);
  $('#formProjeto').addEventListener('submit', salvarProjeto);

}

// Funções de manipulação de dados
async function carregarProjetos() {
  try {
    projetos = await projetoService.getProjetos();
    atualizarDashboard();
    renderizarTabela();
    renderizarGraficos();
  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
  }
}

function atualizarDashboard() {
  const total = projetos.length;
  const concluidos = projetos.filter(p => p.status === 'Concluído').length;
  const emAndamento = projetos.filter(p => p.status === 'Em Andamento').length;
  
  // Calcular projetos atrasados (data fim passou e não está concluído)
  const hoje = new Date();
  const atrasados = projetos.filter(p => {
    if (p.status === 'Concluído') return false;
    const dataFim = new Date(p.dataFim);
    return dataFim < hoje;
  }).length;

  $('#totalProjetos').textContent = total;
  $('#projetosConcluidos').textContent = concluidos;
  $('#projetosEmAndamento').textContent = emAndamento;
  $('#projetosAtrasados').textContent = atrasados;
}

function renderizarTabela() {
  const tbody = $('#tabelaProjetosCompleta');
  if (!tbody) return; // segurança

  tbody.innerHTML = projetos.map(projeto => `
    <tr>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${projeto.nome}</td>
      <td class="px-6 py-4 text-sm text-gray-500">${projeto.descricao.substring(0, 50)}...</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(projeto.status)}">
          ${projeto.status}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPrioridadeColor(projeto.prioridade)}">
          ${projeto.prioridade}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getComplexidadeColor(projeto.complexidade || 'Baixa')}">
          ${projeto.complexidade || 'Baixa'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${projeto.partNumber || '-'}</td>
      <td class="px-6 py-4 text-sm text-gray-500">${formatarPilares(projeto.pilares || [])}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${projeto.dataInicio}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${projeto.dataFim}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button onclick="editarProjeto('${projeto.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
        <button onclick="excluirProjeto('${projeto.id}')" class="text-red-600 hover:text-red-900">Excluir</button>
      </td>
    </tr>
  `).join('');
}

function getStatusColor(status) {
  switch(status) {
    case 'Concluído': return 'bg-green-100 text-green-800';
    case 'Em Andamento': return 'bg-blue-100 text-blue-800';
    case 'Planejamento': return 'bg-yellow-100 text-yellow-800';
    case 'Cancelado': return 'bg-red-100 text-red-800';
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

function getComplexidadeColor(complexidade) {
  switch(complexidade) {
    case 'Muito Alta': return 'bg-red-100 text-red-800';
    case 'Alta': return 'bg-orange-100 text-orange-800';
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
let complexidadeChartInstance = null;
let pilaresChartInstance = null;

function renderizarGraficos() {
  if (!$('#statusChart') || !$('#monthChart') || !$('#complexidadeChart') || !$('#pilaresChart')) return; // evita recriar sem canvas
  
  if (statusChartInstance) statusChartInstance.destroy();
  if (monthChartInstance) monthChartInstance.destroy();
  if (complexidadeChartInstance) complexidadeChartInstance.destroy();
  if (pilaresChartInstance) pilaresChartInstance.destroy();

  // Gráfico de Status
  const statusCtx = $('#statusChart').getContext('2d');
  const statusData = {
    labels: ['Concluídos', 'Em Andamento', 'Planejamento', 'Cancelados'],
    datasets: [{
      data: [
        projetos.filter(p => p.status === 'Concluído').length,
        projetos.filter(p => p.status === 'Em Andamento').length,
        projetos.filter(p => p.status === 'Planejamento').length,
        projetos.filter(p => p.status === 'Cancelado').length
      ],
      backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']
    }]
  };

  statusChartInstance = new Chart(statusCtx, {
    type: 'doughnut',
    data: statusData,
      options: {
        responsive: true,
        maintainAspectRatio: true, 
        aspectRatio: 1, 
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 14 }
            }
          },
          tooltip: { enabled: true },
          datalabels: {
            color: '#000000ff',
            font: { weight: 'bold', size: 13 },
            formatter: (value, ctx) => {
              const total = ctx.chart.data.datasets[0].data
                .reduce((a, b) => a + b, 0);
              const perc = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              // mostra só se > 0
              return value > 0 ? `${value}\n(${perc}%)` : '';
            }
          }
        }
      }
          ,
      plugins: [ChartDataLabels] // precisa registrar
  });

  // Gráfico por Mês
  const monthCtx = $('#monthChart').getContext('2d');
  const monthData = agruparProjetosPorMes();
  
  monthChartInstance = new Chart(monthCtx, {
    type: 'bar',
    data: {
      labels: monthData.map(m => m.mes),
      datasets: [{
        label: 'Projetos',
        data: monthData.map(m => m.quantidade),
        backgroundColor: '#3B82F6'
      }]
    },
      options: {
        responsive: true,
        maintainAspectRatio: true, 
        aspectRatio: 1, 
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 14 }
            }
          },
          tooltip: { enabled: true },
          datalabels: {
            color: '#000000ff',
            font: { weight: 'bold', size: 13 },
            formatter: (value, ctx) => {
              const total = ctx.chart.data.datasets[0].data
                .reduce((a, b) => a + b, 0);
              const perc = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              // mostra só se > 0
              return value > 0 ? `${value}\n(${perc}%)` : '';
            }
          }
        }
      }
          ,
      plugins: [ChartDataLabels] // precisa registrar
  });

  // Gráfico de Complexidade
  const complexidadeCtx = $('#complexidadeChart').getContext('2d');
  const complexidadeData = agruparProjetosPorComplexidade();
  
  complexidadeChartInstance = new Chart(complexidadeCtx, {
    type: 'pie',
    data: {
      labels: complexidadeData.map(c => c.complexidade),
      datasets: [{
        data: complexidadeData.map(c => c.quantidade),
        backgroundColor: ['#10B981', '#F59E0B', '#F97316', '#EF4444']
      }]
    },
      options: {
        responsive: true,
        maintainAspectRatio: true, 
        aspectRatio: 1, 
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 14 }
            }
          },
          tooltip: { enabled: true },
          datalabels: {
            color: '#000000ff',
            font: { weight: 'bold', size: 13 },
            formatter: (value, ctx) => {
              const total = ctx.chart.data.datasets[0].data
                .reduce((a, b) => a + b, 0);
              const perc = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              // mostra só se > 0
              return value > 0 ? `${value}\n(${perc}%)` : '';
            }
          }
        }
      }
          ,
      plugins: [ChartDataLabels] // precisa registrar
  });

  // Gráfico de Pilares
  const pilaresCtx = $('#pilaresChart').getContext('2d');
  const pilaresData = agruparProjetosPorPilar();
  
  pilaresChartInstance = new Chart(pilaresCtx, {
    type: 'bar',
    data: {
      labels: pilaresData.map(p => p.pilar),
      datasets: [{
        label: 'Projetos',
        data: pilaresData.map(p => p.quantidade),
        backgroundColor: ['#8B5CF6', '#06B6D4', '#84CC16', '#F59E0B']
      }]
    },
      options: {
        responsive: true,
        maintainAspectRatio: true, 
        aspectRatio: 1, 
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 14 }
            }
          },
          tooltip: { enabled: true },
          datalabels: {
            color: '#000000ff',
            font: { weight: 'bold', size: 13 },
            formatter: (value, ctx) => {
              const total = ctx.chart.data.datasets[0].data
                .reduce((a, b) => a + b, 0);
              const perc = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              // mostra só se > 0
              return value > 0 ? `${value}\n(${perc}%)` : '';
            }
          }
        }
      }
          ,
      plugins: [ChartDataLabels] // precisa registrar
  });
}


function agruparProjetosPorMes() {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const resultado = meses.map(mes => ({ mes, quantidade: 0 }));

  projetos.forEach(projeto => {
    if (projeto.dataInicio) {
      const data = new Date(projeto.dataInicio);
      const mesIndex = data.getMonth();
      if (mesIndex >= 0 && mesIndex < 12) {
        resultado[mesIndex].quantidade++;
      }
    }
  });

  return resultado;
}

function agruparProjetosPorComplexidade() {
  const complexidades = ['Baixa', 'Média', 'Alta', 'Muito Alta'];
  const resultado = complexidades.map(complexidade => ({ complexidade, quantidade: 0 }));

  projetos.forEach(projeto => {
    const complexidade = projeto.complexidade || 'Baixa';
    const index = complexidades.indexOf(complexidade);
    if (index >= 0) {
      resultado[index].quantidade++;
    }
  });

  return resultado;
}

function agruparProjetosPorPilar() {
  const pilares = ['Segurança', 'Custo', 'Qualidade', 'Produtividade'];
  const resultado = pilares.map(pilar => ({ pilar, quantidade: 0 }));

  projetos.forEach(projeto => {
    if (projeto.pilares && Array.isArray(projeto.pilares)) {
      projeto.pilares.forEach(pilar => {
        const index = pilares.indexOf(pilar);
        if (index >= 0) {
          resultado[index].quantidade++;
        }
      });
    }
  });

  return resultado;
}

// Funções de modal
function abrirModalNovoProjeto() {
  projetoEditando = null;
  $('#modalTitle').textContent = 'Novo Projeto';
  $('#formProjeto').reset();
  $('#dataInicio').value = new Date().toISOString().split('T')[0];
  $('#modalProjeto').classList.remove('hidden');
}

function fecharModal() {
  $('#modalProjeto').classList.add('hidden');
  projetoEditando = null;
}

async function salvarProjeto(e) {
  e.preventDefault();
  
  // Coletando os pilares selecionados
  const pilares = [];
  if ($('#pilarSeguranca').checked) pilares.push('Segurança');
  if ($('#pilarCusto').checked) pilares.push('Custo');
  if ($('#pilarQualidade').checked) pilares.push('Qualidade');
  if ($('#pilarProdutividade').checked) pilares.push('Produtividade');
  
  const dados = {
    nome: $('#nome').value,
    descricao: $('#descricao').value,
    status: $('#status').value,
    prioridade: $('#prioridade').value,
    complexidade: $('#complexidade').value,
    partNumber: $('#partNumber').value,
    pilares: pilares,
    dataInicio: $('#dataInicio').value,
    dataFim: $('#dataFim').value
  };

  try {
    if (projetoEditando) {
      await projetoService.updateProjeto(projetoEditando, dados);
    } else {
      await projetoService.addProjeto(dados);
    }
    
    fecharModal();
    carregarProjetos();
  } catch (error) {
    console.error('Erro ao salvar projeto:', error);
    alert('Erro ao salvar projeto. Tente novamente.');
  }
}

// Funções globais para os botões da tabela
window.editarProjeto = async function(id) {
  const projeto = projetos.find(p => p.id === id);
  if (projeto) {
    projetoEditando = id;
    $('#modalTitle').textContent = 'Editar Projeto';
    $('#nome').value = projeto.nome;
    $('#descricao').value = projeto.descricao;
    $('#status').value = projeto.status;
    $('#prioridade').value = projeto.prioridade;
    $('#complexidade').value = projeto.complexidade || 'Baixa';
    $('#partNumber').value = projeto.partNumber || '';
    
    // Limpar checkboxes primeiro
    $('#pilarSeguranca').checked = false;
    $('#pilarCusto').checked = false;
    $('#pilarQualidade').checked = false;
    $('#pilarProdutividade').checked = false;
    
    // Marcar os pilares selecionados
    if (projeto.pilares) {
      if (projeto.pilares.includes('Segurança')) $('#pilarSeguranca').checked = true;
      if (projeto.pilares.includes('Custo')) $('#pilarCusto').checked = true;
      if (projeto.pilares.includes('Qualidade')) $('#pilarQualidade').checked = true;
      if (projeto.pilares.includes('Produtividade')) $('#pilarProdutividade').checked = true;
    }
    
    $('#dataInicio').value = projeto.dataInicio;
    $('#dataFim').value = projeto.dataFim;
    $('#modalProjeto').classList.remove('hidden');
  }
};

window.excluirProjeto = async function(id) {
  if (confirm('Tem certeza que deseja excluir este projeto?')) {
    try {
      await projetoService.deleteProjeto(id);
      carregarProjetos();
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      alert('Erro ao excluir projeto. Tente novamente.');
    }
  }
};

let ofrSetorChartInstance = null;
let ofrTempoSetorChartInstance = null;
let ofrAtividadeChartInstance = null;
let ofrTempoAtividadeChartInstance = null;

// Função para renderizar os gráficos da aba OFR
function renderizarOFRGraficos(ofrsFiltrados) {
  if (!ofrsFiltrados) ofrsFiltrados = ofrs;
  console.log('OFRs filtrados:', ofrsFiltrados);

  const setores = [...new Set(ofrsFiltrados.map(o => o.setor || 'Outro'))];
  const processosSetor = setores.map(setor =>
    ofrsFiltrados.filter(o => o.setor === setor).length
  );

  const tempoSetor = setores.map(setor =>
    ofrsFiltrados
      .filter(o => o.setor === setor)
      .reduce((sum, o) => sum + converterTempoParaMinutos(o.tempoProcesso), 0)
  );

  const atividades = ['Fabricação', 'Reparo/Retrabalho'];
  const totalTempo = ofrsFiltrados.reduce((sum, o) => sum + converterTempoParaMinutos(o.tempoProcesso), 0);

  const tempoFabricacao = ofrsFiltrados
    .filter(o => (o.atividade || '').toLowerCase().includes('fabrica'))
    .reduce((sum, o) => sum + converterTempoParaMinutos(o.tempoProcesso), 0);

  const tempoReparo = ofrsFiltrados
    .filter(o => (o.atividade || '').toLowerCase().includes('reparo') || (o.atividade || '').toLowerCase().includes('retrabalho'))
    .reduce((sum, o) => sum + converterTempoParaMinutos(o.tempoProcesso), 0);

  const percAtividades = [
    totalTempo ? (tempoFabricacao / totalTempo) * 100 : 0,
    totalTempo ? (tempoReparo / totalTempo) * 100 : 0
  ];

  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  const tempoFabricacaoMes = meses.map((_, index) =>
    ofrsFiltrados
      .filter(o => new Date(o.dataSolicitacao).getMonth() === index && (o.atividade || '').toLowerCase().includes('fabrica'))
      .reduce((sum, o) => sum + converterTempoParaMinutos(o.tempoProcesso), 0)
  );

  const tempoReparoMes = meses.map((_, index) =>
    ofrsFiltrados
      .filter(o => new Date(o.dataSolicitacao).getMonth() === index && ((o.atividade || '').toLowerCase().includes('reparo') || (o.atividade || '').toLowerCase().includes('retrabalho')))
      .reduce((sum, o) => sum + converterTempoParaMinutos(o.tempoProcesso), 0)
  );

  if (ofrSetorChartInstance) ofrSetorChartInstance.destroy();
  if (ofrTempoSetorChartInstance) ofrTempoSetorChartInstance.destroy();
  if (ofrAtividadeChartInstance) ofrAtividadeChartInstance.destroy();
  if (ofrTempoAtividadeChartInstance) ofrTempoAtividadeChartInstance.destroy();

  const cores = [
    '#3B82F6', '#F97316', '#10B981', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F59E0B', '#EF4444'
  ];

  const ctxSetor = document.getElementById('ofrSetorChart').getContext('2d');
  ofrSetorChartInstance = new Chart(ctxSetor, {
    type: 'bar',
    data: {
      labels: setores,
      datasets: [{
        data: processosSetor,
        backgroundColor: setores.map((_, i) => cores[i % cores.length])
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw} processos`
          }
        }
      },
      scales: {
        x: { beginAtZero: true },
        y: {
          ticks: { color: '#333', font: { weight: 'bold' } }
        }
      }
    }
  });

  const ctxTempoSetor = document.getElementById('ofrTempoSetorChart').getContext('2d');
  ofrTempoSetorChartInstance = new Chart(ctxTempoSetor, {
    type: 'bar',
    data: {
      labels: setores,
      datasets: [
        {
          label: 'Tempo (h)',
          data: tempoSetor.map(v => (v / 60).toFixed(1)),
          backgroundColor: '#3B82F6'
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} h`
          }
        }
      },
      scales: {
        x: { beginAtZero: true, title: { display: true, text: 'Horas' } },
        y: { ticks: { color: '#333', font: { weight: 'bold' } } }
      }
    }
  });

  const ctxAtividade = document.getElementById('ofrAtividadeChart').getContext('2d');
  ofrAtividadeChartInstance = new Chart(ctxAtividade, {
    type: 'pie',
    data: {
      labels: atividades,
      datasets: [{
        data: percAtividades,
        backgroundColor: ['#3B82F6', '#F97316']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const ctxTempoAtividade = document.getElementById('ofrTempoAtividadeChart').getContext('2d');
  ofrTempoAtividadeChartInstance = new Chart(ctxTempoAtividade, {
    type: 'bar',
    data: {
      labels: meses,
      datasets: [
        { label: 'Fabricação', data: tempoFabricacaoMes, backgroundColor: '#3B82F6' },
        { label: 'Reparo/Retrabalho', data: tempoReparoMes, backgroundColor: '#F97316' }
      ]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  const filtroMes = $('#filtroMes');
  const filtroAno = $('#filtroAno');
  if (filtroMes && filtroAno) {
    filtroMes.addEventListener('change', atualizarDashboardOFR);
    filtroAno.addEventListener('change', atualizarDashboardOFR);
  }
}


function renderOFRGraficos(content) {
  content.innerHTML = `
    <div class="max-w-7xl mx-auto p-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">OFR - Gráficos</h1>
      <div class="flex items-center gap-2 mb-4">
        <label class="text-sm font-medium text-gray-600">Filtrar por mês:</label>
        <select id="filtroMes" class="border px-2 py-1 rounded">
          <option value="0">Jan</option>
          <option value="1">Fev</option>
          <option value="2">Mar</option>
          <option value="3">Abr</option>
          <option value="4">Mai</option>
          <option value="5">Jun</option>
          <option value="6">Jul</option>
          <option value="7">Ago</option>
          <option value="8">Set</option>
          <option value="9">Out</option>
          <option value="10">Nov</option>
          <option value="11">Dez</option>
        </select>

        <label class="text-sm font-medium text-gray-600">Ano:</label>
        <input type="number" id="filtroAno" class="border px-2 py-1 rounded w-20" value="2025">
      </div>

      <!-- Cards resumo -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 rounded-lg">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total de OFR</p>
              <p class="text-2xl font-semibold text-gray-900" id="totalOFR">0</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <div class="flex items-center">
            <div class="p-2 bg-green-100 rounded-lg">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">OFR no Mês</p>
              <p class="text-2xl font-semibold text-gray-900" id="ofrMes">0</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <div class="flex items-center">
            <div class="p-2 bg-yellow-100 rounded-lg">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Tempo Gasto (h)</p>
              <p class="text-2xl font-semibold text-gray-900" id="tempoOFR">0</p>
            </div>
          </div>
        </div>
      </div>

      <!--- Gráficos --->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Processo por Setor</h3>
          <canvas id="ofrSetorChart"></canvas>
        </div>
        
        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Tempo de Processo por Setor</h3>
          <canvas id="ofrTempoSetorChart"></canvas>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">% Processo por Atividade</h3>
          <canvas id="ofrAtividadeChart"></canvas>
        </div>
        
        <div class="rounded-lg bg-card-content p-4 shadow-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Tempo de Processo por Atividade</h3>
          <canvas id="ofrTempoAtividadeChart"></canvas>
        </div>
      </div>
    </div>
  `;

  // Atualiza os cards com dados reais
  atualizarDashboardOFR();

  // Renderiza os gráficos
  renderizarOFRGraficos();

  // ⚡ Primeiro carrega os dados do Firebase
  carregarOFRs();
}

function renderListaOFR(content) {
  content.innerHTML = `
    <div class="max-w-7xl mx-auto mt-6">
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6 flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900">Lista de OFR</h1>
        <button id="btnNovaOFR" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
          Nova OFR
        </button>
      </div>

      <div class="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº O.F.R</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Solicitação</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atividade</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Necessidade</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tempo de Processo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody id="tabelaOFR" class="bg-white divide-y divide-gray-200">
            <!-- Preenchido dinamicamente -->
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal para Nova OFR -->
    <div id="modalOFR" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4" id="modalOFRTitle">Nova OFR</h3>
            <form id="formOFR">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Nº O.F.R</label>
                <input type="text" id="ofrNumero" class="w-full px-3 py-2 border rounded-md" required>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium">Data Solicitação</label>
                <input type="date" id="ofrDataSolicitacao" class="w-full px-3 py-2 border rounded-md" required>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium">Nome Solicitante</label>
                <input type="text" id="ofrSolicitante" class="w-full px-3 py-2 border rounded-md" required>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium">Setor</label>
                <input type="text" id="ofrSetor" class="w-full px-3 py-2 border rounded-md" required>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium">Atividade</label>
                <input type="text" id="ofrAtividade" class="w-full px-3 py-2 border rounded-md" required>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium">Descrição da Atividade</label>
                <textarea id="ofrDescricao" class="w-full px-3 py-2 border rounded-md"></textarea>
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium">Data Necessidade</label>
                <input type="date" id="ofrDataNecessidade" class="w-full px-3 py-2 border rounded-md">
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium">Data Finalização</label>
                <input type="date" id="ofrDataFinalizacao" class="w-full px-3 py-2 border rounded-md">
              </div>
              <div class="mb-4">
                <label class="block text-sm font-medium">Data Retirada</label>
                <input type="date" id="ofrDataRetirada" class="w-full px-3 py-2 border rounded-md">
              </div>
              <div class="mb-6">
                <label class="block text-sm font-medium">Tempo de Processo</label>
                <input type="text" id="ofrTempoProcesso" class="w-full px-3 py-2 border rounded-md" placeholder="hh:mm:ss">
              </div>
              <div class="flex justify-end gap-3">
                <button type="button" id="btnCancelarOFR" class="px-4 py-2 bg-gray-300 rounded-md">Cancelar</button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
    // Adiciona eventos após renderizar a tela
  setTimeout(() => {
    $('#btnNovaOFR').addEventListener('click', abrirModalNovaOFR);
    $('#btnCancelarOFR').addEventListener('click', fecharModalOFR);
    $('#formOFR').addEventListener('submit', salvarOFR);

    // ⚡ chama carregarOFRs para realmente buscar do Firebase
    carregarOFRs();
  }, 0);
}

function abrirModalNovaOFR() {
  ofrEditando = null;
  $('#modalOFRTitle').textContent = 'Nova OFR';
  $('#formOFR').reset();

  const anoAtual = new Date().getFullYear();

  if (ofrs && ofrs.length > 0) {
    // 🔎 Filtra só as OFRs do ano atual
    const numerosAnoAtual = ofrs
      .filter(o => o.numero && o.numero.endsWith(`|${anoAtual}`))
      .map(o => parseInt(o.numero.split('|')[0], 10))
      .filter(n => !isNaN(n));

    const max = numerosAnoAtual.length > 0 ? Math.max(...numerosAnoAtual) : 0;
    const proximo = (max + 1).toString().padStart(4, "0");

    $('#ofrNumero').value = `${proximo}|${anoAtual}`;
  } else {
    $('#ofrNumero').value = `0001|${anoAtual}`;
  }

  $('#modalOFR').classList.remove('hidden');
}



function fecharModalOFR() {
  $('#modalOFR').classList.add('hidden');
  ofrEditando = null;
}

async function salvarOFR(e) {
  e.preventDefault();

  const dados = {
    numero: $('#ofrNumero').value,
    dataSolicitacao: $('#ofrDataSolicitacao').value,
    solicitante: $('#ofrSolicitante').value,
    setor: $('#ofrSetor').value,
    atividade: $('#ofrAtividade').value,
    descricao: $('#ofrDescricao').value,
    dataNecessidade: $('#ofrDataNecessidade').value,
    dataFinalizacao: $('#ofrDataFinalizacao').value,
    dataRetirada: $('#ofrDataRetirada').value,
    tempoProcesso: $('#ofrTempoProcesso').value
  };

  try {
    if (ofrEditando) {
      await firebaseService.updateOFR(ofrEditando, dados);
    } else {
      await firebaseService.addOFR(dados);
    }
    fecharModalOFR();
    carregarOFRs();
  } catch (error) {
    console.error('Erro ao salvar OFR:', error);
    alert('Erro ao salvar OFR. Tente novamente.');
  }
}

async function carregarOFRs() {
  try {
    ofrs = await firebaseService.getOFRs();
    renderizarTabelaOFR();
    atualizarDashboardOFR();

    // Agora sim, gerar gráficos reais
    renderizarOFRGraficos();
  } catch (error) {
    console.error('Erro ao carregar OFRs:', error);
  }
}

function getOFRsFiltrados() {
  const mesSelecionado = parseInt($('#filtroMes').value);
  const anoSelecionado = parseInt($('#filtroAno').value);

  return ofrs.filter(o => {
    if (!o.dataSolicitacao) return false;
    const d = new Date(o.dataSolicitacao);
    return d.getMonth() === mesSelecionado && d.getFullYear() === anoSelecionado;
  });
}

function converterTempoParaMinutos(tempo) {
  if (!tempo) return 0;
  if (typeof tempo === "string" && tempo.includes(":")) {
    const [h, m, s] = tempo.split(':').map(Number);
    return (h * 60) + m + (s ? s / 60 : 0);
  }
  if (!isNaN(tempo)) return Number(tempo);
  return 0;
}

function formatarMinutosParaHoras(minutos) {
  const h = Math.floor(minutos / 60);
  const m = Math.floor(minutos % 60);
  const s = Math.round((minutos - Math.floor(minutos)) * 60);
  let resultado = "";
  if (h > 0) resultado += `${h}h`;
  if (m > 0) resultado += `${m}min`;
  if (s > 0 && h === 0) resultado += `${s}s`;
  if (!resultado) resultado = "0h";
  return resultado;
}

function atualizarDashboardOFR() {
  const total = ofrs.length;
  $('#totalOFR').textContent = total;

  const mesSelecionado = parseInt($('#filtroMes').value);
  const anoSelecionado = parseInt($('#filtroAno').value);

  const ofrsMes = ofrs.filter(o => {
    if (!o.dataSolicitacao) return false;
    const d = new Date(o.dataSolicitacao);
    return d.getMonth() === mesSelecionado && d.getFullYear() === anoSelecionado;
  });

  $('#ofrMes').textContent = ofrsMes.length;

  const tempoTotalMinutos = ofrsMes.reduce((sum, o) => sum + converterTempoParaMinutos(o.tempoProcesso), 0);
  $('#tempoOFR').textContent = formatarMinutosParaHoras(tempoTotalMinutos);


  // 🔄 Atualiza também os gráficos filtrados
  renderizarOFRGraficos(ofrsMes);
}

function renderizarTabelaOFR() {
  const tbody = $('#tabelaOFR');
  if (!tbody) return;

  tbody.innerHTML = ofrs.map(ofr => `
    <tr>
      <td class="px-6 py-4">${ofr.numero}</td>
      <td class="px-6 py-4">${ofr.dataSolicitacao || '-'}</td>
      <td class="px-6 py-4">${ofr.setor || '-'}</td>
      <td class="px-6 py-4">${ofr.atividade || '-'}</td>
      <td class="px-6 py-4">${ofr.descricao || '-'}</td>
      <td class="px-6 py-4">${ofr.dataNecessidade || '-'}</td>
      <td class="px-6 py-4">${ofr.tempoProcesso || '-'}</td>
      <td class="px-6 py-4">
        <button onclick="editarOFR('${ofr.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
        <button onclick="excluirOFR('${ofr.id}')" class="text-red-600 hover:text-red-900">Excluir</button>
      </td>
    </tr>
  `).join('');
}

window.editarOFR = async function(id) {
  const ofr = ofrs.find(o => o.id === id);
  if (ofr) {
    ofrEditando = id;
    $('#modalOFRTitle').textContent = 'Editar OFR';
    $('#ofrNumero').value = ofr.numero;
    $('#ofrDataSolicitacao').value = ofr.dataSolicitacao || '';
    $('#ofrSolicitante').value = ofr.solicitante || '';
    $('#ofrSetor').value = ofr.setor || '';
    $('#ofrAtividade').value = ofr.atividade || '';
    $('#ofrDescricao').value = ofr.descricao || '';
    $('#ofrDataNecessidade').value = ofr.dataNecessidade || '';
    $('#ofrDataFinalizacao').value = ofr.dataFinalizacao || '';
    $('#ofrDataRetirada').value = ofr.dataRetirada || '';
    $('#ofrTempoProcesso').value = ofr.tempoProcesso || '';
    $('#modalOFR').classList.remove('hidden');
  }
};

window.excluirOFR = async function(id) {
  if (confirm('Tem certeza que deseja excluir esta OFR?')) {
    try {
      await firebaseService.deleteOFR(id);
      carregarOFRs();
    } catch (error) {
      console.error('Erro ao excluir OFR:', error);
    }
  }
};

// Função para gerar relatório PDF
async function gerarRelatorioPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  
  // Título
  pdf.setFontSize(20);
  pdf.text('Relatório de Projetos', 20, 30);
  
  // Data
  pdf.setFontSize(12);
  pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 45);
  
  // Estatísticas
  const total = projetos.length;
  const concluidos = projetos.filter(p => p.status === 'Concluído').length;
  const emAndamento = projetos.filter(p => p.status === 'Em Andamento').length;
  const planejamento = projetos.filter(p => p.status === 'Planejamento').length;
  
  pdf.text(`Total de Projetos: ${total}`, 20, 65);
  pdf.text(`Concluídos: ${concluidos}`, 20, 75);
  pdf.text(`Em Andamento: ${emAndamento}`, 20, 85);
  pdf.text(`Em Planejamento: ${planejamento}`, 20, 95);
  
  // Lista de projetos
  let y = 115;
  pdf.text('Lista de Projetos:', 20, y);
  y += 15;
  
  projetos.forEach((projeto, index) => {
    if (y > 270) {
      pdf.addPage();
      y = 30;
    }
    
    pdf.text(`${index + 1}. ${projeto.nome}`, 20, y);
    y += 10;
    pdf.text(`   Status: ${projeto.status} | Prioridade: ${projeto.prioridade}`, 20, y);
    y += 10;
    pdf.text(`   Início: ${projeto.dataInicio} | Fim: ${projeto.dataFim}`, 20, y);
    y += 15;
  });
  
  pdf.save('relatorio-projetos.pdf');
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
  renderApp();       // monta a estrutura uma única vez
  carregarProjetos(); // depois só atualiza dados
});

// ======= Máscara/formatador para #ofrTempoProcesso (delegation, funciona para elemento criado depois) =======

// Formata enquanto digita: "123456" -> "12:34:56", "1234" -> "12:34", etc.
function formatarTempoAoDigitar(valor) {
  const digits = (valor || '').replace(/\D/g, '').slice(0,6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0,2) + ':' + digits.slice(2);
  return digits.slice(0,2) + ':' + digits.slice(2,4) + ':' + digits.slice(4,6);
}

// Formata para exibir completo (ao perder o foco ou quando carregar um valor existente)
// Preenche com zeros à direita se necessário: "1:2" -> "01:02:00"
function formatarTempoCompleto(valor) {
  if (!valor) return '';
  // Se já tem ":", normaliza e completa
  if (typeof valor === 'string' && valor.includes(':')) {
    const parts = valor.split(':').map(p => p.replace(/\D/g,''));
    while (parts.length < 3) parts.push('00');
    const [h,m,s] = parts.map(p => p.padStart(2,'0').slice(0,2));
    return `${h}:${m}:${s}`;
  }
  // Se é apenas dígitos (ex: "004000" ou "1234")
  const digits = String(valor).replace(/\D/g,'').slice(0,6).padEnd(6,'0');
  const h = digits.slice(0,2);
  const m = digits.slice(2,4);
  const s = digits.slice(4,6);
  return `${h}:${m}:${s}`;
}

// Delegation: aplica formatação enquanto digita
document.addEventListener('input', (e) => {
  const el = e.target;
  if (!el || el.id !== 'ofrTempoProcesso') return;

  const old = el.value;
  const novo = formatarTempoAoDigitar(old);
  // atualiza o campo (coloca o cursor ao final)
  el.value = novo;
  el.setSelectionRange(el.value.length, el.value.length);
});

// Quando sai do campo, completa para hh:mm:ss
document.addEventListener('focusout', (e) => {
  const el = e.target;
  if (!el || el.id !== 'ofrTempoProcesso') return;
  el.value = formatarTempoCompleto(el.value);
});

// Helper para formatar valores ao preencher o modal (usado abaixo em editar/abrir)
function formatarTempoParaCampo(valor) {
  if (!valor) return '';
  return formatarTempoCompleto(valor);
}


