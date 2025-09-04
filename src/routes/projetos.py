from flask import Blueprint, request, jsonify
from src.models.produto import db, Projeto
import uuid
from datetime import datetime

projetos_bp = Blueprint('projetos', __name__)

@projetos_bp.route('/projetos', methods=['GET'])
def get_projetos():
    """Buscar todos os projetos com filtros opcionais"""
    try:
        ano = request.args.get('ano', type=int)
        mes = request.args.get('mes', type=int)
        status = request.args.get('status')
        responsavel = request.args.get('responsavel')
        
        query = Projeto.query
        
        # Aplicar filtros se fornecidos
        if ano:
            query = query.filter(Projeto.entrada.like(f'%/{ano}'))
        
        if mes and ano:
            mes_str = f"{mes:02d}"
            query = query.filter(Projeto.entrada.like(f'%/{mes_str}/{ano}'))
        
        if status:
            query = query.filter(Projeto.status.ilike(f'%{status}%'))
        
        if responsavel:
            query = query.filter(Projeto.responsavel.ilike(f'%{responsavel}%'))
        
        projetos = query.all()
        return jsonify([projeto.to_dict() for projeto in projetos])
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@projetos_bp.route('/projetos', methods=['POST'])
def create_projeto():
    """Criar um novo projeto"""
    try:
        data = request.get_json()
        
        projeto = Projeto(
            id=str(uuid.uuid4()),
            entrada=data.get('ENTRADA'),
            status=data.get('STATUS'),
            responsavel=data.get('RESPONSAVEL'),
            titulo=data.get('TITULO'),
            descricao=data.get('DESCRICAO'),
            prazo=data.get('PRAZO'),
            prioridade=data.get('PRIORIDADE'),
            observacoes=data.get('OBSERVACOES')
        )
        
        db.session.add(projeto)
        db.session.commit()
        
        return jsonify(projeto.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projetos_bp.route('/projetos/<projeto_id>', methods=['PUT'])
def update_projeto(projeto_id):
    """Atualizar um projeto existente"""
    try:
        projeto = Projeto.query.get_or_404(projeto_id)
        data = request.get_json()
        
        projeto.entrada = data.get('ENTRADA', projeto.entrada)
        projeto.status = data.get('STATUS', projeto.status)
        projeto.responsavel = data.get('RESPONSAVEL', projeto.responsavel)
        projeto.titulo = data.get('TITULO', projeto.titulo)
        projeto.descricao = data.get('DESCRICAO', projeto.descricao)
        projeto.prazo = data.get('PRAZO', projeto.prazo)
        projeto.prioridade = data.get('PRIORIDADE', projeto.prioridade)
        projeto.observacoes = data.get('OBSERVACOES', projeto.observacoes)
        projeto.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(projeto.to_dict())
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projetos_bp.route('/projetos/<projeto_id>', methods=['DELETE'])
def delete_projeto(projeto_id):
    """Deletar um projeto"""
    try:
        projeto = Projeto.query.get_or_404(projeto_id)
        db.session.delete(projeto)
        db.session.commit()
        
        return jsonify({'message': 'Projeto deletado com sucesso'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projetos_bp.route('/projetos/stats', methods=['GET'])
def get_projetos_stats():
    """Obter estatísticas dos projetos agrupadas por mês"""
    try:
        ano = request.args.get('ano', type=int)
        
        query = Projeto.query
        if ano:
            query = query.filter(Projeto.entrada.like(f'%/{ano}'))
        
        projetos = query.all()
        
        # Agrupar por mês
        meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
        resultado = []
        
        for i, mes in enumerate(meses, 1):
            projetos_mes = 0
            finalizados_mes = 0
            
            for projeto in projetos:
                if projeto.entrada:
                    partes = projeto.entrada.split("/")
                    if len(partes) >= 2:
                        mes_projeto = int(partes[1]) if partes[1].isdigit() else 0
                        if mes_projeto == i:
                            projetos_mes += 1
                            if projeto.status and projeto.status.upper() == "FINALIZADO":
                                finalizados_mes += 1
            
            resultado.append({
                'name': mes,
                'projetos': projetos_mes,
                'finalizados': finalizados_mes,
                'meta': 15  # Meta padrão para projetos
            })
        
        return jsonify(resultado)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@projetos_bp.route('/projetos/status-count', methods=['GET'])
def get_projetos_status_count():
    """Obter contagem de projetos por status"""
    try:
        ano = request.args.get('ano', type=int)
        mes = request.args.get('mes', type=int)
        
        query = Projeto.query
        
        if ano:
            query = query.filter(Projeto.entrada.like(f'%/{ano}'))
        
        if mes and ano:
            mes_str = f"{mes:02d}"
            query = query.filter(Projeto.entrada.like(f'%/{mes_str}/{ano}'))
        
        projetos = query.all()
        
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
            if s in ["NAO INICIADO", "NÃO INICIADO", "PLANEJAMENTO"]:
                return "NÃO INICIADO"
            elif s in ["EM DESENVOLVIMENTO", "EM ANDAMENTO", "EXECUÇÃO", "ANÁLISE"]:
                return "EM ANDAMENTO"
            elif s in ["FINALIZADO", "CONCLUÍDO", "ENTREGUE"]:
                return "FINALIZADO"
            return None
        
        for projeto in projetos:
            status_mapeado = mapear_status(projeto.status)
            if status_mapeado and status_mapeado in contagem:
                contagem[status_mapeado] += 1
        
        # Formatar resposta
        status_data = [
            {
                'id': 1,
                'name': 'NÃO INICIADO',
                'position': "Quantidade de projetos não iniciados",
                'transactions': contagem["NÃO INICIADO"],
                'rise': True
            },
            {
                'id': 2,
                'name': 'EM ANDAMENTO',
                'position': "Quantidade de projetos em andamento",
                'transactions': contagem["EM ANDAMENTO"],
                'rise': True
            },
            {
                'id': 3,
                'name': 'FINALIZADO',
                'position': "Quantidade de projetos finalizados",
                'transactions': contagem["FINALIZADO"],
                'rise': True
            }
        ]
        
        return jsonify(status_data)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

