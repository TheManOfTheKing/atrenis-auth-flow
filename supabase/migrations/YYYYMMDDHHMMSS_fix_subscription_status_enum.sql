-- Corrigir ENUM subscription_status para ser consistente com a documentação
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

-- Atualizar a coluna status_assinatura na tabela profiles
ALTER TABLE public.profiles 
ALTER COLUMN status_assinatura TYPE public.subscription_status 
USING CASE 
  WHEN status_assinatura::text = 'ativa' THEN 'active'::public.subscription_status
  WHEN status_assinatura::text = 'cancelada' THEN 'canceled'::public.subscription_status
  WHEN status_assinatura::text = 'vencida' THEN 'past_due'::public.subscription_status
  WHEN status_assinatura::text = 'trial' THEN 'trialing'::public.subscription_status
  WHEN status_assinatura::text = 'pendente' THEN 'pendente'::public.subscription_status
  ELSE 'pending'::public.subscription_status
END;

-- Atualizar a coluna subscription_status na tabela profiles (se existir)
ALTER TABLE public.profiles 
ALTER COLUMN subscription_status TYPE public.subscription_status 
USING CASE 
  WHEN subscription_status::text = 'ativa' THEN 'active'::public.subscription_status
  WHEN subscription_status::text = 'cancelada' THEN 'canceled'::public.subscription_status
  WHEN subscription_status::text = 'vencida' THEN 'past_due'::public.subscription_status
  WHEN subscription_status::text = 'trial' THEN 'trialing'::public.subscription_status
  WHEN subscription_status::text = 'pendente' THEN 'pendente'::public.subscription_status
  ELSE 'pending'::public.subscription_status
END;

-- Comentário explicativo
COMMENT ON TYPE public.subscription_status IS 'Status da assinatura: pending, active, inactive, trialing, past_due, canceled, pendente, vitalicio';
