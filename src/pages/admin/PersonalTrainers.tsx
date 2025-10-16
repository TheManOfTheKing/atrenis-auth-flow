import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type PersonalProfile = Tables<'profiles'> & {
  alunos: { count: number }[];
  treinos: { count: number }[];
};

export default function PersonalTrainers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [adminId, setAdminId] = useState<string | null>(null); // To ensure only admin can access

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

  const { data: personals, isLoading, error } = useQuery<PersonalProfile[]>({
    queryKey: ["adminPersonals", searchTerm],
    queryFn: async () => {
      if (!adminId) return []; // Only fetch if admin is identified

      let query = supabase
        .from('profiles')
        .select(`
          id,
          nome,
          email,
          cref,
          created_at,
          alunos:profiles!personal_id(count),
          treinos(count)
        `)
        .eq('role', 'personal');

      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as PersonalProfile[];
    },
    enabled: !!adminId, // Only enable query if adminId is set
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleViewDetails = (id: string) => {
    // Implement navigation to personal trainer detail page
    console.log("Ver detalhes do Personal Trainer:", id);
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: `Detalhes para o Personal Trainer ${id} serão implementados em breve.`,
    });
  };

  const handleExportCSV = () => {
    if (!personals || personals.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: "Nenhum dado de personal trainer para exportar.",
      });
      return;
    }

    const headers = ['Nome', 'Email', 'CREF', 'Alunos', 'Treinos', 'Data de Cadastro'];
    const rows = personals.map(personal => [
      personal.nome,
      personal.email,
      personal.cref || '-',
      personal.alunos[0]?.count || 0,
      personal.treinos[0]?.count || 0,
      new Date(personal.created_at).toLocaleDateString('pt-BR')
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
        <Button onClick={handleExportCSV} className="bg-primary-yellow text-primary-dark hover:bg-primary-yellow/90 gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar personal trainer por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Personal</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CREF</TableHead>
                <TableHead>Alunos</TableHead>
                <TableHead>Treinos</TableHead>
                <TableHead>Cadastro</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : personals && personals.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Personal</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>CREF</TableHead>
                <TableHead>Alunos</TableHead>
                <TableHead>Treinos</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personals.map((personal) => (
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
                  <TableCell>{personal.cref || '-'}</TableCell>
                  <TableCell>{personal.alunos[0]?.count || 0}</TableCell>
                  <TableCell>{personal.treinos[0]?.count || 0}</TableCell>
                  <TableCell>
                    {new Date(personal.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDetails(personal.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-muted-foreground text-center">Nenhum personal trainer encontrado.</p>
      )}
    </div>
  );
}