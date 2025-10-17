# ✅ SCRIPT DEFINITIVO - Estrutura da Tela "Criar Novo Exercício"

## 🎯 Objetivo:

Manter **exatamente** a estrutura da tela "Criar Novo Exercício" que você mostrou, garantindo que a tabela `exercicios` tenha todos os campos necessários.

## 📋 Estrutura da Tela "Criar Novo Exercício":

### **Campos Obrigatórios:**
- ✅ **Nome do Exercício** (obrigatório)
- ✅ **Grupo Muscular** (obrigatório)

### **Campos Opcionais:**
- ✅ **Descrição** (opcional)
- ✅ **Equipamento** (opcional)
- ✅ **Dificuldade** (opcional)
- ✅ **URL do Vídeo** (opcional)
- ✅ **URL da Imagem** (opcional)

## ✅ Script Completo Criado:

O arquivo `YYYYMMDDHHMMSS_ensure_exercicios_structure.sql` garante que a tabela `exercicios` tenha **exatamente** essa estrutura:

### **1. Campos da Tela Mantidos:**
```sql
-- Campos obrigatórios
nome TEXT NOT NULL                    -- Nome do Exercício
grupo_muscular TEXT NOT NULL          -- Grupo Muscular

-- Campos opcionais
descricao TEXT                        -- Descrição
equipamento TEXT                      -- Equipamento
dificuldade TEXT                      -- Dificuldade
video_url TEXT                        -- URL do Vídeo
imagem_url TEXT                       -- URL da Imagem
```

### **2. Campos Técnicos Adicionados:**
```sql
-- Campos necessários para o código funcionar
personal_id UUID                      -- ID do personal trainer (renomeado de criado_por_personal_id)
publico BOOLEAN DEFAULT FALSE         -- Se é exercício público ou privado
created_at TIMESTAMP WITH TIME ZONE   -- Data de criação
updated_at TIMESTAMP WITH TIME ZONE   -- Data de atualização
```

### **3. Recursos Implementados:**
- ✅ **Políticas RLS** para segurança
- ✅ **RPC function `search_exercicios`** para busca
- ✅ **Tabelas relacionadas** (treinos, treino_exercicios)
- ✅ **Exercícios de exemplo** inseridos
- ✅ **Comentários explicativos** em cada campo

## 🚀 **Como Executar:**

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
3. **Preencha o formulário** com os dados:
   - **Nome do Exercício**: "Supino Reto" (obrigatório)
   - **Grupo Muscular**: "Peito" (obrigatório)
   - **Descrição**: "Como executar você sabe" (opcional)
   - **Equipamento**: "Barra" (opcional)
   - **Dificuldade**: "Intermediário" (opcional)
   - **URL do Vídeo**: "https://youtube.com/watch?v=..." (opcional)
   - **URL da Imagem**: "https://exemplo.com/imagem.jpg" (opcional)
4. ✅ **Clique em "Criar Exercício"** - deve funcionar perfeitamente!

## 📋 **Verificações que o Script Faz:**

- ✅ **Estrutura da tela mantida** - todos os campos da interface
- ✅ **Campos obrigatórios** - nome e grupo_muscular como NOT NULL
- ✅ **Campos opcionais** - descrição, equipamento, dificuldade, URLs
- ✅ **Políticas RLS** - segurança configurada
- ✅ **RPC function** - busca funcionando
- ✅ **Tabelas relacionadas** - integridade garantida
- ✅ **Dados existentes** - preservados e atualizados

## 🔧 **Se Ainda Houver Problemas:**

1. **Verifique os logs** no Supabase Dashboard
2. **Confirme que a coluna `publico`** foi adicionada
3. **Confirme que `criado_por_personal_id`** foi renomeada para `personal_id`
4. **Teste a RPC function** executando: `SELECT * FROM search_exercicios();`
5. **Me informe** o erro específico

---

**ESTE SCRIPT MANTÉM EXATAMENTE A ESTRUTURA DA TELA! Execute e teste!** 🎉
