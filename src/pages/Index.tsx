import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface Station {
  id: string;
  name: string;
  x: number;
  y: number;
  lineId: string;
}

interface Line {
  id: string;
  name: string;
  color: string;
  stations: string[];
}

interface Transfer {
  id: string;
  stationIds: [string, string];
}

const METRO_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E'
];

const Index = () => {
  const [lines, setLines] = useState<Line[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [selectedTool, setSelectedTool] = useState<'line' | 'station' | 'transfer' | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [newLineName, setNewLineName] = useState('');
  const [newLineColor, setNewLineColor] = useState(METRO_COLORS[0]);
  const [newStationName, setNewStationName] = useState('');
  const [selectedStationForTransfer, setSelectedStationForTransfer] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('metro-scheme');
    if (saved) {
      const data = JSON.parse(saved);
      setLines(data.lines || []);
      setStations(data.stations || []);
      setTransfers(data.transfers || []);
    }
  }, []);

  useEffect(() => {
    const data = { lines, stations, transfers };
    localStorage.setItem('metro-scheme', JSON.stringify(data));
  }, [lines, stations, transfers]);

  const createLine = () => {
    if (!newLineName.trim()) {
      toast.error('Введите название ветки');
      return;
    }
    const newLine: Line = {
      id: `line-${Date.now()}`,
      name: newLineName,
      color: newLineColor,
      stations: []
    };
    setLines([...lines, newLine]);
    setSelectedLineId(newLine.id);
    setNewLineName('');
    toast.success(`Ветка "${newLineName}" создана`);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === 'station' && selectedLineId && newStationName.trim()) {
      const newStation: Station = {
        id: `station-${Date.now()}`,
        name: newStationName,
        x,
        y,
        lineId: selectedLineId
      };
      setStations([...stations, newStation]);
      setLines(lines.map(line =>
        line.id === selectedLineId
          ? { ...line, stations: [...line.stations, newStation.id] }
          : line
      ));
      setNewStationName('');
      toast.success(`Станция "${newStation.name}" добавлена`);
    }
  };

  const handleStationClick = (stationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedTool === 'transfer') {
      if (!selectedStationForTransfer) {
        setSelectedStationForTransfer(stationId);
        toast.info('Выберите вторую станцию для перехода');
      } else if (selectedStationForTransfer !== stationId) {
        const newTransfer: Transfer = {
          id: `transfer-${Date.now()}`,
          stationIds: [selectedStationForTransfer, stationId]
        };
        setTransfers([...transfers, newTransfer]);
        setSelectedStationForTransfer(null);
        toast.success('Переход создан');
      }
    }
  };

  const exportToPNG = () => {
    toast.success('Экспорт готов! (функция в разработке)');
  };

  const clearScheme = () => {
    setLines([]);
    setStations([]);
    setTransfers([]);
    localStorage.removeItem('metro-scheme');
    toast.success('Схема очищена');
  };

  const getLineById = (id: string) => lines.find(l => l.id === id);
  const getStationById = (id: string) => stations.find(s => s.id === id);

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-80 border-r border-border p-6 space-y-6 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Редактор метросхем</h1>
          <p className="text-sm text-muted-foreground">Создавайте схемы метро</p>
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Создать ветку</h2>
          <div className="space-y-3">
            <div>
              <Label htmlFor="line-name">Название</Label>
              <Input
                id="line-name"
                value={newLineName}
                onChange={(e) => setNewLineName(e.target.value)}
                placeholder="Кольцевая линия"
              />
            </div>
            <div>
              <Label>Цвет</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {METRO_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewLineColor(color)}
                    className={`w-8 h-8 rounded-md transition-transform ${
                      newLineColor === color ? 'ring-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={createLine} className="w-full">
              <Icon name="Plus" size={16} className="mr-2" />
              Создать ветку
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Инструменты</h2>
          
          <Card className="p-4 space-y-3">
            <div>
              <Label htmlFor="select-line">Выбрать ветку</Label>
              <select
                id="select-line"
                value={selectedLineId || ''}
                onChange={(e) => setSelectedLineId(e.target.value || null)}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">-- Выберите ветку --</option>
                {lines.map(line => (
                  <option key={line.id} value={line.id}>
                    {line.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="station-name">Название станции</Label>
              <Input
                id="station-name"
                value={newStationName}
                onChange={(e) => setNewStationName(e.target.value)}
                placeholder="Центральная"
              />
            </div>

            <Button
              onClick={() => setSelectedTool('station')}
              variant={selectedTool === 'station' ? 'default' : 'outline'}
              className="w-full"
              disabled={!selectedLineId || !newStationName.trim()}
            >
              <Icon name="MapPin" size={16} className="mr-2" />
              Добавить станцию
            </Button>

            <Button
              onClick={() => setSelectedTool('transfer')}
              variant={selectedTool === 'transfer' ? 'default' : 'outline'}
              className="w-full"
            >
              <Icon name="GitBranch" size={16} className="mr-2" />
              Создать переход
            </Button>
          </Card>
        </div>

        <Separator />

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Действия</h2>
          <Button onClick={exportToPNG} variant="outline" className="w-full">
            <Icon name="Download" size={16} className="mr-2" />
            Экспорт в PNG
          </Button>
          <Button onClick={clearScheme} variant="outline" className="w-full text-destructive">
            <Icon name="Trash2" size={16} className="mr-2" />
            Очистить схему
          </Button>
        </div>
      </aside>

      <main className="flex-1 relative overflow-hidden bg-muted/20">
        <div
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full relative cursor-crosshair"
          style={{ minHeight: '100vh' }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {lines.map(line => {
              const lineStations = line.stations
                .map(sId => getStationById(sId))
                .filter(Boolean) as Station[];
              
              return lineStations.map((station, idx) => {
                if (idx === 0) return null;
                const prevStation = lineStations[idx - 1];
                return (
                  <line
                    key={`${line.id}-${idx}`}
                    x1={prevStation.x}
                    y1={prevStation.y}
                    x2={station.x}
                    y2={station.y}
                    stroke={line.color}
                    className="metro-line"
                  />
                );
              });
            })}

            {transfers.map(transfer => {
              const [s1, s2] = transfer.stationIds.map(id => getStationById(id)).filter(Boolean) as Station[];
              if (!s1 || !s2) return null;
              return (
                <line
                  key={transfer.id}
                  x1={s1.x}
                  y1={s1.y}
                  x2={s2.x}
                  y2={s2.y}
                  stroke="#333"
                  strokeWidth="3"
                  strokeDasharray="8 4"
                />
              );
            })}
          </svg>

          {stations.map(station => {
            const line = getLineById(station.lineId);
            return (
              <div
                key={station.id}
                onClick={(e) => handleStationClick(station.id, e)}
                className="absolute metro-station pointer-events-auto"
                style={{
                  left: station.x - 8,
                  top: station.y - 8,
                  width: 16,
                  height: 16,
                  backgroundColor: line?.color || '#333',
                  border: '3px solid white',
                  borderRadius: '50%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
                title={station.name}
              />
            );
          })}

          {stations.map(station => (
            <div
              key={`label-${station.id}`}
              className="absolute pointer-events-none text-xs font-medium bg-white px-2 py-1 rounded shadow-sm"
              style={{
                left: station.x + 12,
                top: station.y - 10
              }}
            >
              {station.name}
            </div>
          ))}

          {selectedStationForTransfer && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg">
              Выберите вторую станцию для перехода
            </div>
          )}

          {stations.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <Icon name="MapPin" size={48} className="mx-auto opacity-50" />
                <p className="text-lg">Создайте ветку и добавьте станции</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;