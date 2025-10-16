-- Fix for Plans page: Remove redundant 'tipo_plano' column and update INSERT RLS policy for 'plans' table.
-- This helps prevent potential conflicts and ensures RLS is fully defined.

-- 1. Remove redundant 'tipo_plano' column from 'public.plans'
ALTER TABLE public.plans DROP COLUMN IF EXISTS tipo_plano;

-- 2. Update INSERT RLS policy for 'public.plans' to include WITH CHECK
-- First, drop the existing policy if it exists (to replace it)
DROP POLICY IF EXISTS "Admins can create plans" ON public.plans;

-- Then, recreate the policy with the WITH CHECK clause
CREATE POLICY "Admins can create plans" ON public.plans
FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'admin'::user_role);

-- Fix for Personal Trainers page: Update RPC function get_personal_trainers_admin_view
-- This ensures the 'none' string for plan_filter is handled correctly
-- and prevents 'invalid input syntax for type uuid' errors.

-- IMPORTANT: Drop the existing function first due to parameter name change
DROP FUNCTION IF EXISTS public.get_personal_trainers_admin_view(text, text, public.subscription_status, text, integer, integer);

-- Now, recreate the function with the updated parameter name and logic
CREATE OR REPLACE FUNCTION public.get_personal_trainers_admin_view(
    search_term text DEFAULT NULL::text,
    plan_filter_param text DEFAULT NULL::text, -- Renamed parameter
    status_filter subscription_status DEFAULT NULL::subscription_status,
    sort_by text DEFAULT 'created_at_desc'::text,
    page_size integer DEFAULT 10,
    page_number integer DEFAULT 1
)
RETURNS TABLE(id uuid, nome text, email text, cref text, plan_id uuid, plan_nome text, plan_max_alunos integer, desconto_percentual numeric, data_assinatura timestamp with time zone, data_vencimento timestamp with time zone, status_assinatura subscription_status, total_alunos bigint, created_at timestamp with time zone, ativo boolean, data_desativacao timestamp with time zone, motivo_desativacao text, plano_vitalicio boolean, total_count bigint)
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
    plan_uuid_to_filter UUID;
    filter_by_no_plan BOOLEAN := FALSE;
BEGIN
    -- Base WHERE clause for personal trainers
    where_clause := 'p.role = ''personal''';

    -- Add search term filter
    IF search_term IS NOT NULL AND search_term != '' THEN
        where_clause := where_clause || FORMAT(' AND (p.nome ILIKE %L OR p.email ILIKE %L)', '%' || search_term || '%', '%' || search_term || '%');
    END IF;

    -- Handle plan filter parameter
    IF plan_filter_param IS NOT NULL AND plan_filter_param != '' THEN
        IF plan_filter_param = 'none' THEN
            filter_by_no_plan := TRUE;
        ELSE
            -- Attempt to cast to UUID. If it fails, the filter will be ignored.
            BEGIN
                plan_uuid_to_filter := plan_filter_param::UUID;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Invalid UUID format for plan_filter_param: %', plan_filter_param;
                plan_uuid_to_filter := NULL; -- Invalidate the UUID if cast fails
            END;
        END IF;
    END IF;

    -- Apply plan filter based on processed parameters
    IF filter_by_no_plan THEN
        where_clause := where_clause || ' AND p.plan_id IS NULL';
    ELSIF plan_uuid_to_filter IS NOT NULL THEN
        where_clause := where_clause || FORMAT(' AND p.plan_id = %L', plan_uuid_to_filter);
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
$function$