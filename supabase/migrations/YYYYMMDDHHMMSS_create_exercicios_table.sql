-- Criação da tabela exercicios
CREATE TABLE IF NOT EXISTS public.exercicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  grupo_muscular TEXT NOT NULL,
  equipamento TEXT,
  dificuldade TEXT,
  video_url TEXT,
  imagem_url TEXT,
  publico BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela exercicios
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para exercicios
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

-- Inserir alguns exercícios públicos de exemplo
INSERT INTO public.exercicios (personal_id, nome, descricao, grupo_muscular, equipamento, dificuldade, publico) VALUES
(NULL, 'Agachamento Livre', 'Exercício fundamental para pernas e glúteos. Mantenha as costas retas e desça até as coxas ficarem paralelas ao chão.', 'Quadríceps', 'Peso corporal', 'Iniciante', TRUE),
(NULL, 'Flexão de Braço', 'Exercício clássico para peito, ombros e tríceps. Mantenha o corpo alinhado e desça até quase tocar o chão.', 'Peito', 'Peso corporal', 'Iniciante', TRUE),
(NULL, 'Prancha', 'Exercício isométrico para fortalecer o core. Mantenha o corpo em linha reta da cabeça aos pés.', 'Abdômen', 'Peso corporal', 'Iniciante', TRUE),
(NULL, 'Supino Reto', 'Exercício fundamental para desenvolvimento do peito. Deite no banco e empurre a barra para cima.', 'Peito', 'Barra', 'Intermediário', TRUE),
(NULL, 'Puxada Frontal', 'Exercício para desenvolvimento das costas. Puxe a barra em direção ao peito.', 'Costas', 'Cabo', 'Intermediário', TRUE),
(NULL, 'Desenvolvimento com Halteres', 'Exercício para ombros. Levante os halteres acima da cabeça.', 'Ombros', 'Halteres', 'Intermediário', TRUE),
(NULL, 'Bicicleta Ergométrica', 'Exercício cardiovascular de baixo impacto.', 'Cardio', 'Máquina', 'Iniciante', TRUE),
(NULL, 'Prancha Isométrica', 'Exercício isométrico para core completo.', 'Abdômen', 'Peso corporal', 'Iniciante', TRUE);
