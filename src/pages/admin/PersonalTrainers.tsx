import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables, Enums } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, Download, DollarSign, Edit, ListChecks, PlusCircle, Power, Trash2, MoreHorizontal, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


// Novos hooks e componentes
import { useAdminPersonalTrainers, PersonalTrainerAdminView } from "@/hooks/useAdminPersonalTrainers";
import { usePlans } from "@/hooks/usePlans"; // Para popular o filtro de planos
import { useDeletePersonalByAdmin } from "@/hooks/usePersonalAdminCrud";
import AssignPlanToPersonalDialog from "@/components/admin/AssignPlanToPersonalDialog";
import AlunosPagination from "@/components/personal/AlunosPagination"; // Reutilizando o componente de paginação
import PersonalFormDialog from "@/components/admin/PersonalFormDialog";
import PersonalStatusDialogAdmin from "@/components/admin/PersonalStatusDialogAdmin";

const ITEMS_PER_PAGE = 10;

export default function PersonalTrainers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Enums<'subscription_status'> | null>(null);
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [adminId, setAdminId] = useState<string | null>(null); // To ensure only admin can access

  const [isAssignPlanDialogOpen, setIsAssignPlanDialogOpen] = useState(false);
  const [selectedPersonalForPlan, setSelectedPersonalForPlan] = useState<PersonalTrainerAdminView | null>(null);

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false); // Para criar/editar personal
  const [selectedPersonalForEdit, setSelectedPersonalForEdit] = useState<PersonalTrainerAdminView | null>(null);

  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedPersonalForStatus, setSelectedPersonalForStatus] = useState<PersonalTrainerAdminView | null>(null);
  const [statusActionType, setStatusActionType] = useState<'deactivate' | 'reactivate'>('deactivate');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // In a real app, you'd verify the user's role here
        setAdminId(user.id); 
      } else {
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  const { personalTrainers, totalPersonalTrainers, totalPages, isLoading, error } = useAdminPersonalTrainers({
    searchTerm,
    planFilter,
    statusFilter,
    sortBy,
    currentPage,
  });

  const { data: allPlans, isLoading: isLoadingAllPlans } = usePlans({ ativo: null }); // Fetch all plans for filter
  const deletePersonalMutation = useDeletePersonalByAdmin();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleViewDetails = (id: string) => {
    navigate(`/admin/personal-trainers/${id}`);
  };

  const handleNewPersonal = () => {
    setSelectedPersonalForEdit(null);
    setIsFormDialogOpen(true);
  };

  const handleEditPersonal = (personal: PersonalTrainerAdminView) => {
    setSelectedPersonalForEdit(personal);
    setIsFormDialogOpen(true);
  };

  const handleAssignPlan = (personal: PersonalTrainerAdminView) => {
    setSelectedPersonalForPlan(personal);
    setIsAssignPlanDialogOpen(true);
  };

  const handleToggleStatus = (personal: PersonalTrainerAdminView) => {
    setSelectedPersonalForStatus(personal);
    setStatusActionType(personal.ativo ? 'deactivate' : 'reactivate');
    setIsStatusDialogOpen(true);
  };

  const handleDeletePersonal = (personal: PersonalTrainerAdminView) => {
    if (window.confirm(`Tem certeza que deseja deletar o personal trainer ${personal.nome}? Esta ação é irreversível e só é possível se ele não tiver alunos ativos.`)) {
      deletePersonalMutation.mutate(personal.id);
    }
  };

  const handleExportCSV = () => {
    if (!personalTrainers || personalTrainers.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: "Nenhum dado de personal trainer para exportar.",
      });
      return;
    }

    const headers = [
      'Nome', 'Email', 'CREF', 'Plano Atual', 'Status Assinatura', 'Desconto (%)',
      'Data Assinatura', 'Data Vencimento', 'Alunos Ativos', 'Data de Cadastro'
    ];
    const rows = personalTrainers.map(personal => [
      personal.nome,
      personal.email,
      personal.cref || '-',
      personal.plan_nome || 'Nenhum',
      personal.status_assinatura || 'Pendente',
      personal.desconto_percentual || 0,
      personal.data_assinatura ? format(new Date(personal.data_assinatura), "dd/MM/yyyy", { locale: ptBR }) : '-',
      personal.data_vencimento ? format(new Date(personal.data_vencimento), "dd/MM/yyyy", { locale: ptBR }) : '-',
      personal.total_alunos || 0,
      format(new Date(personal.created_at), "dd/MM/yyyy", { locale: ptBR })
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(field => `"${field}"`).join(',') + '\n'; // Wrap fields in quotes to handle commas
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `atrenis_personal_trainers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Exportação concluída!",
      description: "Dados dos personal trainers exportados com sucesso para CSV.",
    });
  };

  if (error) {
    return <div className="text-destructive">Erro ao carregar personal trainers: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Personal Trainers</h1>
          <p className="text-muted-foreground">Gerencie todos os personal trainers da plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90 gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={handleNewPersonal} className="bg-secondary-blue text-white hover:bg-secondary-blue/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Personal Trainer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="relative col-span-full md:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar personal trainer por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select onValueChange={(value) => setPlanFilter(value === "all" ? null : value)} value={planFilter || "all"}>
          <SelectTrigger className="col-span-full md:col-span-1">
            <SelectValue placeholder="Filtrar por plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Planos</SelectItem>
            <SelectItem value="none">Sem Plano</SelectItem>
            {isLoadingAllPlans ? (
              <SelectItem value="loading-plans" disabled>Carregando planos...</SelectItem>
            ) : (
              allPlans?.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>{plan.nome}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => setStatusFilter(value === "all" ? null : value as Enums<'subscription_status'>)} value={statusFilter || "all"}>
          <SelectTrigger className="col-span-full md:col-span-1">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="ativa">Ativa</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
            <SelectItem value="vencida">Vencida</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={setSortBy} value={sortBy}>
          <SelectTrigger className="col-span-full md:col-span-1">
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at_desc">Mais Recentes</SelectItem>
            <SelectItem value="created_at_asc">Mais Antigos</SelectItem>
            <SelectItem value="nome_asc">Nome (A-Z)</SelectItem>
            <SelectItem value="nome_desc">Nome (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && !personalTrainers.length ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Personal</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plano Atual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Alunos</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : personalTrainers && personalTrainers.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Personal</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plano Atual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Alunos</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personalTrainers.map((personal) => (
                <TableRow key={personal.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary-yellow text-primary-dark">
                          {getInitials(personal.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{personal.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>{personal.email}</TableCell>
                  <TableCell>
                    {personal.plan_nome || <Badge variant="outline">Nenhum</Badge>}
                    {personal.desconto_percentual && personal.desconto_percentual > 0 && (
                      <Badge variant="secondary" className="ml-2">{personal.desconto_percentual}% OFF</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {personal.status_assinatura ? (
                      <Badge
                        className={`
                          ${personal.status_assinatura === 'ativa' && 'bg-secondary-green text-white'}
                          ${personal.status_assinatura === 'vencida' && 'bg-secondary-red text-white'}
                          ${personal.status_assinatura === 'trial' && 'bg-secondary-blue text-white'}
                          ${personal.status_assinatura === 'cancelada' && 'bg-gray-400 text-white'}
                          ${personal.status_assinatura === 'pendente' && 'bg-gray-600 text-white'}
                        `}
                      >
                        {personal.status_assinatura.charAt(0).toUpperCase() + personal.status_assinatura.slice(1)}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {personal.total_alunos} {personal.plan_max_alunos !== null && personal.plan_max_alunos > 0 && ` / ${personal.plan_max_alunos}`}
                  </TableCell>
                  <TableCell>
                    {personal.data_vencimento ? format(new Date(personal.data_vencimento), "dd/MM/yyyy", { locale: ptBR }) : '-'}
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
                        <DropdownMenuItem onClick={() => handleViewDetails(personal.id)}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditPersonal(personal)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAssignPlan(personal)}>
                          <ListChecks className="mr-2 h-4 w-4" /> Atribuir Plano
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className={personal.ativo ? "text-destructive" : "text-green-600"}
                          onClick={() => handleToggleStatus(personal)}
                        >
                          {personal.ativo ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                          {personal.ativo ? 'Desativar Personal' : 'Ativar Personal'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeletePersonal(personal)}
                          disabled={deletePersonalMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Deletar Personal
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
        <p className="text-muted-foreground text-center">Nenhum personal trainer encontrado.</p>
      )}

      <AlunosPagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />
      <p className="text-sm text-muted-foreground text-center mt-4">
        Total de personal trainers: {totalPersonalTrainers}
      </p>

      {selectedPersonalForPlan && (
        <AssignPlanToPersonalDialog
          isOpen={isAssignPlanDialogOpen}
          onClose={() => setIsAssignPlanDialogOpen(false)}
          personal={selectedPersonalForPlan}
        />
      )}

      <PersonalFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        personal={selectedPersonalForEdit}
      />

      {selectedPersonalForStatus && (
        <PersonalStatusDialogAdmin
          isOpen={isStatusDialogOpen}
          onClose={() => setIsStatusDialogOpen(false)}
          personal={selectedPersonalForStatus}
          actionType={statusActionType}
        />
      )}
    </div>
  );
}