-- Função: assign_plan_to_personal
CREATE OR REPLACE FUNCTION public.assign_plan_to_personal(
    p_personal_id UUID,
    p_plan_id UUID,
    p_desconto_percentual NUMERIC,
    p_periodo TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_current_role user_role;
    v_plan_data plans;
    v_personal_profile profiles;
    v_data_assinatura TIMESTAMP WITH TIME ZONE := NOW();
    v_data_vencimento TIMESTAMP WITH TIME ZONE;
    v_total_alunos BIGINT;
    v_status_assinatura subscription_status;
    v_plano_vitalicio BOOLEAN := FALSE;
BEGIN
    -- Check if the caller is an admin
    SELECT role INTO v_current_role FROM public.profiles WHERE id = auth.uid();
    IF v_current_role IS DISTINCT FROM 'admin' THEN
        RETURN json_build_object('success', FALSE, 'error', 'Acesso negado: apenas administradores podem atribuir planos.');
    END IF;

    -- Fetch plan details
    SELECT * INTO v_plan_data FROM public.plans WHERE id = p_plan_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', FALSE, 'error', 'Plano não encontrado.');
    END IF;

    -- Fetch personal profile and current student count
    SELECT * INTO v_personal_profile FROM public.profiles WHERE id = p_personal_id AND role = 'personal';
    IF NOT FOUND THEN
        RETURN json_build_object('success', FALSE, 'error', 'Personal trainer não encontrado.');
    END IF;

    SELECT COUNT(*) INTO v_total_alunos FROM public.profiles WHERE personal_id = p_personal_id AND role = 'aluno';

    -- Check if personal exceeds plan's max_alunos
    IF v_plan_data.max_alunos IS NOT NULL AND v_plan_data.max_alunos > 0 AND v_total_alunos > v_plan_data.max_alunos THEN
        RETURN json_build_object('success', FALSE, 'error', 'O personal trainer excede o limite de alunos para este plano.');
    END IF;

    -- Calculate data_vencimento and status_assinatura based on plan type and period
    IF v_plan_data.tipo = 'vitalicio' THEN
        v_plano_vitalicio := TRUE;
        v_status_assinatura := 'vitalicio';
        v_data_vencimento := NULL; -- Planos vitalícios não vencem
    ELSIF p_periodo = 'mensal' THEN
        v_data_vencimento := v_data_assinatura + INTERVAL '1 month';
        v_status_assinatura := 'ativo';
    ELSIF p_periodo = 'anual' THEN
        v_data_vencimento := v_data_assinatura + INTERVAL '1 year';
        v_status_assinatura := 'ativo';
    ELSE
        RETURN json_build_object('success', FALSE, 'error', 'Período de assinatura inválido. Use "mensal" ou "anual".');
    END IF;

    -- Update personal's profile
    UPDATE public.profiles
    SET
        plan_id = p_plan_id,
        desconto_percentual = p_desconto_percentual,
        data_assinatura = v_data_assinatura,
        data_vencimento = v_data_vencimento,
        status_assinatura = v_status_assinatura,
        plano_vitalicio = v_plano_vitalicio,
        updated_at = NOW()
    WHERE id = p_personal_id;

    RETURN json_build_object('success', TRUE, 'message', 'Plano atribuído com sucesso.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- Função: update_personal_by_admin
CREATE OR REPLACE FUNCTION public.update_personal_by_admin(
    p_personal_id UUID,
    p_nome TEXT,
    p_email TEXT,
    p_telefone TEXT DEFAULT NULL,
    p_cref TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_current_role user_role;
    v_personal_profile profiles;
BEGIN
    -- Verificar se o usuário autenticado é um administrador
    SELECT role INTO v_current_role FROM public.profiles WHERE id = auth.uid();
    IF v_current_role IS DISTINCT FROM 'admin' THEN
        RETURN json_build_object('success', FALSE, 'error', 'Acesso negado: apenas administradores podem atualizar personal trainers.');
    END IF;

    -- Verificar se o personal trainer existe e tem a role correta
    SELECT * INTO v_personal_profile FROM public.profiles WHERE id = p_personal_id AND role = 'personal';
    IF NOT FOUND THEN
        RETURN json_build_object('success', FALSE, 'error', 'Personal trainer não encontrado.');
    END IF;

    -- Atualizar o perfil do personal trainer
    UPDATE public.profiles
    SET
        nome = p_nome,
        email = p_email,
        telefone = p_telefone,
        cref = p_cref,
        updated_at = NOW()
    WHERE id = p_personal_id;

    -- Atualizar o email no auth.users se ele foi alterado
    IF v_personal_profile.email IS DISTINCT FROM p_email THEN
        PERFORM auth.update_user(p_personal_id, json_build_object('email', p_email));
    END IF;

    RETURN json_build_object('success', TRUE, 'message', 'Personal trainer atualizado com sucesso.');

EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object('success', FALSE, 'error', 'Email já cadastrado no sistema.');
    WHEN OTHERS THEN
        RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- As funções toggle_personal_status_admin, delete_personal_by_admin e reset_personal_password_admin
-- não precisam de alterações diretas para os novos campos de plano, pois já operam no nível do perfil.
-- Elas são mantidas como estão.