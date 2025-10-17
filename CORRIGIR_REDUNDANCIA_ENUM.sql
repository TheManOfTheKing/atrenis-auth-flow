-- =====================================================
-- SCRIPT: CORRIGIR REDUNDÂNCIA DO ENUM SUBSCRIPTION_STATUS
-- =====================================================
-- Objetivo: Remover valores redundantes do enum
-- Data: 2024-12-19
-- =====================================================

-- 1. VERIFICAR VALORES ATUAIS DO ENUM
SELECT 
    'VALORES ATUAIS DO ENUM' as info,
    unnest(enum_range(NULL::public.subscription_status)) as valor;

-- 2. VERIFICAR DADOS EXISTENTES QUE USAM OS VALORES REDUNDANTES
SELECT 
    'DADOS USANDO vitalicio' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE status_assinatura = 'vitalicio';

SELECT 
    'DADOS USANDO vitalicia' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE status_assinatura = 'vitalicia';

-- 3. MIGRAR DADOS DE 'vitalicia' PARA 'vitalicio' (se existirem)
UPDATE public.profiles 
SET status_assinatura = 'vitalicio'
WHERE status_assinatura = 'vitalicia';

-- 4. VERIFICAR SE A MIGRAÇÃO FUNCIONOU
SELECT 
    'DADOS APÓS MIGRAÇÃO' as info,
    status_assinatura,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE status_assinatura IN ('vitalicio', 'vitalicia')
GROUP BY status_assinatura;

-- 5. REMOVER VALOR REDUNDANTE 'vitalicio' DO ENUM
-- Nota: PostgreSQL não permite remover valores de enum diretamente
-- A solução é recriar o enum sem o valor redundante

-- 5.1. Criar novo enum sem redundância
CREATE TYPE public.subscription_status_new AS ENUM (
    'pending',
    'active', 
    'inactive',
    'trialing',
    'past_due',
    'canceled',
    'pendente',
    'vitalicio',  -- Mantém apenas o masculino (correto)
    'ativo'       -- Mantém apenas o masculino (correto)
);

-- 5.2. Alterar coluna para usar novo enum
ALTER TABLE public.profiles 
ALTER COLUMN status_assinatura TYPE public.subscription_status_new 
USING status_assinatura::text::public.subscription_status_new;

-- 5.3. Remover enum antigo
DROP TYPE public.subscription_status;

-- 5.4. Renomear novo enum para nome original
ALTER TYPE public.subscription_status_new RENAME TO subscription_status;

-- 6. VERIFICAR VALORES FINAIS DO ENUM
SELECT 
    'VALORES FINAIS DO ENUM (SEM REDUNDÂNCIA)' as info,
    unnest(enum_range(NULL::public.subscription_status)) as valor;

-- 7. VERIFICAR DADOS FINAIS
SELECT 
    'DADOS FINAIS' as info,
    status_assinatura,
    COUNT(*) as quantidade
FROM public.profiles 
GROUP BY status_assinatura
ORDER BY status_assinatura;

-- 8. TESTAR INSERÇÃO COM VALOR 'vitalicio'
INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    status_assinatura,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'teste@vitalicio.com',
    'Teste Vitalicio',
    'personal',
    'vitalicio',  -- Teste do valor corrigido
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 9. VERIFICAR SE O TESTE FUNCIONOU
SELECT 
    'TESTE INSERÇÃO VITALICIO' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE status_assinatura = 'vitalicio';

-- 10. LIMPAR DADOS DE TESTE
DELETE FROM public.profiles 
WHERE email = 'teste@vitalicio.com';

-- =====================================================
-- RESUMO DAS CORREÇÕES:
-- =====================================================
-- ✅ Removido: 'vitalicia' (feminino incorreto)
-- ✅ Mantido: 'vitalicio' (masculino, correto para "O Plano")
-- ✅ Removido: 'ativa' (feminino incorreto)
-- ✅ Mantido: 'ativo' (masculino, correto para "O Plano")
-- ✅ Mantido: 'active' (inglês)
-- ✅ Enum limpo e com concordância correta
-- =====================================================
