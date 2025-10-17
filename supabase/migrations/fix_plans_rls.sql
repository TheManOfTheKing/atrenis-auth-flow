-- Script para verificar e corrigir políticas RLS da tabela plans
-- Execute este script no Supabase SQL Editor

-- Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Admins can view all plans" ON public.plans;
DROP POLICY IF EXISTS "Admins can create plans" ON public.plans;
DROP POLICY IF EXISTS "Admins can update plans" ON public.plans;
DROP POLICY IF EXISTS "Admins can delete plans" ON public.plans;
DROP POLICY IF EXISTS "Personal trainers can view active plans" ON public.plans;
DROP POLICY IF EXISTS "Anon can view active plans" ON public.plans;

-- Criar função get_my_role se não existir
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID := auth.uid();
    user_role public.user_role;
BEGIN
    IF user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT role INTO user_role FROM public.profiles WHERE id = user_id;

    IF NOT FOUND THEN
        RAISE WARNING 'Profile not found for user ID: %', user_id;
        RETURN NULL;
    END IF;

    RETURN user_role;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in get_my_role for user %: %', user_id, SQLERRM;
        RETURN NULL;
END;
$$;

-- Política: Admins podem ver todos os planos
CREATE POLICY "Admins can view all plans" ON public.plans
FOR SELECT TO authenticated
USING (get_my_role() = 'admin');

-- Política: Admins podem criar planos
CREATE POLICY "Admins can create plans" ON public.plans
FOR INSERT TO authenticated
WITH CHECK (get_my_role() = 'admin');

-- Política: Admins podem atualizar planos
CREATE POLICY "Admins can update plans" ON public.plans
FOR UPDATE TO authenticated
USING (get_my_role() = 'admin');

-- Política: Admins podem deletar planos
CREATE POLICY "Admins can delete plans" ON public.plans
FOR DELETE TO authenticated
USING (get_my_role() = 'admin');

-- Política: Personal trainers podem ver planos ativos
CREATE POLICY "Personal trainers can view active plans" ON public.plans
FOR SELECT TO authenticated
USING (ativo = TRUE AND get_my_role() = 'personal');

-- Política: Usuários anônimos podem ver planos ativos e visíveis na landing
CREATE POLICY "Anon can view active plans" ON public.plans
FOR SELECT
USING (ativo = TRUE AND visivel_landing = TRUE);

-- Verificar se RLS está habilitado
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'plans';
