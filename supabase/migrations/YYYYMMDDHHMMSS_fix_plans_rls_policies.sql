-- Corrigir políticas RLS da tabela plans
-- Remover políticas antigas que podem estar causando problemas
DROP POLICY IF EXISTS "Admins can view all plans" ON public.plans;
DROP POLICY IF EXISTS "Admins can create plans" ON public.plans;
DROP POLICY IF EXISTS "Admins can update plans" ON public.plans;
DROP POLICY IF EXISTS "Admins can delete plans" ON public.plans;
DROP POLICY IF EXISTS "Personal trainers can view active plans" ON public.plans;
DROP POLICY IF EXISTS "Anon can view active plans" ON public.plans;

-- Criar políticas RLS mais robustas para plans
-- Política para admins visualizarem todos os planos
CREATE POLICY "Admins can view all plans" ON public.plans
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política para admins criarem planos
CREATE POLICY "Admins can create plans" ON public.plans
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política para admins atualizarem planos
CREATE POLICY "Admins can update plans" ON public.plans
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política para admins deletarem planos
CREATE POLICY "Admins can delete plans" ON public.plans
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Política para personal trainers visualizarem planos ativos
CREATE POLICY "Personal trainers can view active plans" ON public.plans
FOR SELECT TO authenticated
USING (
  ativo = TRUE 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'personal'
  )
);

-- Política para usuários anônimos visualizarem planos ativos e visíveis na landing
CREATE POLICY "Anon can view active and visible plans" ON public.plans
FOR SELECT
USING (ativo = TRUE AND visivel_landing = TRUE);

-- Garantir que a tabela plans tenha RLS habilitado
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Comentários para documentação
COMMENT ON POLICY "Admins can view all plans" ON public.plans IS 'Permite que administradores visualizem todos os planos';
COMMENT ON POLICY "Admins can create plans" ON public.plans IS 'Permite que administradores criem novos planos';
COMMENT ON POLICY "Admins can update plans" ON public.plans IS 'Permite que administradores atualizem planos existentes';
COMMENT ON POLICY "Admins can delete plans" ON public.plans IS 'Permite que administradores deletem planos';
COMMENT ON POLICY "Personal trainers can view active plans" ON public.plans IS 'Permite que personal trainers visualizem apenas planos ativos';
COMMENT ON POLICY "Anon can view active and visible plans" ON public.plans IS 'Permite que usuários anônimos visualizem planos ativos e visíveis na landing page';
