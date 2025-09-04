from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Produto(db.Model):
    __tablename__ = 'produtos'
    
    id = db.Column(db.String(50), primary_key=True)
    entrada = db.Column(db.String(20))  # Data de entrada no formato DD/MM/YYYY
    status = db.Column(db.String(50))
    cliente = db.Column(db.String(100))
    descricao = db.Column(db.Text)
    observacoes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'ENTRADA': self.entrada,
            'STATUS': self.status,
            'CLIENTE': self.cliente,
            'DESCRICAO': self.descricao,
            'OBSERVACOES': self.observacoes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Projeto(db.Model):
    __tablename__ = 'projetos'
    
    id = db.Column(db.String(50), primary_key=True)
    entrada = db.Column(db.String(20))  # Data de entrada no formato DD/MM/YYYY
    status = db.Column(db.String(50))
    responsavel = db.Column(db.String(100))
    titulo = db.Column(db.String(200))
    descricao = db.Column(db.Text)
    prazo = db.Column(db.String(20))  # Data de prazo no formato DD/MM/YYYY
    prioridade = db.Column(db.String(20))
    observacoes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'ENTRADA': self.entrada,
            'STATUS': self.status,
            'RESPONSAVEL': self.responsavel,
            'TITULO': self.titulo,
            'DESCRICAO': self.descricao,
            'PRAZO': self.prazo,
            'PRIORIDADE': self.prioridade,
            'OBSERVACOES': self.observacoes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Melhoria(db.Model):
    __tablename__ = 'melhorias'
    
    id = db.Column(db.String(50), primary_key=True)
    entrada = db.Column(db.String(20))  # Data de entrada no formato DD/MM/YYYY
    status = db.Column(db.String(50))
    area = db.Column(db.String(100))
    tipo = db.Column(db.String(50))  # Processo, Qualidade, Produtividade, etc.
    titulo = db.Column(db.String(200))
    descricao = db.Column(db.Text)
    impacto_esperado = db.Column(db.Text)
    recursos_necessarios = db.Column(db.Text)
    prazo = db.Column(db.String(20))  # Data de prazo no formato DD/MM/YYYY
    observacoes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'ENTRADA': self.entrada,
            'STATUS': self.status,
            'AREA': self.area,
            'TIPO': self.tipo,
            'TITULO': self.titulo,
            'DESCRICAO': self.descricao,
            'IMPACTO_ESPERADO': self.impacto_esperado,
            'RECURSOS_NECESSARIOS': self.recursos_necessarios,
            'PRAZO': self.prazo,
            'OBSERVACOES': self.observacoes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

