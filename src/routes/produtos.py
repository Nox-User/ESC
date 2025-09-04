from flask import Blueprint, request, jsonify
from src.models.produto import db, Produto
import uuid
from datetime import datetime

produtos_bp = Blueprint('produtos', __name__)

@produtos_bp.route('/produtos', methods=['GET'])
def get_produtos():
    """Buscar todos os produtos com filtros opcionais"""
    try:
        ano = request.args.get('ano', type=int)
        mes = request.args.get('mes', type=int)
        status = request.args.get('status')
        
        query = Produto.query
        
        # Aplicar filtros se fornecidos
        if ano:
            query = query.filter(Produto.entrada.like(f'%/{ano}'))
        
        if mes and ano:
            mes_str = f"{mes:02d}"
            query = query.filter(Produto.entrada.like(f'%/{mes_str}/{ano}'))
        
        if status:
            query = query.filter(Produto.status.ilike(f'%{status}%'))
        
        produtos = query.all()
        return jsonify([produto.to_dict() for produto in produtos])
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos', methods=['POST'])
def create_produto():
    """Criar um novo produto"""
    try:
        data = request.get_json()
        
        produto = Produto(
            id=str(uuid.uuid4()),
            entrada=data.get('ENTRADA'),
            status=data.get('STATUS'),
            cliente=data.get('CLIENTE'),
            descricao=data.get('DESCRICAO'),
            observacoes=data.get('OBSERVACOES')
        )
        
        db.session.add(produto)
        db.session.commit()
        
        return jsonify(produto.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos/<produto_id>', methods=['PUT'])
def update_produto(produto_id):
    """Atualizar um produto existente"""
    try:
        produto = Produto.query.get_or_404(produto_id)
        data = request.get_json()
        
        produto.entrada = data.get('ENTRADA', produto.entrada)
        produto.status = data.get('STATUS', produto.status)
        produto.cliente = data.get('CLIENTE', produto.cliente)
        produto.descricao = data.get('DESCRICAO', produto.descricao)
        produto.observacoes = data.get('OBSERVACOES', produto.observacoes)
        produto.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(produto.to_dict())
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos/<produto_id>', methods=['DELETE'])
def delete_produto(produto_id):
    """Deletar um produto"""
    try:
        produto = Produto.query.get_or_404(produto_id)
        db.session.delete(produto)
        db.session.commit()
        
        return jsonify({'message': 'Produto deletado com sucesso'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos/stats', methods=['GET'])
def get_produtos_stats():
    """Obter estatísticas dos produtos agrupadas por mês"""
    try:
        ano = request.args.get('ano', type=int)
        
        query = Produto.query
        if ano:
            query = query.filter(Produto.entrada.like(f'%/{ano}'))
        
        produtos = query.all()
        
        # Agrupar por mês
        meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
        resultado = []
        
        for i, mes in enumerate(meses, 1):
            produtos_mes = 0
            finalizados_mes = 0
            
            for produto in produtos:
                if produto.entrada:
                    partes = produto.entrada.split("/")
                    if len(partes) >= 2:
                        mes_produto = int(partes[1]) if partes[1].isdigit() else 0
                        if mes_produto == i:
                            produtos_mes += 1
                            if produto.status and produto.status.upper() == "FINALIZADO":
                                finalizados_mes += 1
            
            resultado.append({
                'name': mes,
                'produtos': produtos_mes,
                'finalizados': finalizados_mes,
                'meta': 43  # Meta padrão
            })
        
        return jsonify(resultado)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@produtos_bp.route('/produtos/status-count', methods=['GET'])
def get_status_count():
    """Obter contagem de produtos por status"""
    try:
        ano = request.args.get('ano', type=int)
        mes = request.args.get('mes', type=int)
        
        query = Produto.query
        
        if ano:
            query = query.filter(Produto.entrada.like(f'%/{ano}'))
        
        if mes and ano:
            mes_str = f"{mes:02d}"
            query = query.filter(Produto.entrada.like(f'%/{mes_str}/{ano}'))
        
        produtos = query.all()
        
        # Contar por status
        contagem = {
            "NÃO INICIADO": 0,
            "EM ANDAMENTO": 0,
            "FINALIZADO": 0
        }
        
        def mapear_status(status):
            if not status:
                return None
            s = status.upper().strip()
            if s in ["NAO INICIADO", "NÃO INICIADO"]:
                return "NÃO INICIADO"
            elif s in ["EM DESENVOLVIMENTO", "PROCESSO DE DOBRA", "PROCESSO DE CHANFRO", 
                      "PROCESSO DE SOLDA", "PROCESSO DE USINAGEM", "EM ANDAMENTO"]:
                return "EM ANDAMENTO"
            elif s == "FINALIZADO":
                return "FINALIZADO"
            return None
        
        for produto in produtos:
            status_mapeado = mapear_status(produto.status)
            if status_mapeado and status_mapeado in contagem:
                contagem[status_mapeado] += 1
        
        # Formatar resposta
        status_data = [
            {
                'id': 1,
                'name': 'NÃO INICIADO',
                'position': "Quantidade de PPAP's não iniciados",
                'transactions': contagem["NÃO INICIADO"],
                'rise': True
            },
            {
                'id': 2,
                'name': 'EM ANDAMENTO',
                'position': "Quantidade de PPAP's em andamento",
                'transactions': contagem["EM ANDAMENTO"],
                'rise': True
            },
            {
                'id': 3,
                'name': 'FINALIZADO',
                'position': "Quantidade de PPAP's finalizados",
                'transactions': contagem["FINALIZADO"],
                'rise': True
            }
        ]
        
        return jsonify(status_data)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

