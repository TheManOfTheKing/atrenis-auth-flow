-- Função auxiliar para obter o role do usuário autenticado
-- Esta função é usada pelas políticas RLS para verificar permissões

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION public.get_my_role() IS 'Retorna o role do usuário autenticado atual. Usado pelas políticas RLS.';

