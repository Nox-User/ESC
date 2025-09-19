

//--------HELP---------//

//------INFORMAÇÕES DE DATA-------//
const now = new Date();
const month = now.toLocaleString('default', { month: 'long' }).toUpperCase();
const monthnumber = now.getMonth() + 1;
const year = now.getFullYear(); 
const day = now.getDate();


const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const clsx = (...parts) => parts.filter(Boolean).join(' ');
const map = (value, sMin, sMax, dMin, dMax) => dMin + ((value - sMin) / (sMax - sMin)) * (dMax - dMin);

function animateValue({from=0, to=1, duration=800, onUpdate, easing=(t)=>t, onComplete}){
  const start = performance.now();
  function frame(now){
    const p = Math.min(1, (now-start)/duration);
    const v = from + (to-from)*easing(p);
    onUpdate && onUpdate(v);
    if(p < 1){ requestAnimationFrame(frame); } else { onComplete && onComplete(); }
  }
  requestAnimationFrame(frame);
}



// ========= Gráfico ========
function agruparProdutosPorMes(produtos, anos, mesSelecionado) {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  const resultado = meses.map((m) => ({
    name: m,
    produtos: 0,
    finalizados: 0,
    meta: 43
  }));

  produtos.forEach(p => {
    const data = p["ENTRADA"];
    if (!data) return;
    const partes = data.split("/");
    if (partes.length < 3) return;

    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10);
    const ano = parseInt(partes[2], 10);

    if (anos && ano !== anos) return;
    if (mesSelecionado && mes !== mesSelecionado) return;

    const indiceMes = mes - 1;
    resultado[indiceMes].produtos += 1;
    if ((p.STATUS || "").toUpperCase() === "FINALIZADO") {
      resultado[indiceMes].finalizados += 1;
    }
  });

  return resultado;
}


// Importar configuração do Firebase
import { firebaseService } from './firebase-config.js';

let produtosanuais = [];
let graphData = [];
let statusData = [];

// Função para carregar dados do Firebase
export async function carregarDadosFirebase() {
  try {
    console.log("Carregando dados do Firebase...");
    produtosanuais = await firebaseService.getProdutos();
    console.log("Produtos carregados do Firebase:", produtosanuais);
    
    graphData = agruparProdutosPorMes(produtosanuais);
    console.log("Dados do gráfico:", graphData);
    
    statusData = gerarStatusData(produtosanuais, year, month);
    console.log("Dados do Card:", statusData);
    
    // inicia a aplicação só depois dos dados carregados
    App();
    bindFiltros();
  } catch (error) {
    console.error("Erro ao carregar dados do Firebase:", error);
    alert("Erro ao carregar dados do Firebase. Verifique a configuração.");
  }
}

// Inicializar carregamento dos dados


function bindFiltros(){
  const selectAno = document.getElementById("anos");
  const selectMes = document.getElementById("mes");
  if (!selectAno || !selectMes) return;
  

  function atualizar(){
    const ano = selectAno.value ? parseInt(selectAno.value, 10) : null;
    const mes = selectMes.value ? parseInt(selectMes.value, 10) : null;

    graphData = agruparProdutosPorMes(produtosanuais, ano, mes);
    Graph(document.getElementById("graph"));  
    AddComponent(document.getElementById("addComponent"), ano, mes); // <-- passa os dois
    Clientes(document.getElementById("clientes"), ano, mes);
    Satisfaction(document.getElementById("satisfaction"), ano, mes);
    statusData = gerarStatusData(produtosanuais, ano, mes);

    const cards = document.getElementById("cards");
    if (cards) {
      cards.innerHTML = "";
      statusData.forEach(e => cards.appendChild(statusCard(e, mes)));
    }
  }

  selectAno.addEventListener("change", atualizar);
  selectMes.addEventListener("change", atualizar);
}

 

function gerarStatusData(produtos, anoSelecionado, mesSelecionado) {
  const statusBase = [
    { id: 1, name: 'NÃO INICIADO', position: "Quantidade de PPAP's não iniciados"},
    { id: 2, name: 'EM ANDAMENTO', position: "Quantidade de PPAP's em andamento"},
    { id: 3, name: 'FINALIZADO', position: "Quantidade de PPAP's finalizados"},
  ];

  const contagem = {
    "NÃO INICIADO": 0,
    "EM ANDAMENTO": 0,
    "FINALIZADO": 0
  };

    // função auxiliar → remove acentos e padroniza
  function normalizarStatus(status) {
    return status
      .toUpperCase()
      .normalize("NFD")                 // separa acentos
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .trim();
  }

  // mapeia diferentes formas para o mesmo status
  function mapearStatus(status) {
    const s = normalizarStatus(status);
    if (s === "NAO INICIADO") return "NÃO INICIADO";
    if (s === "EM DESENVOLVIMENTO"  || s === "PROCESSO DE DOBRA" || s === "EM ANDAMENTO" ||
        s === "PROCESSO DE CHANFRO" || s === "PROCESSO DE SOLDA" || s === "PROCESSO DE USINAGEM") return "EM ANDAMENTO";
    if (s === "FINALIZADO") return "FINALIZADO";
    return null;
  }

  produtos.forEach(p => {
    const data = p["ENTRADA"];
    if (!data) return;

    const partes = data.split("/");
    if (partes.length < 3) return;
    const mes = parseInt(partes[1], 10);
    const ano = parseInt(partes[2], 10);

    if (anoSelecionado !== null && ano !== anoSelecionado) return;
    if (mesSelecionado !== null && mes !== mesSelecionado) return;

    const status = mapearStatus(p.STATUS || "").toUpperCase().trim();
    if (contagem.hasOwnProperty(status)) {
      contagem[status] += 1;
    }
  });

  return statusBase.map(s => ({
    ...s,
    transactions: contagem[s.name] || 0,
    rise: true
  }));
}

  // ======== montagem ========
  function App(){
    const root = document.getElementById('root');
    root.innerHTML = `
    <div class="flex bg-gray-50">
      <aside id="sidebar" class="fixed inset-y-0 left-0 bg-white w-full sm:w-20 xl:w-60 sm:flex flex-col z-10 hidden shadow-lg"></aside>
      <main class="flex w-full">
        <div class="w-full h-screen hidden sm:block sm:w-20 xl:w-60 flex-shrink-0">.</div>
        <div id="content" class="h-screen flex-grow overflow-x-hidden overflow-auto flex flex-wrap content-start p-2"></div>
      </main>
    </div>`;
    Sidebar({ mount: $('#sidebar') });
    Content({ mount: $('#content') });
  }

  // ======== Sidebar ========
  function Sidebar({ mount }){
    let selected = '0';
    let showSidebar = false;
    const sidebarItems = [
      [
        { id: '0', title: 'Dashboard', notifications: false },
        { id: '1', title: 'Lista de Produtos', notifications: false },
        { id: '2', title: 'Gráficos', notifications: false },
        { id: '3', title: 'ForeCast', notifications: false },
      ],
      [
        { id: '4', title: 'Ajuda', notifications: false },
        { id: '5', title: 'Suporte', notifications: false },
        { id: '6', title: 'Configurações', notifications: false },
      ],
    ];

    function render(){
      mount.innerHTML = `
      <div class="flex-shrink-0 overflow-hidden p-2 mt-12">
        <div class="flex items-center h-full sm:justify-center xl:justify-start p-2 border-b border-gray-200">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
            </svg>
          </div>
          <div class="block sm:hidden xl:block ml-2 font-bold text-xl text-gray-900">PRODUTOS</div>
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

      // bind clicks
      $$('.js-menu').forEach(el=>{
        el.addEventListener('click', ()=>{
          selected = el.dataset.id;
          render();

          const content = document.getElementById("content");

          if (selected === '1') {
            // carrega a página de produtos
            ProdutosPage(content);
          } else if (selected === '2') {
            // carrega a página de gráficos
            GraficosPage(content);
          } else if (selected === '3') {
            // carrega a página de forecast
            ForecastPage(content);
          } else {
            // carrega o dashboard normal
            Content({ mount: content });
          }
        });
      });
    }

    function MenuItem({ item:{id,title,notifications}, selected }){
      return `
        <div data-id="${id}" class="js-menu w-full mt-2 flex items-center px-3 sm:px-0 xl:px-3 justify-start sm:justify-center xl:justify-start sm:mt-6 xl:mt-3 cursor-pointer rounded-lg transition-colors ${selected === id ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} py-2">
          ${SidebarIcon(id)}
          <div class="block sm:hidden xl:block ml-3 font-medium">${title}</div>
          <div class="block sm:hidden xl:block flex-grow"></div>
          ${notifications ? `<div class='flex sm:hidden xl:flex bg-red-500 w-5 h-5 items-center justify-center rounded-full mr-2'><div class='text-white text-xs'>${notifications}</div></div>` : ''}
        </div>
      `;
    }
 
    // util icons/images
    function SidebarIcon(id){
      const map={
        0: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path></svg>`,
        1: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" clip-rule="evenodd"></path></svg>`,
        2: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path></svg>`,
        3: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path></svg>`,
        4: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path></svg>`,
        5: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>`,
        6:`<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path></svg>`,
      };
      return map[id] ?? '';
    }

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

  function Icon({path='options', className='w-4 h-4', asHtml=false}){
    const html = `<img src="https://assets.codepen.io/3685267/${path}.svg" alt="" class="${className}"/>`;
    return asHtml? html: (()=>{ const img=new Image(); img.src=`https://assets.codepen.io/3685267/${path}.svg`; img.className=className; return img; })();
  }
  function IconButton({icon='options', className='w-2 h-2', onclick, asHtml=false}){
    const html = `<button ${onclick?`onclick=\"${onclick}\"`:''} type="button" class="${className}"><img src="../../assets/icons/clipboard.png" class="w-full h-full"/></button>`;
    return asHtml? html: (()=>{ const btn=document.createElement('button'); btn.type='button'; btn.className=className; btn.innerHTML=`<img src="https://assets.codepen.io/3685267/${icon}.svg" class="w-full h-full"/>`; if(onclick) btn.setAttribute('onclick', onclick); return btn; })();
  }
  
  function Image({path='1', className='w-4 h-4', asHtml=false}){
    const html = `<img src="https://assets.codepen.io/3685267/${path}.jpg" alt="" class="${className} rounded-full"/>`;
    return asHtml? html: (()=>{ const img=new window.Image(); img.src=`https://assets.codepen.io/3685267/${path}.jpg`; img.className=className+" rounded-full"; return img; })();
  }
  
  // === Processos disponíveis (id -> rótulo) ===
  const PROCESSOS = [
    { id: "USINAGEM", label: "Usinagem" },
    { id: "DOBRA",    label: "Dobra" },
    { id: "CHANFRO",  label: "Chanfro" },
    { id: "SOLDA",    label: "Solda" },
  ];

