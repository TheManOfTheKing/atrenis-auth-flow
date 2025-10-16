-- Criação do ENUM plan_type (se não existir)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
        CREATE TYPE public.plan_type AS ENUM ('publico', 'vitalicio');
    END IF;
END $$;

-- Adicionar campo tipo à tabela plans
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS tipo public.plan_type DEFAULT 'publico'::public.plan_type;

-- Adicionar campo visivel_landing à tabela plans (usado para exibir planos na landing page)
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS visivel_landing BOOLEAN DEFAULT TRUE;

-- Adicionar campo ordem_exibicao à tabela plans (para ordenar planos na landing page)
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS ordem_exibicao INTEGER DEFAULT 0;

-- Comentários explicativos
COMMENT ON COLUMN public.plans.tipo IS 'Tipo do plano: publico (disponível para assinatura) ou vitalicio (sem data de vencimento)';
COMMENT ON COLUMN public.plans.visivel_landing IS 'Define se o plano é visível na landing page pública';
COMMENT ON COLUMN public.plans.ordem_exibicao IS 'Ordem de exibição do plano na landing page (menor valor = maior prioridade)';

-- Atualizar planos existentes que têm preco_mensal = 0 para serem vitalícios
UPDATE public.plans
SET tipo = 'vitalicio'::public.plan_type
WHERE preco_mensal = 0 OR preco_anual = 0;

-- Planos vitalícios não devem ser visíveis na landing page por padrão
UPDATE public.plans
SET visivel_landing = FALSE
WHERE tipo = 'vitalicio'::public.plan_type;

