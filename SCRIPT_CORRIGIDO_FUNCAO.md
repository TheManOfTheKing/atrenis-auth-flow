# ✅ SCRIPT CORRIGIDO - Erro da Função search_exercicios Resolvido

## 🔍 Problema Identificado:

O erro "cannot change return type of existing function" ocorreu porque a função `search_exercicios` já existia com uma assinatura diferente, e o PostgreSQL não permite alterar o tipo de retorno de uma função existente.

## ✅ Correção Aplicada:

Adicionei comandos para **remover a função existente** antes de recriá-la:

```sql
-- Remover a função search_exercicios existente e recriar com a assinatura correta
DROP FUNCTION IF EXISTS public.search_exercicios(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.search_exercicios;

-- Criar a RPC function search_exercicios (necessária para o hook useExercises)
CREATE OR REPLACE FUNCTION public.search_exercicios(
  search_term TEXT DEFAULT NULL,
  grupo TEXT DEFAULT NULL
)
```

## 🚀 **Como Executar o Script Corrigido:**

### **Via Supabase Dashboard:**
1. Acesse **Supabase Dashboard** → **SQL Editor**
2. Copie **TODO** o conteúdo do arquivo: `supabase/migrations/YYYYMMDDHHMMSS_ensure_exercicios_structure.sql`
3. Cole no SQL Editor
4. Clique em **"Run"**

### **Via Supabase CLI:**
```bash
npx supabase db push
```

## 🧪 **Após Executar:**

1. **Recarregue a página** (Ctrl + F5)
2. **Acesse Treinos** → **Criar Novo Treino** → **Etapa 2** → **"Criar Novo"**
3. **Preencha o formulário:**
   - **Nome do Exercício**: "Supino Reto" (obrigatório)
   - **Grupo Muscular**: "Peito" (obrigatório)
   - **Descrição**: "Como executar você sabe" (opcional)
   - **Equipamento**: "Barra" (opcional)
   - **Dificuldade**: "Intermediário" (opcional)
   - **URL do Vídeo**: "https://youtube.com/watch?v=..." (opcional)
   - **URL da Imagem**: "https://exemplo.com/imagem.jpg" (opcional)
4. ✅ **Clique em "Criar Exercício"** - deve funcionar perfeitamente!

## 📋 **O que o Script Corrigido Faz:**

- ✅ **Remove função existente** com `DROP FUNCTION IF EXISTS`
- ✅ **Recria função com assinatura correta**
- ✅ **Preserva todos os dados existentes**
- ✅ **Adiciona coluna `publico`** (faltava)
- ✅ **Renomeia `criado_por_personal_id` para `personal_id`**
- ✅ **Configura políticas RLS**
- ✅ **Cria tabelas relacionadas** se necessário

## 🔧 **Se Ainda Houver Problemas:**

1. **Verifique os logs** no Supabase Dashboard
2. **Confirme que a função foi recriada** executando: `SELECT * FROM search_exercicios();`
3. **Confirme que as colunas** foram adicionadas na aba "Table Editor"
4. **Me informe** o erro específico

---

**O script está corrigido e deve funcionar perfeitamente! Execute e teste!** 🎉
