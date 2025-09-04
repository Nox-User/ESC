const data = [
  {
    logo: "../src/assets/icons/clipboard.png",
    title: "PRODUTOS",
    subTitle: "AMOSTRA E DESENVOLVIMENTO",
    descprition:
      "Status de desenvolvimento, tempo e amostras dos Produtos.",
    apiLink: "../src/pages/Produto/dashboard.html"
  },
  {
    logo: "../src/assets/icons/dispositivo.png",
    title: "PROJETOS",
    subTitle: "DISPOSITIVOS E GABARITOS",
    descprition:
      "Informações sobre o andamento dos Dispositivos e Gabaritos.",
    apiLink: ""
  },
  {
    logo: "../src/assets/icons/ferramentaria.png",
    title: "FERRAMENTARIA",
    subTitle: "Estoque",
    descprition:
      "Informações sobre o Estoque da Ferramentaria.",
    apiLink: "../src/pages/Ferramentaria/ferramentaria.html"
  },
  {
    logo: "../src/assets/icons/melhoria.png",
    title: "MELHORIAS",
    subTitle: "Processo",
    descprition: "Informações sobre as Melhorias de Processos.",
    apiLink: ""
  },
  {
    logo: "../src/assets/icons/norma.png",
    title: "NORMAS",
    subTitle: "Qualidade",
    descprition:
      "Informações sobre as Normas de Qualidade de nossos principais Clientes. ",
    apiLink:
      ""
  },
  {
    logo: "../src/assets/icons/book.png",
    title: "APOSTILAS",
    subTitle: "Informações",
    descprition:
      "Informações de processos, para facilitar compreensão e desenvolvimentos futuros.",
    apiLink: ""
  },
];

document.getElementById("allCardsContainer").innerHTML = data
  .map(
    (eachCard) =>
    `
      <div class="eachCard">
        <div class="cardContent">
          <div class="cardImage">
            <img src="${eachCard.logo}" alt="${eachCard.title}-logo">
          </div>
          <div class="cardInfo">
            <h2 class="cardTitle">${eachCard.title}</h2>
            <span class="cardSubTitle">${eachCard.subTitle}</span>
            <p class="cardText">${eachCard.descprition}</p>
          </div>
        </div>
        <div class="userActions">
          <button class="btn-secondary"><svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-bookmark" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z" />
          </svg> Guardar</button>
          <button class="btn-primary">
          <a href="${eachCard.apiLink}" rel="noopener noreferrer">IR PARA</a> <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-chevron-right" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
          </svg> </button>
        </div>
      </div>
    `
  )
  .join("");
