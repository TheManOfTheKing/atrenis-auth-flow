import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify if the caller is an admin
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ success: false, error: 'Acesso negado: apenas administradores podem criar personal trainers' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { email, nome, telefone, cref, plan_id, desconto_percentual, periodo } = await req.json()

    if (!email || !nome) {
      return new Response(JSON.stringify({ success: false, error: 'Email e nome são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const tempPassword = `Atrenis${Math.floor(Math.random() * 10000)}`

    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { nome, role: 'personal' }
    })

    if (createUserError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: createUserError.message.includes('already') ? 'Email já cadastrado' : createUserError.message 
      }), {
        status: createUserError.message.includes('already') ? 409 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!newUser.user) {
      return new Response(JSON.stringify({ success: false, error: 'Erro ao criar usuário' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Handle plan assignment if provided
    let dataAssinatura = null;
    let dataVencimento = null;
    let statusAssinatura = 'pendente';
    let planoVitalicio = false;

    if (plan_id && periodo && periodo !== 'none') {
      const { data: planData, error: planError } = await supabaseAdmin
        .from('plans')
        .select('preco_mensal, preco_anual, max_alunos, tipo')
        .eq('id', plan_id)
        .single();

      if (planError || !planData) {
        console.error("Error fetching plan data for new personal:", planError?.message);
      } else {
        dataAssinatura = new Date().toISOString();
        if (planData.tipo === 'vitalicio') {
          planoVitalicio = true;
          statusAssinatura = 'vitalicia';
          // Para planos vitalícios, data_vencimento pode ser null ou uma data muito distante
          dataVencimento = null; // Ou new Date(9999, 11, 31).toISOString();
        } else if (periodo === 'mensal') {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          dataVencimento = nextMonth.toISOString();
          statusAssinatura = 'ativa';
        } else if (periodo === 'anual') {
          const nextYear = new Date();
          nextYear.setFullYear(nextYear.getFullYear() + 1);
          dataVencimento = nextYear.toISOString();
          statusAssinatura = 'ativa';
        }
      }
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        email,
        nome,
        role: 'personal',
        telefone: telefone || null,
        cref: cref || null,
        plan_id: plan_id || null,
        desconto_percentual: desconto_percentual || 0,
        data_assinatura: dataAssinatura,
        data_vencimento: dataVencimento,
        status_assinatura: statusAssinatura,
        plano_vitalicio: planoVitalicio,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      } catch (e) {}
      
      return new Response(JSON.stringify({ success: false, error: 'Erro ao criar perfil' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      personal_id: newUser.user.id,
      email,
      temp_password: tempPassword,
      message: 'Personal trainer criado com sucesso. Forneça a senha temporária ao personal.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro inesperado' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})