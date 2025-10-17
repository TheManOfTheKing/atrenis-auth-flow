-- Migração consolidada para criar todas as funções necessárias
-- Esta migração deve ser executada após as correções do ENUM

-- 1. Função: get_admin_summary_stats
CREATE OR REPLACE FUNCTION public.get_admin_summary_stats()
RETURNS TABLE(
    total_personals BIGINT,
    total_alunos BIGINT,
    mrr NUMERIC,
    arr NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.profiles WHERE role = 'personal') AS total_personals,
        (SELECT COUNT(*) FROM public.profiles WHERE role = 'aluno') AS total_alunos,
        COALESCE(SUM(
            CASE
                WHEN p.status_assinatura = 'active' AND pl.preco_mensal IS NOT NULL THEN
                    pl.preco_mensal * (1 - COALESCE(p.desconto_percentual, 0) / 100)
                WHEN p.status_assinatura = 'active' AND pl.preco_anual IS NOT NULL THEN
                    (pl.preco_anual / 12) * (1 - COALESCE(p.desconto_percentual, 0) / 100)
                ELSE 0
            END
        ), 0) AS mrr,
        COALESCE(SUM(
            CASE
                WHEN p.status_assinatura = 'active' AND pl.preco_mensal IS NOT NULL THEN
                    pl.preco_mensal * 12 * (1 - COALESCE(p.desconto_percentual, 0) / 100)
                WHEN p.status_assinatura = 'active' AND pl.preco_anual IS NOT NULL THEN
                    pl.preco_anual * (1 - COALESCE(p.desconto_percentual, 0) / 100)
                ELSE 0
            END
        ), 0) AS arr
    FROM
        public.profiles p
    LEFT JOIN
        public.plans pl ON p.plan_id = pl.id
    WHERE
        p.role = 'personal';
END;
$$;

