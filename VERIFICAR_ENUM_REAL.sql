-- Script para verificar os valores REAIS do enum subscription_status no banco
-- Execute este script no Supabase SQL Editor

-- 1. Verificar valores atuais do enum subscription_status
SELECT 
    'ENUM subscription_status' as tipo,
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'subscription_status'
ORDER BY e.enumsortorder;

-- 2. Verificar se há dados usando cada valor do enum
SELECT 
    'DADOS EXISTENTES' as tipo,
    status_assinatura,
    COUNT(*) as count
FROM public.profiles 
WHERE status_assinatura IS NOT NULL
GROUP BY status_assinatura
ORDER BY status_assinatura;

-- 3. Verificar se há dados usando 'active' especificamente
SELECT 
    'VERIFICAR ACTIVE' as tipo,
    status_assinatura,
    COUNT(*) as count
FROM public.profiles 
WHERE status_assinatura = 'active'
GROUP BY status_assinatura;

-- 4. Verificar se há dados usando 'ativa' especificamente
SELECT 
    'VERIFICAR ATIVA' as tipo,
    status_assinatura,
    COUNT(*) as count
FROM public.profiles 
WHERE status_assinatura = 'ativa'
GROUP BY status_assinatura;
