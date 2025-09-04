//JS PRODUTOS-ESC - Backend Version

//--------Informações de Datas--------//
const now = new Date();
const month = now.toLocaleString('default', { month: 'long' }).toUpperCase();
const monthnumber = now.getMonth() + 1;
const year = now.getFullYear(); 

const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

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

// ======== dados ========

// ========= Gráfico ========
function agruparProdutosPorMes(produtos, anos) {
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
    if (partes.length < 2) return;

    const mes = parseInt(partes[1], 10);
    const ano = parseInt(partes[2], 10);

    if (isNaN(mes) || mes < 1 || mes > 12) return;
    if (anos && ano !== anos) return;

    const indiceMes = mes - 1;

    resultado[indiceMes].produtos += 1;
    if (p.STATUS && p.STATUS.toUpperCase() === "FINALIZADO") {
      resultado[indiceMes].finalizados += 1;
    }
  });

  return resultado;
}

// Backend API base URL
const API_BASE_URL = '/api';

let produtosanuais = [];
let graphData = [];
let statusData = [];

// Função para carregar dados do backend
async function carregarDadosBackend() {
  try {
    console.log("Carregando dados do backend...");
    const response = await fetch(`${API_BASE_URL}/produtos`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    produtosanuais = await response.json();
    console.log("Produtos carregados do backend:", produtosanuais);
    
    graphData = agruparProdutosPorMes(produtosanuais);
    console.log("Dados do gráfico:", graphData);
    
    statusData = await carregarStatusData();
    console.log("Dados do Card:", statusData);
    
    // inicia a aplicação só depois dos dados carregados
    App();
    bindAnoFiltro();
  } catch (error) {
    console.error("Erro ao carregar dados do backend:", error);
    alert("Erro ao carregar dados do backend. Verifique a configuração.");
  }
}

async function carregarStatusData() {
  try {
    const response = await fetch(`${API_BASE_URL}/produtos/status-count?ano=${year}&mes=${monthnumber}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Erro ao carregar dados de status:", error);
    return [];
  }
}

// Inicializar carregamento dos dados
carregarDadosBackend();

function bindAnoFiltro(){
  const select = document.getElementById("anos");
  if (!select) return;
  select.addEventListener("change", async () => {
    const ano = select.value ? parseInt(select.value, 10) : null;
    
    // Recarregar dados filtrados
    try {
      const url = ano ? `${API_BASE_URL}/produtos?ano=${ano}` : `${API_BASE_URL}/produtos`;
      const response = await fetch(url);
      if (response.ok) {
        produtosanuais = await response.json();
        graphData = agruparProdutosPorMes(produtosanuais, ano);
        Graph(document.getElementById("graph"));  
        AddComponent(document.getElementById("addComponent"), ano);
        Clientes(document.getElementById("clientes"), ano);
        Satisfaction(document.getElementById("satisfaction"), ano);
      }
    } catch (error) {
      console.error("Erro ao filtrar dados:", error);
    }
  });
}  

function gerarStatusData(produtos, year) {
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

  function normalizarStatus(status) {
    return status
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function mapearStatus(status) {
    const s = normalizarStatus(status);
    if (s === "NAO INICIADO") return "NÃO INICIADO";
    if (s === "EM DESENVOLVIMENTO"  || s === "PROCESSO DE DOBRA" || 
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

    if (year && ano !== year) return;
    if (monthnumber && mes !== monthnumber) return;

    const status = mapearStatus(p.STATUS || "");
    if (status && contagem.hasOwnProperty(status)) {
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
  <div class="flex">
    <aside id="sidebar" class="fixed inset-y-0 left-0 bg-card w-full sm:w-20 xl:w-60 sm:flex flex-col z-10 hidden"></aside>
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
      { id: '1', title: 'Overview', notifications: false },
      { id: '2', title: 'Nova Info', notifications: false },
      { id: '3', title: 'Nova Info', notifications: false },
    ],
    [
      { id: '4', title: 'Nova Info', notifications: false },
      { id: '5', title: 'Nova Info', notifications: false },
      { id: '6', title: 'Nova Info', notifications: false },
    ],
  ];

  function render(){
    mount.innerHTML = `
      <div class="flex-shrink-0 overflow-hidden p-2 mt-12">
        <div class="flex items-center h-full sm:justify-center xl:justify-start p-2 sidebar-separator-top">
          ${IconButton({icon:'res-react-dash-logo', className:'w-8 h-8', asHtml:true})}
          <div class="block sm:hidden xl:block ml-2 font-bold text-xl text-black">PRODUTOS</div>
          <div class="flex-grow sm:hidden xl:block"></div>
          ${IconButton({icon:'res-react-dash-sidebar-close', className:'block sm:hidden', asHtml:true, onclick:'__onSidebarHide()'})}
        </div>
      </div>
      <div class="flex-grow overflow-x-hidden overflow-y-auto flex flex-col">
        ${sidebarItems[0].map(i=>MenuItem({item:i,selected})).join('')}
        <div class="mt-8 mb-0 font-bold px-3 block sm:hidden xl:block">ATALHOS</div>
        ${sidebarItems[1].map(i=>MenuItem({item:i,selected})).join('')}
        <div class="flex-grow"></div>
      </div>
      <div class="flex-shrink-0 overflow-hidden p-2">
        <div class="flex items-center h-full sm:justify-center xl:justify-start p-2 sidebar-separator-bottom">
          <div class="block sm:hidden xl:block ml-2 font-bold ">Usuario</div>
          <div class="flex-grow block sm:hidden xl:block"></div>
          ${Icon({path:'res-react-dash-options', className:'block sm:hidden xl:block w-3 h-3', asHtml:true})}
        </div>
      </div>`;

    // bind clicks
    $$('.js-menu').forEach(el=>{
      el.addEventListener('click', ()=>{
        selected = el.dataset.id;
        render();

        const content = document.getElementById("content");

        if (selected === '1') {
          // carrega a página de produtos overview
          ProdutosPage(content);
        } else {
          // carrega o dashboard normal
          Content({ mount: content });
        }
      });
    });
  }

  function MenuItem({ item:{id,title,notifications}, selected }){
    return `
      <div data-id="${id}" class="js-menu w-full mt-6 flex items-center px-3 sm:px-0 xl:px-3 justify-start sm:justify-center xl:justify-start sm:mt-6 xl:mt-3 cursor-pointer ${selected===id? 'sidebar-item-selected':'sidebar-item'}">
        ${SidebarIcon(id)}
        <div class="block sm:hidden xl:block ml-2">${title}</div>
        <div class="block sm:hidden xl:block flex-grow"></div>
        ${notifications ? `<div class='flex sm:hidden xl:flex bg-pink-600  w-5 h-5 items-center justify-center rounded-full mr-2'><div class='text-white text-sm'>${notifications}</div></div>`: ''}
      </div>`
  }

  // util icons/images
  function SidebarIcon(id){
    const map={
      0:`<svg class="w-8 h-8 xl:w-5 xl:h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 19C10.067 19 8.31704 18.2165 7.05029 16.9498L12 12V5C15.866 5 19 8.13401 19 12C19 15.866 15.866 19 12 19Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12ZM21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/></svg>`,
      1:`<svg class="w-8 h-8 xl:w-5 xl:h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 5C3 3.34315 4.34315 2 6 2H14C17.866 2 21 5.13401 21 9V19C21 20.6569 19.6569 22 18 22H6C4.34315 22 3 20.6569 3 19V5ZM13 4H6C5.44772 4 5 4.44772 5 5V19C5 19.5523 5.44772 20 6 20H18C18.5523 20 19 19.5523 19 19V9H13V4ZM18.584 7C17.9413 5.52906 16.6113 4.4271 15 4.10002V7H18.584Z"/></svg>`,
      2:`<svg class="w-8 h-8 xl:w-5 xl:h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M2 4V18L6.8 14.4C7.14582 14.1396 7.56713 13.9992 8 14H16C17.1046 14 18 13.1046 18 12V4C18 2.89543 17.1046 2 16 2H4C2.89543 2 2 2.89543 2 4ZM4 14V4H16V12H7.334C6.90107 11.9988 6.47964 12.1393 6.134 12.4L4 14Z"/><path d="M22 22V9C22 7.89543 21.1046 7 20 7V18L17.866 16.4C17.5204 16.1393 17.0989 15.9988 16.666 16H7C7 17.1046 7.89543 18 9 18H16C16.4329 17.9992 16.8542 18.1396 17.2 18.4L22 22Z"/></svg>`,
      3:`<svg class="w-8 h-8 xl:w-5 xl:h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M9 3C6.23858 3 4 5.23858 4 8C4 10.7614 6.23858 13 9 13C11.7614 13 14 10.7614 14 8C14 5.23858 11.7614 3 9 3ZM6 8C6 6.34315 7.34315 5 9 5C10.6569 5 12 6.34315 12 8C12 9.65685 10.6569 11 9 11C7.34315 11 6 9.65685 6 8Z"/><path d="M16.9084 8.21828C16.6271 8.07484 16.3158 8.00006 16 8.00006V6.00006C16.6316 6.00006 17.2542 6.14956 17.8169 6.43645C17.8789 6.46805 17.9399 6.50121 18 6.5359C18.4854 6.81614 18.9072 7.19569 19.2373 7.65055C19.6083 8.16172 19.8529 8.75347 19.9512 9.37737C20.0496 10.0013 19.9987 10.6396 19.8029 11.2401C19.6071 11.8405 19.2719 12.3861 18.8247 12.8321C18.3775 13.2782 17.8311 13.6119 17.2301 13.8062C16.6953 13.979 16.1308 14.037 15.5735 13.9772C15.5046 13.9698 15.4357 13.9606 15.367 13.9496C14.7438 13.8497 14.1531 13.6038 13.6431 13.2319L13.6421 13.2311L14.821 11.6156C15.0761 11.8017 15.3717 11.9248 15.6835 11.9747C15.9953 12.0247 16.3145 12.0001 16.615 11.903C16.9155 11.8059 17.1887 11.639 17.4123 11.416C17.6359 11.193 17.8035 10.9202 17.9014 10.62C17.9993 10.3198 18.0247 10.0006 17.9756 9.68869C17.9264 9.37675 17.8041 9.08089 17.6186 8.82531C17.4331 8.56974 17.1898 8.36172 16.9084 8.21828Z"/><path d="M19.9981 21C19.9981 20.475 19.8947 19.9551 19.6938 19.47C19.4928 18.9849 19.1983 18.5442 18.8271 18.1729C18.4558 17.8017 18.0151 17.5072 17.53 17.3062C17.0449 17.1053 16.525 17.0019 16 17.0019V15C16.6821 15 17.3584 15.1163 18 15.3431C18.0996 15.3783 18.1983 15.4162 18.2961 15.4567C19.0241 15.7583 19.6855 16.2002 20.2426 16.7574C20.7998 17.3145 21.2417 17.9759 21.5433 18.7039C21.5838 18.8017 21.6217 18.9004 21.6569 19C21.8837 19.6416 22 20.3179 22 21H19.9981Z"/><path d="M16 21H14C14 18.2386 11.7614 16 9 16C6.23858 16 4 18.2386 4 21H2C2 17.134 5.13401 14 9 14C12.866 14 16 17.134 16 21Z"/></svg>`,
      4:`<svg class="w-8 h-8 xl:w-5 xl:h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4H7V2H9V4H15V2H17V4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22ZM5 10V20H19V10H5ZM5 6V8H19V6H5ZM17 14H7V12H17V14Z"/></svg>`,
      5:`<svg class="w-8 h-8 xl:w-5 xl:h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M21.266 20.998H2.73301C2.37575 20.998 2.04563 20.8074 1.867 20.498C1.68837 20.1886 1.68838 19.8074 1.86701 19.498L11.133 3.49799C11.3118 3.1891 11.6416 2.9989 11.9985 2.9989C12.3554 2.9989 12.6852 3.1891 12.864 3.49799L22.13 19.498C22.3085 19.8072 22.3086 20.1882 22.1303 20.4975C21.9519 20.8069 21.6221 20.9976 21.265 20.998H21.266ZM12 5.99799L4.46901 18.998H19.533L12 5.99799ZM12.995 14.999H10.995V9.99799H12.995V14.999Z"/><path d="M11 16H13V18H11V16Z"/></svg>`,
      6:`<svg class="w-8 h-8 xl:w-5 xl:h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M13.82 22H10.18C9.71016 22 9.3036 21.673 9.20304 21.214L8.79604 19.33C8.25309 19.0921 7.73827 18.7946 7.26104 18.443L5.42404 19.028C4.97604 19.1709 4.48903 18.9823 4.25404 18.575L2.43004 15.424C2.19763 15.0165 2.2777 14.5025 2.62304 14.185L4.04804 12.885C3.98324 12.2961 3.98324 11.7019 4.04804 11.113L2.62304 9.816C2.27719 9.49837 2.19709 8.98372 2.43004 8.576L4.25004 5.423C4.48503 5.0157 4.97204 4.82714 5.42004 4.97L7.25704 5.555C7.5011 5.37416 7.75517 5.20722 8.01804 5.055C8.27038 4.91269 8.53008 4.78385 8.79604 4.669L9.20404 2.787C9.30411 2.32797 9.71023 2.00049 10.18 2H13.82C14.2899 2.00049 14.696 2.32797 14.796 2.787L15.208 4.67C15.4888 4.79352 15.7623 4.93308 16.027 5.088C16.274 5.23081 16.5127 5.38739 16.742 5.557L18.58 4.972C19.0277 4.82967 19.5142 5.01816 19.749 5.425L21.569 8.578C21.8015 8.98548 21.7214 9.49951 21.376 9.817L19.951 11.117C20.0158 11.7059 20.0158 12.3001 19.951 12.889L21.376 14.189C21.7214 14.5065 21.8015 15.0205 21.569 15.428L19.749 18.581C19.5142 18.9878 19.0277 19.1763 18.58 19.034L16.742 18.449C16.5095 18.6203 16.2678 18.7789 16.018 18.924C15.7559 19.0759 15.4854 19.2131 15.208 19.335L14.796 21.214C14.6956 21.6726 14.2895 21.9996 13.82 22ZM7.62004 16.229L8.44004 16.829C8.62489 16.9652 8.81755 17.0904 9.01704 17.204C9.20474 17.3127 9.39801 17.4115 9.59604 17.5L10.529 17.909L10.986 20H13.016L13.473 17.908L14.406 17.499C14.8133 17.3194 15.1999 17.0961 15.559 16.833L16.38 16.233L18.421 16.883L19.436 15.125L17.853 13.682L17.965 12.67C18.0142 12.2274 18.0142 11.7806 17.965 11.338L17.853 10.326L19.437 8.88L18.421 7.121L16.38 7.771L15.559 7.171C15.1998 6.90671 14.8133 6.68175 14.406 6.5L13.473 6.091L13.016 4H10.986L10.527 6.092L9.59604 6.5C9.39785 6.58704 9.20456 6.68486 9.01704 6.793C8.81878 6.90633 8.62713 7.03086 8.44304 7.166L7.62204 7.766L5.58204 7.116L4.56504 8.88L6.14804 10.321L6.03604 11.334C5.98684 11.7766 5.98684 12.2234 6.03604 12.666L6.14804 13.678L4.56504 15.121L5.58004 16.879L7.62004 16.229ZM11.996 16C9.7869 16 7.99604 14.2091 7.99604 12C7.99604 9.79086 9.7869 8 11.996 8C14.2052 8 15.996 9.79086 15.996 12C15.9933 14.208 14.204 15.9972 11.996 16ZM11.996 10C10.9034 10.0011 10.0139 10.8788 9.99827 11.9713C9.98262 13.0638 10.8466 13.9667 11.9387 13.9991C13.0309 14.0315 13.9469 13.1815 13.996 12.09V12.49V12C13.996 10.8954 13.1006 10 11.996 10Z"/></svg>`
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

function IconButton({icon='options', className='w-4 h-4', onclick='', asHtml=false}){
  const html = `<button onclick="${onclick}" class="flex items-center justify-center cursor-pointer">${Icon({path:icon, className, asHtml:true})}</button>`;
  return asHtml? html: (()=>{ const btn=document.createElement('button'); btn.className='flex items-center justify-center cursor-pointer'; btn.onclick=()=>eval(onclick); btn.appendChild(Icon({path:icon, className})); return btn; })();
}

// ======== Content ========
function Content({ mount }){
  mount.innerHTML = `
    <div class="w-full">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <div class="text-2xl font-bold">Dashboard de Produtos</div>
          <div class="ml-4">
            <select id="anos" class="px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Todos os anos</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
        </div>
        <button onclick="__onSidebarToggle()" class="block sm:hidden p-2 rounded-md bg-gray-100">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        ${statusData.map(item => `
          <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">${item.position}</p>
                <p class="text-2xl font-bold text-gray-900">${item.transactions}</p>
                <p class="text-lg font-semibold text-black">${item.name}</p>
              </div>
              <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div id="graph" class="bg-white p-6 rounded-lg shadow-md"></div>
        <div id="addComponent" class="bg-white p-6 rounded-lg shadow-md"></div>
      </div>
      
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <div id="clientes" class="bg-white p-6 rounded-lg shadow-md"></div>
        <div id="satisfaction" class="bg-white p-6 rounded-lg shadow-md"></div>
      </div>
    </div>`;

  Graph(document.getElementById("graph"));
  AddComponent(document.getElementById("addComponent"));
  Clientes(document.getElementById("clientes"));
  Satisfaction(document.getElementById("satisfaction"));
}

// Função para página de produtos (Overview)
function ProdutosPage(mount) {
  mount.innerHTML = `
    <div class="w-full tabela-overview">
      <div class="flex items-center justify-between mb-4">
        <div class="text-2xl font-bold">Lista de Produtos</div>
        <button onclick="adicionarProduto()" class="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800">
          Adicionar Produto
        </button>
      </div>
      
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-black text-white">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Cliente</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Descrição</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Entrada</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${produtosanuais.map(produto => `
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${produto.CLIENTE || 'Não definido'}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${produto.DESCRICAO || 'Sem descrição'}</div>
                    <div class="text-sm text-gray-500">${produto.OBSERVACOES || ''}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(produto.STATUS)}">${produto.STATUS || 'Não definido'}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${produto.ENTRADA || 'Não definida'}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="editarProduto('${produto.id}')" class="text-black hover:text-gray-700 mr-3">Editar</button>
                    <button onclick="excluirProduto('${produto.id}')" class="text-red-600 hover:text-red-900">Excluir</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function getStatusColor(status) {
  if (!status) return 'bg-gray-100 text-gray-800';
  const s = status.toUpperCase();
  if (s.includes('FINALIZADO')) return 'bg-green-100 text-green-800';
  if (s.includes('ANDAMENTO') || s.includes('DESENVOLVIMENTO') || s.includes('PROCESSO')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
}

// Funções para manipular produtos
async function adicionarProduto() {
  const cliente = prompt('Cliente:');
  if (!cliente) return;
  
  const descricao = prompt('Descrição:');
  const observacoes = prompt('Observações:');
  
  const novoProduto = {
    ENTRADA: new Date().toLocaleDateString('pt-BR'),
    STATUS: 'NÃO INICIADO',
    CLIENTE: cliente,
    DESCRICAO: descricao,
    OBSERVACOES: observacoes
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/produtos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(novoProduto)
    });
    
    if (response.ok) {
      alert('Produto adicionado com sucesso!');
      carregarDadosBackend(); // Recarregar dados
    } else {
      alert('Erro ao adicionar produto');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao adicionar produto');
  }
}

async function editarProduto(id) {
  const produto = produtosanuais.find(p => p.id === id);
  if (!produto) return;
  
  const cliente = prompt('Cliente:', produto.CLIENTE);
  if (cliente === null) return;
  
  const status = prompt('Status:', produto.STATUS);
  const descricao = prompt('Descrição:', produto.DESCRICAO);
  const observacoes = prompt('Observações:', produto.OBSERVACOES);
  
  const produtoAtualizado = {
    CLIENTE: cliente,
    STATUS: status,
    DESCRICAO: descricao,
    OBSERVACOES: observacoes
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(produtoAtualizado)
    });
    
    if (response.ok) {
      alert('Produto atualizado com sucesso!');
      carregarDadosBackend(); // Recarregar dados
    } else {
      alert('Erro ao atualizar produto');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao atualizar produto');
  }
}

async function excluirProduto(id) {
  if (!confirm('Tem certeza que deseja excluir este produto?')) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      alert('Produto excluído com sucesso!');
      carregarDadosBackend(); // Recarregar dados
    } else {
      alert('Erro ao excluir produto');
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao excluir produto');
  }
}

// Componentes de gráfico e outros (simplificados)
function Graph(mount) {
  mount.innerHTML = `
    <div>
      <h3 class="text-lg font-semibold mb-4">Produtos por Mês</h3>
      <div class="h-64 flex items-end justify-between space-x-2">
        ${graphData.map(item => `
          <div class="flex flex-col items-center">
            <div class="bg-black rounded-t" style="height: ${Math.max(item.produtos * 10, 5)}px; width: 20px;"></div>
            <div class="text-xs mt-1">${item.name}</div>
            <div class="text-xs text-gray-500">${item.produtos}</div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

function AddComponent(mount) {
  mount.innerHTML = `
    <div>
      <h3 class="text-lg font-semibold mb-4">Ações Rápidas</h3>
      <div class="space-y-3">
        <button onclick="adicionarProduto()" class="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200">
          <div class="font-medium text-gray-900">Novo Produto</div>
          <div class="text-sm text-gray-700">Adicionar um novo produto ao sistema</div>
        </button>
        <button class="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200">
          <div class="font-medium text-blue-900">Relatório Mensal</div>
          <div class="text-sm text-blue-700">Gerar relatório de produtos do mês</div>
        </button>
      </div>
    </div>`;
}

function Clientes(mount) {
  mount.innerHTML = `
    <div>
      <h3 class="text-lg font-semibold mb-4">Clientes Ativos</h3>
      <div class="space-y-2">
        ${[...new Set(produtosanuais.map(p => p.CLIENTE).filter(c => c))].slice(0, 5).map(cliente => `
          <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span class="text-sm">${cliente}</span>
            <span class="text-xs text-gray-500">${produtosanuais.filter(p => p.CLIENTE === cliente).length} produtos</span>
          </div>
        `).join('')}
      </div>
    </div>`;
}

function Satisfaction(mount) {
  mount.innerHTML = `
    <div>
      <h3 class="text-lg font-semibold mb-4">Status dos Produtos</h3>
      <div class="space-y-3">
        ${statusData.map(item => `
          <div class="flex items-center justify-between">
            <span class="text-sm">${item.name}</span>
            <div class="flex items-center">
              <div class="w-20 bg-gray-200 rounded-full h-2 mr-2">
                <div class="bg-black h-2 rounded-full" style="width: ${Math.min((item.transactions / Math.max(...statusData.map(s => s.transactions))) * 100, 100)}%"></div>
              </div>
              <span class="text-sm font-medium">${item.transactions}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

