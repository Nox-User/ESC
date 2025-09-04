// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD53Q57GFkGSYH1p5mAfsxZIGBKnp8AEG8",
  authDomain: "ferramentaria-d120f.firebaseapp.com",
  databaseURL: "https://ferramentaria-d120f-default-rtdb.firebaseio.com",
  projectId: "ferramentaria-d120f",
  storageBucket: "ferramentaria-d120f.firebasestorage.app",
  messagingSenderId: "227336233826",
  appId: "1:227336233826:web:0fa15161281a6d896a823b",
  measurementId: "G-2EVDBKX8S6"
};

// Inicializar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, child, push, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Funções para interagir com o Realtime Database
export const firebaseService = {
  // Buscar todos os produtos
  async getProdutos() {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `produto`));
      if (snapshot.exists()) {
        const produtosObj = snapshot.val();
        const produtosArray = Object.keys(produtosObj).map(key => ({
          id: key,
          ...produtosObj[key]
        }));
        return produtosArray;
      } else {
        console.log("Nenhum dado disponível no nó 'produto'.");
        return [];
      }
    } catch (error) {
      console.error("Erro ao buscar produtos do Realtime Database:", error);
      throw error;
    }
  },

  // Adicionar novo produto
  async addProduto(produto) {
    try {
      const newProdutoRef = push(ref(db, 'produto'));
      await update(newProdutoRef, produto);
      return newProdutoRef.key;
    } catch (error) {
      console.error("Erro ao adicionar produto ao Realtime Database:", error);
      throw error;
    }
  },

  // Atualizar produto
  async updateProduto(id, dadosAtualizados) {
    try {
      const produtoRef = ref(db, `produto/${id}`);
      await update(produtoRef, dadosAtualizados);
    } catch (error) {
      console.error("Erro ao atualizar produto no Realtime Database:", error);
      throw error;
    }
  },

  // Deletar produto
  async deleteProduto(id) {
    try {
      const produtoRef = ref(db, `produto/${id}`);
      await remove(produtoRef);
    } catch (error) {
      console.error("Erro ao deletar produto do Realtime Database:", error);
      throw error;
    }
  }
};

