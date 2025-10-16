import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Power, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { usePlans, useTogglePlanStatus, useDeletePlan } from "@/hooks/usePlans";
import PlanFormDialog from "@/components/admin/PlanFormDialog";

type Plan = Tables<'plans'>;

export default function AdminPlans() {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<string>("all"); // 'all', 'true', 'false'
  const [sortBy, setSortBy] = useState<string>("nome_asc"); // 'nome_asc', 'preco_mensal_asc', etc.
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | undefined>(undefined);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Em uma aplicação real, você verificaria a role do usuário aqui
        setAdminId(user.id);
      } else {
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  const { data: plans, isLoading, error } = usePlans({
    ativo: filterActive === "all" ? null : filterActive === "true",
    sortBy: sortBy as any, // Cast para o tipo correto
  });

  const togglePlanStatusMutation = useTogglePlanStatus();
  const deletePlanMutation = useDeletePlan();

  const handleNewPlan = () => {
    setSelectedPlan(undefined);
    setIsFormDialogOpen(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsFormDialogOpen(true);
  };

  const handleToggleStatus = (planId: string, currentStatus: boolean) => {
    togglePlanStatusMutation.mutate({ id: planId, ativo: !currentStatus });
  };

  const handleDeletePlan = (planId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este plano? Esta ação é irreversível.")) {
      deletePlanMutation.mutate(planId);
    }
  };

  if (error) {
    return <div className="text-destructive">Erro ao carregar planos: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Planos</h1>
          <p className="text-muted-foreground">Crie e gerencie os planos de assinatura da plataforma.</p>
        </div>
        <Button onClick={handleNewPlan} className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90">
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Plano
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select onValueChange={setFilterActive} value={filterActive}>
          <SelectTrigger className="col-span-full md:col-span-1">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="true">Apenas Ativos</SelectItem>
            <SelectItem value="false">Apenas Inativos</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={setSortBy} value={sortBy}>
          <SelectTrigger className="col-span-full md:col-span-1">
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nome_asc">Nome (A-Z)</SelectItem>
            <SelectItem value="nome_desc">Nome (Z-A)</SelectItem>
            <SelectItem value="preco_mensal_asc">Preço Mensal (Crescente)</SelectItem>
            <SelectItem value="preco_mensal_desc">Preço Mensal (Decrescente)</SelectItem>
            <SelectItem value="created_at_desc">Mais Recentes</SelectItem>
            <SelectItem value="created_at_asc">Mais Antigos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço Mensal</TableHead>
                <TableHead>Preço Anual</TableHead>
                <TableHead>Max Alunos</TableHead>
                <TableHead>Recursos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço Mensal</TableHead>
                <TableHead>Preço Anual</TableHead>
                <TableHead>Max Alunos</TableHead>
                <TableHead>Recursos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.nome}</TableCell>
                  <TableCell>R$ {plan.preco_mensal.toFixed(2)}</TableCell>
                  <TableCell>{plan.preco_anual ? `R$ ${plan.preco_anual.toFixed(2)}` : '-'}</TableCell>
                  <TableCell>{plan.max_alunos === 0 ? 'Ilimitado' : plan.max_alunos}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(plan.recursos as string[] || []).map((recurso, idx) => (
                        <Badge key={idx} variant="secondary" className="whitespace-nowrap">{recurso}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.ativo ? "default" : "outline"}>
                      {plan.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditPlan(plan)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(plan.id, plan.ativo || false)}
                        disabled={togglePlanStatusMutation.isPending}
                      >
                        {plan.ativo ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(plan.id)} disabled={deletePlanMutation.isPending}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-muted-foreground text-center">Nenhum plano encontrado.</p>
      )}

      <PlanFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        plan={selectedPlan}
      />
    </div>
  );
}