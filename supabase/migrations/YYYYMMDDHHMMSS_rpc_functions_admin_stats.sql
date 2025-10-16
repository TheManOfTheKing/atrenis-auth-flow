-- Função: get_admin_summary_stats
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
                WHEN p.status_assinatura = 'ativa' AND pl.preco_mensal IS NOT NULL THEN
                    pl.preco_mensal * (1 - COALESCE(p.desconto_percentual, 0) / 100)
                WHEN p.status_assinatura = 'ativa' AND pl.preco_anual IS NOT NULL THEN
                    (pl.preco_anual / 12) * (1 - COALESCE(p.desconto_percentual, 0) / 100)
                ELSE 0
            END
        ), 0) AS mrr,
        COALESCE(SUM(
            CASE
                WHEN p.status_assinatura = 'ativa' AND pl.preco_mensal IS NOT NULL THEN
                    pl.preco_mensal * 12 * (1 - COALESCE(p.desconto_percentual, 0) / 100)
                WHEN p.status_assinatura = 'ativa' AND pl.preco_anual IS NOT NULL THEN
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

-- Função: get_personals_growth_monthly
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
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS mes,
        EXTRACT(YEAR FROM created_at)::INTEGER AS ano,
        COUNT(id) AS total_personals
    FROM
        public.profiles
    WHERE
        role = 'personal' AND created_at >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')
    GROUP BY
        DATE_TRUNC('month', created_at)
    ORDER BY
        ano, DATE_TRUNC('month', created_at);
END;
$$;

-- Função: get_students_per_personal_top10
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
        p.personal_id,
        pp.nome AS personal_nome,
        COUNT(p.id) AS total_alunos
    FROM
        public.profiles p
    JOIN
        public.profiles pp ON p.personal_id = pp.id
    WHERE
        p.role = 'aluno' AND p.personal_id IS NOT NULL
    GROUP BY
        p.personal_id, pp.nome
    ORDER BY
        total_alunos DESC
    LIMIT 10;
END;
$$;

-- Função: get_plans_distribution_stats
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
        COALESCE(pl.nome, 'Sem Plano')
    ORDER BY
        total_personals DESC;
END;
$$;

-- Função: get_recent_subscriptions
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
        pl.nome AS plan_nome,
        p.data_assinatura,
        p.status_assinatura
    FROM
        public.profiles p
    JOIN
        public.plans pl ON p.plan_id = pl.id
    WHERE
        p.role = 'personal' AND p.data_assinatura IS NOT NULL
    ORDER BY
        p.data_assinatura DESC
    LIMIT 5;
END;
$$;

-- Função: get_expiring_subscriptions
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
        pl.nome AS plan_nome,
        p.data_vencimento,
        p.status_assinatura
    FROM
        public.profiles p
    JOIN
        public.plans pl ON p.plan_id = pl.id
    WHERE
        p.role = 'personal'
        AND p.status_assinatura = 'ativa'
        AND p.data_vencimento IS NOT NULL
        AND p.data_vencimento BETWEEN NOW() AND NOW() + (days_ahead || ' days')::INTERVAL
    ORDER BY
        p.data_vencimento ASC;
END;
$$;

-- Função: get_personals_without_active_plan
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
        AND (p.plan_id IS NULL OR p.status_assinatura != 'ativa');
END;
$$;