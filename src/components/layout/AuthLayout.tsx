import { useState, useEffect, useMemo } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Menu, X, LayoutDashboard, Users, Dumbbell, ListChecks, BarChart3, History, Home } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"; // Importar componentes de breadcrumb
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs"; // Importar o hook useBreadcrumbs
import { useIsMobile } from "@/hooks/use-mobile"; // Importar o hook useIsMobile
import React from "react"; // Importar React para React.Fragment

type UserRole = "admin" | "personal" | "aluno";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile(); // Usar o hook de mobile

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome, role")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setUserName(profile.nome);
          setUserRole(profile.role as UserRole);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = userRole === "personal" ? [
    { icon: LayoutDashboard, label: "Dashboard", path: "/personal/dashboard" },
    { icon: Users, label: "Alunos", path: "/personal/alunos" },
    { icon: Dumbbell, label: "Treinos", path: "/personal/treinos" },
    { icon: ListChecks, label: "Exercícios", path: "/personal/exercicios" },
  ] : userRole === "admin" ? [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Users, label: "Personal Trainers", path: "/admin/personal-trainers" },
    { icon: Users, label: "Alunos", path: "/admin/alunos" },
    { icon: BarChart3, label: "Estatísticas", path: "/admin/estatisticas" },
  ] : userRole === "aluno" ? [
    { icon: LayoutDashboard, label: "Dashboard", path: "/aluno/dashboard" },
    { icon: History, label: "Histórico de Treinos", path: "/aluno/historico" },
  ] : [];

  const breadcrumbs = useBreadcrumbs(userRole);

  // Responsividade para breadcrumbs
  const displayedBreadcrumbs = useMemo(() => {
    if (isMobile && breadcrumbs.length > 2) {
      // Se for mobile e houver mais de 2 itens, mostra "..." e os últimos 2
      return [
        { label: '...', path: '#', isCurrent: false }, // Item de placeholder
        ...breadcrumbs.slice(-2)
      ];
    }
    return breadcrumbs;
  }, [breadcrumbs, isMobile]);


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {(userRole === "personal" || userRole === "admin" || userRole === "aluno") && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}
            <h1 className="text-xl font-bold text-primary">Atrenis</h1>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{userName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {(userRole === "personal" || userRole === "admin" || userRole === "aluno") && (
          <>
            {/* Mobile Sidebar */}
            {sidebarOpen && (
              <div className="fixed inset-0 z-40 md:hidden">
                <div className="fixed inset-0 bg-background/80" onClick={() => setSidebarOpen(false)} />
                <aside className="fixed left-0 top-16 bottom-0 w-64 bg-card border-r p-4 overflow-y-auto">
                  <nav className="space-y-2">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`
                        }
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </nav>
                </aside>
              </div>
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 border-r bg-card min-h-[calc(100vh-4rem)] p-4">
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Breadcrumbs */}
          {userRole && ( // Apenas mostra breadcrumbs se o papel do usuário for conhecido
            <div className="mb-6">
              <Breadcrumb>
                <BreadcrumbList>
                  {displayedBreadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.path}>
                      <BreadcrumbItem>
                        {index === 0 && crumb.label === 'Home' ? (
                          <BreadcrumbLink asChild>
                            <NavLink to={crumb.path}>
                              <Home className="h-4 w-4" />
                            </NavLink>
                          </BreadcrumbLink>
                        ) : crumb.isCurrent ? (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <NavLink to={crumb.path}>
                              {crumb.label}
                            </NavLink>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!crumb.isCurrent && index < displayedBreadcrumbs.length - 1 && (
                        <BreadcrumbSeparator />
                      )}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}