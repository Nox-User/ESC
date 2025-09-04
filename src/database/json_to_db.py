import json
import sqlite3

# Arquivos
json_file = "ferramentaria-d120f-default-rtdb-produto-export.json"
db_file = "produtos.db"

# Lendo JSON
with open(json_file, "r", encoding="utf-8") as f:
    data = json.load(f)

# Conectando/criando banco
conn = sqlite3.connect(db_file)
cursor = conn.cursor()

# Criar tabela
cursor.execute("""
CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente TEXT,
    entrada TEXT,
    espessura TEXT,
    item TEXT,
    material TEXT,
    part_number TEXT,
    rev TEXT,
    ship_date TEXT,
    status TEXT,
    processos TEXT,
    tempo_comercial INTEGER,
    tempo_engenharia INTEGER,
    tempo_homologado INTEGER
)
""")

# Inserir dados
for key, item in data.items():
    cursor.execute("""
        INSERT INTO produtos (
            cliente, entrada, espessura, item, material, part_number, rev,
            ship_date, status, processos, tempo_comercial, tempo_engenharia, tempo_homologado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        item.get("CLIENTE"),
        item.get("ENTRADA"),
        str(item.get("ESPESSURA")),
        item.get("ITEM"),
        item.get("MATERIAL"),
        str(item.get("PART NUMBER")),
        str(item.get("REV")),
        item.get("SHIP DATE"),
        item.get("STATUS"),
        ",".join(item.get("processos", [])) if isinstance(item.get("processos"), list) else None,
        item.get("tempo_comercial", 0),
        item.get("tempo_engenharia", 0),
        item.get("tempo_homologado", 0),
    ))

# Salvar e fechar
conn.commit()
conn.close()

print(f"Banco {db_file} criado com sucesso!")
