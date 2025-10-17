-- Adicionar colunas que estão faltando na tabela exercicios
-- Verificar e adicionar apenas as colunas que não existem

-- Adicionar coluna equipamento se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS equipamento TEXT;

-- Adicionar coluna dificuldade se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS dificuldade TEXT;

-- Adicionar coluna video_url se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Adicionar coluna imagem_url se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS imagem_url TEXT;

-- Adicionar coluna publico se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS publico BOOLEAN DEFAULT FALSE;

-- Adicionar coluna personal_id se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS personal_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Adicionar coluna descricao se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Adicionar coluna grupo_muscular se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS grupo_muscular TEXT;

-- Adicionar coluna created_at se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar coluna updated_at se não existir
ALTER TABLE public.exercicios 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verificar se RLS está habilitado, se não, habilitar
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver (para recriar)
DROP POLICY IF EXISTS "Personal trainers can view their own and public exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Personal trainers can create exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Personal trainers can update their own exercises" ON public.exercicios;
DROP POLICY IF EXISTS "Personal trainers can delete their own exercises" ON public.exercicios;

-- Criar políticas RLS para exercicios
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

-- Inserir alguns exercícios públicos de exemplo se a tabela estiver vazia
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

-- Comentários explicativos
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
