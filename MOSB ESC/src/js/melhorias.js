import { firebaseService } from './firebase-config.js';

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
function renderApp() {
  const root = $('#root');
  root.innerHTML = `
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-7xl mx-auto">
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

        <!-- Dashboard Cards -->
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
        </div>

        <!-- Tabela de Melhorias -->
        <div class="bg-white rounded-lg shadow-sm">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Lista de Melhorias</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>
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
    </div>

    <!-- Modal para Nova/Editar Melhoria -->
    <div id="modalMelhoria" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
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
              
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Data de Criação</label>
                <input type="date" id="dataCriacao" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
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

  // Carregar dados
  carregarMelhorias();
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

let statusChartInstance = null;
let monthChartInstance = null;

function renderizarGraficos() {
  // Gráfico de Status
  const statusCtx = $('#statusChart').getContext('2d');
  if (statusChartInstance) {
    statusChartInstance.destroy(); // destrói o gráfico anterior
  }
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

  // Gráfico por Mês
  const monthCtx = $('#monthChart').getContext('2d');
  if (monthChartInstance) {
    monthChartInstance.destroy(); // destrói o gráfico anterior
  }
  const monthData = agruparMelhoriasPorMes();
  
  monthChartInstance = new Chart(monthCtx, {
    type: 'bar',
    data: {
      labels: monthData.map(m => m.mes),
      datasets: [{
        label: 'Melhorias',
        data: monthData.map(m => m.quantidade),
        backgroundColor: '#3B82F6'
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
  
  const dados = {
    titulo: $('#titulo').value,
    descricao: $('#descricao').value,
    status: $('#status').value,
    prioridade: $('#prioridade').value,
    dataCriacao: $('#dataCriacao').value
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

