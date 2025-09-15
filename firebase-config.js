import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, child, push, update, remove, set } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let app;
let db;

export const initializeFirebase = (config) => {
  app = initializeApp(config);
  db = getDatabase(app);
};

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
  },

  // Dentro de firebaseService
  async getOFRs() {
    const snapshot = await get(child(ref(db), 'ofrs'));
    if (!snapshot.exists()) return [];
    return Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
  },

  async addOFR(ofr) {
    const newRef = push(ref(db, 'ofrs'));
    await set(newRef, ofr);
    return newRef.key;
  },

  async updateOFR(id, dados) {
    await update(ref(db, `ofrs/${id}`), dados);
  },

  async deleteOFR(id) {
    await remove(ref(db, `ofrs/${id}`));
  },


  
  // === MELHORIAS ===
  // Buscar todas as melhorias
  async getMelhorias() {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `melhoria`));
      if (snapshot.exists()) {
        const melhoriaObj = snapshot.val();
        const melhoriaArray = Object.keys(melhoriaObj).map(key => ({
          id: key,
          ...melhoriaObj[key]
        }));
        return melhoriaArray;
      } else {
        console.log("Nenhum dado disponível no nó 'melhoria'.");
        return [];
      }
    } catch (error) {
      console.error("Erro ao buscar melhorias do Realtime Database:", error);
      throw error;
    }
  },

  // Adicionar nova melhoria
  async addMelhoria(melhoria) {
    try {
      const newMelhoriaRef = push(ref(db, 'melhoria'));
      await update(newMelhoriaRef, melhoria);
      return newMelhoriaRef.key;
    } catch (error) {
      console.error("Erro ao adicionar melhoria ao Realtime Database:", error);
      throw error;
    }
  },

  // Atualizar melhoria
  async updateMelhoria(id, dadosAtualizados) {
    try {
      const melhoriaRef = ref(db, `melhoria/${id}`);
      await update(melhoriaRef, dadosAtualizados);
    } catch (error) {
      console.error("Erro ao atualizar melhoria no Realtime Database:", error);
      throw error;
    }
  },

  // Deletar melhoria
  async deleteMelhoria(id) {
    try {
      const melhoriaRef = ref(db, `melhoria/${id}`);
      await remove(melhoriaRef);
    } catch (error) {
      console.error("Erro ao deletar melhoria do Realtime Database:", error);
      throw error;
    }
  },

  // === PROJETOS ===
  // Buscar todos os projetos
  async getProjetos() {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `projeto`));
      if (snapshot.exists()) {
        const projetoObj = snapshot.val();
        const projetoArray = Object.keys(projetoObj).map(key => ({
          id: key,
          ...projetoObj[key]
        }));
        return projetoArray;
      } else {
        console.log("Nenhum dado disponível no nó 'projeto'.");
        return [];
      }
    } catch (error) {
      console.error("Erro ao buscar projetos do Realtime Database:", error);
      throw error;
    }
  },

  // Adicionar novo projeto
  async addProjeto(projeto) {
    try {
      const newProjetoRef = push(ref(db, 'projeto'));
      await update(newProjetoRef, projeto);
      return newProjetoRef.key;
    } catch (error) {
      console.error("Erro ao adicionar projeto ao Realtime Database:", error);
      throw error;
    }
  },

  // Atualizar projeto
  async updateProjeto(id, dadosAtualizados) {
    try {
      const projetoRef = ref(db, `projeto/${id}`);
      await update(projetoRef, dadosAtualizados);
    } catch (error) {
      console.error("Erro ao atualizar projeto no Realtime Database:", error);
      throw error;
    }
  },

  // Deletar projeto
  async deleteProjeto(id) {
    try {
      const projetoRef = ref(db, `projeto/${id}`);
      await remove(projetoRef);
    } catch (error) {
      console.error("Erro ao deletar projeto do Realtime Database:", error);
      throw error;
    }
  },

  // === FORECAST ===
  // Buscar todos os forecasts
  async getForecasts() {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `forecast`));
      if (snapshot.exists()) {
        const forecastObj = snapshot.val();
        const forecastArray = Object.keys(forecastObj).map(key => ({
          id: key,
          ...forecastObj[key]
        }));
        return forecastArray;
      } else {
        console.log("Nenhum dado disponível no nó 'forecast'.");
        return [];
      }
    } catch (error) {
      console.error("Erro ao buscar forecasts do Realtime Database:", error);
      throw error;
    }
  },

  // Salvar dados de forecast
  async salvarForecast(dadosForecast) {
    try {
      const forecastRef = ref(db, 'forecast');
      await update(forecastRef, { dados: dadosForecast, ultimaAtualizacao: new Date().toISOString() });
    } catch (error) {
      console.error("Erro ao salvar forecast no Realtime Database:", error);
      throw error;
    }
  },

  // Limpar dados de forecast
  async limparForecast() {
    try {
      const forecastRef = ref(db, 'forecast');
      await remove(forecastRef);
    } catch (error) {
      console.error("Erro ao limpar forecast do Realtime Database:", error);
      throw error;
    }
  }
};

