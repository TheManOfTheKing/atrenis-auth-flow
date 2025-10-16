-- Criação do ENUM user_role (se não existir)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'personal', 'aluno');
    END IF;
END $$;

-- Criação do ENUM subscription_status (se não existir)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE public.subscription_status AS ENUM ('ativa', 'cancelada', 'vencida', 'trial', 'pendente');
    END IF;
END $$;

-- Tabela: plans
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_mensal NUMERIC NOT NULL,
  preco_anual NUMERIC,
  max_alunos INTEGER,
  recursos JSONB DEFAULT '[]'::jsonb,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela 'plans'
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para 'plans'
CREATE POLICY "Admins can view all plans" ON public.plans
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can create plans" ON public.plans
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update plans" ON public.plans
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete plans" ON public.plans
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Personal trainers can view active plans" ON public.plans
FOR SELECT TO authenticated
USING (ativo = TRUE AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'personal'));

CREATE POLICY "Anon can view active plans" ON public.plans
FOR SELECT
USING (ativo = TRUE);

-- Adicionar colunas à tabela 'profiles' (se não existirem)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS desconto_percentual NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_assinatura TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS data_vencimento TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_assinatura public.subscription_status DEFAULT 'pendente'::public.subscription_status,
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS data_desativacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS motivo_desativacao TEXT;

-- Tabela: aluno_status_history
CREATE TABLE IF NOT EXISTS public.aluno_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL,
  motivo TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela 'aluno_status_history'
ALTER TABLE public.aluno_status_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para 'aluno_status_history'
CREATE POLICY "Admins can manage aluno status history" ON public.aluno_status_history
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Personal can insert and view their students' status history" ON public.aluno_status_history
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'personal' AND aluno_id IN (SELECT id FROM public.profiles WHERE personal_id = auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'personal' AND aluno_id IN (SELECT id FROM public.profiles WHERE personal_id = auth.uid())));

CREATE POLICY "Students can view their own status history" ON public.aluno_status_history
FOR SELECT TO authenticated
USING (aluno_id = auth.uid());

-- Atualizar políticas RLS para 'profiles' para incluir o campo 'ativo' e 'status_assinatura'
-- Remover políticas antigas se necessário (ex: 'Users can view own profile', 'Users can update own profile')
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "aluno_view_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Personal pode atualizar seus alunos" ON public.profiles;
DROP POLICY IF EXISTS "Personals: Create student profiles" ON public.profiles;

CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os perfis" ON public.profiles
FOR SELECT TO authenticated
USING (get_my_role() = 'admin'::user_role);

CREATE POLICY "Admins podem atualizar todos os perfis" ON public.profiles
FOR UPDATE TO authenticated
USING (get_my_role() = 'admin'::user_role);

CREATE POLICY "Admins podem deletar perfis" ON public.profiles
FOR DELETE TO authenticated
USING (get_my_role() = 'admin'::user_role);

CREATE POLICY "Personal pode ver perfis de seus alunos" ON public.profiles
FOR SELECT TO authenticated
USING (get_my_role() = 'personal'::user_role AND personal_id = auth.uid());

CREATE POLICY "Personal pode criar alunos" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (get_my_role() = 'personal'::user_role AND personal_id = auth.uid());

CREATE POLICY "Personal pode atualizar seus alunos" ON public.profiles
FOR UPDATE TO authenticated
USING (get_my_role() = 'personal'::user_role AND personal_id = auth.uid() AND role = 'aluno'::user_role);


-- Trigger para atualizar 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Aplicar trigger à tabela 'plans'
DROP TRIGGER IF EXISTS set_updated_at_plans ON public.plans;
CREATE TRIGGER set_updated_at_plans
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Aplicar trigger à tabela 'profiles' (se já não estiver aplicada)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();