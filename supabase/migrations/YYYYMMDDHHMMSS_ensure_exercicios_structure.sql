-- SCRIPT PARA GARANTIR QUE A TABELA EXERCICIOS TENHA EXATAMENTE OS CAMPOS DA TELA "CRIAR NOVO EXERCÍCIO"
-- Baseado na estrutura atual da tabela e nos campos necessários da interface

-- 1. Adicionar coluna 'publico' se não existir (necessária para o código)
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS publico BOOLEAN DEFAULT FALSE;

-- 2. Renomear 'criado_por_personal_id' para 'personal_id' (o código usa personal_id)
ALTER TABLE public.exercicios 
RENAME COLUMN criado_por_personal_id TO personal_id;

-- 3. Atualizar os índices para usar o novo nome da coluna
DROP INDEX IF EXISTS idx_exercicios_criado_por;
DROP INDEX IF EXISTS idx_exercicios_personal_id;

CREATE INDEX IF NOT EXISTS idx_exercicios_personal_id ON public.exercicios USING btree (personal_id);

-- 4. Garantir que todos os campos da tela existem e têm os tipos corretos
-- Nome do Exercício (obrigatório) - já existe como TEXT NOT NULL
-- Grupo Muscular (obrigatório) - já existe como TEXT, vamos garantir que é NOT NULL
ALTER TABLE public.exercicios 
ALTER COLUMN grupo_muscular SET NOT NULL;

-- Descrição - já existe como TEXT
-- Equipamento - já existe como TEXT
-- Dificuldade - já existe como TEXT
-- URL do Vídeo - já existe como TEXT
-- URL da Imagem - já existe como TEXT

-- 5. Habilitar RLS se não estiver habilitado
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;

-- 6. Remover todas as políticas existentes para recriar
DROP POLICY IF EXISTS "Personal trainers can view their own and public exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Personal trainers can create exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Personal trainers can update their own exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Personal trainers can delete their own exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Admins can manage all exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Users can view public exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Users can create exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Users can update their own exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Users can delete their own exercises" ON public.exercicios;

-- 7. Criar políticas RLS corretas
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

