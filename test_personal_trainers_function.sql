-- Teste da função get_personal_trainers_admin_view
-- Execute este SQL no Supabase SQL Editor para testar

SELECT * FROM public.get_personal_trainers_admin_view(
    search_term := NULL,
    plan_filter := NULL,
    status_filter := NULL,
    sort_by := 'created_at_desc',
    page_size := 10,
    page_number := 1
);
