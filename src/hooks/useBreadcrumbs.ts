import { useLocation } from "react-router-dom";
import { useMemo } from "react";

interface BreadcrumbItem {
  label: string;
  path: string;
  isCurrent: boolean;
}

const routeLabels: { [key: string]: string } = {
  '/personal/dashboard': 'Dashboard',
  '/personal/alunos': 'Alunos',
  '/personal/alunos/new': 'Novo Aluno',
  '/personal/exercicios': 'Exercícios',
  '/personal/exercicios/new': 'Novo Exercício',
  '/personal/treinos': 'Treinos',
  '/personal/treinos/new': 'Novo Treino',
  '/aluno/dashboard': 'Dashboard',
  '/aluno/historico': 'Histórico de Treinos',
  '/admin/dashboard': 'Dashboard',
  '/admin/personal-trainers': 'Personal Trainers',
  '/admin/alunos': 'Alunos',
  '/admin/planos': 'Planos',
  '/admin/estatisticas': 'Estatísticas', // Adicionado
};

export function useBreadcrumbs(userRole: 'admin' | 'personal' | 'aluno' | null) {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean); // Remove strings vazias

  const homePath = useMemo(() => {
    if (userRole === 'admin') return '/admin/dashboard';
    if (userRole === 'personal') return '/personal/dashboard';
    if (userRole === 'aluno') return '/aluno/dashboard';
    return '/'; // Rota padrão para não autenticados ou papel desconhecido
  }, [userRole]);

  const breadcrumbs = useMemo(() => {
    const crumbs: BreadcrumbItem[] = [];
    let currentPath = '';

    // Adiciona o item "Home"
    if (homePath && userRole) { // Adiciona Home apenas se o papel do usuário for conhecido
      crumbs.push({ label: 'Home', path: homePath, isCurrent: location.pathname === homePath });
    }

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      currentPath += `/${segment}`;
      const isLast = i === pathSegments.length - 1;

      let label = routeLabels[currentPath];

      // Lida com segmentos dinâmicos ou caminhos não mapeados diretamente
      if (!label) {
        // Exemplos de tratamento para rotas dinâmicas
        if (currentPath.match(/^\/personal\/alunos\/[^/]+\/historico$/)) {
          label = 'Histórico do Aluno';
        } else if (currentPath.match(/^\/aluno\/treino\/[^/]+$/)) {
          label = 'Executar Treino';
        } else if (currentPath.match(/^\/personal\/alunos\/[^/]+\/edit$/)) {
          label = 'Editar Aluno';
        } else if (currentPath.match(/^\/personal\/exercicios\/[^/]+\/edit$/)) {
          label = 'Editar Exercício';
        } else if (currentPath.match(/^\/personal\/treinos\/[^/]+\/edit$/)) {
          label = 'Editar Treino';
        } else {
          // Fallback: capitaliza e substitui hífens por espaços
          label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        }
      }

      crumbs.push({
        label: label,
        path: currentPath,
        isCurrent: isLast,
      });
    }
    return crumbs;
  }, [location.pathname, userRole, homePath]);

  return breadcrumbs;
}