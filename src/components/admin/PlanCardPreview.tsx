import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Users, DollarSign } from 'lucide-react';
import { Tables, Enums } from '@/integrations/supabase/types';

interface PlanCardPreviewProps {
  plan: Partial<Tables<'plans'>>;
}

export default function PlanCardPreview({ plan }: PlanCardPreviewProps) {
  const isVitalicio = plan.tipo === 'vitalicio';
  const precoMensal = plan.preco_mensal || 0;
  const precoAnual = plan.preco_anual || 0;
  const maxAlunos = plan.max_alunos || 0;
  const recursos = (plan.recursos as string[] || []);

  const calculateEconomy = () => {
    if (precoMensal > 0 && precoAnual > 0) {
      const economy = ((precoMensal * 12 - precoAnual) / (precoMensal * 12)) * 100;
      return Math.round(economy);
    }
    return 0;
  };

  const economy = calculateEconomy();

  return (
    <Card className="w-full max-w-sm mx-auto bg-gray-800 border-none text-white relative">
      {plan.visivel_landing && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-yellow text-primary-dark font-bold">
          PREVIEW
        </Badge>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-2xl mb-2">{plan.nome || "Nome do Plano"}</CardTitle>
        <p className="text-gray-400 text-sm">{plan.descricao || "Descrição breve do plano."}</p>
        <div className="mt-4">
          {isVitalicio ? (
            <p className="text-5xl font-black text-primary-yellow mb-2">Vitalício</p>
          ) : (
            <>
              <p className="text-5xl font-black mb-2">R${precoMensal.toFixed(2).replace('.', ',')}</p>
              <p className="text-gray-400 text-sm">por mês</p>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {precoAnual > 0 && !isVitalicio && (
          <div className="text-center text-sm text-gray-300">
            Ou R$ {precoAnual.toFixed(2).replace('.', ',')} / ano (Economize {economy}%)
          </div>
        )}
        <div className="space-y-3">
          {recursos.length > 0 ? (
            recursos.map((recurso, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-secondary-green" />
                <span>{recurso}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm text-center">Nenhum recurso adicionado.</p>
          )}
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-secondary-green" />
            <span>Até {maxAlunos === 0 ? 'ilimitados' : maxAlunos} alunos</span>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Badge variant={plan.ativo ? "default" : "outline"} className="mr-2">
            {plan.ativo ? "Ativo" : "Inativo"}
          </Badge>
          <Badge variant={plan.visivel_landing ? "default" : "outline"}>
            {plan.visivel_landing ? "Visível na Landing" : "Oculto na Landing"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}