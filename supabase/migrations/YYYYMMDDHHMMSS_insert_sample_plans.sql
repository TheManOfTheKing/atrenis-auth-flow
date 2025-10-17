-- Inserir planos de exemplo para teste
-- Verificar se já existem planos antes de inserir
DO $$
BEGIN
  -- Inserir apenas se não houver planos existentes
  IF NOT EXISTS (SELECT 1 FROM public.plans LIMIT 1) THEN
    -- Plano Básico
    INSERT INTO public.plans (
      nome, 
      descricao, 
      preco_mensal, 
      preco_anual, 
      max_alunos, 
      recursos, 
      ativo, 
      tipo, 
      visivel_landing, 
      ordem_exibicao
    ) VALUES (
      'Plano Básico',
      'Ideal para personal trainers iniciantes',
      97.00,
      970.00,
      50,
      '["Acesso à biblioteca de treinos", "Relatórios básicos", "Suporte por email"]'::jsonb,
      true,
      'publico',
      true,
      1
    );

    -- Plano Premium
    INSERT INTO public.plans (
      nome, 
      descricao, 
      preco_mensal, 
      preco_anual, 
      max_alunos, 
      recursos, 
      ativo, 
      tipo, 
      visivel_landing, 
      ordem_exibicao
    ) VALUES (
      'Plano Premium',
      'Para personal trainers experientes',
      197.00,
      1970.00,
      200,
      '["Acesso à biblioteca completa", "Relatórios avançados", "Suporte prioritário", "Integração com wearables", "Análise de performance"]'::jsonb,
      true,
      'publico',
      true,
      2
    );

    -- Plano Vitalício
    INSERT INTO public.plans (
      nome, 
      descricao, 
      preco_mensal, 
      preco_anual, 
      max_alunos, 
      recursos, 
      ativo, 
      tipo, 
      visivel_landing, 
      ordem_exibicao
    ) VALUES (
      'Plano Vitalício',
      'Acesso permanente à plataforma',
      0.00,
      0.00,
      0,
      '["Acesso completo à plataforma", "Todos os recursos", "Suporte premium", "Sem limitações"]'::jsonb,
      true,
      'vitalicio',
      false,
      3
    );

    RAISE NOTICE 'Planos de exemplo inseridos com sucesso';
  ELSE
    RAISE NOTICE 'Planos já existem, pulando inserção';
  END IF;
END $$;
