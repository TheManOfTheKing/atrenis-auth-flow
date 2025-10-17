-- Script completo para corrigir a tabela exercicios
-- Este script verifica a estrutura atual e adiciona os campos necessários

-- 1. Verificar e adicionar colunas que estão faltando na tabela exercicios
-- Baseado na análise do código, estes são os campos necessários:

-- Adicionar coluna personal_id (se não existir) - renomear de criado_por_personal_id se necessário
DO $$
BEGIN
    -- Verificar se a coluna criado_por_personal_id existe e personal_id não existe
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'exercicios' 
               AND column_name = 'criado_por_personal_id' 
               AND table_schema = 'public')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'exercicios' 
                    AND column_name = 'personal_id' 
                    AND table_schema = 'public') THEN
        -- Renomear criado_por_personal_id para personal_id
        ALTER TABLE public.exercicios RENAME COLUMN criado_por_personal_id TO personal_id;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'exercicios' 
                      AND column_name = 'personal_id' 
                      AND table_schema = 'public') THEN
        -- Adicionar coluna personal_id se não existir
        ALTER TABLE public.exercicios ADD COLUMN personal_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Adicionar coluna equipamento se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS equipamento TEXT;

-- Adicionar coluna dificuldade se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS dificuldade TEXT;

-- Adicionar coluna imagem_url se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS imagem_url TEXT;

-- Adicionar coluna publico se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS publico BOOLEAN DEFAULT FALSE;

-- Adicionar coluna grupo_muscular se não existir (pode estar como NOT NULL)
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS grupo_muscular TEXT;

-- Tornar grupo_muscular NOT NULL se não for
ALTER TABLE public.exercicios 
ALTER COLUMN grupo_muscular SET NOT NULL;

-- Adicionar coluna descricao se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Adicionar coluna video_url se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Adicionar coluna created_at se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar coluna updated_at se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Habilitar RLS se não estiver habilitado
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Personal trainers can view their own and public exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Personal trainers can create exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Personal trainers can update their own exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Personal trainers can delete their own exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Admins can manage all exercises" ON public.exercicios;

-- 4. Criar políticas RLS corretas
-- Personal trainers podem ver seus próprios exercícios e exercícios públicos
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

