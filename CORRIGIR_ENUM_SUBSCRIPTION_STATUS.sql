-- Script para corrigir o enum subscription_status definitivamente
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, verificar os valores atuais do enum
SELECT 
    'VALORES ATUAIS DO ENUM' as info,
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'subscription_status'
ORDER BY e.enumsortorder;

-- 2. Verificar dados existentes
SELECT 
    'DADOS EXISTENTES' as info,
    status_assinatura,
    COUNT(*) as count
FROM public.profiles 
WHERE status_assinatura IS NOT NULL
GROUP BY status_assinatura
ORDER BY status_assinatura;

-- 3. CORREÇÃO: Se o enum tem 'active' em vez de 'ativa', vamos corrigir
-- Primeiro, vamos adicionar 'ativa' se não existir
DO $$ 
BEGIN
    -- Verificar se 'ativa' já existe no enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'ativa' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_status')
    ) THEN
        -- Adicionar 'ativa' ao enum
        ALTER TYPE public.subscription_status ADD VALUE 'ativa';
        RAISE NOTICE 'Valor "ativa" adicionado ao enum subscription_status';
    ELSE
        RAISE NOTICE 'Valor "ativa" já existe no enum subscription_status';
    END IF;
END $$;

-- 4. Adicionar 'vitalicia' se não existir
DO $$ 
BEGIN
    -- Verificar se 'vitalicia' já existe no enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'vitalicia' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_status')
    ) THEN
        -- Adicionar 'vitalicia' ao enum
        ALTER TYPE public.subscription_status ADD VALUE 'vitalicia';
        RAISE NOTICE 'Valor "vitalicia" adicionado ao enum subscription_status';
    ELSE
        RAISE NOTICE 'Valor "vitalicia" já existe no enum subscription_status';
    END IF;
END $$;

-- 5. Se existir 'active' no enum, vamos migrar os dados para 'ativa'
-- Primeiro, verificar se há dados com 'active'
DO $$ 
DECLARE
    active_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO active_count 
    FROM public.profiles 
    WHERE status_assinatura = 'active';
    
    IF active_count > 0 THEN
        -- Atualizar dados de 'active' para 'ativa'
        UPDATE public.profiles 
        SET status_assinatura = 'ativa' 
        WHERE status_assinatura = 'active';
        
        RAISE NOTICE 'Migrados % registros de "active" para "ativa"', active_count;
    ELSE
        RAISE NOTICE 'Nenhum registro com "active" encontrado';
    END IF;
END $$;

-- 6. Verificar valores finais do enum
SELECT 
    'VALORES FINAIS DO ENUM' as info,
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'subscription_status'
ORDER BY e.enumsortorder;

-- 7. Verificar dados finais
SELECT 
    'DADOS FINAIS' as info,
    status_assinatura,
    COUNT(*) as count
FROM public.profiles 
WHERE status_assinatura IS NOT NULL
GROUP BY status_assinatura
ORDER BY status_assinatura;
