import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

interface ExerciseConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercicio: any;
  exercicioDetalhes?: any;
  onSave: (updatedConfig: any) => void;
}

export function ExerciseConfigDialog({
  open,
  onOpenChange,
  exercicio,
  exercicioDetalhes,
  onSave
}: ExerciseConfigDialogProps) {
  const [config, setConfig] = useState({
    series: exercicio.series,
    repeticoes: exercicio.repeticoes,
    carga: exercicio.carga || '',
    descanso_seg: exercicio.descanso_seg,
    observacoes: exercicio.observacoes || ''
  });

  useEffect(() => {
    if (open) {
      setConfig({
        series: exercicio.series,
        repeticoes: exercicio.repeticoes,
        carga: exercicio.carga || '',
        descanso_seg: exercicio.descanso_seg,
        observacoes: exercicio.observacoes || ''
      });
    }
  }, [open, exercicio]);

  const handleSave = () => {
    onSave(config);
  };

  const isValid = config.series.trim() && config.repeticoes.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Exercício</DialogTitle>
          {exercicioDetalhes && (
            <div className="space-y-2">
              <h4 className="font-medium">{exercicioDetalhes.nome}</h4>
              <div className="flex gap-2 flex-wrap">
                {exercicioDetalhes.grupo_muscular && (
                  <Badge variant="secondary" className="text-xs">
                    {exercicioDetalhes.grupo_muscular}
                  </Badge>
                )}
                {exercicioDetalhes.equipamento && (
                  <Badge variant="outline" className="text-xs">
                    {exercicioDetalhes.equipamento}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="series">Séries *</Label>
              <Input
                id="series"
                placeholder="Ex: 3, 4, 3-4"
                value={config.series}
                onChange={(e) => setConfig({ ...config, series: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Número de séries (ex: 3, 4, 3-4)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="repeticoes">Repetições *</Label>
              <Input
                id="repeticoes"
                placeholder="Ex: 10, 8-12"
                value={config.repeticoes}
                onChange={(e) => setConfig({ ...config, repeticoes: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Número de repetições (ex: 10, 8-12)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="carga">Carga</Label>
            <Input
              id="carga"
              placeholder="Ex: 20kg, moderada, peso corporal"
              value={config.carga}
              onChange={(e) => setConfig({ ...config, carga: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Peso ou intensidade (opcional)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descanso">Descanso entre séries (segundos)</Label>
            <Input
              id="descanso"
              type="number"
              min="0"
              max="600"
              placeholder="60"
              value={config.descanso_seg}
              onChange={(e) => setConfig({ ...config, descanso_seg: parseInt(e.target.value) || 60 })}
            />
            <p className="text-xs text-muted-foreground">
              Tempo de descanso em segundos (0-600)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Manter costas retas, executar lentamente..."
              value={config.observacoes}
              onChange={(e) => setConfig({ ...config, observacoes: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Dicas ou instruções especiais (opcional)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Salvar Configuração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