-- 2. Função: get_personals_growth_monthly
CREATE OR REPLACE FUNCTION public.get_personals_growth_monthly()
RETURNS TABLE(
    mes TEXT,
    ano INTEGER,
    total_personals BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        TO_CHAR(DATE_TRUNC('month', p.created_at), 'Mon') AS mes,
        EXTRACT(YEAR FROM p.created_at)::INTEGER AS ano,
        COUNT(*) AS total_personals
    FROM
        public.profiles p
    WHERE
        p.role = 'personal'
        AND p.created_at >= DATE_TRUNC('year', NOW() - INTERVAL '1 year')
    GROUP BY
        DATE_TRUNC('month', p.created_at)
    ORDER BY
        DATE_TRUNC('month', p.created_at);
END;
$$;

-- 3. Função: get_students_per_personal_top10
CREATE OR REPLACE FUNCTION public.get_students_per_personal_top10()
RETURNS TABLE(
    personal_id UUID,
    personal_nome TEXT,
    total_alunos BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS personal_id,
        p.nome AS personal_nome,
        COUNT(a.id) AS total_alunos
    FROM
        public.profiles p
    LEFT JOIN
        public.profiles a ON a.personal_id = p.id AND a.role = 'aluno'
    WHERE
        p.role = 'personal'
    GROUP BY
        p.id, p.nome
    ORDER BY
        total_alunos DESC
    LIMIT 10;
END;
$$;

-- 4. Função: get_plans_distribution_stats
CREATE OR REPLACE FUNCTION public.get_plans_distribution_stats()
RETURNS TABLE(
    plan_nome TEXT,
    total_personals BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(pl.nome, 'Sem Plano') AS plan_nome,
        COUNT(p.id) AS total_personals
    FROM
        public.profiles p
    LEFT JOIN
        public.plans pl ON p.plan_id = pl.id
    WHERE
        p.role = 'personal'
    GROUP BY
        pl.nome
    ORDER BY
        total_personals DESC;
END;
$$;

-- 5. Função: get_recent_subscriptions
CREATE OR REPLACE FUNCTION public.get_recent_subscriptions()
RETURNS TABLE(
    personal_id UUID,
    personal_nome TEXT,
    plan_nome TEXT,
    data_assinatura TIMESTAMP WITH TIME ZONE,
    status_assinatura subscription_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS personal_id,
        p.nome AS personal_nome,
        COALESCE(pl.nome, 'Sem Plano') AS plan_nome,
        p.data_assinatura,
        p.status_assinatura
    FROM
        public.profiles p
    LEFT JOIN
        public.plans pl ON p.plan_id = pl.id
    WHERE
        p.role = 'personal' AND p.data_assinatura IS NOT NULL
    ORDER BY
        p.data_assinatura DESC
    LIMIT 5;
END;
$$;

-- 6. Função: get_expiring_subscriptions
CREATE OR REPLACE FUNCTION public.get_expiring_subscriptions(days_ahead INTEGER DEFAULT 7)
RETURNS TABLE(
    personal_id UUID,
    personal_nome TEXT,
    plan_nome TEXT,
    data_vencimento TIMESTAMP WITH TIME ZONE,
    status_assinatura subscription_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS personal_id,
        p.nome AS personal_nome,
        COALESCE(pl.nome, 'Sem Plano') AS plan_nome,
        p.data_vencimento,
        p.status_assinatura
    FROM
        public.profiles p
    LEFT JOIN
        public.plans pl ON p.plan_id = pl.id
    WHERE
        p.role = 'personal'
        AND p.status_assinatura = 'active'
        AND p.data_vencimento IS NOT NULL
        AND p.data_vencimento BETWEEN NOW() AND NOW() + (days_ahead || ' days')::INTERVAL
    ORDER BY
        p.data_vencimento ASC;
END;
$$;

-- 7. Função: get_personals_without_active_plan
CREATE OR REPLACE FUNCTION public.get_personals_without_active_plan()
RETURNS TABLE(
    personal_id UUID,
    personal_nome TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS personal_id,
        p.nome AS personal_nome,
        p.email,
        p.created_at
    FROM
        public.profiles p
    WHERE
        p.role = 'personal'
        AND (p.plan_id IS NULL OR p.status_assinatura NOT IN ('active', 'trialing'))
    ORDER BY
        p.created_at DESC;
END;
$$;

-- 8. Função: get_personal_trainers_admin_view (CORRIGIDA)
CREATE OR REPLACE FUNCTION public.get_personal_trainers_admin_view(
    search_term TEXT DEFAULT NULL,
    plan_filter TEXT DEFAULT NULL,
    status_filter subscription_status DEFAULT NULL,
    sort_by TEXT DEFAULT 'created_at_desc',
    page_size INTEGER DEFAULT 10,
    page_number INTEGER DEFAULT 1
)
RETURNS TABLE(
    id UUID,
    nome TEXT,
    email TEXT,
    cref TEXT,
    plan_id UUID,
    plan_nome TEXT,
    plan_max_alunos INTEGER,
    desconto_percentual NUMERIC,
    data_assinatura TIMESTAMP WITH TIME ZONE,
    data_vencimento TIMESTAMP WITH TIME ZONE,
    status_assinatura subscription_status,
    total_alunos BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    ativo BOOLEAN,
    data_desativacao TIMESTAMP WITH TIME ZONE,
    motivo_desativacao TEXT,
    plano_vitalicio BOOLEAN,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    offset_value INTEGER := (page_number - 1) * page_size;
    base_query TEXT;
    count_query TEXT;
    where_clause TEXT := '';
    order_clause TEXT := '';
    total_count BIGINT;
BEGIN
    -- Base WHERE clause for personal trainers
    where_clause := 'p.role = ''personal''';

    -- Add search term filter
    IF search_term IS NOT NULL AND search_term != '' THEN
        where_clause := where_clause || FORMAT(' AND (p.nome ILIKE %L OR p.email ILIKE %L)', '%' || search_term || '%', '%' || search_term || '%');
    END IF;

    -- Add plan filter
    IF plan_filter IS NOT NULL AND plan_filter != 'all' AND plan_filter != 'none' THEN
        where_clause := where_clause || FORMAT(' AND p.plan_id = %L', plan_filter);
    END IF;
    
    -- Handle 'Sem Plano' filter
    IF plan_filter IS NOT NULL AND plan_filter = 'none' THEN
        where_clause := where_clause || ' AND p.plan_id IS NULL';
    END IF;

    -- Add subscription status filter
    IF status_filter IS NOT NULL THEN
        where_clause := where_clause || FORMAT(' AND p.status_assinatura = %L', status_filter);
    END IF;

    -- Count total records
    count_query := FORMAT('SELECT COUNT(*) FROM public.profiles p WHERE %s', where_clause);
    EXECUTE count_query INTO total_count;

    -- Build ORDER BY clause
    CASE sort_by
        WHEN 'nome_asc' THEN order_clause := 'p.nome ASC';
        WHEN 'nome_desc' THEN order_clause := 'p.nome DESC';
        WHEN 'created_at_asc' THEN order_clause := 'p.created_at ASC';
        WHEN 'created_at_desc' THEN order_clause := 'p.created_at DESC';
        ELSE order_clause := 'p.created_at DESC';
    END CASE;

    -- Main query
    base_query := FORMAT('
        SELECT
            p.id,
            p.nome,
            p.email,
            p.cref,
            p.plan_id,
            COALESCE(pl.nome, ''Sem Plano'') AS plan_nome,
            COALESCE(pl.max_alunos, 0) AS plan_max_alunos,
            COALESCE(p.desconto_percentual, 0) AS desconto_percentual,
            p.data_assinatura,
            p.data_vencimento,
            p.status_assinatura,
            (SELECT COUNT(*) FROM public.profiles WHERE personal_id = p.id AND role = ''aluno'') AS total_alunos,
            p.created_at,
            COALESCE(p.ativo, true) AS ativo,
            p.data_desativacao,
            p.motivo_desativacao,
            COALESCE(p.plano_vitalicio, false) AS plano_vitalicio,
            %s AS total_count
        FROM
            public.profiles p
        LEFT JOIN
            public.plans pl ON p.plan_id = pl.id
        WHERE
            %s
        ORDER BY
            %s
        LIMIT %s OFFSET %s
    ', total_count, where_clause, order_clause, page_size, offset_value);

    RETURN QUERY EXECUTE base_query;
END;
$function$;

-- 9. Função: get_personal_stats
CREATE OR REPLACE FUNCTION public.get_personal_stats(personal_uuid UUID)
RETURNS TABLE(
    total_alunos BIGINT,
    total_treinos BIGINT,
    total_execucoes BIGINT,
    execucoes_mes BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_total_alunos BIGINT;
    v_total_treinos BIGINT;
    v_total_execucoes BIGINT;
    v_execucoes_mes BIGINT;
BEGIN
    -- Total de alunos do personal trainer
    SELECT COUNT(*)
    INTO v_total_alunos
    FROM public.profiles
    WHERE role = 'aluno' AND personal_id = personal_uuid;

    -- Total de treinos criados pelo personal trainer
    SELECT COUNT(*)
    INTO v_total_treinos
    FROM public.treinos
    WHERE personal_id = personal_uuid;

    -- Total de execuções de treinos dos alunos do personal trainer
    SELECT COUNT(*)
    INTO v_total_execucoes
    FROM public.treino_execucoes te
    WHERE te.aluno_id IN (
        SELECT id FROM public.profiles WHERE role = 'aluno' AND personal_id = personal_uuid
    );

    -- Execuções de treinos no mês atual
    SELECT COUNT(*)
    INTO v_execucoes_mes
    FROM public.treino_execucoes te
    WHERE te.aluno_id IN (
        SELECT id FROM public.profiles WHERE role = 'aluno' AND personal_id = personal_uuid
    )
    AND DATE_TRUNC('month', te.data_execucao) = DATE_TRUNC('month', NOW());

    -- Retornar os resultados
    RETURN QUERY
    SELECT v_total_alunos, v_total_treinos, v_total_execucoes, v_execucoes_mes;
END;
$$;

-- 10. Função: get_aluno_stats
CREATE OR REPLACE FUNCTION public.get_aluno_stats(aluno_uuid UUID)
RETURNS TABLE(
    treinos_ativos BIGINT,
    treinos_concluidos BIGINT,
    total_execucoes BIGINT,
    execucoes_mes BIGINT,
    media_avaliacao NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_treinos_ativos BIGINT;
    v_treinos_concluidos BIGINT;
    v_total_execucoes BIGINT;
    v_execucoes_mes BIGINT;
    v_media_avaliacao NUMERIC;
BEGIN
    -- Treinos ativos do aluno
    SELECT COUNT(*)
    INTO v_treinos_ativos
    FROM public.aluno_treinos at
    WHERE at.aluno_id = aluno_uuid AND at.status = 'ativo';

    -- Treinos concluídos do aluno
    SELECT COUNT(*)
    INTO v_treinos_concluidos
    FROM public.aluno_treinos at
    WHERE at.aluno_id = aluno_uuid AND at.status = 'concluido';

    -- Total de execuções do aluno
    SELECT COUNT(*)
    INTO v_total_execucoes
    FROM public.treino_execucoes te
    WHERE te.aluno_id = aluno_uuid;

    -- Execuções no mês atual
    SELECT COUNT(*)
    INTO v_execucoes_mes
    FROM public.treino_execucoes te
    WHERE te.aluno_id = aluno_uuid
    AND DATE_TRUNC('month', te.data_execucao) = DATE_TRUNC('month', NOW());

    -- Média de avaliação
    SELECT COALESCE(AVG(te.avaliacao), 0)
    INTO v_media_avaliacao
    FROM public.treino_execucoes te
    WHERE te.aluno_id = aluno_uuid AND te.avaliacao IS NOT NULL;

    -- Retornar os resultados
    RETURN QUERY
    SELECT v_treinos_ativos, v_treinos_concluidos, v_total_execucoes, v_execucoes_mes, v_media_avaliacao;
END;
$$;

-- Comentários nas funções
COMMENT ON FUNCTION public.get_admin_summary_stats() IS 'Retorna estatísticas gerais do admin: total de personals, alunos, MRR e ARR';
COMMENT ON FUNCTION public.get_personals_growth_monthly() IS 'Retorna crescimento mensal de personal trainers';
COMMENT ON FUNCTION public.get_students_per_personal_top10() IS 'Retorna top 10 personal trainers por número de alunos';
COMMENT ON FUNCTION public.get_plans_distribution_stats() IS 'Retorna distribuição de planos entre personal trainers';
COMMENT ON FUNCTION public.get_recent_subscriptions() IS 'Retorna assinaturas recentes';
COMMENT ON FUNCTION public.get_expiring_subscriptions(INTEGER) IS 'Retorna assinaturas que vencem nos próximos dias';
COMMENT ON FUNCTION public.get_personals_without_active_plan() IS 'Retorna personal trainers sem plano ativo';
COMMENT ON FUNCTION public.get_personal_trainers_admin_view(TEXT, TEXT, subscription_status, TEXT, INTEGER, INTEGER) IS 'Retorna lista de personal trainers para admin com filtros e paginação';
COMMENT ON FUNCTION public.get_personal_stats(UUID) IS 'Retorna estatísticas do personal trainer';
COMMENT ON FUNCTION public.get_aluno_stats(UUID) IS 'Retorna estatísticas do aluno';
