-- Script SIMPLES para verificar e corrigir o enum subscription_status
-- Execute este script no Supabase SQL Editor

-- 1. VERIFICAR valores atuais do enum
SELECT 
    'VALORES ATUAIS DO ENUM' as info,
    e.enumlabel as valor
FROM pg_enum e 
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname = 'subscription_status'
ORDER BY e.enumsortorder;

-- 2. VERIFICAR dados existentes
SELECT 
    'DADOS EXISTENTES' as info,
    status_assinatura,
    COUNT(*) as count
FROM public.profiles 
WHERE status_assinatura IS NOT NULL
GROUP BY status_assinatura;

-- 3. ADICIONAR 'ativa' ao enum (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'ativa' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_status')
    ) THEN
        ALTER TYPE public.subscription_status ADD VALUE 'ativa';
        RAISE NOTICE 'Adicionado "ativa" ao enum';
    ELSE
        RAISE NOTICE '"ativa" já existe no enum';
    END IF;
END $$;

-- 4. ADICIONAR 'vitalicia' ao enum (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'vitalicia' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_status')
    ) THEN
        ALTER TYPE public.subscription_status ADD VALUE 'vitalicia';
        RAISE NOTICE 'Adicionado "vitalicia" ao enum';
    ELSE
        RAISE NOTICE '"vitalicia" já existe no enum';
    END IF;
END $$;

-- 5. VERIFICAR valores finais do enum
SELECT 
    'VALORES FINAIS DO ENUM' as info,
    e.enumlabel as valor
FROM pg_enum e 
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname = 'subscription_status'
ORDER BY e.enumsortorder;
