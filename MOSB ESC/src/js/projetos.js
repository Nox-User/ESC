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
              <h1 class="text-3xl font-bold text-gray-900">Gestão de Projetos</h1>
              <p class="text-gray-600 mt-1">${day} de ${month} de ${year}</p>
            </div>
            <div class="flex gap-3">
              <button id="btnNovoProjeto" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                Novo Projeto
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
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Total de Projetos</p>
                <p class="text-2xl font-semibold text-gray-900" id="totalProjetos">0</p>
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
                <p class="text-sm font-medium text-gray-600">Concluídos</p>
                <p class="text-2xl font-semibold text-gray-900" id="projetosConcluidos">0</p>
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
                <p class="text-2xl font-semibold text-gray-900" id="projetosEmAndamento">0</p>
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
                <p class="text-sm font-medium text-gray-600">Atrasados</p>
                <p class="text-2xl font-semibold text-gray-900" id="projetosAtrasados">0</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Gráficos -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Status dos Projetos</h3>
            <canvas id="statusChart" width="400" height="200"></canvas>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Projetos por Mês</h3>
            <canvas id="monthChart" width="400" height="200"></canvas>
          </div>
        </div>

        <!-- Tabela de Projetos -->
        <div class="bg-white rounded-lg shadow-sm">
          <div class="p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Lista de Projetos</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Início</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Fim</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody id="tabelaProjetos" class="bg-white divide-y divide-gray-200">
                <!-- Conteúdo será inserido dinamicamente -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Novo/Editar Projeto -->
    <div id="modalProjeto" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
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
              
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Data de Fim Prevista</label>
                <input type="date" id="dataFim" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
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
  const tbody = $('#tabelaProjetos');
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

let statusChartInstance = null;
let monthChartInstance = null;

function renderizarGraficos() {
  if (!$('#statusChart') || !$('#monthChart')) return; // evita recriar sem canvas
  
  if (statusChartInstance) statusChartInstance.destroy();
  if (monthChartInstance) monthChartInstance.destroy();

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
      maintainAspectRatio: false
    }
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
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
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
  
  const dados = {
    nome: $('#nome').value,
    descricao: $('#descricao').value,
    status: $('#status').value,
    prioridade: $('#prioridade').value,
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


