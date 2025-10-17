-- Adicionar valor 'vitalicia' ao enum subscription_status
-- Este valor é necessário para planos vitalícios

-- Adicionar o valor 'vitalicia' ao enum subscription_status se não existir
DO $$ 
BEGIN
    -- Verificar se o valor 'vitalicia' já existe no enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'vitalicia' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_status')
    ) THEN
        -- Adicionar o valor 'vitalicia' ao enum
        ALTER TYPE public.subscription_status ADD VALUE 'vitalicia';
    END IF;
END $$;

-- Comentário explicativo
COMMENT ON TYPE public.subscription_status IS 'Status da assinatura: ativa, cancelada, vencida, trial, pendente, vitalicia';
