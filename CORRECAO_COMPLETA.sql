-- ========================================
-- CORREÇÃO COMPLETA - ATRENIS
-- ========================================
-- Este script corrige os erros:
-- 1. Personal Trainers: invalid input syntax for type uuid: "none"
-- 2. Garante que todos os campos necessários estão presentes
-- ========================================

-- Deletar todas as versões antigas da função
DROP FUNCTION IF EXISTS public.get_personal_trainers_admin_view(text, uuid, subscription_status, text, integer, integer);
DROP FUNCTION IF EXISTS public.get_personal_trainers_admin_view(text, text, subscription_status, text, integer, integer);

-- Criar a função corrigida
CREATE OR REPLACE FUNCTION public.get_personal_trainers_admin_view(
    search_term TEXT DEFAULT NULL,
    plan_filter TEXT DEFAULT NULL,  -- Mudado de UUID para TEXT para aceitar "none" e "all"
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
    plan_uuid UUID;
BEGIN
    -- Base WHERE clause for personal trainers
    where_clause := 'p.role = ''personal''';

    -- Add search term filter
    IF search_term IS NOT NULL AND search_term != '' THEN
        where_clause := where_clause || FORMAT(' AND (p.nome ILIKE %L OR p.email ILIKE %L)', '%' || search_term || '%', '%' || search_term || '%');
    END IF;

    -- Add plan filter
    IF plan_filter IS NOT NULL AND plan_filter != '' AND plan_filter != 'all' THEN
        IF plan_filter = 'none' THEN
            -- Filter for personal trainers without plan
            where_clause := where_clause || ' AND p.plan_id IS NULL';
        ELSE
            -- Try to convert to UUID and filter by plan_id
            BEGIN
                plan_uuid := plan_filter::UUID;
                where_clause := where_clause || FORMAT(' AND p.plan_id = %L', plan_uuid);
            EXCEPTION WHEN OTHERS THEN
                -- If conversion fails, ignore the filter
                NULL;
            END;
        END IF;
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
            pl.nome AS plan_nome,
            pl.max_alunos AS plan_max_alunos,
            p.desconto_percentual,
            p.data_assinatura,
            p.data_vencimento,
            p.status_assinatura,
            (SELECT COUNT(*) FROM public.profiles WHERE personal_id = p.id AND role = ''aluno'') AS total_alunos,
            p.created_at,
            p.ativo,
            p.data_desativacao,
            p.motivo_desativacao,
            p.plano_vitalicio,
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

-- Comentário na função
COMMENT ON FUNCTION public.get_personal_trainers_admin_view(TEXT, TEXT, subscription_status, TEXT, INTEGER, INTEGER) IS 
'Retorna lista paginada de personal trainers com filtros. plan_filter aceita: UUID do plano, "none" (sem plano), "all" (todos), ou NULL.';

