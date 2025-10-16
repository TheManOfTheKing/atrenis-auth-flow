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

    -- Calculate data_vencimento
    IF p_periodo = 'mensal' THEN
        v_data_vencimento := v_data_assinatura + INTERVAL '1 month';
    ELSIF p_periodo = 'anual' THEN
        v_data_vencimento := v_data_assinatura + INTERVAL '1 year';
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
        status_assinatura = 'ativa'::subscription_status,
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

-- Função: toggle_personal_status_admin
CREATE OR REPLACE FUNCTION public.toggle_personal_status_admin(
    p_personal_id UUID,
    p_ativo BOOLEAN,
    p_motivo TEXT DEFAULT NULL
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
        RETURN json_build_object('success', FALSE, 'error', 'Acesso negado: apenas administradores podem alterar o status de personal trainers.');
    END IF;

    -- Verificar se o personal trainer existe e tem a role correta
    SELECT * INTO v_personal_profile FROM public.profiles WHERE id = p_personal_id AND role = 'personal';
    IF NOT FOUND THEN
        RETURN json_build_object('success', FALSE, 'error', 'Personal trainer não encontrado.');
    END IF;

    -- Atualizar o status do personal trainer
    UPDATE public.profiles
    SET
        ativo = p_ativo,
        data_desativacao = CASE WHEN p_ativo = FALSE THEN NOW() ELSE NULL END,
        motivo_desativacao = CASE WHEN p_ativo = FALSE THEN p_motivo ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_personal_id;

    -- Opcional: Desativar todos os alunos deste personal se ele for desativado
    IF p_ativo = FALSE THEN
        UPDATE public.profiles
        SET
            ativo = FALSE,
            data_desativacao = NOW(),
            motivo_desativacao = 'Personal trainer desativado',
            updated_at = NOW()
        WHERE personal_id = p_personal_id AND role = 'aluno' AND ativo = TRUE;
    END IF;

    RETURN json_build_object('success', TRUE, 'message', 'Status do personal trainer atualizado com sucesso.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- Função: delete_personal_by_admin
CREATE OR REPLACE FUNCTION public.delete_personal_by_admin(
    p_personal_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_current_role user_role;
    v_personal_profile profiles;
    v_active_students_count BIGINT;
BEGIN
    -- Verificar se o usuário autenticado é um administrador
    SELECT role INTO v_current_role FROM public.profiles WHERE id = auth.uid();
    IF v_current_role IS DISTINCT FROM 'admin' THEN
        RETURN json_build_object('success', FALSE, 'error', 'Acesso negado: apenas administradores podem deletar personal trainers.');
    END IF;

    -- Verificar se o personal trainer existe e tem a role correta
    SELECT * INTO v_personal_profile FROM public.profiles WHERE id = p_personal_id AND role = 'personal';
    IF NOT FOUND THEN
        RETURN json_build_object('success', FALSE, 'error', 'Personal trainer não encontrado.');
    END IF;

    -- Verificar se o personal trainer tem alunos ativos
    SELECT COUNT(*) INTO v_active_students_count
    FROM public.profiles
    WHERE personal_id = p_personal_id AND role = 'aluno' AND ativo = TRUE;

    IF v_active_students_count > 0 THEN
        RETURN json_build_object('success', FALSE, 'error', 'Não é possível deletar um personal trainer com alunos ativos. Desative os alunos primeiro.');
    END IF;

    -- Deletar o perfil do personal trainer (o trigger de auth.users fará o resto)
    DELETE FROM public.profiles WHERE id = p_personal_id;
    -- Deletar o usuário do auth.users
    PERFORM auth.admin.delete_user(p_personal_id);

    RETURN json_build_object('success', TRUE, 'message', 'Personal trainer deletado com sucesso.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- Função: reset_personal_password_admin
CREATE OR REPLACE FUNCTION public.reset_personal_password_admin(
    p_personal_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_current_role user_role;
    v_personal_profile profiles;
    v_new_password TEXT;
BEGIN
    -- Verificar se o usuário autenticado é um administrador
    SELECT role INTO v_current_role FROM public.profiles WHERE id = auth.uid();
    IF v_current_role IS DISTINCT FROM 'admin' THEN
        RETURN json_build_object('success', FALSE, 'error', 'Acesso negado: apenas administradores podem resetar senhas.');
    END IF;

    -- Verificar se o personal trainer existe e tem a role correta
    SELECT * INTO v_personal_profile FROM public.profiles WHERE id = p_personal_id AND role = 'personal';
    IF NOT FOUND THEN
        RETURN json_build_object('success', FALSE, 'error', 'Personal trainer não encontrado.');
    END IF;

    -- Gerar nova senha temporária
    v_new_password := 'Atrenis' || floor(random() * 10000)::TEXT;

    -- Atualizar a senha do usuário no auth.users
    PERFORM auth.update_user(p_personal_id, json_build_object('password', v_new_password));

    RETURN json_build_object('success', TRUE, 'message', 'Senha do personal trainer resetada com sucesso.', 'new_password', v_new_password);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- Função: toggle_aluno_status (já existente, mas incluída para completude)
CREATE OR REPLACE FUNCTION public.toggle_aluno_status(
    p_aluno_id UUID,
    p_ativo BOOLEAN,
    p_motivo TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_personal_id UUID;
    v_aluno_personal_id UUID;
    v_current_user_id UUID := auth.uid();
BEGIN
    -- Verificar se o usuário autenticado é um personal trainer
    SELECT id INTO v_personal_id FROM public.profiles WHERE id = v_current_user_id AND role = 'personal';
    IF v_personal_id IS NULL THEN
        RETURN json_build_object('success', FALSE, 'error', 'Acesso negado: Apenas personal trainers podem alterar o status de alunos.');
    END IF;

    -- Verificar se o aluno pertence a este personal trainer
    SELECT personal_id INTO v_aluno_personal_id FROM public.profiles WHERE id = p_aluno_id AND role = 'aluno';
    IF v_aluno_personal_id IS DISTINCT FROM v_personal_id THEN
        RETURN json_build_object('success', FALSE, 'error', 'Acesso negado: O aluno não pertence a este personal trainer.');
    END IF;

    -- Atualizar o status do aluno
    UPDATE public.profiles
    SET
        ativo = p_ativo,
        data_desativacao = CASE WHEN p_ativo = FALSE THEN NOW() ELSE NULL END,
        motivo_desativacao = CASE WHEN p_ativo = FALSE THEN p_motivo ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_aluno_id;

    -- Registrar a mudança no histórico
    INSERT INTO public.aluno_status_history (aluno_id, ativo, motivo, changed_by)
    VALUES (p_aluno_id, p_ativo, p_motivo, v_current_user_id);

    RETURN json_build_object('success', TRUE, 'message', 'Status do aluno atualizado com sucesso.');

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;