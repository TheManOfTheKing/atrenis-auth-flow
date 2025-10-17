-- Script CORRIGIDO para verificar se existe algum campo com valor 'active' no banco
-- Execute este script no Supabase SQL Editor

-- 1. Verificar valores do enum subscription_status
SELECT 
    'ENUM subscription_status' as tabela_campo,
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'subscription_status'
ORDER BY e.enumsortorder;

-- 2. Verificar se há dados usando 'active' na coluna status_assinatura
SELECT 
    'profiles.status_assinatura' as tabela_campo,
    status_assinatura,
    COUNT(*) as count
FROM public.profiles 
WHERE status_assinatura = 'active'
GROUP BY status_assinatura;

-- 3. Verificar se há dados usando 'active' em qualquer coluna de texto da tabela profiles
SELECT 
    'profiles' as tabela,
    'status_assinatura' as coluna,
    status_assinatura as valor,
    COUNT(*) as count
FROM public.profiles 
WHERE status_assinatura::text ILIKE '%active%'
GROUP BY status_assinatura;

-- 4. Verificar se há dados usando 'active' na coluna nome da tabela profiles
SELECT 
    'profiles' as tabela,
    'nome' as coluna,
    nome as valor,
    COUNT(*) as count
FROM public.profiles 
WHERE nome ILIKE '%active%'
GROUP BY nome;

-- 5. Verificar se há dados usando 'active' na coluna motivo_desativacao da tabela profiles
SELECT 
    'profiles' as tabela,
    'motivo_desativacao' as coluna,
    motivo_desativacao as valor,
    COUNT(*) as count
FROM public.profiles 
WHERE motivo_desativacao ILIKE '%active%'
GROUP BY motivo_desativacao;

-- 6. Verificar se há dados usando 'active' na tabela plans (nome)
SELECT 
    'plans' as tabela,
    'nome' as coluna,
    nome as valor,
    COUNT(*) as count
FROM public.plans 
WHERE nome ILIKE '%active%'
GROUP BY nome;

-- 7. Verificar se há dados usando 'active' na coluna descricao da tabela plans
SELECT 
    'plans' as tabela,
    'descricao' as coluna,
    descricao as valor,
    COUNT(*) as count
FROM public.plans 
WHERE descricao ILIKE '%active%'
GROUP BY descricao;

-- 8. Verificar se há dados usando 'active' em qualquer coluna JSONB da tabela plans
SELECT 
    'plans' as tabela,
    'recursos' as coluna,
    recursos::text as valor,
    COUNT(*) as count
FROM public.plans 
WHERE recursos::text ILIKE '%active%'
GROUP BY recursos::text;

-- 9. Verificar se há dados usando 'active' na tabela treinos (nome)
SELECT 
    'treinos' as tabela,
    'nome' as coluna,
    nome as valor,
    COUNT(*) as count
FROM public.treinos 
WHERE nome ILIKE '%active%'
GROUP BY nome;

-- 10. Verificar se há dados usando 'active' na tabela exercicios (nome)
SELECT 
    'exercicios' as tabela,
    'nome' as coluna,
    nome as valor,
    COUNT(*) as count
FROM public.exercicios 
WHERE nome ILIKE '%active%'
GROUP BY nome;

-- 11. Verificar se há dados usando 'active' na coluna descricao da tabela exercicios
SELECT 
    'exercicios' as tabela,
    'descricao' as coluna,
    descricao as valor,
    COUNT(*) as count
FROM public.exercicios 
WHERE descricao ILIKE '%active%'
GROUP BY descricao;

-- 12. Verificar se há dados usando 'active' na coluna equipamento da tabela exercicios
SELECT 
    'exercicios' as tabela,
    'equipamento' as coluna,
    equipamento as valor,
    COUNT(*) as count
FROM public.exercicios 
WHERE equipamento ILIKE '%active%'
GROUP BY equipamento;

-- 13. Verificar se há dados usando 'active' na coluna dificuldade da tabela exercicios
SELECT 
    'exercicios' as tabela,
    'dificuldade' as coluna,
    dificuldade as valor,
    COUNT(*) as count
FROM public.exercicios 
WHERE dificuldade ILIKE '%active%'
GROUP BY dificuldade;

-- 14. Verificar se há dados usando 'active' na tabela aluno_status_history (se existir)
SELECT 
    'aluno_status_history' as tabela,
    'motivo' as coluna,
    motivo as valor,
    COUNT(*) as count
FROM public.aluno_status_history 
WHERE motivo ILIKE '%active%'
GROUP BY motivo;

-- 15. Verificar se há dados usando 'active' na tabela subscription_history (se existir)
SELECT 
    'subscription_history' as tabela,
    'motivo' as coluna,
    motivo as valor,
    COUNT(*) as count
FROM public.subscription_history 
WHERE motivo ILIKE '%active%'
GROUP BY motivo;

-- 16. Verificar se há dados usando 'active' na tabela subscription_history (status_assinatura)
SELECT 
    'subscription_history' as tabela,
    'status_assinatura' as coluna,
    status_assinatura as valor,
    COUNT(*) as count
FROM public.subscription_history 
WHERE status_assinatura ILIKE '%active%'
GROUP BY status_assinatura;

-- 17. Verificar se há dados usando 'active' na tabela subscription_history (acao)
SELECT 
    'subscription_history' as tabela,
    'acao' as coluna,
    acao as valor,
    COUNT(*) as count
FROM public.subscription_history 
WHERE acao ILIKE '%active%'
GROUP BY acao;

-- 18. Verificar se há dados usando 'active' na tabela subscription_history (observacoes)
SELECT 
    'subscription_history' as tabela,
    'observacoes' as coluna,
    observacoes as valor,
    COUNT(*) as count
FROM public.subscription_history 
WHERE observacoes ILIKE '%active%'
GROUP BY observacoes;

-- 19. Verificar se há dados usando 'active' na tabela plan_status_history (se existir)
SELECT 
    'plan_status_history' as tabela,
    'motivo' as coluna,
    motivo as valor,
    COUNT(*) as count
FROM public.plan_status_history 
WHERE motivo ILIKE '%active%'
GROUP BY motivo;
