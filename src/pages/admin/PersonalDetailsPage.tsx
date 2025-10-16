import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail, Phone, CalendarDays, Target, User, Dumbbell, Clock, Edit, Power, Trash2, ArrowLeft, ListChecks,
  Users as UsersIcon, Activity, TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

import { usePersonalDetailsAdmin, PersonalTrainerAdminView } from "@/hooks/useAdminPersonalTrainers";
import { usePersonalStats } from "@/hooks/usePersonalStats"; // Reutilizando hook de stats do personal
import { usePersonalStudents } from "@/hooks/usePersonalStudents"; // Reutilizando hook de alunos do personal
import AssignPlanToPersonalDialog from "@/components/admin/AssignPlanToPersonalDialog";
import PersonalFormDialog from "@/components/admin/PersonalFormDialog";
import PersonalStatusDialogAdmin from "@/components/admin/PersonalStatusDialogAdmin";
import { useDeletePersonalByAdmin } from "@/hooks/usePersonalAdminCrud";

export default function PersonalDetailsPage() {
  const { id: personalId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState<string | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignPlanDialogOpen, setIsAssignPlanDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusActionType, setStatusActionType] = useState<'deactivate' | 'reactivate'>('deactivate');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAdminId(user.id);
      } else {
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  const { data: personal, isLoading: isLoadingPersonal, error: personalError } = usePersonalDetailsAdmin(personalId);
  // NOTE: usePersonalStats uses auth.uid(), so it will fetch stats for the *admin* user, not the personal being viewed.
  // A new RPC function would be needed to fetch stats for a specific personal by ID.
  // For now, we'll use placeholders for these stats.
  // const { data: stats, isLoading: isLoadingStats, error: statsError } = usePersonalStats(); 
  const { alunos, isLoading: isLoadingStudents, error: studentsError } = usePersonalStudents(personalId);

  const deletePersonalMutation = useDeletePersonalByAdmin();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleAssignPlan = () => {
    setIsAssignPlanDialogOpen(true);
  };

  const handleToggleStatus = () => {
    if (!personal) return;
    setStatusActionType(personal.ativo ? 'deactivate' : 'reactivate');
    setIsStatusDialogOpen(true);
  };

  const handleDelete = () => {
    if (!personal) return;
    if (window.confirm(`Tem certeza que deseja deletar o personal trainer ${personal.nome}? Esta ação é irreversível e só é possível se ele não tiver alunos ativos.`)) {
      deletePersonalMutation.mutate(personal.id, {
        onSuccess: () => {
          navigate("/admin/personal-trainers");
        },
      });
    }
  };

  if (personalError) {
    return <div className="text-destructive">Erro ao carregar detalhes do personal: {personalError.message}</div>;
  }

  if (isLoadingPersonal || !personal) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-4 w-1/2" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-4 w-1/2" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-4 w-1/2" /></CardContent></Card>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate("/admin/personal-trainers")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <h1 className="text-3xl font-bold">Detalhes do Personal Trainer</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-1" /> Editar
          </Button>
          <Button
            variant={personal.ativo ? 'destructive' : 'default'}
            size="sm"
            onClick={handleToggleStatus}
            disabled={deletePersonalMutation.isPending}
          >
            <Power className="h-4 w-4 mr-1" /> {personal.ativo ? 'Desativar' : 'Ativar'}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deletePersonalMutation.isPending}>
            <Trash2 className="h-4 w-4 mr-1" /> Deletar
          </Button>
        </div>
      </div>

      {/* Informações Gerais */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary-yellow text-primary-dark text-3xl">
              {getInitials(personal.nome)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{personal.nome}</CardTitle>
            <p className="text-muted-foreground">{personal.email}</p>
            <Badge variant={personal.ativo ? "default" : "outline"} className="mt-2">
              {personal.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{personal.email}</span>
          </div>
          {personal.telefone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <span>{personal.telefone}</span>
            </div>
          )}
          {personal.cref && (
            <div className="flex items-center gap-3">
              <Dumbbell className="h-5 w-5 text-muted-foreground" />
              <span>{personal.cref}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span>Membro desde: {format(new Date(personal.created_at), "PPP", { locale: ptBR })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Plano */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Plano de Assinatura</CardTitle>
          <Button variant="outline" size="sm" onClick={handleAssignPlan}>
            <ListChecks className="h-4 w-4 mr-1" /> Atribuir/Editar Plano
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Plano Atual:</p>
            <p className="text-lg font-semibold">{personal.plan_nome || "Nenhum Plano Atribuído"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status da Assinatura:</p>
            {personal.status_assinatura ? (
              <Badge
                className={`
                  ${personal.status_assinatura === 'ativa' && 'bg-secondary-green text-white'}
                  ${personal.status_assinatura === 'vencida' && 'bg-secondary-red text-white'}
                  ${personal.status_assinatura === 'trial' && 'bg-secondary-blue text-white'}
                  ${personal.status_assinatura === 'cancelada' && 'bg-gray-400 text-white'}
                  ${personal.status_assinatura === 'pendente' && 'bg-gray-600 text-white'}
                  ${personal.status_assinatura === 'vitalicia' && 'bg-purple-600 text-white'}
                `}
              >
                {personal.status_assinatura.charAt(0).toUpperCase() + personal.status_assinatura.slice(1)}
              </Badge>
            ) : (
              <Badge variant="outline">Pendente</Badge>
            )}
          </div>
          {personal.data_assinatura && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Assinatura:</p>
              <p>{format(new Date(personal.data_assinatura), "PPP", { locale: ptBR })}</p>
            </div>
          )}
          {personal.data_vencimento && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Vencimento:</p>
              <p>{personal.plano_vitalicio ? 'Vitalício' : format(new Date(personal.data_vencimento), "PPP", { locale: ptBR })}</p>
            </div>
          )}
          {personal.desconto_percentual && personal.desconto_percentual > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Desconto Aplicado:</p>
              <p>{personal.desconto_percentual}%</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Limite de Alunos:</p>
            <p>{personal.plan_max_alunos === 0 ? 'Ilimitado' : personal.plan_max_alunos || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas do Personal (usando o hook usePersonalStats) */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas do Personal</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-center text-center p-4 border rounded-md">
            <UsersIcon className="h-8 w-8 text-secondary-blue mb-2" />
            <p className="text-xl font-bold">{personal.total_alunos || 0}</p>
            <p className="text-sm text-muted-foreground">Alunos Atribuídos</p>
          </div>
          {/* Os outros stats (treinos criados, execuções) precisariam de uma RPC específica para admin ver stats de outro personal */}
          {/* Por enquanto, vamos usar placeholders ou adaptar o usePersonalStats se possível */}
          <div className="flex flex-col items-center text-center p-4 border rounded-md">
            <Dumbbell className="h-8 w-8 text-secondary-green mb-2" />
            <p className="text-xl font-bold">N/A</p> {/* stats?.total_treinos || 0 */}
            <p className="text-sm text-muted-foreground">Treinos Criados</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 border rounded-md">
            <Activity className="h-8 w-8 text-purple-600 mb-2" />
            <p className="text-xl font-bold">N/A</p> {/* stats?.total_execucoes || 0 */}
            <p className="text-sm text-muted-foreground">Execuções Totais</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 border rounded-md">
            <TrendingUp className="h-8 w-8 text-orange-600 mb-2" />
            <p className="text-xl font-bold">N/A</p> {/* stats?.execucoes_mes || 0 */}
            <p className="text-sm text-muted-foreground">Execuções Mês</p>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alunos do Personal */}
      <Card>
        <CardHeader>
          <CardTitle>Alunos de {personal.nome}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingStudents ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : alunos && alunos.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {alunos.map((aluno) => (
                <Card key={aluno.id} className="p-4 flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-800">
                      {getInitials(aluno.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{aluno.nome}</p>
                    <p className="text-sm text-muted-foreground">{aluno.email}</p>
                  </div>
                  <Badge variant={aluno.ativo ? "default" : "outline"} className="ml-auto">
                    {aluno.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center">Este personal trainer ainda não tem alunos.</p>
          )}
        </CardContent>
      </Card>

      {personal && (
        <>
          <PersonalFormDialog
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            personal={personal}
          />
          <AssignPlanToPersonalDialog
            isOpen={isAssignPlanDialogOpen}
            onClose={() => setIsAssignPlanDialogOpen(false)}
            personal={personal}
          />
          <PersonalStatusDialogAdmin
            isOpen={isStatusDialogOpen}
            onClose={() => setIsStatusDialogOpen(false)}
            personal={personal}
            actionType={statusActionType}
          />
        </>
      )}
    </div>
  );
}