-- Corrigir função get_my_role para ser mais robusta
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role_value user_role;
BEGIN
  -- Verificar se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Buscar o role do usuário na tabela profiles
  SELECT role INTO user_role_value
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Retornar o role encontrado ou 'aluno' como padrão
  RETURN COALESCE(user_role_value, 'aluno'::user_role);
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, retornar NULL
    RETURN NULL;
END;
$$;

-- Comentário para documentação
COMMENT ON FUNCTION public.get_my_role() IS 'Retorna o role do usuário autenticado ou NULL se não encontrado';
