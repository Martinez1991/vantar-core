-- Extensões necessárias para o Vantar.
-- pgvector: embeddings do RAG (isolados por tenant — RS-LLM-003).
CREATE EXTENSION IF NOT EXISTS vector;
-- pgcrypto: gen_random_uuid() para chaves primárias.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
