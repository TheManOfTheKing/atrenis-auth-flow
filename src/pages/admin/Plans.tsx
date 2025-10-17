import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables, Enums } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Power, Trash2, CheckCircle2, XCircle, Copy, Users, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  usePlans,
  useTogglePlanStatus,
  useDeletePlan,
  useDuplicatePlan,
  useUpdatePlanOrder,
  useCountPersonalsWithPlan
} from "@/hooks/usePlans";
import PlanFormDialog from "@/components/admin/PlanFormDialog";
import PersonalsWithPlanDialog from "@/components/admin/PersonalsWithPlanDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Plan = Tables<'plans'>;

export default function AdminPlans() {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<string>("all"); // 'all', 'true', 'false'
  const [filterType, setFilterType] = useState<string>("all"); // 'all', 'publico', 'vitalicio'
  const [sortBy, setSortBy] = useState<string>("ordem_exibicao_asc"); // Default sort by display order
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | undefined>(undefined);

  const [isPersonalsDialogOpen, setIsPersonalsDialogOpen] = useState(false);
  const [selectedPlanForPersonals, setSelectedPlanForPersonals] = useState<{ id: string; name: string } | null>(null);

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
    tipo: filterType === "all" ? null : (filterType as Enums<'plan_type'>),
    sortBy: sortBy as any,
  });

  const togglePlanStatusMutation = useTogglePlanStatus();
  const deletePlanMutation = useDeletePlan();
  const duplicatePlanMutation = useDuplicatePlan();
  const updatePlanOrderMutation = useUpdatePlanOrder();

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

  const handleDeletePlan = (plan: Plan) => {
    if (window.confirm(`Tem certeza que deseja excluir o plano "${plan.nome}"? Esta ação é irreversível e só é possível se não houver personal trainers associados a ele.`)) {
      deletePlanMutation.mutate(plan.id);
    }
  };

  const handleDuplicatePlan = (planId: string) => {
    duplicatePlanMutation.mutate(planId);
  };

  const handleViewPersonals = (plan: Plan) => {
    setSelectedPlanForPersonals({ id: plan.id, name: plan.nome });
    setIsPersonalsDialogOpen(true);
  };

  const handleMovePlan = (planId: string, direction: 'up' | 'down') => {
    if (!plans) return;

    const currentPlanIndex = plans.findIndex(p => p.id === planId);
    if (currentPlanIndex === -1) return;

    const currentPlan = plans[currentPlanIndex];
    let newOrder = currentPlan.ordem_exibicao || 0;

    if (direction === 'up') {
      if (currentPlanIndex === 0) return; // Already at the top
      const prevPlan = plans[currentPlanIndex - 1];
      newOrder = (prevPlan.ordem_exibicao || 0) - 1;
    } else { // direction === 'down'
      if (currentPlanIndex === plans.length - 1) return; // Already at the bottom
      const nextPlan = plans[currentPlanIndex + 1];
      newOrder = (nextPlan.ordem_exibicao || 0) + 1;
    }
    updatePlanOrderMutation.mutate({ id: planId, newOrder });
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

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

        <Select onValueChange={setFilterType} value={filterType}>
          <SelectTrigger className="col-span-full md:col-span-1">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="publico">Público</SelectItem>
            <SelectItem value="vitalicio">Vitalício</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={setSortBy} value={sortBy}>
          <SelectTrigger className="col-span-full md:col-span-1">
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ordem_exibicao_asc">Ordem de Exibição</SelectItem>
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
                <TableHead>Tipo</TableHead>
                <TableHead>Preço Mensal</TableHead>
                <TableHead>Preço Anual</TableHead>
                <TableHead>Max Alunos</TableHead>
                <TableHead>Visível Landing</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
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
                <TableHead>Tipo</TableHead>
                <TableHead>Preço Mensal</TableHead>
                <TableHead>Preço Anual</TableHead>
                <TableHead>Max Alunos</TableHead>
                <TableHead>Visível Landing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan, index) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.nome}</TableCell>
                  <TableCell>
                    <Badge
                      className={`
                        ${plan.tipo === 'publico' && 'bg-secondary-blue text-white'}
                        ${plan.tipo === 'vitalicio' && 'bg-primary-yellow text-primary-dark'}
                      `}
                    >
                      {plan.tipo?.charAt(0).toUpperCase() + plan.tipo?.slice(1) || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>R$ {plan.preco_mensal.toFixed(2)}</TableCell>
                  <TableCell>{plan.preco_anual ? `R$ ${plan.preco_anual.toFixed(2)}` : '-'}</TableCell>
                  <TableCell>{plan.max_alunos === 0 ? 'Ilimitado' : plan.max_alunos}</TableCell>
                  <TableCell>
                    <Badge variant={plan.visivel_landing ? "default" : "destructive"}>
                      {plan.visivel_landing ? "Sim" : "Não"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.ativo ? "default" : "outline"}>
                      {plan.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicatePlan(plan.id)} disabled={duplicatePlanMutation.isPending}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewPersonals(plan)}>
                          <Users className="mr-2 h-4 w-4" /> Ver Personals
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(plan.id, plan.ativo || false)}
                          disabled={togglePlanStatusMutation.isPending}
                          className={plan.ativo ? "text-destructive" : "text-green-600"}
                        >
                          {plan.ativo ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                          {plan.ativo ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeletePlan(plan)}
                          disabled={deletePlanMutation.isPending}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Deletar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleMovePlan(plan.id, 'up')} disabled={index === 0 || updatePlanOrderMutation.isPending}>
                          <ArrowUp className="mr-2 h-4 w-4" /> Mover para Cima
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMovePlan(plan.id, 'down')} disabled={index === plans.length - 1 || updatePlanOrderMutation.isPending}>
                          <ArrowDown className="mr-2 h-4 w-4" /> Mover para Baixo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {selectedPlanForPersonals && (
        <PersonalsWithPlanDialog
          isOpen={isPersonalsDialogOpen}
          onClose={() => setIsPersonalsDialogOpen(false)}
          planId={selectedPlanForPersonals.id}
          planName={selectedPlanForPersonals.name}
        />
      )}
    </div>
  );
}