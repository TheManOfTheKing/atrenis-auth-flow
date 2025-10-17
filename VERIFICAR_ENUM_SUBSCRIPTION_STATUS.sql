-- Script para verificar os valores atuais do enum subscription_status
-- Execute este script no Supabase SQL Editor para ver os valores reais

-- 1. Verificar se o enum existe e seus valores
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'subscription_status'
ORDER BY e.enumsortorder;

-- 2. Verificar se há dados usando cada valor
SELECT 
    status_assinatura,
    COUNT(*) as count
FROM public.profiles 
WHERE status_assinatura IS NOT NULL
GROUP BY status_assinatura
ORDER BY status_assinatura;

-- 3. Verificar se há planos do tipo vitalicio
SELECT 
    id,
    nome,
    tipo,
    preco_mensal,
    preco_anual
FROM public.plans 
WHERE tipo = 'vitalicio';

-- 4. Verificar personal trainers com planos vitalicios
SELECT 
    p.id,
    p.nome,
    p.status_assinatura,
    p.plano_vitalicio,
    pl.nome as plano_nome,
    pl.tipo as plano_tipo
FROM public.profiles p
LEFT JOIN public.plans pl ON p.plan_id = pl.id
WHERE p.role = 'personal' 
  AND (p.plano_vitalicio = TRUE OR pl.tipo = 'vitalicio');
