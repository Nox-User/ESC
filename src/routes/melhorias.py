from flask import Blueprint, request, jsonify
from src.models.produto import db, Melhoria
import uuid
from datetime import datetime

melhorias_bp = Blueprint('melhorias', __name__)

@melhorias_bp.route('/melhorias', methods=['GET'])
def get_melhorias():
    """Buscar todas as melhorias com filtros opcionais"""
    try:
        ano = request.args.get('ano', type=int)
        mes = request.args.get('mes', type=int)
        status = request.args.get('status')
        area = request.args.get('area')
        tipo = request.args.get('tipo')
        
        query = Melhoria.query
        
        # Aplicar filtros se fornecidos
        if ano:
            query = query.filter(Melhoria.entrada.like(f'%/{ano}'))
        
        if mes and ano:
            mes_str = f"{mes:02d}"
            query = query.filter(Melhoria.entrada.like(f'%/{mes_str}/{ano}'))
        
        if status:
            query = query.filter(Melhoria.status.ilike(f'%{status}%'))
        
        if area:
            query = query.filter(Melhoria.area.ilike(f'%{area}%'))
        
        if tipo:
            query = query.filter(Melhoria.tipo.ilike(f'%{tipo}%'))
        
        melhorias = query.all()
        return jsonify([melhoria.to_dict() for melhoria in melhorias])
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@melhorias_bp.route('/melhorias', methods=['POST'])
def create_melhoria():
    """Criar uma nova melhoria"""
    try:
        data = request.get_json()
        
        melhoria = Melhoria(
            id=str(uuid.uuid4()),
            entrada=data.get('ENTRADA'),
            status=data.get('STATUS'),
            area=data.get('AREA'),
            tipo=data.get('TIPO'),
            titulo=data.get('TITULO'),
            descricao=data.get('DESCRICAO'),
            impacto_esperado=data.get('IMPACTO_ESPERADO'),
            recursos_necessarios=data.get('RECURSOS_NECESSARIOS'),
            prazo=data.get('PRAZO'),
            observacoes=data.get('OBSERVACOES')
        )
        
        db.session.add(melhoria)
        db.session.commit()
        
        return jsonify(melhoria.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@melhorias_bp.route('/melhorias/<melhoria_id>', methods=['PUT'])
def update_melhoria(melhoria_id):
    """Atualizar uma melhoria existente"""
    try:
        melhoria = Melhoria.query.get_or_404(melhoria_id)
        data = request.get_json()
        
        melhoria.entrada = data.get('ENTRADA', melhoria.entrada)
        melhoria.status = data.get('STATUS', melhoria.status)
        melhoria.area = data.get('AREA', melhoria.area)
        melhoria.tipo = data.get('TIPO', melhoria.tipo)
        melhoria.titulo = data.get('TITULO', melhoria.titulo)
        melhoria.descricao = data.get('DESCRICAO', melhoria.descricao)
        melhoria.impacto_esperado = data.get('IMPACTO_ESPERADO', melhoria.impacto_esperado)
        melhoria.recursos_necessarios = data.get('RECURSOS_NECESSARIOS', melhoria.recursos_necessarios)
        melhoria.prazo = data.get('PRAZO', melhoria.prazo)
        melhoria.observacoes = data.get('OBSERVACOES', melhoria.observacoes)
        melhoria.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(melhoria.to_dict())
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@melhorias_bp.route('/melhorias/<melhoria_id>', methods=['DELETE'])
def delete_melhoria(melhoria_id):
    """Deletar uma melhoria"""
    try:
        melhoria = Melhoria.query.get_or_404(melhoria_id)
        db.session.delete(melhoria)
        db.session.commit()
        
        return jsonify({'message': 'Melhoria deletada com sucesso'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@melhorias_bp.route('/melhorias/stats', methods=['GET'])
def get_melhorias_stats():
    """Obter estatísticas das melhorias agrupadas por mês"""
    try:
        ano = request.args.get('ano', type=int)
        
        query = Melhoria.query
        if ano:
            query = query.filter(Melhoria.entrada.like(f'%/{ano}'))
        
        melhorias = query.all()
        
        # Agrupar por mês
        meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
        resultado = []
        
        for i, mes in enumerate(meses, 1):
            melhorias_mes = 0
            finalizadas_mes = 0
            
            for melhoria in melhorias:
                if melhoria.entrada:
                    partes = melhoria.entrada.split("/")
                    if len(partes) >= 2:
                        mes_melhoria = int(partes[1]) if partes[1].isdigit() else 0
                        if mes_melhoria == i:
                            melhorias_mes += 1
                            if melhoria.status and melhoria.status.upper() in ["FINALIZADO", "IMPLEMENTADO"]:
                                finalizadas_mes += 1
            
            resultado.append({
                'name': mes,
                'melhorias': melhorias_mes,
                'finalizadas': finalizadas_mes,
                'meta': 8  # Meta padrão para melhorias
            })
        
        return jsonify(resultado)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@melhorias_bp.route('/melhorias/status-count', methods=['GET'])
def get_melhorias_status_count():
    """Obter contagem de melhorias por status"""
    try:
        ano = request.args.get('ano', type=int)
        mes = request.args.get('mes', type=int)
        
        query = Melhoria.query
        
        if ano:
            query = query.filter(Melhoria.entrada.like(f'%/{ano}'))
        
        if mes and ano:
            mes_str = f"{mes:02d}"
            query = query.filter(Melhoria.entrada.like(f'%/{mes_str}/{ano}'))
        
        melhorias = query.all()
        
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
            if s in ["NAO INICIADO", "NÃO INICIADO", "PROPOSTA", "AGUARDANDO APROVAÇÃO"]:
                return "NÃO INICIADO"
            elif s in ["EM DESENVOLVIMENTO", "EM ANDAMENTO", "EM ANÁLISE", "EM TESTE", "IMPLEMENTANDO"]:
                return "EM ANDAMENTO"
            elif s in ["FINALIZADO", "IMPLEMENTADO", "CONCLUÍDO"]:
                return "FINALIZADO"
            return None
        
        for melhoria in melhorias:
            status_mapeado = mapear_status(melhoria.status)
            if status_mapeado and status_mapeado in contagem:
                contagem[status_mapeado] += 1
        
        # Formatar resposta
        status_data = [
            {
                'id': 1,
                'name': 'NÃO INICIADO',
                'position': "Quantidade de melhorias não iniciadas",
                'transactions': contagem["NÃO INICIADO"],
                'rise': True
            },
            {
                'id': 2,
                'name': 'EM ANDAMENTO',
                'position': "Quantidade de melhorias em andamento",
                'transactions': contagem["EM ANDAMENTO"],
                'rise': True
            },
            {
                'id': 3,
                'name': 'FINALIZADO',
                'position': "Quantidade de melhorias finalizadas",
                'transactions': contagem["FINALIZADO"],
                'rise': True
            }
        ]
        
        return jsonify(status_data)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@melhorias_bp.route('/melhorias/tipos', methods=['GET'])
def get_tipos_melhorias():
    """Obter lista de tipos de melhorias disponíveis"""
    try:
        tipos = db.session.query(Melhoria.tipo).distinct().filter(Melhoria.tipo.isnot(None)).all()
        tipos_list = [tipo[0] for tipo in tipos if tipo[0]]
        return jsonify(tipos_list)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@melhorias_bp.route('/melhorias/areas', methods=['GET'])
def get_areas_melhorias():
    """Obter lista de áreas de melhorias disponíveis"""
    try:
        areas = db.session.query(Melhoria.area).distinct().filter(Melhoria.area.isnot(None)).all()
        areas_list = [area[0] for area in areas if area[0]]
        return jsonify(areas_list)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

