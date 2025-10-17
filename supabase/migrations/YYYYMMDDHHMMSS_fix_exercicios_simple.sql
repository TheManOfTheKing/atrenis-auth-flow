-- Script simples para corrigir a tabela exercicios
-- Execute este script completo no Supabase SQL Editor

-- 1. Primeiro, vamos verificar se a tabela existe e adicionar as colunas faltantes
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS personal_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS equipamento TEXT;

ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS dificuldade TEXT;

ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS imagem_url TEXT;

ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS publico BOOLEAN DEFAULT FALSE;

-- 2. Garantir que grupo_muscular existe e é NOT NULL
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS grupo_muscular TEXT;

-- 3. Habilitar RLS
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas existentes
DROP POLICY IF EXISTS "Personal trainers can view their own and public exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Personal trainers can create exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Personal trainers can update their own exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Personal trainers can delete their own exercises" ON public.exercicios;

-- 5. Criar políticas RLS
CREATE POLICY "Personal trainers can view their own and public exercises" ON public.exercicios
FOR SELECT TO authenticated
USING (
  publico = TRUE 
  OR personal_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Personal trainers can create exercises" ON public.exercicios
FOR INSERT TO authenticated
WITH CHECK (
  personal_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Personal trainers can update their own exercises" ON public.exercicios
FOR UPDATE TO authenticated
USING (
  personal_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Personal trainers can delete their own exercises" ON public.exercicios
FOR DELETE TO authenticated
USING (
  personal_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 6. Criar a RPC function search_exercicios
CREATE OR REPLACE FUNCTION public.search_exercicios(
  search_term TEXT DEFAULT NULL,
  grupo TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  descricao TEXT,
  grupo_muscular TEXT,
  equipamento TEXT,
  dificuldade TEXT,
  video_url TEXT,
  imagem_url TEXT,
  publico BOOLEAN,
  personal_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.nome,
    e.descricao,
    e.grupo_muscular,
    e.equipamento,
    e.dificuldade,
    e.video_url,
    e.imagem_url,
    e.publico,
    e.personal_id,
    e.created_at,
    e.updated_at
  FROM public.exercicios e
  WHERE 
    (search_term IS NULL OR e.nome ILIKE '%' || search_term || '%' OR e.descricao ILIKE '%' || search_term || '%')
    AND (grupo IS NULL OR e.grupo_muscular = grupo)
    AND (
      e.publico = TRUE 
      OR e.personal_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  ORDER BY e.nome;
END;
$$;

-- 7. Inserir exercícios de exemplo se a tabela estiver vazia
INSERT INTO public.exercicios (personal_id, nome, descricao, grupo_muscular, equipamento, dificuldade, publico) 
SELECT * FROM (VALUES
  (NULL, 'Agachamento Livre', 'Exercício fundamental para pernas e glúteos.', 'Quadríceps', 'Peso corporal', 'Iniciante', TRUE),
  (NULL, 'Flexão de Braço', 'Exercício clássico para peito, ombros e tríceps.', 'Peito', 'Peso corporal', 'Iniciante', TRUE),
  (NULL, 'Prancha', 'Exercício isométrico para fortalecer o core.', 'Abdômen', 'Peso corporal', 'Iniciante', TRUE),
  (NULL, 'Supino Reto', 'Exercício fundamental para desenvolvimento do peito.', 'Peito', 'Barra', 'Intermediário', TRUE),
  (NULL, 'Puxada Frontal', 'Exercício para desenvolvimento das costas.', 'Costas', 'Cabo', 'Intermediário', TRUE)
) AS t(personal_id, nome, descricao, grupo_muscular, equipamento, dificuldade, publico)
WHERE NOT EXISTS (SELECT 1 FROM public.exercicios LIMIT 1);
