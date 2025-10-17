-- Primeiro, vamos verificar quais colunas existem na tabela profiles
-- e criar as que estão faltando

-- Verificar se a coluna status_assinatura existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'status_assinatura'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN status_assinatura public.subscription_status DEFAULT 'pendente'::public.subscription_status;
    END IF;
END $$;

-- Verificar se a coluna subscription_status existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'subscription_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN subscription_status public.subscription_status DEFAULT 'pendente'::public.subscription_status;
    END IF;
END $$;

-- Agora corrigir o ENUM subscription_status para ser consistente com a documentação
-- Primeiro, vamos remover o ENUM antigo e criar o novo

-- Remover o ENUM antigo se existir
DROP TYPE IF EXISTS public.subscription_status CASCADE;

-- Criar o ENUM correto baseado na documentação
CREATE TYPE public.subscription_status AS ENUM (
  'pending',
  'active', 
  'inactive',
  'trialing',
  'past_due',
  'canceled',
  'pendente',
  'vitalicio'
);

-- Recriar as colunas com o novo tipo
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status_assinatura_new public.subscription_status DEFAULT 'pendente'::public.subscription_status;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status_new public.subscription_status DEFAULT 'pendente'::public.subscription_status;

-- Copiar dados existentes se houver
UPDATE public.profiles 
SET status_assinatura_new = 'pendente'::public.subscription_status
WHERE status_assinatura_new IS NULL;

UPDATE public.profiles 
SET subscription_status_new = 'pendente'::public.subscription_status
WHERE subscription_status_new IS NULL;

-- Remover colunas antigas
ALTER TABLE public.profiles DROP COLUMN IF EXISTS status_assinatura;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS subscription_status;

-- Renomear colunas novas
ALTER TABLE public.profiles RENAME COLUMN status_assinatura_new TO status_assinatura;
ALTER TABLE public.profiles RENAME COLUMN subscription_status_new TO subscription_status;

-- Comentário explicativo
COMMENT ON TYPE public.subscription_status IS 'Status da assinatura: pending, active, inactive, trialing, past_due, canceled, pendente, vitalicio';
COMMENT ON COLUMN public.profiles.status_assinatura IS 'Status da assinatura do personal trainer';
COMMENT ON COLUMN public.profiles.subscription_status IS 'Status da assinatura (coluna alternativa)';