window.formatarCampoHora = function(input) {
  let val = input.value.replace(/[^0-9]/g, ""); // só números
  if (!val) {
    input.value = "";
    return;
  }

  while (val.length < 6) val = "0" + val;
  let h = parseInt(val.slice(0, 2), 10);
  let m = parseInt(val.slice(2, 4), 10);
  let s = parseInt(val.slice(4, 6), 10);

  if (m > 59) m = 59;
  if (s > 59) s = 59;

  input.value = `${String(h).padStart(2,"0")}h${String(m).padStart(2,"0")}min${String(s).padStart(2,"0")}s`;
};


  // Cria/atualiza inputs de tempo para cada checkbox marcado
function montarCamposTempoPorProcesso(modal, classeCheckbox, seletorContainer, valoresPreExistentes = {}) {
  const container = modal.querySelector(seletorContainer);
  if (!container) return;
  const selecionados = Array.from(modal.querySelectorAll(`.${classeCheckbox}:checked`)).map(cb => cb.value);
  container.innerHTML = '';

  const areas = ['comercial', 'engenharia', 'homologado'];

  selecionados.forEach(proc => {
    const label = PROCESSOS.find(p => p.id === proc)?.label || proc;
    const valores = valoresPreExistentes[proc] || {};

    const wrap = document.createElement('div');
    wrap.className = 'border rounded p-3 mb-3 bg-white';
    wrap.innerHTML = `
      <div class="font-bold mb-2">${label}</div>
      <div class="grid grid-cols-3 gap-3">
        ${areas.map(area => {
          const v = valores[area] || {};
          const cap = area.charAt(0).toUpperCase() + area.slice(1);
          return `
            <div class="border rounded p-2">
              <div class="font-semibold text-sm">${cap}</div>

              <label class="text-xs block mt-2">Setup (h)</label>
              <input type="text" class="tempoProc" onblur="formatarCampoHora(this)"
                    data-proc="${proc}" data-area="${area}" data-field="setup"
                    value="${v.setup || ''}"/>

              <label class="text-xs block mt-2">Ciclo (h)</label>
              <input type="text" class="tempoProc" onblur="formatarCampoHora(this)"
                    data-proc="${proc}" data-area="${area}" data-field="ciclo"
                    value="${v.ciclo || ''}"/>
            </div>
          `;
        }).join('')}
      </div>
    `;
    container.appendChild(wrap);
  });
}

function coletarTemposPorProcesso(modal) {
  const tempos = {};
  modal.querySelectorAll('.tempoProc').forEach(inp => {
    const proc = inp.dataset.proc;
    const area = inp.dataset.area;
    const field = inp.dataset.field;
    const val = converterHoraParaDecimal(inp.value);
    if (!tempos[proc]) tempos[proc] = {};
    if (!tempos[proc][area]) tempos[proc][area] = { setup: 0, ciclo: 0 };
    tempos[proc][area][field] = isNaN(val) ? 0 : val;
  });
  return tempos;
}

function converterHoraParaDecimal(str) {
  if (!str) return 0;
  // pega apenas dígitos
  const match = str.match(/(\d+)h(\d+)min(\d+)s/);
  if (!match) return 0;
  const h = parseInt(match[1], 10) || 0;
  const m = parseInt(match[2], 10) || 0;
  const s = parseInt(match[3], 10) || 0;
  return h + (m/60) + (s/3600);
}

function montarCamposTempoView(container, processos = [], temposObj = {}) {
  container.innerHTML = '';
  const areas = ['comercial','engenharia','homologado'];
  processos.forEach(proc => {
    const label = PROCESSOS.find(p => p.id === proc)?.label || proc;
    const valores = temposObj[proc] || {};

    const wrap = document.createElement('div');
    wrap.className = 'border rounded p-3 mb-3 bg-white';
    wrap.innerHTML = `
      <div class="font-bold mb-2">${label}</div>
      <div class="grid grid-cols-3 gap-3">
        ${areas.map(area => {
          const v = valores[area] || {};
          const cap = area.charAt(0).toUpperCase() + area.slice(1);
          return `
            <div class="border rounded p-2">
              <div class="font-semibold text-sm">${cap}</div>
              <label class="text-xs block mt-2">Setup (h)</label>
              <input type="text" disabled class="border px-2 py-1 rounded w-full bg-gray-100" value="${converterDecimalParaHora(v.setup)}" />
              <label class="text-xs block mt-2">Ciclo (h)</label>
              <input type="text" disabled class="border px-2 py-1 rounded w-full bg-gray-100" value="${converterDecimalParaHora(v.ciclo)}" />
            </div>
          `;
        }).join('')}
      </div>
    `;
    container.appendChild(wrap);
  });
}

function converterDecimalParaHora(valor) {
  if (!valor || isNaN(valor)) return "00h00min00s";
  const h = Math.floor(valor);
  const m = Math.floor((valor - h) * 60);
  const s = Math.round(((valor - h) * 60 - m) * 60);
  return `${String(h).padStart(2,"0")}h${String(m).padStart(2,"0")}min${String(s).padStart(2,"0")}s`;
}

  // ======== Conteúdo principal ========
  function Content({ mount }){
    mount.innerHTML = `
      <div class="w-full sm:flex p-2 mt-4 items-end">
      </div>
      <div id="cards" class="flex flex-wrap w-full"></div>
      <div class="w-full p-2 lg:w-2/3">
        <div class="rounded-lg bg-card-content sm:h-80 h-60 p-0" id="graph"></div>
      </div>
      <div class="w-full p-2 lg:w-1/3">
        <div class="rounded-lg bg-card-content overflow-hidden h-80 shadow-lg" id="addComponent"></div>
      </div>
      <div class="w-full p-2 lg:w-1/3">
        <div class="rounded-lg bg-card-content h-80" id="segmentation"></div>
      </div>
      <div class="w-full p-2 lg:w-1/3">
        <div class="rounded-lg bg-card-content h-80" id="satisfaction"></div>
      </div>
      <div class="w-full p-2 lg:w-1/3 ">
        <div class="rounded-lg bg-card-content h-80 p-4 shadow-lg" id="clientes"></div>
      </div>`;

    // Cards de pessoas
    const cards = $('#cards', mount);
    statusData.forEach(e=> cards.appendChild(statusCard(e)) );
    // Gráfico
    Graph($('#graph', mount));
    // Cliente
    Clientes($('#clientes', mount), year);
    // Segmentação
    Segmentation($('#segmentation', mount));
    // Satisfação
    Satisfaction($('#satisfaction', mount), year);
    // Add component
    AddComponent($('#addComponent', mount), year);
    
  }

  function statusCard({id, name, position, transactions, rise}, mesSelecionado){
    const wrap = document.createElement('div');
    wrap.className='w-full p-2 lg:w-1/3';

    let statusIcon = [];
    switch(id){
      case 1: statusIcon = '<i class="fi fi-bs-cross animate-draw-x"></i>'; break;
      case 2: statusIcon = '<i class="fi fi-bs-refresh animate-refresh"></i>'; break;
      case 3: statusIcon = '<i class="fi fi-bs-check animate-draw-check"></i>'; break;
      default: statusIcon = '<i class="fa fa-question-circle"></i>';
    }

    // traduz número para nome do mês
    const nomesMes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    let textoMes = "Todos";
    if (mesSelecionado) {
      textoMes = nomesMes[mesSelecionado-1];
    }

    wrap.innerHTML = `
      <div class="rounded-lg bg-card-content flex justify-between items-center p-3 h-32 shadow-lg">
        <div>
          <div class="flex items-center">
            <div class="ml-2">
              <div class="flex items-center">
                <div class="mr-2 font-bold text-black">${name}</div>
                ${statusIcon}
              </div>
              <div class="text-sm text-gray-400">${position}</div>
            </div>
          </div>
        </div>
        <div class="flex flex-col items-center">
          ${Icon({path: rise? 'res-react-dash-bull':'res-react-dash-bear', className:'w-8 h-8', asHtml:true})}
          <div class="font-bold text-lg ${rise? 'text-green-500':'text-red-500'}" id="product"></div>
          <div class="text-sm text-gray-400">No mês de: ${textoMes}</div>
        </div>
      </div>`;
      
    // animações
    const product = $('#product', wrap);
    animateValue({ from:0, to:transactions, duration:900, onUpdate:(v)=>{ product.textContent = `${v.toFixed(0)}`; }});

    return wrap;
  }


  // ======== Gráfico SVG responsivo (linhas) ========
