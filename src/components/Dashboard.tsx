import React, { useMemo, useState, useRef } from 'react';
import { Occurrence, TeachersDict, OccurrencesDict, OccurrenceNature } from '../types';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateDashboardReport } from '../lib/rhDocx';
import { toPng } from 'html-to-image';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList
} from 'recharts';
import { Filter, Calendar, Users, PieChart as PieIcon, BarChart3, Search, FileDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface DashboardProps {
  occurrences: OccurrencesDict;
  teachers: TeachersDict;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

export function Dashboard({ occurrences, teachers }: DashboardProps) {
  const [filterTeacher, setFilterTeacher] = useState<string>('all');
  const [filterNature, setFilterNature] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const pieChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);

  const allOccurrences = useMemo(() => Object.values(occurrences), [occurrences]);
  const teacherNames = useMemo(() => Object.keys(teachers).sort(), [teachers]);

  const natures: (OccurrenceNature | 'SUBSTITUTION')[] = [
    "ATESTADO", "DOAÇÃO DE SANGUE", "EFETIVO EXERCÍCIO", "FALTA ABONADA", 
    "FÉRIAS", "FOLGA ANIVERSÁRIO", "LICENÇA PRÊMIO", "LICENÇA SAÚDE", 
    "LUTO", "OUTRAS AUSÊNCIAS", "RECESSO", "SERVIÇO OBRIGATÓRIO", 
    "TELETRABALHO", "FALTA INJUSTIFICADA", "AUSÊNCIA SUPORTE", "SUBSTITUTION"
  ];

  const filteredData = useMemo(() => {
    return allOccurrences.filter(occ => {
      const matchTeacher = filterTeacher === 'all' || occ.teacherName === filterTeacher;
      const matchNature = filterNature === 'all' || 
        (occ.type === 'STANDARD' && occ.nature === filterNature) ||
        (occ.type === 'SUBSTITUTION' && filterNature === 'SUBSTITUTION');
      
      let matchDate = true;
      if (startDate && endDate) {
        const d = parseISO(occ.date);
        matchDate = isWithinInterval(d, { start: parseISO(startDate), end: parseISO(endDate) });
      } else if (startDate) {
        matchDate = occ.date >= startDate;
      } else if (endDate) {
        matchDate = occ.date <= endDate;
      }

      return matchTeacher && matchNature && matchDate;
    });
  }, [allOccurrences, filterTeacher, filterNature, startDate, endDate]);

  const statsByType = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredData.forEach(occ => {
      if (occ.type === 'SUBSTITUTION') return; // Exclude from pie chart distribution
      const type = occ.nature || 'OUTRAS';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const statsByStatus = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredData.forEach(occ => {
      counts[occ.situacao] = (counts[occ.situacao] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const substitutionStats = useMemo(() => {
    // Quality of substitutions per professional
    const subs = filteredData.filter(occ => occ.type === 'SUBSTITUTION');
    const counts: { [key: string]: number } = {};
    subs.forEach(occ => {
      counts[occ.teacherName] = (counts[occ.teacherName] || 0) + occ.totalClasses;
    });
    return Object.entries(counts)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredData]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const dataURLToUint8Array = (dataURL: string) => {
        const base64 = dataURL.split(',')[1];
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      };

      const pieImage = pieChartRef.current ? await toPng(pieChartRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 }) : null;
      const barImage = barChartRef.current ? await toPng(barChartRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 }) : null;

      const images = {
        pieChart: pieImage ? dataURLToUint8Array(pieImage) : undefined,
        barChart: barImage ? dataURLToUint8Array(barImage) : undefined
      };

      const metrics = {
        totalSubstituted: filteredData.filter(o => o.type === 'SUBSTITUTION').reduce((acc, o) => acc + o.totalClasses, 0),
        totalAbsences: filteredData.filter(o => o.type === 'STANDARD').length
      };

      const blob = await generateDashboardReport(filteredData, {
        teacher: filterTeacher === 'all' ? undefined : filterTeacher,
        nature: filterNature === 'all' ? undefined : filterNature,
        start: startDate,
        end: endDate
      }, metrics, images);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Relatorio_Gestao_${format(new Date(), 'dd-MM-yyyy')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      {/* Header & Filters */}
      <div className="bg-white border-b border-slate-200 p-6 flex flex-col gap-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-serif italic text-slate-800 flex items-center gap-3">
                <BarChart3 className="text-blue-600" />
                Dashboard de Gestão
            </h2>
            <div className="flex items-center gap-4">
                <button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className={cn(
                    "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95",
                    isExporting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <FileDown size={14} className={isExporting ? "animate-bounce" : ""} />
                  {isExporting ? "Gerando..." : "Exportar para Word"}
                </button>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 uppercase tracking-widest hidden md:block">
                    <span>{filteredData.length} registros encontrados</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Users size={12} /> Docente
            </label>
            <select 
              value={filterTeacher} 
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">TODOS OS PROFESSORES</option>
              {teacherNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <PieIcon size={12} /> Tipo / Natureza
            </label>
            <select 
              value={filterNature} 
              onChange={(e) => setFilterNature(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">TODAS AS NATUREZAS</option>
              {natures.map(nat => (
                <option key={nat} value={nat}>{nat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12} /> De
            </label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12} /> Até
            </label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution by Type */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" ref={pieChartRef}>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-6">Distribuição por Tipo de Ocorrência</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {statsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Substitutes */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" ref={barChartRef}>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-6">Top 10 Substitutos (Total h/a)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={substitutionStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#0056b3" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                    <LabelList dataKey="total" position="right" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#64748b' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Metrics */}
            <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Total de Aulas Substituídas</p>
                <p className="text-5xl font-serif italic">
                    {filteredData.filter(o => o.type === 'SUBSTITUTION').reduce((acc, o) => acc + o.totalClasses, 0)}
                    <span className="text-xl ml-2 opacity-60">h/a</span>
                </p>
            </div>
            
            <div className="bg-amber-500 p-6 rounded-2xl text-white shadow-lg space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Ausências Registradas</p>
                <p className="text-5xl font-serif italic">
                    {filteredData.filter(o => o.type === 'STANDARD').length}
                    <span className="text-xl ml-2 opacity-60">ocorr.</span>
                </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Relat. Gerados no Período</p>
                <span className="text-4xl font-serif italic text-slate-800">
                   {statsByStatus.length}
                </span>
                <p className="text-[10px] text-slate-400 mt-2">categorias profissionais</p>
            </div>
        </div>

        {/* Detailed Table (Optional but helpful) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Detalhamento de Ocorrências Filtradas</h3>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                    <thead className="bg-slate-900 text-white sticky top-0">
                        <tr>
                            <th className="p-3 text-[10px] font-bold text-left uppercase">Data</th>
                            <th className="p-3 text-[10px] font-bold text-left uppercase">Docente</th>
                            <th className="p-3 text-[10px] font-bold text-left uppercase">Natureza/Tipo</th>
                            <th className="p-3 text-[10px] font-bold text-center uppercase">Aulas</th>
                            <th className="p-3 text-[10px] font-bold text-left uppercase">Detalhes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredData.sort((a,b) => b.date.localeCompare(a.date)).map((occ) => (
                            <tr key={occ.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 text-xs font-mono">{format(parseISO(occ.date), 'dd/MM/yyyy')}</td>
                                <td className="p-3 text-xs font-bold text-slate-700">{occ.teacherName}</td>
                                <td className="p-3">
                                    <span className={cn(
                                        "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest",
                                        occ.type === 'SUBSTITUTION' ? "bg-purple-50 text-purple-600 border border-purple-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                                    )}>
                                        {occ.type === 'SUBSTITUTION' ? 'SUBSTITUIÇÃO' : occ.nature}
                                    </span>
                                </td>
                                <td className="p-3 text-xs text-center font-mono">{occ.totalClasses}h</td>
                                <td className="p-3 text-[10px] text-slate-500 italic">
                                    {occ.type === 'SUBSTITUTION' ? `Substituindo ${occ.substitutedTeacherName} (${occ.reason})` : (occ.substitutedBy ? `Sinc. com ${occ.substitutedBy}` : '-')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}
