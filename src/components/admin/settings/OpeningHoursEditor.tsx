import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { OpeningHours, OpeningHoursSlot } from '@/contexts/StoreConfigContext';

interface OpeningHoursEditorProps {
  value: OpeningHours;
  onChange: (hours: OpeningHours) => void;
  disabled?: boolean;
}

const DAYS: { key: keyof OpeningHours; label: string; short: string }[] = [
  { key: 'mon', label: 'Segunda-feira', short: 'Seg' },
  { key: 'tue', label: 'Terça-feira', short: 'Ter' },
  { key: 'wed', label: 'Quarta-feira', short: 'Qua' },
  { key: 'thu', label: 'Quinta-feira', short: 'Qui' },
  { key: 'fri', label: 'Sexta-feira', short: 'Sex' },
  { key: 'sat', label: 'Sábado', short: 'Sáb' },
  { key: 'sun', label: 'Domingo', short: 'Dom' },
];

const DEFAULT_SLOT: OpeningHoursSlot = { start: '18:00', end: '23:00' };

export function OpeningHoursEditor({ value, onChange, disabled }: OpeningHoursEditorProps) {
  const [selectedDay, setSelectedDay] = useState<keyof OpeningHours>('mon');
  const [copyFrom, setCopyFrom] = useState<keyof OpeningHours | null>(null);

  const currentSlots = value[selectedDay] || [];

  const updateSlots = (newSlots: OpeningHoursSlot[]) => {
    onChange({
      ...value,
      [selectedDay]: newSlots,
    });
  };

  const addSlot = () => {
    updateSlots([...currentSlots, { ...DEFAULT_SLOT }]);
  };

  const removeSlot = (index: number) => {
    updateSlots(currentSlots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: 'start' | 'end', newValue: string) => {
    updateSlots(
      currentSlots.map((slot, i) =>
        i === index ? { ...slot, [field]: newValue } : slot
      )
    );
  };

  const toggleDay = (isOpen: boolean) => {
    if (isOpen && currentSlots.length === 0) {
      updateSlots([{ ...DEFAULT_SLOT }]);
    } else if (!isOpen) {
      updateSlots([]);
    }
  };

  const copyToAllDays = () => {
    const newHours: OpeningHours = {} as OpeningHours;
    DAYS.forEach(day => {
      newHours[day.key] = [...currentSlots];
    });
    onChange(newHours);
  };

  const resetToDefaults = () => {
    onChange({
      mon: [{ start: '18:00', end: '23:00' }],
      tue: [{ start: '18:00', end: '23:00' }],
      wed: [{ start: '18:00', end: '23:00' }],
      thu: [{ start: '18:00', end: '23:00' }],
      fri: [{ start: '18:00', end: '00:30' }],
      sat: [{ start: '18:00', end: '00:30' }],
      sun: [{ start: '18:00', end: '23:00' }],
    });
  };

  return (
    <div className="space-y-4">
      {/* Day Selector */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map(day => {
          const slots = value[day.key] || [];
          const isOpen = slots.length > 0;
          
          return (
            <button
              key={day.key}
              onClick={() => setSelectedDay(day.key)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all',
                selectedDay === day.key
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50',
                !isOpen && 'opacity-50'
              )}
            >
              <span className="text-sm font-medium">{day.short}</span>
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full',
                isOpen ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
              )}>
                {isOpen ? 'Aberto' : 'Fechado'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Editor */}
      <div className="bg-muted/30 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">
              {DAYS.find(d => d.key === selectedDay)?.label}
            </h4>
            <p className="text-sm text-muted-foreground">
              {currentSlots.length === 0 ? 'Fechado' : `${currentSlots.length} horário(s)`}
            </p>
          </div>
          <Switch
            checked={currentSlots.length > 0}
            onCheckedChange={toggleDay}
            disabled={disabled}
          />
        </div>

        {currentSlots.length > 0 && (
          <div className="space-y-3">
            {currentSlots.map((slot, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={slot.start}
                    onChange={(e) => updateSlot(index, 'start', e.target.value)}
                    className="w-28"
                    disabled={disabled}
                  />
                  <span className="text-muted-foreground">às</span>
                  <Input
                    type="time"
                    value={slot.end}
                    onChange={(e) => updateSlot(index, 'end', e.target.value)}
                    className="w-28"
                    disabled={disabled}
                  />
                </div>
                {currentSlots.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSlot(index)}
                    disabled={disabled}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={addSlot}
              disabled={disabled}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Intervalo
            </Button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={copyToAllDays}
          disabled={disabled || currentSlots.length === 0}
          className="gap-2"
        >
          Copiar para todos os dias
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetToDefaults}
          disabled={disabled}
          className="gap-2 text-muted-foreground"
        >
          <RotateCcw className="w-4 h-4" />
          Resetar padrão
        </Button>
      </div>
    </div>
  );
}