function Graph(mount){

  // guarda valor selecionado (se existir)
  const selectAntigo = document.getElementById("anos");
  const valorSelecionado = selectAntigo ? selectAntigo.value : "";
  
  const selectMesAntigo = document.getElementById("mes");
  const valorMesSelecionado = selectMesAntigo ? selectMesAntigo.value : "";

  mount.innerHTML = `
    <div class="flex p-1 h-full flex-col shadow-lg">
    <div className="w-full h-80 p-4 bg-white rounded-2xl"> 

      <div>
      <div class="flex items-center justify-between">
        <!-- Título + Legenda -->
        <div class="flex items-center gap-4">
          <div class="font-bold text-black ml-1">SUMÁRIO DE AMOSTRAS (KPI)</div>
          <!-- Legenda -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1">
              <span class="w-3 h-3 rounded-full" style="background-color:#4472C4"></span>
              <span class="text-sm text-black">TOTAL</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="w-3 h-3 rounded-full" style="background-color:#ED7D31"></span>
              <span class="text-sm text-black">FINALIZADO</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="w-3 h-3 rounded-full" style="background-color:#ff0000"></span>
              <span class="text-sm text-black">META</span>
            </div>
          </div>
        </div>
        <!-- Filtro de mês à direita -->
        <div class="ml-1">
          <label for="mes">Mês : </label>
          <select id="mes" class="border p-2 rounded">
            <option value="">Todos</option>
            <option value="1">Janeiro</option>
            <option value="2">Fevereiro</option>
            <option value="3">Março</option>
            <option value="4">Abril</option>
            <option value="5">Maio</option>
            <option value="6">Junho</option>
            <option value="7">Julho</option>
            <option value="8">Agosto</option>
            <option value="9">Setembro</option>
            <option value="10">Outubro</option>
            <option value="11">Novembro</option>
            <option value="12">Dezembro</option>
          </select>
        </div>

        <!-- Filtro de ano à direita -->
        <div class="ml-2">
          <label for="anos">Ano : </label>
          <select id="anos" class="border p-2 rounded">
            <option value="">Todos</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

        <div class="ml-2">Gráfico de Desenvolvimento Mensal:</div>
      </div>

      <div class="flex-grow">
        <div class="w-full h-full" id="svgWrap" style="min-height:260px"></div>
      </div>
    </div>`;

  // restaura o valor do filtro
  const selectNovo = document.getElementById("anos");
  if (valorSelecionado !== "") {
    selectNovo.value = valorSelecionado;
  }

  const selectNovoMes = document.getElementById("mes");
  if (valorMesSelecionado !== "") {
    selectNovoMes.value = valorMesSelecionado;
  }
  const svgWrap = $('#svgWrap', mount);

function renderSvg(){
  const w = svgWrap.offsetWidth || 600;
  const h = svgWrap.offsetHeight || 260;
  const pad = {l:40, r:40, t:10, b:50};
  const x0 = pad.l, x1 = w - pad.r, y0 = h - pad.b, y1 = pad.t;

  const xs = (i)=> map(i, 0, graphData.length-1, x0, x1);
  const maxY = Math.max(1, ...graphData.map(d=>Math.max(d.produtos,d.finalizados,d.meta))) * 1.12;
  const ys = (v)=> map(v, 0, maxY, y0, y1);

  const xTicks = graphData.map((d,i)=>({x: xs(i), label:d.name}));

  // cria ticks no eixo Y (ex: 5 divisões)
  const nYTicks = 5;
  const yTicks = [];
  for(let i=0;i<=nYTicks;i++){
    const v = (maxY/nYTicks) * i;
    yTicks.push({y: ys(v), label: Math.round(v)});
  }

  function getSmoothPath(data, xs, ys, suavização = 0.5) {
    if (!data.length) return '';
    let d = `M ${xs(0)} ${ys(data[0])}`;
    for (let i = 1; i < data.length; i++) {
      const x0 = xs(i-1), y0 = ys(data[i-1]);
      const x1 = xs(i), y1 = ys(data[i]);
      const cx = (x0 + x1) * suavização;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    return d;
  }

  const pathFinalizados = getSmoothPath(graphData.map(d=>d.finalizados), xs, ys);
  const pathMeta = getSmoothPath(graphData.map(d=>d.meta), xs, ys);

  svgWrap.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <!-- grid vertical -->
      ${xTicks.map(t=>`<line x1="${t.x}" x2="${t.x}" y1="${y1}" y2="${y0}" stroke="#ffffffff" stroke-width="6"/>`).join('')}
      <!-- grid horizontal -->
      ${yTicks.map(t=>`<line x1="${x0}" x2="${x1}" y1="${t.y}" y2="${t.y}" stroke="#a5a5a5ff" stroke-width="0.5"/>`).join('')}
      <!-- eixo X labels -->
      ${xTicks.map(t=>`<text x="${t.x}" y="${y0 + 20}" text-anchor="middle" font-size="12" fill="#000">${t.label}</text>`).join('')}
      
      <!-- Barras (TOTAL) -->
      ${graphData.map((d,i)=>`
        <rect x="${xs(i)-10}" y="${ys(d.produtos)}" width="20" height="${y0 - ys(d.produtos)}" fill="#4472C4"/>
        ${d.produtos > 0 ? `<text x="${xs(i)}" y="${ys(d.produtos) - 8}" text-anchor="middle" font-size="15" fill="#4472C4">${d.produtos}</text>` : ""}
      `).join('')}
      
      <!-- Linha finalizados -->
      <path d="${pathFinalizados}" fill="none" stroke="#ED7D31" stroke-width="3"/>
      ${graphData.map((d,i)=> d.finalizados > 0 ? `
        <text x="${xs(i) + 12}" y="${ys(d.finalizados) - 5}" text-anchor="start" font-size="15" fill="#ED7D31">${d.finalizados}</text>
      ` : "").join('')}

      <!-- Linha meta fixa -->
      <path d="${pathMeta}" fill="none" stroke="#ff0000" stroke-dasharray="6,3" stroke-width="1"/>
      ${graphData.map((d,i)=> d.finalizados > 0 ? `
        <text x="${xs(i)}" y="${ys(d.meta) + 15}" text-anchor="middle" font-size="12" fill="#ff0000">${d.meta}</text>
      ` : "").join('')}
    </svg>
  `;
}



  renderSvg();
  bindFiltros();
  const ro = new ResizeObserver(renderSvg);
  ro.observe(mount);   // << mudar aqui
}

function gerarSegmentationData(produtos) {
  const processos = [
    {nome: "USINAGEM", cor: "#156912ff"},
    {nome: "DOBRA", cor: "#0526adff"},
    {nome: "CHANFRO", cor: "#b40b0bff"},
    {nome: "SOLDA", cor: "#5b0b6bff"},
  ];

  const resultado = processos.map(p => ({...p, itens: []}));

  produtos.forEach(p => {
    const status = (p.STATUS || "").toUpperCase().trim();
    const partNumber = p["PART NUMBER"] || "N/A";
    const shipDate = p["SHIP DATE"] || "N/A";

    resultado.forEach(proc => {
      if (status.includes(proc.nome)) {
        proc.itens.push({ partNumber, shipDate });
      }
    });
  });

  return resultado.map(proc => ({
    processo: proc.nome,
    quantidade: proc.itens.length,
    cor: proc.cor,
    itens: proc.itens
  }));
}


function Segmentation(mount){
  const dados = gerarSegmentationData(produtosanuais);

  mount.innerHTML = `
    <div class="p-4 h-full shadow-lg">
      <div class="flex justify-between items-center">
        <div class="text-black font-bold">DADOS GERAIS:</div>
        <img src="https://assets.codepen.io/3685267/res-react-dash-options.svg" class="w-2 h-2"/>
      </div>
      <div class="mt-3">Amostras por Processo:</div>
      <div id="rows"></div>
      <!-- Botão único de detalhes -->
      <div class="flex mt-3 px-3 items-center justify-between bg-details rounded-xl w-36 h-12 text-white cursor-pointer" id="btnDetalhes">
        <div>Detalhes</div>
        <img src="https://assets.codepen.io/3685267/res-react-dash-chevron-right.svg" class="w-4 h-4"/>
      </div>
    </div>`;

  const rows = $('#rows', mount);
  dados.forEach(({processo, quantidade, cor})=>{
    const row = document.createElement('div');
    row.className='flex items-center mt-2';
    row.innerHTML = `
      <div class="w-2 h-2 rounded-full" style="background:${cor}"></div>
      <div class="ml-2" style="color:${cor}">${processo}</div>
      <div class="flex-grow"></div>
      <div class="font-bold" style="color:${cor}">${quantidade}</div>
    `;
    rows.appendChild(row);
  });

  // botão único → abre modal com todos os itens
  $('#btnDetalhes', mount).addEventListener("click", ()=>{
    abrirModalDetalhes(dados); // passa [{processo, quantidade, itens}, ...]
  });
}

function abrirModalDetalhes(dadosPorProcesso){
  let modal = document.getElementById("modal-detalhes");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-detalhes";
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6 w-4/5 max-h-[85vh] overflow-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-bold">Itens Pendentes - Todos os Processos</h2>
        <button id="fecharModal" class="bg-red-500 text-white px-3 py-1 rounded">Fechar</button>
      </div>

      <!-- Filtro -->
      <div class="mb-4">
        <input type="text" id="filtroItens" placeholder="Filtrar por Part Number ou Ship Date" 
               class="w-full border rounded px-3 py-2"/>
      </div>

      <div id="conteudoProcessos"></div>
    </div>
  `;

  // Monta os campos de tempo quando marca/desmarca
  modal.querySelectorAll(".novoProcesso").forEach(cb => {
    cb.addEventListener("change", () => {
      montarCamposTempoPorProcesso(modal, "novoProcesso", "#temposProcessosNovo");
    });
  });

  // fechar modal
  modal.querySelector("#fecharModal").addEventListener("click", ()=> modal.remove());

  const conteudo = modal.querySelector("#conteudoProcessos");

  // Função que monta as tabelas
  function renderTabela(filtro=""){
    conteudo.innerHTML = "";

    dadosPorProcesso.forEach(proc=>{
      const itensFiltrados = proc.itens.filter(i => {
        const txt = (i.partNumber + " " + i.shipDate).toLowerCase();
        return txt.includes(filtro.toLowerCase());
      });

      if (itensFiltrados.length === 0) return;

      const secao = document.createElement("div");
      secao.className = "mb-6";

      secao.innerHTML = `
        <h3 class="text-md font-bold mb-2">${proc.processo}</h3>
        <table class="w-full text-left border-collapse mb-4">
          <thead>
            <tr class="bg-gray-200">
              <th class="p-2">Part Number</th>
              <th class="p-2">Ship Date</th>
            </tr>
          </thead>
          <tbody>
            ${itensFiltrados.map(i=>`
              <tr class="border-b">
                <td class="p-2">${i.partNumber}</td>
                <td class="p-2">${i.shipDate}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;

      conteudo.appendChild(secao);
    });
  }

  // render inicial
  renderTabela();

  // aplicar filtro enquanto digita
  modal.querySelector("#filtroItens").addEventListener("input", (e)=>{
    renderTabela(e.target.value);
  });
}

function Satisfaction(mount, anoSelecionado, mesSelecionado){
  const produtosFiltrados = produtosanuais.filter(p => {
    const data = p["ENTRADA"];
    if (!data) return false;
    const partes = data.split("/");
    if (partes.length < 3) return false;

    const mes = parseInt(partes[1], 10);
    const ano = parseInt(partes[2], 10);

    if (anoSelecionado && ano !== anoSelecionado) return false;
    if (mesSelecionado && mes !== mesSelecionado) return false;

    return true;
  });

  let total = produtosFiltrados.length;
  let finalizados = 0;

  produtosFiltrados.forEach(p => {
    const status = (p.STATUS || "").toUpperCase().trim();
    if (status === "FINALIZADO" || status.startsWith("PROCESSO")) {
      finalizados++;
    }
  });

  const taxa = total > 0 ? (finalizados / total) * 100 : 0;

  // render base
  mount.innerHTML = `
    <div class="p-4 h-full shadow-lg">
      <div class="flex justify-between items-center">
        <div class="text-Black font-bold">DADOS GERAIS:</div>
        <img src="https://assets.codepen.io/3685267/res-react-dash-options.svg" class="w-2 h-2"/>
      </div>
      <div class="mt-3">Índice de Finalização de Amostras:</div>
      <div class="flex justify-center"><svg viewBox="0 0 700 380" fill="none" width="300" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 350C100 283.696 126.339 220.107 173.223 173.223C220.107 126.339 283.696 100 350 100C416.304 100 479.893 126.339 526.777 173.223C573.661 220.107 600 283.696 600 350" stroke="#d43f11ff" stroke-width="40" stroke-linecap="round"/>
        <path id="satPath" d="M100 350C100 283.696 126.339 220.107 173.223 173.223C220.107 126.339 283.696 100 350 100C416.304 100 479.893 126.339 526.777 173.223C573.661 220.107 600 283.696 600 350" stroke="#2f49d0" stroke-width="40" stroke-linecap="round" stroke-dasharray="785.4" stroke-dashoffset="785.4"/>
        <circle id="satDot" cx="140" cy="350" r="12"/>
      </svg></div>
      <div class="flex justify-center">
        <div class="flex justify-between mt-2" style="width:300px">
          <div style="width:50px;padding-left:16px">0%</div>
          <div style="width:150px;text-align:center">
            <div class="font-bold" style="color:#2f49d1;font-size:18px">${taxa.toFixed(1)}%</div>
            <div>Taxa de finalização</div>
          </div>
          <div style="width:50px">100%</div>
        </div>
      </div>
    </div>`;

  // anima o arco e o ponto
  const path = $('#satPath', mount);
  const dot = $('#satDot', mount);
  animateValue({
    from:785.4,
    to:785.4 - (785.4 * (taxa/100)), // proporção da taxa
    duration:1500,
    easing:(t)=>1-Math.pow(1-t,3),
    onUpdate:(v)=>{
      path.setAttribute('stroke-dashoffset', String(v));
      const pi = Math.PI; const tau = 2*pi;
      const cx = 350 + 250 * Math.cos(map(v, 785.4, 0, pi, tau));
      const cy = 350 + 250 * Math.sin(map(v, 785.4, 0, pi, tau));
      dot.setAttribute('cx', String(cx));
      dot.setAttribute('cy', String(cy));
    }
  });
}


  function AddComponent(mount, anoSelecionado, mesSelecionado){
    // calcula total de produtos filtrados pelo ano
    const dados = agruparProdutosPorMes(produtosanuais, anoSelecionado, mesSelecionado);
    const totalProdutos = dados.reduce((soma, d) => soma + d.produtos, 0);

    const totalFuncionarios = 6;
    const ncPermitido = Math.round(totalProdutos * 0.005); // 0,5%
    const ncReal = Math.round(ncPermitido * 0.5);
    console.log("Dados de NC",ncReal);

    mount.innerHTML = `
      <div class="p-4 h-full flex flex-col shadow-lg">
        <div class="text-black font-bold text-lg mb-4 border-b pb-2 ">
          SUMÁRIO DE AMOSTRAS (KPI) (${anoSelecionado || 'Todos'})
        </div>
        <div class="flex-grow shadow-lg">
          <table class="w-full text-left border-collapse rounded-lg overflow-hidden shadow">
            <thead>
              <tr class="bg-gray-200 text-gray-700">
                <th class="p-3 text-sm font-semibold">INDICADOR DE DESEMPENO</th>
                <th class="p-3 text-sm font-semibold text-right">DADOS</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-300">
              <tr class="hover:bg-gray-50 transition">
                <td class="p-3">TOTAL DE AMOSTRAS:</td>
                <td class="p-3 font-bold text-blue-600 text-right">${totalProdutos}</td>
              </tr>
              <tr class="hover:bg-gray-50 transition">
                <td class="p-3">NC PERMITIDO (0,5%/ANO)</td>
                <td class="p-3 font-bold text-green-600 text-right">${ncPermitido}</td>
              </tr>
              <tr class="hover:bg-gray-50 transition">
                <td class="p-3">NC ATUAIS</td>
                <td class="p-3 font-bold ${ncReal > ncPermitido ? 'text-red-600' : 'text-green-600'} text-right">${ncReal}</td>
              </tr>
              <tr class="hover:bg-gray-50 transition">
                <td class="p-3">FUNCIONÁRIOS:</td>
                <td class="p-3 font-bold text-indigo-600 text-right">${totalFuncionarios}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // ======== Clientes ========
  
function Clientes(mount, anoSelecionado, mesSelecionado){
  const produtosFiltrados = produtosanuais.filter(p => {
    const data = p["ENTRADA"];
    if (!data) return false;
    const partes = data.split("/");
    if (partes.length < 3) return false;

    const mes = parseInt(partes[1], 10);
    const ano = parseInt(partes[2], 10);

    if (anoSelecionado && ano !== anoSelecionado) return false;
    if (mesSelecionado && mes !== mesSelecionado) return false;

    return true;
  });

  const clientesMap = {};
  produtosFiltrados.forEach(p => {
    const cliente = p["CLIENTE"] || "Desconhecido";
    if (!clientesMap[cliente]) clientesMap[cliente] = 0;
    clientesMap[cliente]++;
  });

  const clientes = Object.entries(clientesMap)
    .map(([name, value], idx) => ({
      id: idx+1,
      name,
      value,
      rise: true
    }));

  mount.innerHTML = `
    <div class="flex justify-between items-center">
      <div class="text-black font-bold">DADOS GERAIS:</div>
      <img src="https://assets.codepen.io/3685267/res-react-dash-options.svg" class="w-2 h-2"/>
    </div>
    <div class="mt-3">Total de Amostras por Cliente</div>
    <div id="rows"></div>
    <div class="flex-grow"></div>
    <div class="flex justify-center"><div>Ver todos</div></div>
  `;

  const rows = $('#rows', mount);
  clientes.forEach(({id,name,value,rise})=>{
    const row = document.createElement('div');
    row.className='flex items-center mt-3';
    row.innerHTML = `
      <div>${id}</div>
      <div class="ml-2">${name}</div>
      <div class="flex-grow"></div>
      <div>${value.toLocaleString()}</div>
      <img src="https://assets.codepen.io/3685267/${rise? 'res-react-dash-country-up':'res-react-dash-country-down'}.svg" class="w-4 h-4 mx-3"/>
      <img src="https://assets.codepen.io/3685267/res-react-dash-options.svg" class="w-2 h-2"/>
    `;
    rows.appendChild(row);
  });
}


function ProdutosPage(mount){
  let produtos = [...produtosanuais]; // cópia local
  let filtroTexto = "";

  mount.innerHTML = `
    <div class="p-6 w-full">
      <h2 class="text-2xl font-bold mb-4">GERENCIAMENTO DE PRODUTOS</h2>

    <!-- Barra de filtros -->
    <div class="flex flex-wrap items-center mb-4 gap-4">
      <!-- Texto -->
      <input type="text" id="filtroProdutos" placeholder="Pesquisar..." 
        class="border rounded px-3 py-2 flex-grow"/>

      <!-- Cliente -->
      <select id="filtroCliente" class="border px-3 py-2 rounded">
        <option value="">Todos os Clientes</option>
      </select>

      <!-- Processo -->
      <select id="filtroProcesso" class="border px-3 py-2 rounded">
        <option value="">Todos os Processos</option>
        <option value="USINAGEM">USINAGEM</option>
        <option value="DOBRA">DOBRA</option>
        <option value="CHANFRO">CHANFRO</option>
        <option value="SOLDA">SOLDA</option>
      </select>

      <!-- Data inicial -->
      <input type="date" id="filtroDataInicio" class="border rounded px-3 py-2"/>

      <button id="btnNovoProduto" class="bg-green-600 text-white px-4 py-2 rounded">+ Novo Produto</button>
    </div>


      <!-- Tabela -->
      <div class="tabela-overview border rounded-lg">
        <!-- Cabeçalho fixo -->
        <table class="w-full text-left border-collapse">
          <thead class="bg-gray-200 text-gray-700 sticky top-0 z-10">
            <tr>
              <th class="p-3">Part Number</th>
              <th class="p-3">Cliente</th>
              <th class="p-3">Entrada</th>
              <th class="p-3">Ship Date</th>
              <th class="p-3">Dias Atraso</th> <!-- NOVA COLUNA -->
              <th class="p-3">Status</th>
              <th class="p-3">Ações</th>
            </tr>
          </thead>
        </table>

        <!-- Corpo com scroll -->
        <div class="max-h-[70vh] overflow-y-auto">
          <table class="w-full text-left border-collapse">
            <tbody id="tabelaProdutos"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const tabela = $('#tabelaProdutos', mount);

  function renderTabela() {
    tabela.innerHTML = "";

    const texto = filtroTexto.toLowerCase();
    const clienteSelecionado = $('#filtroCliente').value;
    const processoSelecionado = $('#filtroProcesso').value;
    const dataInicio = $('#filtroDataInicio').value;

    const filtrados = produtos.filter(p => {
      // 🔸 1. Filtro por texto
      const txt = Object.values(p).join(" ").toLowerCase();
      if (texto && !txt.includes(texto)) return false;

      // 🔸 2. Filtro por cliente
      if (clienteSelecionado && p.CLIENTE !== clienteSelecionado) return false;

      // 🔸 3. Filtro por processo (verifica no STATUS)
      if (processoSelecionado && !(p.STATUS || "").toUpperCase().includes(processoSelecionado)) return false;

      // 🔸 4. Filtro por intervalo de datas
      const data = p["ENTRADA"] || p["SHIP DATE"];
      if (data) {
        const partes = data.split("/");
        if (partes.length === 3) {
          const dia = partes[0].padStart(2,"0");
          const mes = partes[1].padStart(2,"0");
          const ano = partes[2];
          const dataProduto = new Date(ano, parseInt(mes,10)-1, parseInt(dia,10));
          if (dataInicio) {
            const inicio = new Date(dataInicio);
            inicio.setHours(0,0,0,0);
            if (dataProduto < inicio) return false;
          }
        }
      }
      return true;
    });

    // Renderiza os produtos filtrados
    filtrados.forEach((p) => {
      const originalStatus = p["STATUS"] || "";
      let displayStatus = originalStatus;
      let diasAtraso = null;

      // calcula se está atrasado com base no SHIP DATE (formato dd/mm/yyyy)
      if (p["SHIP DATE"]) {
        const partes = (p["SHIP DATE"] || "").split("/");
        if (partes.length === 3) {
          const d = parseInt(partes[0], 10);
          const m = parseInt(partes[1], 10);
          const a = parseInt(partes[2], 10);
          if (!isNaN(d) && !isNaN(m) && !isNaN(a)) {
            const dataShip = new Date(a, m-1, d);
            const hoje = new Date();
            // neutraliza horas para comparação só por dia
            dataShip.setHours(0,0,0,0);
            hoje.setHours(0,0,0,0);

            // se ship < hoje e não finalizado => ATRASADO
            if (dataShip < hoje && !originalStatus.toUpperCase().includes("FINALIZADO")) {
              displayStatus = "ATRASADO";
              const diffMs = hoje.getTime() - dataShip.getTime();
              diasAtraso = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            }
          }
        }
      }

      const tr = document.createElement("tr");
      tr.className = "border-b hover:bg-gray-50";
      tr.innerHTML = `
        <td class="p-2">${p["PART NUMBER"] || ""}</td>
        <td class="p-2">${p["CLIENTE"] || ""}</td>
        <td class="p-2">${p["ENTRADA"] || ""}</td>
        <td class="p-2">${p["SHIP DATE"] || ""}</td>
        <td class="p-2 text-right">${diasAtraso ? diasAtraso + 'd' : '-'}</td>
        <td class="p-2">${renderStatusBadge(displayStatus)}</td>
        <td class="p-2">
          <button class="bg-blue-500 text-white px-2 py-1 rounded text-sm editarProduto">Editar</button>
          <button class="bg-gray-600 text-white px-2 py-1 rounded text-sm visualizarProduto">Visualizar</button>
        </td>
      `;
      tabela.appendChild(tr);

      // mantém o comportamento de editar/visualizar
      tr.querySelector(".editarProduto").addEventListener("click", () => editarProduto(p));
      tr.querySelector(".visualizarProduto").addEventListener("click", () => visualizarProduto(p));
    });
  }



  // filtro em tempo real
  $('#filtroProdutos', mount).addEventListener("input", e=>{
    filtroTexto = e.target.value;
    renderTabela();
  });

  // adicionar novo produto
  $('#btnNovoProduto', mount).addEventListener("click", ()=>{
    abrirModalNovoProduto();
  });

  renderTabela();

function renderStatusBadge(status) {
  const s = (status || "").toUpperCase();
  let cor = "bg-gray-400 text-white";

  if (s.includes("FINALIZADO")) cor = "bg-green-500 text-white";
  else if (s.includes("EM ANDAMENTO") || s.includes("ANDAMENTO") || s.includes("PROCESSO")) cor = "bg-blue-500 text-white";
  else if (s.includes("NÃO INICIADO") || s.includes("NAO INICIADO")) cor = "bg-gray-500 text-white";
  else if (s.includes("PROCESSO DE USINAGEM")) cor = "bg-blue-500 text-white";
  else if (s.includes("PROCESSO DE DOBRA")) cor = "bg-purple-500 text-white";
  else if (s.includes("PROCESSO DE CHANFRO")) cor = "bg-orange-500 text-white";
  else if (s.includes("PROCESSO DE SOLDA")) cor = "bg-yellow-500 text-white";
  else if (s.includes("ATRASADO")) cor = "bg-red-600 text-white"; // novo
  else cor = "bg-red-500 text-white"; // status desconhecido

  return `<span class="px-2 py-1 rounded text-xs font-bold ${cor}">${status}</span>`;
}


function abrirModalNovoProduto() {
  let modal = document.getElementById("modal-novo-produto");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-novo-produto";
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6 w-1/2 max-h-[90vh] overflow-y-auto">
      <h3 class="text-lg font-bold mb-4">Adicionar Novo Produto</h3>
      <div class="grid grid-cols-2 gap-4">
        <input type="text" id="novoPart" placeholder="Part Number" class="border px-3 py-2 rounded"/>
        <input type="text" id="novoRevisao" placeholder="Revisão" class="border px-3 py-2 rounded"/>
        <select id="novoCliente" class="border px-3 py-2 rounded">
          <option value="">Selecione o Cliente</option>
          <option value="VOLVO">VOLVO</option>
          <option value="KOMATSU">KOMATSU</option>
          <option value="JOHN DEERE">JOHN DEERE</option>
          <option value="CATERPILLAR">CATERPILLAR</option>
          <option value="KION">KION</option>
          <option value="TOYOTA">TOYOTA</option>
          <option value="CL CALDEIRARIA">CL CALDEIRARIA</option>
        </select>
        <select id="novoComplexidade" class="border px-3 py-2 rounded">
          <option value="">Selecione a Complexidade</option>
          <option value="BAIXA">BAIXA</option>
          <option value="MÉDIA">MÉDIA</option>
          <option value="ALTA">ALTA</option>
        </select>
        <input type="text" id="novoEntrada" placeholder="Data Entrada (dd/mm/yyyy)" class="border px-3 py-2 rounded"/>
        <input type="text" id="novoShip" placeholder="Ship Date" class="border px-3 py-2 rounded"/>
        <select id="novoTipo" class="border px-3 py-2 rounded">
          <option value="">Selecione o Tipo</option>
          <option value="BLANK">BLANK</option>
          <option value="CONJUNTO">CONJUNTO</option>
        </select>
        <select id="novoStatus" class="border px-3 py-2 rounded col-span-2">
          <option value="">Selecione o Status</option>
          <option value="NÃO INICIADO">NÃO INICIADO</option>
          <option value="EM ANDAMENTO">EM ANDAMENTO</option>
          <option value="FINALIZADO">FINALIZADO</option>
          <option value="PROCESSO DE USINAGEM">PROCESSO DE USINAGEM</option>
          <option value="PROCESSO DE DOBRA">PROCESSO DE DOBRA</option>
          <option value="PROCESSO DE CHANFRO">PROCESSO DE CHANFRO</option>
          <option value="PROCESSO DE SOLDA">PROCESSO DE SOLDA</option>
        </select>

        <div class="col-span-2">
          <label class="font-bold">Processos:</label>
          <div class="flex flex-wrap gap-4 mt-2">
            ${PROCESSOS.map(p => `<label class="flex items-center gap-2"><input type="checkbox" value="${p.id}" class="novoProcesso"> ${p.label}</label>`).join('')}
          </div>
          <div id="temposProcessosNovo" class="grid grid-cols-1 gap-3 mt-3"></div>
        </div>

        <div id="secaoComponentes" class="col-span-2 hidden">
          <label class="font-bold">Componentes do Conjunto:</label>
          <div id="listaComponentes" class="mt-2 space-y-2"></div>
          <button type="button" id="btnAdicionarComponente" class="bg-green-500 text-white px-3 py-1 rounded text-sm mt-2">+ Adicionar Componente</button>
        </div>

      </div>
      <div class="flex justify-end mt-4 gap-2">
        <button id="cancelarNovo" class="bg-gray-500 text-white px-4 py-2 rounded">Cancelar</button>
        <button id="salvarNovo" class="bg-green-600 text-white px-4 py-2 rounded">Salvar</button>
      </div>
    </div>
  `;

  // bind processos -> montar campos
  modal.querySelectorAll(".novoProcesso").forEach(cb => {
    cb.addEventListener("change", () => {
      montarCamposTempoPorProcesso(modal, "novoProcesso", "#temposProcessosNovo");
    });
  });

  // tipo -> exibe seção componentes
  modal.querySelector("#novoTipo").addEventListener("change", (e) => {
    const secao = modal.querySelector("#secaoComponentes");
    if (e.target.value === "CONJUNTO") secao.classList.remove("hidden");
    else secao.classList.add("hidden");
  });

  // adicionar componente
  modal.querySelector("#btnAdicionarComponente")?.addEventListener("click", () => adicionarComponente(modal, "listaComponentes"));

  // cancelar
  modal.querySelector("#cancelarNovo").addEventListener("click", ()=> modal.remove());

  // salvar
  modal.querySelector("#salvarNovo").addEventListener("click", async () => {
    try {
      const processosSelecionados = Array.from(modal.querySelectorAll(".novoProcesso:checked")).map(cb => cb.value);
      const tempos = coletarTemposPorProcesso(modal);
      const componentes = coletarComponentes(modal, "listaComponentes");

      const novo = {
        "PART NUMBER": modal.querySelector("#novoPart").value,
        "REVISAO": modal.querySelector("#novoRevisao").value,
        "CLIENTE": modal.querySelector("#novoCliente").value,
        "COMPLEXIDADE": modal.querySelector("#novoComplexidade").value,
        "TIPO": modal.querySelector("#novoTipo").value,
        "ENTRADA": modal.querySelector("#novoEntrada").value,
        "SHIP DATE": modal.querySelector("#novoShip").value,
        "STATUS": modal.querySelector("#novoStatus").value,
        "processos": processosSelecionados,
        "tempos": tempos,
        "componentes": componentes
      };

      const novoId = await firebaseService.addProduto(novo);
      // atualizar arrays locais (se existir lógica semelhante a original)
      produtos.push({ id: novoId, ...novo });
      produtosanuais.push({ id: novoId, ...novo });

      modal.remove();
      renderTabela(); // se essa função existir no escopo (mantive o nome original)
      graphData = agruparProdutosPorMes(produtosanuais);
      statusData = gerarStatusData(produtosanuais, year, month);
      console.log("Produto adicionado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao adicionar produto.");
    }
  });
}



  // ==== Funções auxiliares ====
function editarProduto(produto) {
  let modal = document.getElementById("modal-editar-produto");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-editar-produto";
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6 w-1/2 max-h-[90vh] overflow-y-auto">
      <h3 class="text-lg font-bold mb-4">Editar Produto</h3>
      <div class="grid grid-cols-2 gap-4">
        <input type="text" id="editPart" value="${produto["PART NUMBER"] || ""}" placeholder="Part Number" class="border px-3 py-2 rounded"/>
        <input type="text" id="editRevisao" value="${produto["REVISAO"] || ""}" placeholder="Revisão" class="border px-3 py-2 rounded"/>
        <select id="editCliente" class="border px-3 py-2 rounded">
          <option value="">Selecione o Cliente</option>
          <option value="VOLVO" ${produto["CLIENTE"] === "VOLVO" ? "selected" : ""}>VOLVO</option>
          <option value="KOMATSU" ${produto["CLIENTE"] === "KOMATSU" ? "selected" : ""}>KOMATSU</option>
          <option value="JOHN DEERE" ${produto["CLIENTE"] === "JOHN DEERE" ? "selected" : ""}>JOHN DEERE</option>
          <option value="CATERPILLAR" ${produto["CLIENTE"] === "CATERPILLAR" ? "selected" : ""}>CATERPILLAR</option>
          <option value="KION" ${produto["CLIENTE"] === "KION" ? "selected" : ""}>KION</option>
          <option value="TOYOTA" ${produto["CLIENTE"] === "TOYOTA" ? "selected" : ""}>TOYOTA</option>
          <option value="CL CALDEIRARIA" ${produto["CLIENTE"] === "CL CALDEIRARIA" ? "selected" : ""}>CL CALDEIRARIA</option>                    
        </select>
        <select id="editComplexidade" class="border px-3 py-2 rounded">
          <option value="">Selecione a Complexidade</option>
            <option value="BAIXA" ${produto["COMPLEXIDADE"] === "BAIXA" ? "selected" : ""}>BAIXA</option>
            <option value="MÉDIA" ${produto["COMPLEXIDADE"] === "MÉDIA" ? "selected" : ""}>MÉDIA</option>
            <option value="ALTA" ${produto["COMPLEXIDADE"] === "ALTA" ? "selected" : ""}>ALTA</option>
        </select>
        <input type="text" id="editEntrada" value="${produto["ENTRADA"] || ""}" placeholder="Data Entrada" class="border px-3 py-2 rounded"/>
        <input type="text" id="editShip" value="${produto["SHIP DATE"] || ""}" placeholder="Ship Date" class="border px-3 py-2 rounded"/>
        <select id="editTipo" class="border px-3 py-2 rounded">
          <option value="">Selecione o Tipo</option>
          <option value="BLANK" ${produto["TIPO"] === "BLANK" ? "selected" : ""}>BLANK</option>
          <option value="CONJUNTO" ${produto["TIPO"] === "CONJUNTO" ? "selected" : ""}>CONJUNTO</option>
        </select>
        <select id="editStatus" class="border px-3 py-2 rounded col-span-2">
          <option value="">Selecione o Status</option>
          <option value="NÃO INICIADO" ${produto["STATUS"] === "NÃO INICIADO" ? "selected" : ""}>NÃO INICIADO</option>
          <option value="EM ANDAMENTO" ${produto["STATUS"] === "EM ANDAMENTO" ? "selected" : ""}>EM ANDAMENTO</option>
          <option value="FINALIZADO" ${produto["STATUS"] === "FINALIZADO" ? "selected" : ""}>FINALIZADO</option>
          <option value="PROCESSO DE USINAGEM" ${produto["STATUS"] === "PROCESSO DE USINAGEM" ? "selected" : ""}>PROCESSO DE USINAGEM</option>
          <option value="PROCESSO DE DOBRA" ${produto["STATUS"] === "PROCESSO DE DOBRA" ? "selected" : ""}>PROCESSO DE DOBRA</option>
          <option value="PROCESSO DE CHANFRO" ${produto["STATUS"] === "PROCESSO DE CHANFRO" ? "selected" : ""}>PROCESSO DE CHANFRO</option>
          <option value="PROCESSO DE SOLDA" ${produto["STATUS"] === "PROCESSO DE SOLDA" ? "selected" : ""}>PROCESSO DE SOLDA</option>
        </select>

        <div class="col-span-2">
          <label class="font-bold">Processos:</label>
          <div class="flex flex-wrap gap-4 mt-2">
            ${PROCESSOS.map(p => `<label class="flex items-center gap-2"><input type="checkbox" value="${p.id}" class="editProcesso" ${ (produto.processos || []).includes(p.id) ? 'checked':'' }> ${p.label}</label>`).join('')}
          </div>
          <div id="temposProcessosEdit" class="grid grid-cols-1 gap-3 mt-3"></div>
        </div>

        <div id="secaoComponentesEdit" class="col-span-2 ${(produto["TIPO"] === "CONJUNTO") ? "" : "hidden"}">
          <label class="font-bold">Componentes do Conjunto:</label>
          <div id="listaComponentesEdit" class="mt-2 space-y-2"></div>
          <button type="button" id="btnAdicionarComponenteEdit" class="bg-green-500 text-white px-3 py-1 rounded text-sm mt-2">+ Adicionar Componente</button>
        </div>
      </div>

      <div class="flex justify-end mt-4 gap-2">
        <button id="cancelarEditar" class="bg-gray-500 text-white px-4 py-2 rounded">Cancelar</button>
        <button id="salvarEditar" class="bg-blue-600 text-white px-4 py-2 rounded">Salvar</button>
      </div>
    </div>
  `;

  // montar campos de tempos com valores existentes (produto.tempos)
  montarCamposTempoPorProcesso(modal, "editProcesso", "#temposProcessosEdit", produto.tempos || {});

  // mostrar/ocultar seção de componentes conforme tipo
  modal.querySelector("#editTipo").addEventListener("change", () => {
    const sec = modal.querySelector("#secaoComponentesEdit");
    if (modal.querySelector("#editTipo").value === "CONJUNTO") sec.classList.remove("hidden");
    else sec.classList.add("hidden");
  });

  // renderizar componentes existentes
  (produto.componentes || []).forEach(c => adicionarComponente(modal, "listaComponentesEdit", c));

  // bind adicionar componente
  modal.querySelector("#btnAdicionarComponenteEdit").addEventListener("click", () => adicionarComponente(modal, "listaComponentesEdit"));

  // cancelar
  modal.querySelector("#cancelarEditar").addEventListener("click", ()=> modal.remove());

  // salvar
  modal.querySelector("#salvarEditar").addEventListener("click", async () => {
    try {
      const processosSelecionados = Array.from(modal.querySelectorAll(".editProcesso:checked")).map(cb => cb.value);
      const tempos = coletarTemposPorProcesso(modal);
      const componentes = coletarComponentes(modal, "listaComponentesEdit");

      const atualizado = {
        "PART NUMBER": modal.querySelector("#editPart").value,
        "REVISAO": modal.querySelector("#editRevisao").value,
        "CLIENTE": modal.querySelector("#editCliente").value,
        "COMPLEXIDADE": modal.querySelector("#editComplexidade").value,
        "TIPO": modal.querySelector("#editTipo").value,
        "ENTRADA": modal.querySelector("#editEntrada").value,
        "SHIP DATE": modal.querySelector("#editShip").value,
        "STATUS": modal.querySelector("#editStatus").value,
        "processos": processosSelecionados,
        "tempos": tempos,
        "componentes": componentes
      };

      if (produto.id) {
        await firebaseService.updateProduto(produto.id, atualizado);
      }

      // atualiza arrays locais se necessário (seguir seu padrão)
      const idxLocal = produtos.findIndex(p => p.id === produto.id);
      if (idxLocal >= 0) produtos[idxLocal] = { id: produto.id, ...atualizado };
      const globalIdx = produtosanuais.findIndex(p => p.id === produto.id);
      if (globalIdx >= 0) produtosanuais[globalIdx] = { id: produto.id, ...atualizado };

      modal.remove();
      renderTabela();
      console.log("Produto atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar produto.");
    }
  });
}

  
// === Visualizar Produto ===
function visualizarProduto(produto) {
  let modal = document.getElementById("modal-visualizar-produto");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-visualizar-produto";
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6 w-1/2 max-h-[90vh] overflow-y-auto">
      <h3 class="text-lg font-bold mb-4">Visualizar Produto</h3>
      <div class="grid grid-cols-2 gap-4">
        <input type="text" value="${produto["PART NUMBER"] || ""}" disabled class="border px-3 py-2 rounded bg-gray-100" />
        <input type="text" value="${produto["REVISAO"] || ""}" disabled class="border px-3 py-2 rounded bg-gray-100" />
        <input type="text" value="${produto["CLIENTE"] || ""}" disabled class="border px-3 py-2 rounded bg-gray-100" />
        <input type="text" value="${produto["COMPLEXIDADE"] || ""}" disabled class="border px-3 py-2 rounded bg-gray-100" />
        <input type="text" value="${produto["ENTRADA"] || ""}" disabled class="border px-3 py-2 rounded bg-gray-100" />
        <input type="text" value="${produto["SHIP DATE"] || ""}" disabled class="border px-3 py-2 rounded bg-gray-100" />
        <input type="text" value="${produto["TIPO"] || ""}" disabled class="border px-3 py-2 rounded bg-gray-100" />
        <input type="text" value="${produto["STATUS"] || ""}" disabled class="border px-3 py-2 rounded bg-gray-100" />

        <div class="col-span-2">
          <label class="font-bold">Processos Selecionados</label>
          <div class="flex flex-wrap gap-2 mt-2">
            ${(PROCESSOS.map(p => {
              const checked = (produto.processos || []).includes(p.id) ? 'checked' : '';
              return `<label class="flex items-center gap-2"><input type="checkbox" disabled ${checked}> ${p.label}</label>`;
            })).join('')}
          </div>
        </div>

        <div id="temposProcessosView" class="col-span-2"></div>

        <div id="secaoComponentesView" class="col-span-2 ${(produto["TIPO"] === "CONJUNTO") ? "" : "hidden"}">
          <label class="font-bold block mb-2">Componentes:</label>
          <div id="listaComponentesView" class="space-y-2"></div>
        </div>
      </div>

      <div class="flex justify-end mt-4">
        <button id="fecharVisualizar" class="bg-red-500 text-white px-4 py-2 rounded">Fechar</button>
      </div>
    </div>
  `;

  // montar view de tempos por processo (readonly)
  const processosList = produto.processos && produto.processos.length ? produto.processos : Object.keys(produto.tempos || {});
  montarCamposTempoView(modal.querySelector('#temposProcessosView'), processosList, produto.tempos || {});

  // renderizar componentes (readonly)
  const lista = modal.querySelector("#listaComponentesView");
  (produto.componentes || []).forEach(c => {
    const div = document.createElement('div');
    div.className = 'border rounded p-3 bg-gray-100 mb-2';

    const compTemposHtml = ['comercial','engenharia','homologado'].map(area=>{
      const tv = (c.tempos && c.tempos[area]) || {};
      const cap = area.charAt(0).toUpperCase() + area.slice(1);
      return `
        <div>
          <div class="font-semibold">${cap}</div>
          <div class="text-sm">Setup: ${tv.setup ?? '-'}</div>
          <div class="text-sm">Ciclo: ${tv.ciclo ?? '-'}</div>
        </div>
      `;
    }).join('');

    div.innerHTML = `
      <div class="grid grid-cols-2 gap-2">
        <input type="text" value="${c.partNumber || ''}" disabled class="border px-2 py-1 rounded bg-gray-100 w-full"/>
        <input type="text" value="${c.revisao || ''}" disabled class="border px-2 py-1 rounded bg-gray-100 w-full"/>
        <input type="text" value="${c.complexidade || ''}" disabled class="border px-2 py-1 rounded bg-gray-100 w-full"/>
        <input type="text" value="${c.status || ''}" disabled class="border px-2 py-1 rounded bg-gray-100 w-full"/>
      </div>

      <div class="mt-2 border-t pt-2 grid grid-cols-3 gap-3">
        ${compTemposHtml}
      </div>
    `;
    lista.appendChild(div);
  });

  modal.querySelector("#fecharVisualizar").addEventListener("click", ()=> modal.remove());
}




    // Captura clientes únicos para popular select
  const clientesUnicos = [...new Set(produtos.map(p => p.CLIENTE).filter(Boolean))];
  const selectCliente = $('#filtroCliente', mount);
  clientesUnicos.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    selectCliente.appendChild(opt);
  });

  // Eventos dos filtros
  ['#filtroProdutos','#filtroCliente','#filtroProcesso','#filtroDataInicio']
    .forEach(sel => {
      $(sel, mount).addEventListener("input", renderTabela);
      $(sel, mount).addEventListener("change", renderTabela);
    });

}

  // init
App();

// ======== Página de Gráficos ========
function GraficosPage(mount) {
  mount.innerHTML = `
    <div class="p-6 w-full">
      <h2 class="text-2xl font-bold mb-6">GRÁFICOS DE ANÁLISE</h2>
      
      <!-- Filtros -->
      <div class="flex items-center mb-6 gap-4">
        <select id="filtroAnoGraficos" class="border px-3 py-2 rounded">
          <option value="">Todos os Anos</option>
          <option value="2027">2027</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>
        <select id="filtroMesGraficos" class="border px-3 py-2 rounded">
          <option value="">Todos os Meses</option>
          <option value="1">Janeiro</option>
          <option value="2">Fevereiro</option>
          <option value="3">Março</option>
          <option value="4">Abril</option>
          <option value="5">Maio</option>
          <option value="6">Junho</option>
          <option value="7">Julho</option>
          <option value="8">Agosto</option>
          <option value="9">Setembro</option>
          <option value="10">Outubro</option>
          <option value="11">Novembro</option>
          <option value="12">Dezembro</option>
        </select>

        <select id="filtroClienteGraficos" class="border px-3 py-2 rounded">
          <option value="">Todos os Clientes</option>
        </select>
      </div>

      <!-- Container dos gráficos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Gráfico de Complexidade -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-lg font-bold mb-4">Distribuição por Complexidade</h3>
          <canvas id="graficoComplexidade" width="400" height="300"></canvas>
        </div>

        <!-- Gráfico Blank x Conjunto por Cliente -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-lg font-bold mb-4">Blank x Conjunto por Cliente</h3>
          <canvas id="graficoBlankConjunto" width="400" height="300"></canvas>
        </div>
      </div>
    </div>
  `;
  
  let graficoComplexidadeInstance = null;
  let graficoBlankConjuntoInstance = null;

  // Carregar Chart.js se não estiver carregado
  if (typeof Chart === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
      inicializarGraficos();
    };
    document.head.appendChild(script);
  } else {
    inicializarGraficos();
  }

  // Popular filtro de clientes
  const clientesUnicos = [...new Set(produtosanuais.map(p => p.CLIENTE).filter(Boolean))];
  const selectCliente = document.getElementById('filtroClienteGraficos');
  clientesUnicos.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    selectCliente.appendChild(opt);
  });



  // Eventos dos filtros
  document.getElementById('filtroAnoGraficos').addEventListener('change', atualizarGraficos);
  document.getElementById('filtroClienteGraficos').addEventListener('change', atualizarGraficos);
  document.getElementById('filtroMesGraficos').addEventListener('change', atualizarGraficos);

  function inicializarGraficos() {
    atualizarGraficos();
  }

  function atualizarGraficos() {
    const anoSelecionado = document.getElementById('filtroAnoGraficos').value;
    const clienteSelecionado = document.getElementById('filtroClienteGraficos').value;
    const mesSelecionado = document.getElementById('filtroMesGraficos').value;

    // Filtrar produtos
    const produtosFiltrados = produtosanuais.filter(p => {
      if (anoSelecionado) {
        const data = p["ENTRADA"];
        if (data) {
          const partes = data.split("/");
          if (partes.length >= 3) {
            const ano = parseInt(partes[2], 10);
            if (ano !== parseInt(anoSelecionado, 10)) return false;
          }
        }
      }

      if (mesSelecionado) {
        const data = p["ENTRADA"];
        if (data) {
          const partes = data.split("/");
          if (partes.length >= 3) {
            const mes = parseInt(partes[1], 10);
            if (mes !== parseInt(mesSelecionado, 10)) return false;
          }
        }
      }

      if (clienteSelecionado && p.CLIENTE !== clienteSelecionado) return false;
      
      return true;
    });

    // Atualizar gráfico de complexidade
    atualizarGraficoComplexidade(produtosFiltrados);
    
    // Atualizar gráfico Blank x Conjunto
    atualizarGraficoBlankConjunto(produtosFiltrados);
  }

  function atualizarGraficoComplexidade(produtos) {
    const complexidades = { 'BAIXA': 0, 'MÉDIA': 0, 'ALTA': 0, 'NÃO DEFINIDA': 0 };
    
    produtos.forEach(p => {
      const complexidade = p.COMPLEXIDADE || 'NÃO DEFINIDA';
      if (complexidades.hasOwnProperty(complexidade)) {
        complexidades[complexidade]++;
      } else {
        complexidades['NÃO DEFINIDA']++;
      }
    });

    const ctx = document.getElementById('graficoComplexidade').getContext('2d');
    
    if (graficoComplexidadeInstance) {
      graficoComplexidadeInstance.destroy();
    }

    graficoComplexidadeInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(complexidades),
        datasets: [{
          data: Object.values(complexidades),
          backgroundColor: ['#10B981','#F59E0B','#EF4444','#6B7280'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 14 }
            }
          },
          tooltip: { enabled: true },
          datalabels: {
            color: '#fff',
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

  function atualizarGraficoBlankConjunto(produtos) {
    // Agrupar por cliente e tipo
    const dadosPorCliente = {};
    
    produtos.forEach(p => {
      const cliente = p.CLIENTE || 'Não Definido';
      const tipo = p.TIPO || 'Não Definido';
      
      if (!dadosPorCliente[cliente]) {
        dadosPorCliente[cliente] = { BLANK: 0, CONJUNTO: 0, 'Não Definido': 0 };
      }
      
      if (dadosPorCliente[cliente].hasOwnProperty(tipo)) {
        dadosPorCliente[cliente][tipo]++;
      } else {
        dadosPorCliente[cliente]['Não Definido']++;
      }
    });

    const clientes = Object.keys(dadosPorCliente);
    const dadosBlank = clientes.map(c => dadosPorCliente[c].BLANK || 0);
    const dadosConjunto = clientes.map(c => dadosPorCliente[c].CONJUNTO || 0);
    const dadosNaoDefinido = clientes.map(c => dadosPorCliente[c]['Não Definido'] || 0);

    const ctx = document.getElementById('graficoBlankConjunto').getContext('2d');
    
    if (graficoBlankConjuntoInstance) {
      graficoBlankConjuntoInstance.destroy();
    }

    graficoBlankConjuntoInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: clientes,
        datasets: [
          {
            label: 'BLANK',
            data: dadosBlank,
            backgroundColor: '#3B82F6',
            borderColor: '#1D4ED8',
            borderWidth: 1
          },
          {
            label: 'CONJUNTO',
            data: dadosConjunto,
            backgroundColor: '#10B981',
            borderColor: '#047857',
            borderWidth: 1
          },
          {
            label: 'Não Definido',
            data: dadosNaoDefinido,
            backgroundColor: '#6B7280',
            borderColor: '#374151',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
          datalabels: {
            anchor: 'end',
            align: 'top',
            color: '#000',
            font: { weight: 'bold', size: 12 },
            formatter: value => value > 0 ? value : ''
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }
}

// ======== Página de ForeCast ========
function ForecastPage(mount) {
  mount.innerHTML = `
    <div class="p-6 w-full">
      <h2 class="text-2xl font-bold mb-6">FORECAST</h2>
      
      <!-- Upload de arquivo JSON -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 class="text-lg font-bold mb-4">Upload de Dados de Forecast</h3>
        <div class="flex items-center gap-4">
          <input type="file" id="uploadForecast" accept=".json" class="border px-3 py-2 rounded"/>
          <button id="btnProcessarForecast" class="bg-blue-600 text-white px-4 py-2 rounded">Processar Arquivo</button>
        </div>
        <p class="text-sm text-gray-600 mt-2">
          Formato esperado: JSON com array de objetos contendo partNumber, revisao, cliente e demandas mensais
        </p>
      </div>

      <!-- Tabela de Forecast -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-bold mb-4">Dados de Forecast</h3>
        <div class="overflow-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-200 text-gray-700">
                <th class="p-3 border">Part Number</th>
                <th class="p-3 border">Revisão</th>
                <th class="p-3 border">Cliente</th>
                <th class="p-3 border">Jan</th>
                <th class="p-3 border">Fev</th>
                <th class="p-3 border">Mar</th>
                <th class="p-3 border">Abr</th>
                <th class="p-3 border">Mai</th>
                <th class="p-3 border">Jun</th>
                <th class="p-3 border">Jul</th>
                <th class="p-3 border">Ago</th>
                <th class="p-3 border">Set</th>
                <th class="p-3 border">Out</th>
                <th class="p-3 border">Nov</th>
                <th class="p-3 border">Dez</th>
                <th class="p-3 border">Ações</th>
              </tr>
            </thead>
            <tbody id="tabelaForecast">
              <tr>
                <td colspan="16" class="p-4 text-center text-gray-500">
                  Nenhum dado de forecast carregado. Faça upload de um arquivo JSON.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Eventos
  document.getElementById('btnProcessarForecast').addEventListener('click', processarArquivoForecast);
  
  // Carregar dados existentes do Firebase se houver
  carregarForecastDoFirebase();

  function processarArquivoForecast() {
    const fileInput = document.getElementById('uploadForecast');
    const file = fileInput.files[0];
    
    if (!file) {
      alert('Por favor, selecione um arquivo JSON.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const dados = JSON.parse(e.target.result);
        
        if (!Array.isArray(dados)) {
          throw new Error('O arquivo deve conter um array de objetos.');
        }

        // Validar estrutura dos dados
        const dadosValidos = dados.filter(item => {
          return (item.partnumber || item.partNumber) && item.cliente;
        });


        if (dadosValidos.length === 0) {
          throw new Error('Nenhum dado válido encontrado no arquivo.');
        }

        // Salvar no Firebase e atualizar tabela
        salvarForecastNoFirebase(dadosValidos);
        renderizarTabelaForecast(dadosValidos);
        
        alert(`${dadosValidos.length} registros de forecast processados com sucesso!`);
        
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        alert('Erro ao processar arquivo: ' + error.message);
      }
    };
    
    reader.readAsText(file);
  }

  async function salvarForecastNoFirebase(dados) {
    try {
      // Aqui você pode implementar a lógica para salvar no Firebase
      // Por enquanto, vamos armazenar localmente
      localStorage.setItem('forecastData', JSON.stringify(dados));
    } catch (error) {
      console.error('Erro ao salvar forecast no Firebase:', error);
    }
  }

  function carregarForecastDoFirebase() {
    try {
      const dados = localStorage.getItem('forecastData');
      if (dados) {
        const forecastData = JSON.parse(dados);
        renderizarTabelaForecast(forecastData);
        console.log(forecastData);
      }
    } catch (error) {
      console.error('Erro ao carregar forecast do Firebase:', error);
    }
  }

  function renderizarTabelaForecast(dados) {
    const tabela = document.getElementById('tabelaForecast');
    if (!dados || dados.length === 0) {
      tabela.innerHTML = `
        <tr>
          <td colspan="16" class="p-4 text-center text-gray-500">
            Nenhum dado de forecast disponível.
          </td>
        </tr>
      `;
      return;
    }

    const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

    tabela.innerHTML = dados.map(item => {
      return `
        <tr class="border-b hover:bg-gray-50">
          <td class="p-3 border">${item.partnumber || item.partNumber || ''}</td>
          <td class="p-3 border">${item.revisao || ''}</td>
          <td class="p-3 border">${item.cliente || ''}</td>
          ${meses.map(mes => `<td class="p-3 border text-center">${item[mes] && item[mes] !== '-' ? item[mes] : 0}</td>`).join('')}
          <td class="p-3 border">
            <button class="bg-red-500 text-white px-2 py-1 rounded text-sm" 
              onclick="removerItemForecast('${item.partnumber || item.partNumber}')">
              Remover
            </button>
          </td>
        </tr>
      `;
    }).join('');
}

  // Função global para remover item
  window.removerItemForecast = function(partNumber) {
    try {
      const dados = JSON.parse(localStorage.getItem('forecastData') || '[]');
      const dadosFiltrados = dados.filter(item => item.partNumber !== partNumber);
      localStorage.setItem('forecastData', JSON.stringify(dadosFiltrados));
      renderizarTabelaForecast(dadosFiltrados);
      alert('Item removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover item:', error);
      alert('Erro ao remover item.');
    }
  };
}

// Função para renderizar componentes de forma legível
function renderizarListaComponentes(componentes = []) {
  if (!Array.isArray(componentes) || componentes.length === 0) {
    return "Nenhum componente cadastrado.";
  }
  return componentes.map(c => `
  <div class="p-2 border rounded mb-1 bg-gray-50">
    <strong>${c.partNumber || ""}</strong> Rev: ${c.revisao || ""}<br>
    Complexidade: ${c.complexidade || ""} | Status: ${c.status || ""}
  </div>
  `).join("");
}

// ======== Funções auxiliares para componentes ========
function adicionarComponente(modal, listaId = 'listaComponentes', compVals = {}) {
  const lista = modal.querySelector(`#${listaId}`);
  if (!lista) return;
  const componenteId = 'comp_' + Date.now() + '_' + Math.floor(Math.random()*10000);

  const v = compVals || {};
  const div = document.createElement('div');
  div.className = 'border rounded p-3 bg-gray-50 mb-2';
  div.dataset.componenteId = componenteId;

  // tempos por componente: comercial/engenharia/homologado -> setup/ciclo
  const areas = ['comercial','engenharia','homologado'];
  const temposHtml = areas.map(area => {
    const tv = (v.tempos && v.tempos[area]) || {};
    const cap = area.charAt(0).toUpperCase() + area.slice(1);
    return `
      <div>
        <div class="font-semibold">${cap}</div>

        <label class="text-xs block mt-1">Setup (h)</label>
        <input type="text" class="comp-tempo border px-2 py-1 rounded w-full"
              data-area="${area}" data-field="setup"
              value="${tv.setup ?? ''}"
              onblur="formatarCampoHora(this)"/>

        <label class="text-xs block mt-1">Ciclo (h)</label>
        <input type="text" class="comp-tempo border px-2 py-1 rounded w-full"
              data-area="${area}" data-field="ciclo"
              value="${tv.ciclo ?? ''}"
              onblur="formatarCampoHora(this)"/>
      </div>
    `;
  }).join('');

  div.innerHTML = `
    <div class="grid grid-cols-2 gap-2">
      <input type="text" placeholder="Part Number do Componente" value="${v.partNumber || ''}" class="componente-part border px-2 py-1 rounded w-full"/>
      <input type="text" placeholder="Revisão" value="${v.revisao || ''}" class="componente-revisao border px-2 py-1 rounded w-full"/>
      <select class="componente-complexidade border px-2 py-1 rounded w-full">
        <option value="">Complexidade</option>
        <option value="BAIXA" ${v.complexidade === 'BAIXA' ? 'selected' : ''}>BAIXA</option>
        <option value="MÉDIA" ${v.complexidade === 'MÉDIA' ? 'selected' : ''}>MÉDIA</option>
        <option value="ALTA" ${v.complexidade === 'ALTA' ? 'selected' : ''}>ALTA</option>
      </select>
      <select class="componente-status border px-2 py-1 rounded w-full">
        <option value="">Status</option>
        <option value="NÃO INICIADO" ${v.status === 'NÃO INICIADO' ? 'selected' : ''}>NÃO INICIADO</option>
        <option value="EM ANDAMENTO" ${v.status === 'EM ANDAMENTO' ? 'selected' : ''}>EM ANDAMENTO</option>
        <option value="FINALIZADO" ${v.status === 'FINALIZADO' ? 'selected' : ''}>FINALIZADO</option>
      </select>
    </div>

    <div class="mt-3 border-t pt-2">
      <div class="font-bold mb-2">Tempos do Componente (horas)</div>
      <div class="grid grid-cols-3 gap-3">
        ${temposHtml}
      </div>
    </div>

    <div class="flex justify-end mt-2">
      <button type="button" class="bg-red-500 text-white px-2 py-1 rounded text-sm remover-componente">Remover</button>
    </div>
  `;

  // evento remover
  div.querySelector('.remover-componente').addEventListener('click', ()=> div.remove());

  lista.appendChild(div);
}

// coleta componentes (funciona tanto para listaComponentes quanto listaComponentesEdit)
function coletarComponentes(modal, listaId = 'listaComponentes') {
  const lista = modal.querySelector(`#${listaId}`);
  const componentes = [];
  if (!lista) return componentes;

  Array.from(lista.querySelectorAll('[data-componente-id]')).forEach(div => {
    const tempos = { comercial:{setup:0,ciclo:0}, engenharia:{setup:0,ciclo:0}, homologado:{setup:0,ciclo:0} };
    div.querySelectorAll('.comp-tempo').forEach(inp => {
      const area = inp.dataset.area;
      const field = inp.dataset.field;
      const v = parseFloat(inp.value);
      if (!tempos[area]) tempos[area] = { setup:0, ciclo:0 };
      tempos[area][field] = isNaN(v) ? 0 : v;
    });

    componentes.push({
      id: div.dataset.componenteId,
      partNumber: div.querySelector('.componente-part')?.value || '',
      revisao: div.querySelector('.componente-revisao')?.value || '',
      complexidade: div.querySelector('.componente-complexidade')?.value || '',
      status: div.querySelector('.componente-status')?.value || '',
      tempos
    });
  });

  return componentes;
}




// ======== Funções auxiliares para componentes na edição ========
// helper para compatibilidade: adicionarComponenteEdit usa o mesmo mecanismo
function adicionarComponenteEdit(modal, compVals) {
  return adicionarComponente(modal, 'listaComponentesEdit', compVals);
}



function renderizarComponentesEdit(modal, componentes = []) {
  const listaComponentes = modal.querySelector("#listaComponentesEdit");
  listaComponentes.innerHTML = "";
  
  componentes.forEach(comp => {
    const componenteDiv = document.createElement("div");
    componenteDiv.className = "border rounded p-3 bg-gray-50";
    componenteDiv.dataset.componenteId = comp.id || Date.now();
    
    componenteDiv.innerHTML = `
      <div class="grid grid-cols-2 gap-2">
        <input type="text" placeholder="Part Number do Componente" value="${comp.partNumber || ''}" class="border px-2 py-1 rounded componente-part-edit"/>
        <input type="text" placeholder="Revisão" value="${comp.revisao || ''}" class="border px-2 py-1 rounded componente-revisao-edit"/>
        <select class="border px-2 py-1 rounded componente-cliente-edit">
          <option value="">Cliente</option>
          <option value="VOLVO" ${comp.cliente === 'VOLVO' ? 'selected' : ''}>VOLVO</option>
          <option value="KOMATSU" ${comp.cliente === 'KOMATSU' ? 'selected' : ''}>KOMATSU</option>
          <option value="JOHN DEERE" ${comp.cliente === 'JOHN DEERE' ? 'selected' : ''}>JOHN DEERE</option>
          <option value="CATERPILLAR" ${comp.cliente === 'CATERPILLAR' ? 'selected' : ''}>CATERPILLAR</option>
          <option value="KION" ${comp.cliente === 'KION' ? 'selected' : ''}>KION</option>
          <option value="TOYOTA" ${comp.cliente === 'TOYOTA' ? 'selected' : ''}>TOYOTA</option>
          <option value="CL CALDEIRARIA" ${comp.cliente === 'CL CALDEIRARIA' ? 'selected' : ''}>CL CALDEIRARIA</option>
        </select>
        <select class="border px-2 py-1 rounded componente-complexidade-edit">
          <option value="">Complexidade</option>
          <option value="BAIXA" ${comp.complexidade === 'BAIXA' ? 'selected' : ''}>BAIXA</option>
          <option value="MÉDIA" ${comp.complexidade === 'MÉDIA' ? 'selected' : ''}>MÉDIA</option>
          <option value="ALTA" ${comp.complexidade === 'ALTA' ? 'selected' : ''}>ALTA</option>
        </select>
        <input type="text" placeholder="Data Entrada" value="${comp.entrada || ''}" class="border px-2 py-1 rounded componente-entrada-edit"/>
        <input type="text" placeholder="Ship Date" value="${comp.shipDate || ''}" class="border px-2 py-1 rounded componente-ship-edit"/>
        <select class="border px-2 py-1 rounded componente-status-edit">
          <option value="">Status</option>
          <option value="NÃO INICIADO" ${comp.status === 'NÃO INICIADO' ? 'selected' : ''}>NÃO INICIADO</option>
          <option value="EM ANDAMENTO" ${comp.status === 'EM ANDAMENTO' ? 'selected' : ''}>EM ANDAMENTO</option>
          <option value="FINALIZADO" ${comp.status === 'FINALIZADO' ? 'selected' : ''}>FINALIZADO</option>
        </select>
        <button type="button" class="bg-red-500 text-white px-2 py-1 rounded text-sm remover-componente-edit">
          Remover
        </button>
      </div>
    `;
    
    listaComponentes.appendChild(componenteDiv);
    
    // Evento para remover componente
    componenteDiv.querySelector(".remover-componente-edit").addEventListener("click", () => {
      componenteDiv.remove();
    });
  });
}