-- Personal trainers podem criar exercícios
CREATE POLICY "Personal trainers can create exercises" ON public.exercicios
FOR INSERT TO authenticated
WITH CHECK (
  personal_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Personal trainers podem atualizar seus próprios exercícios
CREATE POLICY "Personal trainers can update their own exercises" ON public.exercicios
FOR UPDATE TO authenticated
USING (
  personal_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Personal trainers podem deletar seus próprios exercícios
CREATE POLICY "Personal trainers can delete their own exercises" ON public.exercicios
FOR DELETE TO authenticated
USING (
  personal_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 5. Criar a RPC function search_exercicios se não existir
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

-- 6. Inserir exercícios públicos de exemplo se a tabela estiver vazia
INSERT INTO public.exercicios (personal_id, nome, descricao, grupo_muscular, equipamento, dificuldade, publico) 
SELECT * FROM (VALUES
  (NULL, 'Agachamento Livre', 'Exercício fundamental para pernas e glúteos. Mantenha as costas retas e desça até as coxas ficarem paralelas ao chão.', 'Quadríceps', 'Peso corporal', 'Iniciante', TRUE),
  (NULL, 'Flexão de Braço', 'Exercício clássico para peito, ombros e tríceps. Mantenha o corpo alinhado e desça até quase tocar o chão.', 'Peito', 'Peso corporal', 'Iniciante', TRUE),
  (NULL, 'Prancha', 'Exercício isométrico para fortalecer o core. Mantenha o corpo em linha reta da cabeça aos pés.', 'Abdômen', 'Peso corporal', 'Iniciante', TRUE),
  (NULL, 'Supino Reto', 'Exercício fundamental para desenvolvimento do peito. Deite no banco e empurre a barra para cima.', 'Peito', 'Barra', 'Intermediário', TRUE),
  (NULL, 'Puxada Frontal', 'Exercício para desenvolvimento das costas. Puxe a barra em direção ao peito.', 'Costas', 'Cabo', 'Intermediário', TRUE),
  (NULL, 'Desenvolvimento com Halteres', 'Exercício para ombros. Levante os halteres acima da cabeça.', 'Ombros', 'Halteres', 'Intermediário', TRUE),
  (NULL, 'Bicicleta Ergométrica', 'Exercício cardiovascular de baixo impacto.', 'Cardio', 'Máquina', 'Iniciante', TRUE),
  (NULL, 'Prancha Isométrica', 'Exercício isométrico para core completo.', 'Abdômen', 'Peso corporal', 'Iniciante', TRUE)
) AS t(personal_id, nome, descricao, grupo_muscular, equipamento, dificuldade, publico)
WHERE NOT EXISTS (SELECT 1 FROM public.exercicios LIMIT 1);

-- 7. Adicionar comentários explicativos
COMMENT ON TABLE public.exercicios IS 'Tabela de exercícios disponíveis na plataforma';
COMMENT ON COLUMN public.exercicios.personal_id IS 'ID do personal trainer que criou o exercício (NULL para exercícios públicos do sistema)';
COMMENT ON COLUMN public.exercicios.nome IS 'Nome do exercício';
COMMENT ON COLUMN public.exercicios.descricao IS 'Descrição detalhada de como executar o exercício';
COMMENT ON COLUMN public.exercicios.grupo_muscular IS 'Grupo muscular principal trabalhado';
COMMENT ON COLUMN public.exercicios.equipamento IS 'Equipamento necessário para o exercício';
COMMENT ON COLUMN public.exercicios.dificuldade IS 'Nível de dificuldade do exercício (Iniciante, Intermediário, Avançado)';
COMMENT ON COLUMN public.exercicios.video_url IS 'URL do vídeo demonstrativo';
COMMENT ON COLUMN public.exercicios.imagem_url IS 'URL da imagem ilustrativa';
COMMENT ON COLUMN public.exercicios.publico IS 'Se o exercício é público (disponível para todos) ou privado (apenas do personal)';

-- 8. Verificar se a tabela treino_exercicios existe e tem a estrutura correta
-- (Necessária para a funcionalidade de treinos)
CREATE TABLE IF NOT EXISTS public.treino_exercicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treino_id UUID NOT NULL REFERENCES public.treinos(id) ON DELETE CASCADE,
  exercicio_id UUID NOT NULL REFERENCES public.exercicios(id) ON DELETE CASCADE,
  ordem INTEGER DEFAULT 1,
  series TEXT,
  repeticoes TEXT,
  carga TEXT,
  descanso_seg INTEGER DEFAULT 60,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela treino_exercicios
ALTER TABLE public.treino_exercicios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para treino_exercicios
CREATE POLICY IF NOT EXISTS "Personal trainers can manage their workout exercises" ON public.treino_exercicios
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.treinos t 
    WHERE t.id = treino_exercicios.treino_id 
    AND t.personal_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 9. Verificar se a tabela treinos existe
CREATE TABLE IF NOT EXISTS public.treinos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT DEFAULT 'personalizado',
  duracao_estimada_min INTEGER,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela treinos
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para treinos
CREATE POLICY IF NOT EXISTS "Personal trainers can manage their workouts" ON public.treinos
FOR ALL TO authenticated
USING (
  personal_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 10. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Tabela exercicios corrigida com sucesso!';
  RAISE NOTICE 'Colunas adicionadas: personal_id, equipamento, dificuldade, imagem_url, publico';
  RAISE NOTICE 'RPC function search_exercicios criada';
  RAISE NOTICE 'Políticas RLS configuradas';
  RAISE NOTICE 'Exercícios de exemplo inseridos';
END $$;
