-- Script para adicionar apenas as colunas faltantes na tabela exercicios existente
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar colunas que estão faltando (usando ADD COLUMN IF NOT EXISTS)
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

-- 2. Verificar se grupo_muscular existe, se não, adicionar
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS grupo_muscular TEXT;

-- 3. Verificar se descricao existe, se não, adicionar
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS descricao TEXT;

-- 4. Verificar se video_url existe, se não, adicionar
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 5. Verificar se created_at existe, se não, adicionar
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 6. Verificar se updated_at existe, se não, adicionar
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 7. Habilitar RLS se não estiver habilitado
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;

-- 8. Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Personal trainers can view their own and public exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Personal trainers can create exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Personal trainers can update their own exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Personal trainers can delete their own exercises" ON public.exercicios;

-- 9. Criar políticas RLS
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

-- 10. Criar a RPC function search_exercicios
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

-- 11. Mensagem de sucesso
SELECT 'Tabela exercicios atualizada com sucesso! Colunas adicionadas: personal_id, equipamento, dificuldade, imagem_url, publico' as resultado;
