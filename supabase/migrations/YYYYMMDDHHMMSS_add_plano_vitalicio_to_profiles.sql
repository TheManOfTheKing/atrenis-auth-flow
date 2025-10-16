-- Adicionar campo plano_vitalicio à tabela profiles
-- Este campo indica se o personal trainer possui um plano vitalício (sem data de vencimento)

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plano_vitalicio BOOLEAN DEFAULT FALSE;

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.plano_vitalicio IS 'Indica se o personal trainer possui um plano vitalício (sem data de vencimento)';

-- Atualizar registros existentes que têm planos vitalícios
-- (Se houver algum plano do tipo 'vitalicio', atualizar os personal trainers que o possuem)
UPDATE public.profiles p
SET plano_vitalicio = TRUE
WHERE p.role = 'personal'
  AND p.plan_id IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM public.plans pl 
    WHERE pl.id = p.plan_id 
      AND pl.tipo = 'vitalicio'
  );

