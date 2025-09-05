

  // Data Atual
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

    const partes = data.split("/"); // deve ser ["18","01","2024"]
    if (partes.length < 2) return;

    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10);
    const ano = parseInt(partes[2], 10);

    if (isNaN(mes) || mes < 1 || mes > 12) return; // ignora datas inválidas
    if (anos && ano !== anos) return;

    const indiceMes = mes - 1;

    resultado[indiceMes].produtos += 1;
    if (p.STATUS && p.STATUS.toUpperCase() === "FINALIZADO") {
      resultado[indiceMes].finalizados += 1;
    }
  });

  return resultado;
}

// Importar configuração do Firebase
import { firebaseService } from 'https://nox-user.github.io/MOSB-PIE/firebase-config.js';

let produtosanuais = [];
let graphData = [];
let statusData = [];

// Função para carregar dados do Firebase
async function carregarDadosFirebase() {
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
    bindAnoFiltro();
  } catch (error) {
    console.error("Erro ao carregar dados do Firebase:", error);
    alert("Erro ao carregar dados do Firebase. Verifique a configuração.");
  }
}

// Inicializar carregamento dos dados
carregarDadosFirebase();

function bindAnoFiltro(){
  const select = document.getElementById("anos");
  if (!select) return;
  select.addEventListener("change", () => {
    const ano = select.value ? parseInt(select.value, 10) : null;
    graphData = agruparProdutosPorMes(produtosanuais, ano);
    Graph(document.getElementById("graph"));  
    AddComponent(document.getElementById("addComponent"), ano);
    Clientes(document.getElementById("clientes"), ano);
    Satisfaction(document.getElementById("satisfaction"), ano);
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
        { id: '2', title: 'Gráficos', notifications: false },
        { id: '3', title: 'ForeCast', notifications: false },
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

  // Cria/atualiza inputs de tempo para cada checkbox marcado
  function montarCamposTempoPorProcesso(modal, classeCheckbox, seletorContainer, valoresPreExistentes = {}) {
    const container = modal.querySelector(seletorContainer);
    if (!container) return;

    const selecionados = Array.from(modal.querySelectorAll(`.${classeCheckbox}:checked`))
      .map(cb => cb.value);

    container.innerHTML = "";

    selecionados.forEach(proc => {
      const label = PROCESSOS.find(p => p.id === proc)?.label || proc;
      const valores = valoresPreExistentes[proc] || {};

      const wrap = document.createElement("div");
      wrap.className = "border rounded p-3 mb-2";
      wrap.innerHTML = `
        <div class="font-bold mb-2">${label}</div>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label>Comercial</label>
            <input type="text" class="tempoProc border px-2 py-1 rounded w-full" 
                  data-proc="${proc}" data-tipo="comercial"
                  value="${valores.comercial ?? ""}">
          </div>
          <div>
            <label>Engenharia</label>
            <input type="text" class="tempoProc border px-2 py-1 rounded w-full"
                  data-proc="${proc}" data-tipo="engenharia"
                  value="${valores.engenharia ?? ""}">
          </div>
          <div>
            <label>Homologado</label>
            <input type="text" class="tempoProc border px-2 py-1 rounded w-full"
                  data-proc="${proc}" data-tipo="homologado"
                  value="${valores.homologado ?? ""}">
          </div>
        </div>
      `;

      container.appendChild(wrap);

      // === aplicar máscara em todos os inputs do wrap recém-criado ===
      wrap.querySelectorAll(".tempoProc").forEach(input => {
        input.setAttribute("maxlength", "6"); // ex: "12h30m"
        input.addEventListener("input", () => {
          let v = input.value.replace(/\D/g, ""); // só números
          if (v.length > 4) v = v.slice(0, 4);   // máximo 4 dígitos

          let horas = v.slice(0, 2);
          let minutos = v.slice(2);

          let resultado = "";
          if (horas) resultado += horas + "h";
          if (minutos) resultado += minutos + "m";

          input.value = resultado;
        });
      });
    });
  }


    // Coleta objeto { USINAGEM: 3.5, SOLDA: 1, ... } a partir dos inputs
  function coletarTemposPorProcesso(modal) {
    const tempos = {};
    modal.querySelectorAll(".tempoProc").forEach(inp => {
      const proc = inp.dataset.proc;
      const tipo = inp.dataset.tipo;
      const v = parseFloat(inp.value);
      if (!tempos[proc]) tempos[proc] = {};
      tempos[proc][tipo] = isNaN(v) ? 0 : v;
    });
    return tempos;
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
        <div class="rounded-lg bg-card-content overflow-hidden h-80" id="addComponent"></div>
      </div>
      <div class="w-full p-2 lg:w-1/3">
        <div class="rounded-lg bg-card-content h-80" id="segmentation"></div>
      </div>
      <div class="w-full p-2 lg:w-1/3">
        <div class="rounded-lg bg-card-content h-80" id="satisfaction"></div>
      </div>
      <div class="w-full p-2 lg:w-1/3">
        <div class="rounded-lg bg-card-content h-80 p-4" id="clientes"></div>
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

  function statusCard({id, name, position, transactions, rise}){
    const wrap = document.createElement('div');
    wrap.className='w-full p-2 lg:w-1/3';

    let statusIcon = [];
      
    switch(id){
      case 1: // X
          statusIcon = '<i class="fi fi-bs-cross animate-draw-x"></i>';
          break;
      case 2: // refresh
          statusIcon = '<i class="fi fi-bs-refresh animate-refresh"></i>';
          break;
      case 3: // check
          statusIcon = '<i class="fi fi-bs-check animate-draw-check"></i>';
          break;
      default:
          statusIcon = '<i class="fa fa-question-circle"></i>';
    }

    wrap.innerHTML = `
      <div class="rounded-lg bg-card-content flex justify-between items-center p-3 h-32">
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
          <div class="text-sm text-gray-400">No mês de: ${month}</div>
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

  mount.innerHTML = `
    <div class="flex p-1 h-full flex-col">
    <div className="w-full h-80 p-4 bg-white rounded-2xl shadow-md"> 

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
        <!-- Filtro de ano à direita -->
        <div class="ml-2">
          <label for="anos">Filtrar por </label>
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

    const pointsFinalizados = graphData.map((d,i)=>`
      <circle cx="${xs(i)}" cy="${ys(d.finalizados)}" r="6" fill="transparent" class="point"
        data-type="PPAP's Finalizados" data-label="${d.name}" data-value="${d.finalizados}" />
    `).join('');

    const pointsMeta = graphData.map((d,i)=>`
      <circle cx="${xs(i)}" cy="${ys(d.meta)}" r="6" fill="transparent" class="point"
        data-type="Meta" data-label="${d.name}" data-value="${d.meta}" />
    `).join('');

    svgWrap.style.position = "relative"; // garante que o tooltip posicione certo

    svgWrap.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <!-- grid vertical -->
        ${xTicks.map(t=>`<line x1="${t.x}" x2="${t.x}" y1="${y1}" y2="${y0}" stroke="#ffffffff" stroke-width="6"/>`).join('')}
        <!-- grid horizontal -->
        ${yTicks.map(t=>`<line x1="${x0}" x2="${x1}" y1="${t.y}" y2="${t.y}" stroke="#a5a5a5ff" stroke-width="0,5"/>`).join('')}
        <!-- eixo X labels -->
        ${xTicks.map(t=>`<text x="${t.x}" y="${y0 + 20}" text-anchor="middle" font-size="12" fill="#000000ff">${t.label}</text>`).join('')}
        
        <!-- Barras -->
        ${graphData.map((d,i)=>`
          <rect x="${xs(i)-10}" y="${ys(d.produtos)}" width="20" height="${y0 - ys(d.produtos)}" fill="#4472C4"
            data-type="PPAP's Total" data-label="${d.name}" data-value="${d.produtos}"/>
        `).join('')}
        
        <!-- Linha finalizados -->
        <path d="${pathFinalizados}" fill="none" stroke="#ED7D31" stroke-width="3"/>
        ${pointsFinalizados}

        <!-- Linha meta fixa -->
        <path d="${pathMeta}" fill="none" stroke="#ff0000ff" stroke-dasharray="6,3" stroke-width="2"/>
        ${pointsMeta}  

        </svg>
        <!-- Tooltip customizado -->
        <div id="tooltip" style="position:absolute; pointer-events:none; display:none; z-index:10; white-space:nowrap;">
          <div class="rounded-xl overflow-hidden bg-gray-800 shadow-lg">
            <div class="tooltip-body text-center p-3">
              <div class="text-white font-bold text-sm" id="tooltip-value">$0</div>
              <div class="text-gray-300 text-xs" id="tooltip-label">Detalhe</div>
            </div>
          </div>
        </div>
      `;

      const svg = svgWrap.querySelector("svg");
      const tooltip = svgWrap.querySelector("#tooltip");

      // ativa tooltip só nas barras (sem pontos visíveis)
      const points = svg.querySelectorAll("circle.point");
      const bars = svg.querySelectorAll("rect");

      // Apenas os pontos ficam visíveis ao passar o mouse
      svg.addEventListener("mousemove", e => {
          let nearest = null;
          let minDist = Infinity;
          points.forEach(pt => {
              const cx = parseFloat(pt.getAttribute("cx"));
              const cy = parseFloat(pt.getAttribute("cy"));
              const dx = e.offsetX - cx;
              const dy = e.offsetY - cy;
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist < minDist) {
                  minDist = dist;
                  nearest = pt;
              }
              pt.setAttribute("fill", "transparent"); // reset todos pontos
          });

          if (nearest && minDist < 20) { // só trava se o mouse estiver próximo
              nearest.setAttribute("fill", "#ff8800ff"); // ponto visível
              tooltip.style.display = "block";
              tooltip.style.left = (parseFloat(nearest.getAttribute("cx")) + 15) + "px";
              tooltip.style.top = (parseFloat(nearest.getAttribute("cy")) - 30) + "px";
              tooltip.querySelector("#tooltip-value").innerText = nearest.dataset.value;
              tooltip.querySelector("#tooltip-label").innerText = `${nearest.dataset.type} em ${nearest.dataset.label}`;
          } else {
              tooltip.style.display = "none";
          }
      });

      // As barras mantêm a cor original
      bars.forEach(bar => {
          bar.addEventListener("mousemove", e => {
              e.stopPropagation(); // importante! impede que o SVG trate o mouse
              tooltip.style.display = "block";
              tooltip.style.left = (e.offsetX + 15) + "px";
              tooltip.style.top = (e.offsetY - 30) + "px";
              tooltip.querySelector("#tooltip-value").innerText = bar.dataset.value;
              tooltip.querySelector("#tooltip-label").innerText = `${bar.dataset.type} em ${bar.dataset.label}`;
          });
          bar.addEventListener("mouseleave", e => {
              tooltip.style.display = "none";
          });
      });
  }

  renderSvg();
  bindAnoFiltro();
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
    <div class="p-4 h-full">
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

function Satisfaction(mount, anoSelecionado){
  // filtrar produtos do mês atual e ano selecionado
  const produtosFiltrados = produtosanuais.filter(p => {
    const data = p["ENTRADA"];
    if (!data) return false;
    const partes = data.split("/");
    if (partes.length < 3) return false;

    const mes = parseInt(partes[1], 10);
    const ano = parseInt(partes[2], 10);

    if (anoSelecionado && ano !== anoSelecionado) return false;
    if (mes !== monthnumber) return false;

    return true;
  });

  // contar finalizados
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
    <div class="p-4 h-full">
      <div class="flex justify-between items-center">
        <div class="text-Black font-bold">DADOS GERAIS:</div>
        <img src="https://assets.codepen.io/3685267/res-react-dash-options.svg" class="w-2 h-2"/>
      </div>
      <div class="mt-3">Índice de Finalização de Amostras:</div>
      <div class="flex justify-center"><svg viewBox="0 0 700 380" fill="none" width="300" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 350C100 283.696 126.339 220.107 173.223 173.223C220.107 126.339 283.696 100 350 100C416.304 100 479.893 126.339 526.777 173.223C573.661 220.107 600 283.696 600 350" stroke="#2d2d2d" stroke-width="40" stroke-linecap="round"/>
        <path id="satPath" d="M100 350C100 283.696 126.339 220.107 173.223 173.223C220.107 126.339 283.696 100 350 100C416.304 100 479.893 126.339 526.777 173.223C573.661 220.107 600 283.696 600 350" stroke="#2f49d0" stroke-width="40" stroke-linecap="round" stroke-dasharray="785.4" stroke-dashoffset="785.4"/>
        <circle id="satDot" cx="140" cy="350" r="12" fill="#fff"/>
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


  function AddComponent(mount, anoSelecionado){
    // calcula total de produtos filtrados pelo ano
    const dados = agruparProdutosPorMes(produtosanuais, anoSelecionado);
    const totalProdutos = dados.reduce((soma, d) => soma + d.produtos, 0);

    const totalFuncionarios = 16;
    const ncPermitido = Math.round(totalProdutos * 0.005); // 0,5%
    const ncReal = 2;

    mount.innerHTML = `
      <div class="p-4 h-full flex flex-col">
        <div class="text-black font-bold text-lg mb-4 border-b pb-2">
          SUMÁRIO DE AMOSTRAS (KPI) (${anoSelecionado || 'Todos'})
        </div>
        <div class="flex-grow overflow-auto">
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
  
function Clientes(mount, anoSelecionado){
  // filtrar produtos do mês atual e ano (ou todos os anos se vazio)
  const produtosFiltrados = produtosanuais.filter(p => {
    const data = p["ENTRADA"];
    if (!data) return false;
    const partes = data.split("/");
    if (partes.length < 3) return false;

    const mes = parseInt(partes[1], 10);
    const ano = parseInt(partes[2], 10);

    if (anoSelecionado && ano !== anoSelecionado) return false;
    if (mes !== monthnumber) return false;

    return true;
  });

  // agrupar por cliente
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

  // render
  mount.innerHTML = `
    <div class="flex justify-between items-center">
      <div class="text-black font-bold">DADOS GERAIS:</div>
      <img src="https://assets.codepen.io/3685267/res-react-dash-options.svg" class="w-2 h-2"/>
    </div>
    <div class="mt-3">Total de Amostras por Cliente em: ${month}</div>
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
      <div class="tabela-overview overflow-auto border rounded-lg">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-200 text-gray-700">
              <th class="p-3">Part Number</th>
              <th class="p-3">Cliente</th>
              <th class="p-3">Entrada</th>
              <th class="p-3">Ship Date</th>
              <th class="p-3">Status</th>
              <th class="p-3">Ações</th>
            </tr>
          </thead>
          <tbody id="tabelaProdutos"></tbody>
        </table>
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
        const [dia, mes, ano] = data.split("/");
        const dataProduto = new Date(`${ano}-${mes}-${dia}`);

        if (dataInicio) {
          const inicio = new Date(dataInicio);
          if (dataProduto < inicio) return false;
        }
      }
      return true;
    });

    // Renderiza os produtos filtrados
    filtrados.forEach((p) => {
      const tr = document.createElement("tr");
      tr.className = "border-b hover:bg-gray-50";
      tr.innerHTML = `
        <td class="p-2">${p["PART NUMBER"] || ""}</td>
        <td class="p-2">${p["CLIENTE"] || ""}</td>
        <td class="p-2">${p["ENTRADA"] || ""}</td>
        <td class="p-2">${p["SHIP DATE"] || ""}</td>
        <td class="p-2">${renderStatusBadge(p["STATUS"])}</td>
        <td class="p-2">
          <button class="bg-blue-500 text-white px-2 py-1 rounded text-sm editarProduto">Editar</button>
          <button class="bg-gray-600 text-white px-2 py-1 rounded text-sm visualizarProduto">Visualizar</button>
        </td>
      `;
      tabela.appendChild(tr);

      // passa o produto inteiro
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
  else if (s.includes("ANDAMENTO")) cor = "bg-blue-500 text-white";
  else if (s.includes("NÃO INICIADO") || s.includes("NAO INICIADO")) cor = "bg-gray-500 text-white";
  else if (s.includes("PROCESSO DE USINAGEM")) cor = "bg-blue-500 text-white";
  else if (s.includes("PROCESSO DE DOBRA")) cor = "bg-purple-500 text-white";
  else if (s.includes("PROCESSO DE CHANFRO")) cor = "bg-orange-500 text-white";
  else if (s.includes("PROCESSO DE SOLDA")) cor = "bg-yellow-500 text-white";
  else cor = "bg-red-500 text-white"; // status desconhecido

  return `<span class="px-2 py-1 rounded text-xs font-bold ${cor}">${status}</span>`;
  }

  // ==== Funções auxiliares ====
  function abrirModalNovoProduto(){
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
            <option value="CL CALDEIRARIA">CL CALDEIRARIA</option              
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
          </select>
          
          <!-- Seção de Componentes (aparece apenas para CONJUNTO) -->
          <div id="secaoComponentes" class="col-span-2 hidden">
            <label class="font-bold">Componentes do Conjunto:</label>
            <div id="listaComponentes" class="mt-2 space-y-2"></div>
            <button type="button" id="btnAdicionarComponente" class="bg-green-500 text-white px-3 py-1 rounded text-sm mt-2">+ Adicionar Componente</button>
          </div>
          <div class="col-span-2">
            <label class="font-bold">Processos:</label>
            <div class="flex flex-wrap gap-4 mt-2">
              ${PROCESSOS.map(p => `
                <label class="flex items-center gap-2">
                  <input type="checkbox" value="${p.id}" class="novoProcesso"> ${p.label}
                </label>
              `).join("")}
            </div>

            <!-- Aqui vão aparecer os tempos de cada processo marcado -->
            <div id="temposProcessosNovo" class="grid grid-cols-1 gap-3 mt-3"></div>
          </div>

          <!-- Seção de Componentes (apenas para CONJUNTO) -->
          <div id="secaoComponentes" class="col-span-2 hidden">
            <label class="font-bold">Componentes do Conjunto:</label>
            <div id="listaComponentes" class="mt-2 space-y-2"></div>
            <button type="button" id="btnAdicionarComponente" class="bg-green-500 text-white px-3 py-1 rounded text-sm mt-2">
              + Adicionar Componente
            </button>
          </div>
        </div>
        <div class="flex justify-end mt-4 gap-2">
          <button id="cancelarNovo" class="bg-gray-500 text-white px-4 py-2 rounded">Cancelar</button>
          <button id="salvarNovo" class="bg-green-600 text-white px-4 py-2 rounded">Salvar</button>
        </div>
      </div>
    `;

    // Sempre que marcar/desmarcar um processo → cria os campos de tempo
    modal.querySelectorAll(".novoProcesso").forEach(cb => {
      cb.addEventListener("change", () => {
        montarCamposTempoPorProcesso(modal, "novoProcesso", "#temposProcessosNovo");
      });
    });

    // Mostrar/ocultar seção de componentes baseado no tipo
    modal.querySelector("#novoTipo").addEventListener("change", (e) => {
      const secaoComponentes = modal.querySelector("#secaoComponentes");
      if (e.target.value === "CONJUNTO") {
        secaoComponentes.classList.remove("hidden");
      } else {
        secaoComponentes.classList.add("hidden");
      }
    });

    // Adicionar componente
    modal.querySelector("#btnAdicionarComponente").addEventListener("click", () => {
      adicionarComponente(modal, "listaComponentes");
    });
    // cancelar
    modal.querySelector("#cancelarNovo").addEventListener("click", ()=> modal.remove());

    // salvar
    modal.querySelector("#salvarNovo").addEventListener("click", async ()=>{
      const processosSelecionados = Array
        .from(modal.querySelectorAll(".novoProcesso:checked"))
        .map(cb => cb.value);

      const tempos = coletarTemposPorProcesso(modal);
      const componentes = coletarComponentes(modal, "listaComponentes");

      const novo = {
        "PART NUMBER": $("#novoPart", modal).value,
        "REVISAO": $("#novoRevisao", modal).value,
        "CLIENTE": $("#novoCliente", modal).value,
        "COMPLEXIDADE": $("#novoComplexidade", modal).value,
        "TIPO": $("#novoTipo", modal).value,
        "ENTRADA": $("#novoEntrada", modal).value,
        "SHIP DATE": $("#novoShip", modal).value,
        "STATUS": $("#novoStatus", modal).value,
        "processos": processosSelecionados,
        "tempos": tempos, // <- tempos organizados por processo
        "componentes": componentes // <- componentes do conjunto
      };

      try {
        const novoId = await firebaseService.addProduto(novo);
        produtos.push({ id: novoId, ...novo });
        produtosanuais.push({ id: novoId, ...novo });

        modal.remove();
        renderTabela();
        graphData = agruparProdutosPorMes(produtosanuais);
        statusData = gerarStatusData(produtosanuais, year, month);
        alert("Produto adicionado com sucesso!");
      } catch (error) {
        console.error(error);
        alert("Erro ao adicionar produto.");
      }
    });
  }

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
            <option value="VOLVO">VOLVO</option>
            <option value="KOMATSU">KOMATSU</option>
            <option value="JOHN DEERE">JOHN DEERE</option>
            <option value="CATERPILLAR">CATERPILLAR</option>
            <option value="KION">KION</option>
            <option value="TOYOTA">TOYOTA</option>
            <option value="CL CALDEIRARIA">CL CALDEIRARIA</option             
          </select>
          
          <select id="editComplexidade" class="border px-3 py-2 rounded">
            <option value="">Selecione a Complexidade</option>
            <option value="BAIXA">BAIXA</option>
            <option value="MÉDIA">MÉDIA</option>
            <option value="ALTA">ALTA</option>
          </select>
          
          <input type="text" id="editEntrada" value="${produto["ENTRADA"] || ""}" placeholder="Data Entrada (dd/mm/yyyy)" class="border px-3 py-2 rounded"/>
          <input type="text" id="editShip" value="${produto["SHIP DATE"] || ""}" placeholder="Ship Date" class="border px-3 py-2 rounded"/>
          
          <select id="editTipo" class="border px-3 py-2 rounded">
            <option value="">Selecione o Tipo</option>
            <option value="BLANK">BLANK</option>
            <option value="CONJUNTO">CONJUNTO</option>
          </select>
          
          <!-- Seção de Componentes (aparece apenas para CONJUNTO) -->
          <div id="secaoComponentesEdit" class="col-span-2 hidden">
            <label class="font-bold">Componentes do Conjunto:</label>
            <div id="listaComponentesEdit" class="mt-2 space-y-2"></div>
            <button type="button" id="btnAdicionarComponenteEdit" class="bg-green-500 text-white px-3 py-1 rounded text-sm mt-2">+ Adicionar Componente</button>
          </div>
          
          <input type="number" id="novoTempoComercial" placeholder="Tempo Comercial (h)" class="border px-3 py-2 rounded"/>
          <input type="number" id="novoTempoEngenharia" placeholder="Tempo Engenharia (h)" class="border px-3 py-2 rounded"/>
          <input type="number" id="novoTempoHomologado" placeholder="Tempo Homologado (h)" class="border px-3 py-2 rounded"/>


          <select id="editStatus" class="border px-3 py-2 rounded col-span-2">
            <option value="">Selecione o Status</option>
            <option value="NÃO INICIADO">NÃO INICIADO</option>
            <option value="EM ANDAMENTO">EM ANDAMENTO</option>
            <option value="FINALIZADO">FINALIZADO</option>
            <option value="PROCESSO DE USINAGEM">PROCESSO DE USINAGEM</option>
            <option value="PROCESSO DE CHANFRO">PROCESSO DE CHANFRO</option>
            <option value="PROCESSO DE DOBRA">PROCESSO DE DOBRA</option>
            <option value="PROCESSO DE SOLDA">PROCESSO DE SOLDA</option>
          </select>

          <div class="col-span-2">
            <label class="font-bold">Processos:</label>
            <div class="flex flex-wrap gap-4 mt-2">
              ${PROCESSOS.map(p => `
                <label class="flex items-center gap-2">
                  <input type="checkbox" value="${p.id}" class="editProcesso"> ${p.label}
                </label>
              `).join("")}
            </div>

            <!-- Tempos por processo (edit) -->
            <div id="temposProcessosEdit" class="grid grid-cols-1 gap-3 mt-3"></div>
          </div>

          <!-- Seção de Componentes (apenas para CONJUNTO) -->
          <div id="secaoComponentesEdit" class="col-span-2 ${produto.TIPO === 'CONJUNTO' ? '' : 'hidden'}">
            <label class="font-bold">Componentes do Conjunto:</label>
            <div id="listaComponentesEdit" class="mt-2 space-y-2"></div>
            <button type="button" id="btnAdicionarComponenteEdit" class="bg-green-500 text-white px-3 py-1 rounded text-sm mt-2">
              + Adicionar Componente
            </button>
          </div>

        </div>

        <div class="flex justify-end mt-4 gap-2">
          <button id="cancelarEditar" class="bg-gray-500 text-white px-4 py-2 rounded">Cancelar</button>
          <button id="salvarEditar" class="bg-blue-600 text-white px-4 py-2 rounded">Salvar</button>
        </div>

      </div>
    `;

    // Marcar os processos já salvos
    (produto.processos || []).forEach(proc => {
      const cb = modal.querySelector(`.editProcesso[value="${proc}"]`);
      if (cb) cb.checked = true;
    });

    // Desenhar campos de tempo com valores já salvos
    montarCamposTempoPorProcesso(
      modal,
      "editProcesso",
      "#temposProcessosEdit",
      produto.tempos || {} // valores existentes
    );

    // Redesenhar quando o usuário marca/desmarca
    modal.querySelectorAll(".editProcesso").forEach(cb => {
      cb.addEventListener("change", () => {
        montarCamposTempoPorProcesso(modal, "editProcesso", "#temposProcessosEdit", produto.tempos || {});
      });
    });

    // Mostrar/ocultar seção de componentes baseado no tipo
    const selectTipoEdit = modal.querySelector("#editTipo");
    const secaoComponentesEdit = modal.querySelector("#secaoComponentesEdit");
    
    selectTipoEdit.addEventListener("change", () => {
      if (selectTipoEdit.value === "CONJUNTO") {
        secaoComponentesEdit.classList.remove("hidden");
      } else {
        secaoComponentesEdit.classList.add("hidden");
      }
    });

    // Renderizar componentes existentes
    if (produto.componentes && produto.componentes.length > 0) {
      renderizarComponentesEdit(modal, produto.componentes);
    }

    // Adicionar componente
    modal.querySelector("#btnAdicionarComponenteEdit").addEventListener("click", () => {
      adicionarComponenteEdit(modal);
    });

    // seleciona valores atuais
    modal.querySelector("#editCliente").value = produto["CLIENTE"] || "";
    modal.querySelector("#editComplexidade").value = produto["COMPLEXIDADE"] || "";
    modal.querySelector("#editTipo").value = produto["TIPO"] || "";
    modal.querySelector("#editStatus").value = produto["STATUS"] || "";

    // cancelar
    modal.querySelector("#cancelarEditar").addEventListener("click", () => modal.remove());

    // salvar
    modal.querySelector("#salvarEditar").addEventListener("click", async () => {
      const processosSelecionados = Array
        .from(modal.querySelectorAll(".editProcesso:checked"))
        .map(cb => cb.value);

      const tempos = coletarTemposPorProcesso(modal);
      const componentes = coletarComponentes(modal, "listaComponentesEdit");

      const atualizado = {
        "PART NUMBER": $("#editPart", modal).value,
        "REVISAO": $("#editRevisao", modal).value,
        "CLIENTE": $("#editCliente", modal).value,
        "COMPLEXIDADE": $("#editComplexidade", modal).value,
        "TIPO": $("#editTipo", modal).value,
        "ENTRADA": $("#editEntrada", modal).value,
        "SHIP DATE": $("#editShip", modal).value,
        "STATUS": $("#editStatus", modal).value,
        // removidos tempos globais
        "processos": processosSelecionados,
        "tempos": tempos,
        "componentes": componentes
      };
      try {
        if (produto.id) {
          await firebaseService.updateProduto(produto.id, atualizado);
        }
        // Atualiza listas locais corretamente
        const idxLocal = produtos.findIndex(p => p.id === produto.id);
        if (idxLocal >= 0) produtos[idxLocal] = { ...produtos[idxLocal], ...atualizado };
        const globalIdx = produtosanuais.findIndex(p => p.id === produto.id);
        if (globalIdx >= 0) produtosanuais[globalIdx] = { ...produtosanuais[globalIdx], ...atualizado };

        modal.remove();
        renderTabela();
        alert("Produto atualizado com sucesso!");
      } catch (error) {
        console.error("Erro ao atualizar produto:", error);
        alert("Erro ao atualizar produto.");
      }
    });

  }

    function visualizarProduto(produto) {
      let modal = document.getElementById("modal-visualizar-produto");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "modal-visualizar-produto";
        modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
        document.body.appendChild(modal);
      }

      const processos = produto.processos || [];
         const processos = produto.processos || [];
      const tempos = produto.tempos || {};
      const componentes = produto.componentes || [];

      const listaProcessos = processos.length
        ? `<ul class="list-disc pl-5">
            ${processos.map(p => {
              const label = PROCESSOS.find(x => x.id === p)?.label || p;
              const t = tempos[p] || {};
              return `<li>
                <strong>${label}:</strong><br>
                Comercial: ${t.comercial ?? 0} h |
                Engenharia: ${t.engenharia ?? 0} h |
                Homologado: ${t.homologado ?? 0} h
              </li>`;
            }).join("")}
          </ul>`
        : "Nenhum processo cadastrado";

      const listaComponentes = componentes.length
        ? `<ul class="list-disc pl-5">
            ${componentes.map(c => `
              <li>
                <strong>${c.partNumber || 'N/A'}</strong> (Rev: ${c.revisao || 'N/A'}) - 
                Cliente: ${c.cliente || 'N/A'} - 
                Status: ${c.status || 'N/A'}
              </li>
            `).join("")}
          </ul>`
        : "Nenhum componente cadastrado";;

      const listaComponentes = componentes.length
        ? `<ul class="list-disc pl-5">
            ${componentes.map(comp => `
              <li>
                <strong>${comp.partNumber || 'N/A'}</strong> (Rev: ${comp.revisao || 'N/A'})<br>
                Cliente: ${comp.cliente || 'N/A'} | Status: ${comp.status || 'N/A'}
              </li>
            `).join("")}
          </ul>`
        : "Nenhum componente cadastrado";


      modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6 w-1/2 max-h-[80vh] overflow-y-auto">
          <h3 class="text-lg font-bold mb-4">Detalhes do Produto</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><strong>Part Number:</strong> ${produto["PART NUMBER"] || ""}</div>
            <div><strong>Revisão:</strong> ${produto["REVISAO"] || ""}</div>
            <div><strong>Cliente:</strong> ${produto["CLIENTE"] || ""}</div>
            <div><strong>Complexidade:</strong> ${produto["COMPLEXIDADE"] || ""}</div>
            <div><strong>Tipo:</strong> ${produto["TIPO"] || ""}</div>
            <div><strong>Entrada:</strong> ${produto["ENTRADA"] || ""}</div>
            <div><strong>Ship Date:</strong> ${produto["SHIP DATE"] || ""}</div>
            <div><strong>Status:</strong> ${produto["STATUS"] || ""}</div>
            <div class="col-span-2"><strong>Processos & Tempos:</strong><br>${listaProcessos}</div>
            ${produto.TIPO === 'CONJUNTO' ? `<div class="col-span-2"><strong>Componentes:</strong><br>${listaComponentes}</div>` : ''}
          </div>
          <div class="flex justify-end mt-4">
            <button id="fecharVisualizar" class="bg-red-500 text-white px-4 py-2 rounded">Fechar</button>
          </div>
        </div>
      `;

      modal.querySelector("#fecharVisualizar").addEventListener("click", () => modal.remove());
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
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
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

  let graficoComplexidadeInstance = null;
  let graficoBlankConjuntoInstance = null;

  function inicializarGraficos() {
    atualizarGraficos();
  }

  function atualizarGraficos() {
    const anoSelecionado = document.getElementById('filtroAnoGraficos').value;
    const clienteSelecionado = document.getElementById('filtroClienteGraficos').value;

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
          backgroundColor: [
            '#10B981', // Verde para BAIXA
            '#F59E0B', // Amarelo para MÉDIA
            '#EF4444', // Vermelho para ALTA
            '#6B7280'  // Cinza para NÃO DEFINIDA
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
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
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
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
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          },
          x: {
            ticks: {
              maxRotation: 45
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        }
      }
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
          return item.partNumber && item.cliente && item.demandas;
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

    tabela.innerHTML = dados.map(item => {
      const demandas = item.demandas || {};
      const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      
      return `
        <tr class="border-b hover:bg-gray-50">
          <td class="p-3 border">${item.partNumber || ''}</td>
          <td class="p-3 border">${item.revisao || ''}</td>
          <td class="p-3 border">${item.cliente || ''}</td>
          ${meses.map(mes => `<td class="p-3 border text-center">${demandas[mes] || 0}</td>`).join('')}
          <td class="p-3 border">
            <button class="bg-red-500 text-white px-2 py-1 rounded text-sm" onclick="removerItemForecast('${item.partNumber}')">
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



// ======== Funções auxiliares para componentes ========
function adicionarComponente(modal) {
  const listaComponentes = modal.querySelector("#listaComponentes");
  const componenteId = Date.now(); // ID único baseado no timestamp
  
  const componenteDiv = document.createElement("div");
  componenteDiv.className = "border rounded p-3 bg-gray-50";
  componenteDiv.dataset.componenteId = componenteId;
  
  componenteDiv.innerHTML = `
    <div class="grid grid-cols-2 gap-2">
      <input type="text" placeholder="Part Number do Componente" class="border px-2 py-1 rounded componente-part"/>
      <input type="text" placeholder="Revisão" class="border px-2 py-1 rounded componente-revisao"/>
      <select class="border px-2 py-1 rounded componente-cliente">
        <option value="">Cliente</option>
        <option value="VOLVO">VOLVO</option>
        <option value="KOMATSU">KOMATSU</option>
        <option value="JOHN DEERE">JOHN DEERE</option>
        <option value="CATERPILLAR">CATERPILLAR</option>
        <option value="KION">KION</option>
        <option value="TOYOTA">TOYOTA</option>
        <option value="CL CALDEIRARIA">CL CALDEIRARIA</option>
      </select>
      <select class="border px-2 py-1 rounded componente-complexidade">
        <option value="">Complexidade</option>
        <option value="BAIXA">BAIXA</option>
        <option value="MÉDIA">MÉDIA</option>
        <option value="ALTA">ALTA</option>
      </select>
      <input type="text" placeholder="Data Entrada" class="border px-2 py-1 rounded componente-entrada"/>
      <input type="text" placeholder="Ship Date" class="border px-2 py-1 rounded componente-ship"/>
      <select class="border px-2 py-1 rounded componente-status">
        <option value="">Status</option>
        <option value="NÃO INICIADO">NÃO INICIADO</option>
        <option value="EM ANDAMENTO">EM ANDAMENTO</option>
        <option value="FINALIZADO">FINALIZADO</option>
      </select>
      <button type="button" class="bg-red-500 text-white px-2 py-1 rounded text-sm remover-componente">
        Remover
      </button>
    </div>
  `;
  
  listaComponentes.appendChild(componenteDiv);
  
  // Evento para remover componente
  componenteDiv.querySelector(".remover-componente").addEventListener("click", () => {
    componenteDiv.remove();
  });
}

function coletarComponentes(modal) {
  const componentesDivs = modal.querySelectorAll("#listaComponentes > div");
  const componentes = [];
  
  componentesDivs.forEach(div => {
    const componente = {
      id: div.dataset.componenteId,
      partNumber: div.querySelector(".componente-part").value,
      revisao: div.querySelector(".componente-revisao").value,
      cliente: div.querySelector(".componente-cliente").value,
      complexidade: div.querySelector(".componente-complexidade").value,
      entrada: div.querySelector(".componente-entrada").value,
      shipDate: div.querySelector(".componente-ship").value,
      status: div.querySelector(".componente-status").value
    };
    
    if (componente.partNumber) { // Só adiciona se tiver part number
      componentes.push(componente);
    }
  });
  
  return componentes;
}

function renderizarComponentes(modal, componentes = []) {
  const listaComponentes = modal.querySelector("#listaComponentes");
  listaComponentes.innerHTML = "";
  
  componentes.forEach(comp => {
    const componenteDiv = document.createElement("div");
    componenteDiv.className = "border rounded p-3 bg-gray-50";
    componenteDiv.dataset.componenteId = comp.id || Date.now();
    
    componenteDiv.innerHTML = `
      <div class="grid grid-cols-2 gap-2">
        <input type="text" placeholder="Part Number do Componente" value="${comp.partNumber || ''}" class="border px-2 py-1 rounded componente-part"/>
        <input type="text" placeholder="Revisão" value="${comp.revisao || ''}" class="border px-2 py-1 rounded componente-revisao"/>
        <select class="border px-2 py-1 rounded componente-cliente">
          <option value="">Cliente</option>
          <option value="VOLVO" ${comp.cliente === 'VOLVO' ? 'selected' : ''}>VOLVO</option>
          <option value="KOMATSU" ${comp.cliente === 'KOMATSU' ? 'selected' : ''}>KOMATSU</option>
          <option value="JOHN DEERE" ${comp.cliente === 'JOHN DEERE' ? 'selected' : ''}>JOHN DEERE</option>
          <option value="CATERPILLAR" ${comp.cliente === 'CATERPILLAR' ? 'selected' : ''}>CATERPILLAR</option>
          <option value="KION" ${comp.cliente === 'KION' ? 'selected' : ''}>KION</option>
          <option value="TOYOTA" ${comp.cliente === 'TOYOTA' ? 'selected' : ''}>TOYOTA</option>
          <option value="CL CALDEIRARIA" ${comp.cliente === 'CL CALDEIRARIA' ? 'selected' : ''}>CL CALDEIRARIA</option>
        </select>
        <select class="border px-2 py-1 rounded componente-complexidade">
          <option value="">Complexidade</option>
          <option value="BAIXA" ${comp.complexidade === 'BAIXA' ? 'selected' : ''}>BAIXA</option>
          <option value="MÉDIA" ${comp.complexidade === 'MÉDIA' ? 'selected' : ''}>MÉDIA</option>
          <option value="ALTA" ${comp.complexidade === 'ALTA' ? 'selected' : ''}>ALTA</option>
        </select>
        <input type="text" placeholder="Data Entrada" value="${comp.entrada || ''}" class="border px-2 py-1 rounded componente-entrada"/>
        <input type="text" placeholder="Ship Date" value="${comp.shipDate || ''}" class="border px-2 py-1 rounded componente-ship"/>
        <select class="border px-2 py-1 rounded componente-status">
          <option value="">Status</option>
          <option value="NÃO INICIADO" ${comp.status === 'NÃO INICIADO' ? 'selected' : ''}>NÃO INICIADO</option>
          <option value="EM ANDAMENTO" ${comp.status === 'EM ANDAMENTO' ? 'selected' : ''}>EM ANDAMENTO</option>
          <option value="FINALIZADO" ${comp.status === 'FINALIZADO' ? 'selected' : ''}>FINALIZADO</option>
        </select>
        <button type="button" class="bg-red-500 text-white px-2 py-1 rounded text-sm remover-componente">
          Remover
        </button>
      </div>
    `;
    
    listaComponentes.appendChild(componenteDiv);
    
    // Evento para remover componente
    componenteDiv.querySelector(".remover-componente").addEventListener("click", () => {
      componenteDiv.remove();
    });
  });
}



// ======== Página de Gráficos ========
function GraficosPage(mount) {
  mount.innerHTML = `
    <div class="p-6 w-full">
      <h2 class="text-2xl font-bold mb-6">GRÁFICOS DE ANÁLISE</h2>
      
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

  // Carregar Chart.js se não estiver carregado
  if (typeof Chart === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
      criarGraficos();
    };
    document.head.appendChild(script);
  } else {
    criarGraficos();
  }

  function criarGraficos() {
    criarGraficoComplexidade();
    criarGraficoBlankConjunto();
  }

  function criarGraficoComplexidade() {
    const ctx = document.getElementById('graficoComplexidade');
    if (!ctx) return;

    // Contar produtos por complexidade
    const complexidades = { 'BAIXA': 0, 'MÉDIA': 0, 'ALTA': 0, 'NÃO DEFINIDA': 0 };
    
    produtosanuais.forEach(produto => {
      const complexidade = produto.COMPLEXIDADE || 'NÃO DEFINIDA';
      if (complexidades.hasOwnProperty(complexidade)) {
        complexidades[complexidade]++;
      } else {
        complexidades['NÃO DEFINIDA']++;
      }
    });

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(complexidades),
        datasets: [{
          data: Object.values(complexidades),
          backgroundColor: [
            '#10B981', // Verde para BAIXA
            '#F59E0B', // Amarelo para MÉDIA
            '#EF4444', // Vermelho para ALTA
            '#6B7280'  // Cinza para NÃO DEFINIDA
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
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
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  function criarGraficoBlankConjunto() {
    const ctx = document.getElementById('graficoBlankConjunto');
    if (!ctx) return;

    // Agrupar por cliente e tipo
    const dadosPorCliente = {};
    
    produtosanuais.forEach(produto => {
      const cliente = produto.CLIENTE || 'NÃO DEFINIDO';
      const tipo = produto.TIPO || 'NÃO DEFINIDO';
      
      if (!dadosPorCliente[cliente]) {
        dadosPorCliente[cliente] = { BLANK: 0, CONJUNTO: 0, 'NÃO DEFINIDO': 0 };
      }
      
      if (dadosPorCliente[cliente].hasOwnProperty(tipo)) {
        dadosPorCliente[cliente][tipo]++;
      } else {
        dadosPorCliente[cliente]['NÃO DEFINIDO']++;
      }
    });

    const clientes = Object.keys(dadosPorCliente);
    const dadosBlank = clientes.map(cliente => dadosPorCliente[cliente].BLANK);
    const dadosConjunto = clientes.map(cliente => dadosPorCliente[cliente].CONJUNTO);
    const dadosNaoDefinido = clientes.map(cliente => dadosPorCliente[cliente]['NÃO DEFINIDO']);

    new Chart(ctx, {
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
            borderColor: '#059669',
            borderWidth: 1
          },
          {
            label: 'NÃO DEFINIDO',
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
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        }
      }
    });
  }
}

// ======== Página de Forecast ========
function ForecastPage(mount) {
  mount.innerHTML = `
    <div class="p-6 w-full">
      <h2 class="text-2xl font-bold mb-6">FORECAST</h2>
      
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 class="text-lg font-bold mb-4">Upload de Arquivo JSON</h3>
        <div class="flex items-center gap-4">
          <input type="file" id="uploadForecast" accept=".json" class="border rounded px-3 py-2"/>
          <button id="btnProcessarForecast" class="bg-blue-600 text-white px-4 py-2 rounded">Processar Arquivo</button>
          <button id="btnCarregarForecast" class="bg-green-600 text-white px-4 py-2 rounded">Carregar Dados Salvos</button>
          <button id="btnLimparForecast" class="bg-red-600 text-white px-4 py-2 rounded">Limpar Dados</button>
        </div>
        <p class="text-sm text-gray-600 mt-2">
          O arquivo JSON deve conter um array de objetos com: partNumber, revisao, cliente, e demandas mensais (jan, fev, mar, etc.).
        </p>
        <div class="mt-4">
          <h4 class="font-bold mb-2">Exemplo de formato JSON:</h4>
          <pre class="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
[
  {
    "partNumber": "ABC123",
    "revisao": "A",
    "cliente": "VOLVO",
    "jan": 10,
    "fev": 15,
    "mar": 20,
    "abr": 12,
    "mai": 18,
    "jun": 25,
    "jul": 30,
    "ago": 22,
    "set": 16,
    "out": 14,
    "nov": 19,
    "dez": 21
  }
]
          </pre>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-bold mb-4">Tabela de Forecast</h3>
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
              </tr>
            </thead>
            <tbody id="tabelaForecast">
              <tr>
                <td colspan="15" class="p-4 text-center text-gray-500">
                  Nenhum dado de forecast carregado. Faça upload de um arquivo JSON ou carregue dados salvos.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Event listeners
  document.getElementById('btnProcessarForecast').addEventListener('click', processarArquivoForecast);
  document.getElementById('btnCarregarForecast').addEventListener('click', carregarForecastSalvo);
  document.getElementById('btnLimparForecast').addEventListener('click', limparForecast);
  
  // Carregar dados automaticamente ao abrir a página
  carregarForecastSalvo();
}

async function processarArquivoForecast() {
  const fileInput = document.getElementById('uploadForecast');
  const file = fileInput.files[0];
  
  if (!file) {
    alert('Por favor, selecione um arquivo JSON.');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const dados = JSON.parse(e.target.result);
      
      if (!Array.isArray(dados)) {
        throw new Error('O arquivo deve conter um array de objetos.');
      }

      // Validar estrutura dos dados
      const camposObrigatorios = ['partNumber', 'revisao', 'cliente'];
      const mesesValidos = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      
      for (let i = 0; i < dados.length; i++) {
        const item = dados[i];
        
        // Verificar campos obrigatórios
        for (const campo of camposObrigatorios) {
          if (!item.hasOwnProperty(campo)) {
            throw new Error(`Item ${i + 1}: Campo obrigatório '${campo}' não encontrado.`);
          }
        }
        
        // Verificar se pelo menos um mês tem valor
        const temMes = mesesValidos.some(mes => item.hasOwnProperty(mes) && !isNaN(item[mes]));
        if (!temMes) {
          throw new Error(`Item ${i + 1}: Nenhum valor de demanda mensal válido encontrado.`);
        }
      }

      // Salvar no Firebase
      await firebaseService.salvarForecast(dados);
      
      atualizarTabelaForecast(dados);
      alert('Dados de forecast processados e salvos com sucesso!');
      
    } catch (error) {
      alert('Erro ao processar arquivo: ' + error.message);
    }
  };
  
  reader.readAsText(file);
}

async function carregarForecastSalvo() {
  try {
    const forecasts = await firebaseService.getForecasts();
    
    if (forecasts.length > 0 && forecasts[0].dados) {
      atualizarTabelaForecast(forecasts[0].dados);
    } else {
      // Manter mensagem padrão se não houver dados
      const tbody = document.getElementById('tabelaForecast');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="15" class="p-4 text-center text-gray-500">
              Nenhum dado de forecast carregado. Faça upload de um arquivo JSON.
            </td>
          </tr>
        `;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar forecast:', error);
  }
}

async function limparForecast() {
  if (confirm('Tem certeza que deseja limpar todos os dados de forecast?')) {
    try {
      await firebaseService.limparForecast();
      
      const tbody = document.getElementById('tabelaForecast');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="15" class="p-4 text-center text-gray-500">
              Nenhum dado de forecast carregado. Faça upload de um arquivo JSON.
            </td>
          </tr>
        `;
      }
      
      alert('Dados de forecast limpos com sucesso!');
    } catch (error) {
      alert('Erro ao limpar dados: ' + error.message);
    }
  }
}

function atualizarTabelaForecast(dados) {
  const tbody = document.getElementById('tabelaForecast');
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  dados.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'border-b hover:bg-gray-50';
    
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    
    tr.innerHTML = `
      <td class="p-3 border">${item.partNumber || ''}</td>
      <td class="p-3 border">${item.revisao || ''}</td>
      <td class="p-3 border">${item.cliente || ''}</td>
      ${meses.map(mes => `<td class="p-3 border text-center">${item[mes] || 0}</td>`).join('')}
    `;
    
    tbody.appendChild(tr);
  });
}


// ======== Funções auxiliares para componentes na edição ========
function adicionarComponenteEdit(modal) {
  const listaComponentes = modal.querySelector("#listaComponentesEdit");
  const componenteId = Date.now(); // ID único baseado no timestamp
  
  const componenteDiv = document.createElement("div");
  componenteDiv.className = "border rounded p-3 bg-gray-50";
  componenteDiv.dataset.componenteId = componenteId;
  
  componenteDiv.innerHTML = `
    <div class="grid grid-cols-2 gap-2">
      <input type="text" placeholder="Part Number do Componente" class="border px-2 py-1 rounded componente-part-edit"/>
      <input type="text" placeholder="Revisão" class="border px-2 py-1 rounded componente-revisao-edit"/>
      <select class="border px-2 py-1 rounded componente-cliente-edit">
        <option value="">Cliente</option>
        <option value="VOLVO">VOLVO</option>
        <option value="KOMATSU">KOMATSU</option>
        <option value="JOHN DEERE">JOHN DEERE</option>
        <option value="CATERPILLAR">CATERPILLAR</option>
        <option value="KION">KION</option>
        <option value="TOYOTA">TOYOTA</option>
        <option value="CL CALDEIRARIA">CL CALDEIRARIA</option>
      </select>
      <select class="border px-2 py-1 rounded componente-complexidade-edit">
        <option value="">Complexidade</option>
        <option value="BAIXA">BAIXA</option>
        <option value="MÉDIA">MÉDIA</option>
        <option value="ALTA">ALTA</option>
      </select>
      <input type="text" placeholder="Data Entrada" class="border px-2 py-1 rounded componente-entrada-edit"/>
      <input type="text" placeholder="Ship Date" class="border px-2 py-1 rounded componente-ship-edit"/>
      <select class="border px-2 py-1 rounded componente-status-edit">
        <option value="">Status</option>
        <option value="NÃO INICIADO">NÃO INICIADO</option>
        <option value="EM ANDAMENTO">EM ANDAMENTO</option>
        <option value="FINALIZADO">FINALIZADO</option>
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
}

function coletarComponentesEdit(modal) {
  const componentesDivs = modal.querySelectorAll("#listaComponentesEdit > div");
  const componentes = [];
  
  componentesDivs.forEach(div => {
    const componente = {
      id: div.dataset.componenteId,
      partNumber: div.querySelector(".componente-part-edit").value,
      revisao: div.querySelector(".componente-revisao-edit").value,
      cliente: div.querySelector(".componente-cliente-edit").value,
      complexidade: div.querySelector(".componente-complexidade-edit").value,
      entrada: div.querySelector(".componente-entrada-edit").value,
      shipDate: div.querySelector(".componente-ship-edit").value,
      status: div.querySelector(".componente-status-edit").value
    };
    
    if (componente.partNumber) { // Só adiciona se tiver part number
      componentes.push(componente);
    }
  });
  
  return componentes;
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


// ======== Funções para gerenciar componentes ========
function adicionarComponente(modal, containerId) {
  const container = modal.querySelector(`#${containerId}`);
  if (!container) return;

  const componenteId = Date.now(); // ID único baseado no timestamp
  
  const componenteDiv = document.createElement('div');
  componenteDiv.className = 'border rounded p-3 bg-gray-50';
  componenteDiv.dataset.componenteId = componenteId;
  
  componenteDiv.innerHTML = `
    <div class="grid grid-cols-2 gap-2 mb-2">
      <input type="text" placeholder="Part Number do Componente" class="border px-2 py-1 rounded componente-part" />
      <input type="text" placeholder="Revisão" class="border px-2 py-1 rounded componente-revisao" />
      <select class="border px-2 py-1 rounded componente-cliente">
        <option value="">Selecione o Cliente</option>
        <option value="VOLVO">VOLVO</option>
        <option value="KOMATSU">KOMATSU</option>
        <option value="JOHN DEERE">JOHN DEERE</option>
        <option value="CATERPILLAR">CATERPILLAR</option>
        <option value="KION">KION</option>
        <option value="TOYOTA">TOYOTA</option>
        <option value="CL CALDEIRARIA">CL CALDEIRARIA</option>
      </select>
      <select class="border px-2 py-1 rounded componente-complexidade">
        <option value="">Complexidade</option>
        <option value="BAIXA">BAIXA</option>
        <option value="MÉDIA">MÉDIA</option>
        <option value="ALTA">ALTA</option>
      </select>
    </div>
    <div class="grid grid-cols-2 gap-2 mb-2">
      <input type="date" class="border px-2 py-1 rounded componente-entrada" />
      <input type="text" placeholder="Ship Date" class="border px-2 py-1 rounded componente-ship" />
    </div>
    <div class="flex justify-between items-center">
      <select class="border px-2 py-1 rounded componente-status">
        <option value="">Status</option>
        <option value="NÃO INICIADO">NÃO INICIADO</option>
        <option value="EM ANDAMENTO">EM ANDAMENTO</option>
        <option value="FINALIZADO">FINALIZADO</option>
      </select>
      <button type="button" class="bg-red-500 text-white px-2 py-1 rounded text-sm remover-componente">Remover</button>
    </div>
  `;
  
  container.appendChild(componenteDiv);
  
  // Event listener para remover componente
  componenteDiv.querySelector('.remover-componente').addEventListener('click', () => {
    componenteDiv.remove();
  });
}

function coletarComponentes(modal, containerId) {
  const container = modal.querySelector(`#${containerId}`);
  if (!container) return [];
  
  const componentesDivs = container.querySelectorAll('[data-componente-id]');
  const componentes = [];
  
  componentesDivs.forEach(div => {
    const componente = {
      partNumber: div.querySelector('.componente-part').value,
      revisao: div.querySelector('.componente-revisao').value,
      cliente: div.querySelector('.componente-cliente').value,
      complexidade: div.querySelector('.componente-complexidade').value,
      entrada: div.querySelector('.componente-entrada').value,
      shipDate: div.querySelector('.componente-ship').value,
      status: div.querySelector('.componente-status').value
    };
    
    // Só adiciona se pelo menos o part number estiver preenchido
    if (componente.partNumber.trim()) {
      componentes.push(componente);
    }
  });
  
  return componentes;
}

function carregarComponentes(modal, containerId, componentes) {
  const container = modal.querySelector(`#${containerId}`);
  if (!container || !componentes || !Array.isArray(componentes)) return;
  
  // Limpar componentes existentes
  container.innerHTML = '';
  
  // Adicionar cada componente
  componentes.forEach(componente => {
    adicionarComponente(modal, containerId);
    
    // Preencher os valores
    const componenteDiv = container.lastElementChild;
    if (componenteDiv) {
      componenteDiv.querySelector('.componente-part').value = componente.partNumber || '';
      componenteDiv.querySelector('.componente-revisao').value = componente.revisao || '';
      componenteDiv.querySelector('.componente-cliente').value = componente.cliente || '';
      componenteDiv.querySelector('.componente-complexidade').value = componente.complexidade || '';
      componenteDiv.querySelector('.componente-entrada').value = componente.entrada || '';
      componenteDiv.querySelector('.componente-ship').value = componente.shipDate || '';
      componenteDiv.querySelector('.componente-status').value = componente.status || '';
    }
  });
}