-- 8. Remover a função search_exercicios existente e recriar com a assinatura correta
DROP FUNCTION IF EXISTS public.search_exercicios(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.search_exercicios;

-- Criar a RPC function search_exercicios (necessária para o hook useExercises)
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

-- 9. Atualizar exercícios existentes para serem públicos (se não tiverem personal_id)
UPDATE public.exercicios 
SET publico = TRUE 
WHERE personal_id IS NULL;

-- 10. Inserir exercícios públicos de exemplo se a tabela estiver vazia
INSERT INTO public.exercicios (personal_id, nome, descricao, grupo_muscular, equipamento, dificuldade, video_url, imagem_url, publico) 
SELECT * FROM (VALUES
  (NULL::UUID, 'Agachamento Livre', 'Exercício fundamental para pernas e glúteos. Mantenha as costas retas e desça até as coxas ficarem paralelas ao chão.', 'Quadríceps', 'Peso corporal', 'Iniciante', NULL, NULL, TRUE),
  (NULL::UUID, 'Flexão de Braço', 'Exercício clássico para peito, ombros e tríceps. Mantenha o corpo alinhado e desça até quase tocar o chão.', 'Peito', 'Peso corporal', 'Iniciante', NULL, NULL, TRUE),
  (NULL::UUID, 'Prancha', 'Exercício isométrico para fortalecer o core. Mantenha o corpo em linha reta da cabeça aos pés.', 'Abdômen', 'Peso corporal', 'Iniciante', NULL, NULL, TRUE),
  (NULL::UUID, 'Supino Reto', 'Exercício fundamental para desenvolvimento do peito. Deite no banco e empurre a barra para cima.', 'Peito', 'Barra', 'Intermediário', NULL, NULL, TRUE),
  (NULL::UUID, 'Puxada Frontal', 'Exercício para desenvolvimento das costas. Puxe a barra em direção ao peito.', 'Costas', 'Cabo', 'Intermediário', NULL, NULL, TRUE),
  (NULL::UUID, 'Desenvolvimento com Halteres', 'Exercício para ombros. Levante os halteres acima da cabeça.', 'Ombros', 'Halteres', 'Intermediário', NULL, NULL, TRUE),
  (NULL::UUID, 'Bicicleta Ergométrica', 'Exercício cardiovascular de baixo impacto.', 'Cardio', 'Máquina', 'Iniciante', NULL, NULL, TRUE),
  (NULL::UUID, 'Prancha Isométrica', 'Exercício isométrico para core completo.', 'Abdômen', 'Peso corporal', 'Iniciante', NULL, NULL, TRUE)
) AS t(personal_id, nome, descricao, grupo_muscular, equipamento, dificuldade, video_url, imagem_url, publico)
WHERE NOT EXISTS (SELECT 1 FROM public.exercicios LIMIT 1);

-- 11. Verificar se a tabela treino_exercicios existe (necessária para a funcionalidade de treinos)
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
DROP POLICY IF EXISTS "Personal trainers can manage their workout exercises" ON public.treino_exercicios;
CREATE POLICY "Personal trainers can manage their workout exercises" ON public.treino_exercicios
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

-- 12. Verificar se a tabela treinos existe
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
DROP POLICY IF EXISTS "Personal trainers can manage their workouts" ON public.treinos;
CREATE POLICY "Personal trainers can manage their workouts" ON public.treinos
FOR ALL TO authenticated
USING (
  personal_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 13. Adicionar comentários explicativos
COMMENT ON TABLE public.exercicios IS 'Tabela de exercícios disponíveis na plataforma - estrutura compatível com a tela "Criar Novo Exercício"';
COMMENT ON COLUMN public.exercicios.personal_id IS 'ID do personal trainer que criou o exercício (NULL para exercícios públicos do sistema)';
COMMENT ON COLUMN public.exercicios.nome IS 'Nome do exercício (obrigatório)';
COMMENT ON COLUMN public.exercicios.descricao IS 'Descrição detalhada de como executar o exercício';
COMMENT ON COLUMN public.exercicios.grupo_muscular IS 'Grupo muscular principal trabalhado (obrigatório)';
COMMENT ON COLUMN public.exercicios.equipamento IS 'Equipamento necessário para o exercício';
COMMENT ON COLUMN public.exercicios.dificuldade IS 'Nível de dificuldade do exercício (Iniciante, Intermediário, Avançado)';
COMMENT ON COLUMN public.exercicios.video_url IS 'URL do vídeo demonstrativo';
COMMENT ON COLUMN public.exercicios.imagem_url IS 'URL da imagem ilustrativa';
COMMENT ON COLUMN public.exercicios.publico IS 'Se o exercício é público (disponível para todos) ou privado (apenas do personal)';

-- 14. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TABELA EXERCICIOS CONFIGURADA COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Estrutura mantida conforme a tela "Criar Novo Exercício":';
  RAISE NOTICE '- Nome do Exercício (obrigatório)';
  RAISE NOTICE '- Grupo Muscular (obrigatório)';
  RAISE NOTICE '- Descrição (opcional)';
  RAISE NOTICE '- Equipamento (opcional)';
  RAISE NOTICE '- Dificuldade (opcional)';
  RAISE NOTICE '- URL do Vídeo (opcional)';
  RAISE NOTICE '- URL da Imagem (opcional)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Alterações realizadas:';
  RAISE NOTICE '- Coluna "publico" adicionada';
  RAISE NOTICE '- Coluna "criado_por_personal_id" renomeada para "personal_id"';
  RAISE NOTICE '- Políticas RLS configuradas';
  RAISE NOTICE '- RPC function search_exercicios criada';
  RAISE NOTICE '- Exercícios existentes marcados como públicos';
  RAISE NOTICE '- Exercícios de exemplo inseridos (se tabela estava vazia)';
  RAISE NOTICE '========================================';
END $$;
