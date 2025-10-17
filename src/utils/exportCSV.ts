export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    console.error('Nenhum dado para exportar');
    return;
  }

  // Obter cabeçalhos das chaves do primeiro objeto
  const headers = Object.keys(data[0]);
  
  // Criar linhas CSV
  const csvRows = [
    headers.join(','), // Cabeçalho
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escapar vírgulas e aspas
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ];

  // Criar blob e fazer download
  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Limpar URL do objeto
  URL.revokeObjectURL(url);
}

// Função específica para exportar Personal Trainers
export function exportPersonalTrainersToCSV(personals: any[]) {
  const formattedData = personals.map(personal => ({
    'Nome': personal.nome,
    'Email': personal.email,
    'Telefone': personal.telefone || '',
    'CREF': personal.cref || '',
    'Status': personal.ativo ? 'Ativo' : 'Inativo',
    'Plano': personal.plan_nome || 'Sem plano',
    'Status Assinatura': personal.status_assinatura || '',
    'Data Cadastro': personal.created_at ? new Date(personal.created_at).toLocaleDateString('pt-BR') : '',
    'Última Atualização': personal.updated_at ? new Date(personal.updated_at).toLocaleDateString('pt-BR') : ''
  }));
  
  exportToCSV(formattedData, 'personal-trainers');
}

// Função específica para exportar Alunos
export function exportAlunosToCSV(alunos: any[]) {
  const formattedData = alunos.map(aluno => ({
    'Nome': aluno.nome,
    'Email': aluno.email,
    'Telefone': aluno.telefone || '',
    'Data Nascimento': aluno.data_nascimento || '',
    'Personal Trainer': aluno.personal_nome || 'Sem personal',
    'Objetivo': aluno.objetivo || '',
    'Status': aluno.ativo ? 'Ativo' : 'Inativo',
    'Data Cadastro': aluno.created_at ? new Date(aluno.created_at).toLocaleDateString('pt-BR') : '',
    'Última Atualização': aluno.updated_at ? new Date(aluno.updated_at).toLocaleDateString('pt-BR') : ''
  }));
  
  exportToCSV(formattedData, 'alunos');
}
