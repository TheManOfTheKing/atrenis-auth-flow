-- Função: get_personal_stats
-- Descrição: Retorna estatísticas do personal trainer (total de alunos, treinos, execuções)
-- Parâmetros: personal_uuid (UUID do personal trainer)
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

-- Comentário na função
COMMENT ON FUNCTION public.get_personal_stats(UUID) IS 'Retorna estatísticas do personal trainer: total de alunos, treinos, execuções totais e execuções no mês atual';

