# ✅ CORREÇÃO DO ERRO - Tabela exercicios não existe

## 🔍 Problema Identificado:

O erro "Could not find the 'dificuldade' column of 'exercicios' in the schema cache" ocorre porque **a tabela `exercicios` não existe no banco de dados Supabase**.

## ✅ Solução Aplicada:

Criei uma migração completa para criar a tabela `exercicios` com todas as colunas necessárias:

### **Estrutura da Tabela:**
```sql
CREATE TABLE public.exercicios (
  id UUID PRIMARY KEY,
  personal_id UUID REFERENCES profiles(id),
  nome TEXT NOT NULL,
  descricao TEXT,
  grupo_muscular TEXT NOT NULL,
  equipamento TEXT,
  dificuldade TEXT,           -- ✅ Coluna que estava faltando
  video_url TEXT,
  imagem_url TEXT,
  publico BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### **Recursos Incluídos:**
- ✅ **Todas as colunas** necessárias para o formulário
- ✅ **Políticas RLS** para segurança
- ✅ **Exercícios públicos** de exemplo
- ✅ **Comentários** explicativos

## 🚀 **Como Executar a Migração:**

### **Opção 1: Via Supabase Dashboard (Recomendado)**
1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo do arquivo: `supabase/migrations/YYYYMMDDHHMMSS_create_exercicios_table.sql`
4. Clique em **"Run"**

### **Opção 2: Via Supabase CLI**
```bash
npx supabase db push
```

## 🧪 **Após Executar a Migração:**

1. **Recarregue a página** (Ctrl + F5)
2. **Acesse Treinos** → **Criar Novo Treino** → **Etapa 2** → **"Criar Novo"**
3. **Preencha o formulário** com os dados:
   - Nome: "Supino Reto"
   - Grupo Muscular: "Peito"
   - Descrição: "Como executar você sabe"
   - Equipamento: "Barra"
   - Dificuldade: "Intermediário"
   - URLs: opcionais
4. ✅ **Clique em "Criar Exercício"** - deve funcionar sem erro!

## 📋 **Funcionalidades que Funcionarão:**

- ✅ **Criar exercícios personalizados**
- ✅ **Buscar exercícios** (públicos + pessoais)
- ✅ **Adicionar exercícios aos treinos**
- ✅ **Configurar séries, repetições, carga**
- ✅ **Reordenar exercícios** (drag & drop)

## 🔧 **Se Ainda Houver Problemas:**

1. **Verifique se a migração foi executada** no Supabase Dashboard
2. **Confirme que a tabela `exercicios` existe** na aba "Table Editor"
3. **Me informe** se ainda há erros

---

**Execute a migração e teste novamente!** 🎉
