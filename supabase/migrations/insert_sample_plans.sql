-- Script para inserir dados de exemplo na tabela plans
-- Execute este script no Supabase SQL Editor se a tabela estiver vazia

-- Verificar se a tabela está vazia
DO $$
BEGIN
    -- Verificar se existem planos
    IF NOT EXISTS (SELECT 1 FROM public.plans LIMIT 1) THEN
        RAISE NOTICE 'Inserindo planos de exemplo...';
        
        -- Inserir planos de exemplo
        INSERT INTO public.plans (
            id,
            nome,
            descricao,
            tipo,
            preco_mensal,
            preco_anual,
            max_alunos,
            recursos,
            ativo,
            visivel_landing,
            ordem_exibicao,
            created_at,
            updated_at
        ) VALUES
        (
            gen_random_uuid(),
            'Plano Básico',
            'Acesso essencial para começar a treinar com personal trainer.',
            'publico',
            97.00,
            970.00,
            50,
            '["Acesso a 10 treinos", "Suporte via chat", "Acompanhamento básico"]'::jsonb,
            true,
            true,
            1,
            NOW(),
            NOW()
        ),
        (
            gen_random_uuid(),
            'Plano Premium',
            'Tudo que você precisa para levar seu treino ao próximo nível.',
            'publico',
            147.00,
            1470.00,
            150,
            '["Acesso ilimitado a treinos", "Suporte prioritário", "Criação de treinos personalizados", "Análise de performance"]'::jsonb,
            true,
            true,
            2,
            NOW(),
            NOW()
        ),
        (
            gen_random_uuid(),
            'Plano Vitalício',
            'Acesso ilimitado e para sempre. Ideal para personal trainers estabelecidos.',
            'vitalicio',
            0.00,
            NULL,
            0,
            '["Acesso vitalício a todos os recursos", "Prioridade em novas funcionalidades", "Suporte VIP", "Consultoria personalizada"]'::jsonb,
            true,
            false,
            0,
            NOW(),
            NOW()
        ),
        (
            gen_random_uuid(),
            'Plano Estudante',
            'Plano especial com desconto para estudantes de educação física.',
            'publico',
            67.00,
            670.00,
            30,
            '["Acesso a treinos básicos", "Material didático", "Suporte educacional"]'::jsonb,
            true,
            true,
            3,
            NOW(),
            NOW()
        ),
        (
            gen_random_uuid(),
            'Plano Corporativo',
            'Solução completa para academias e centros de treinamento.',
            'publico',
            297.00,
            2970.00,
            500,
            '["Gestão de múltiplos personal trainers", "Relatórios avançados", "Suporte dedicado", "Integração com sistemas"]'::jsonb,
            true,
            true,
            4,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Planos de exemplo inseridos com sucesso!';
    ELSE
        RAISE NOTICE 'A tabela plans já contém dados. Nenhum plano foi inserido.';
    END IF;
END $$;
