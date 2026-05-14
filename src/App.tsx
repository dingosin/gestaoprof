/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dashboard } from "./components/Dashboard";
import { 
  LayoutDashboard,
  Users,
  Award,
  Briefcase,
  UserCheck,
  UserMinus,
  UserPlus,
  Search,
  PlusCircle, 
  Edit, 
  Edit3,
  FileText, 
  History, 
  Save, 
  Trash2, 
  Download, 
  Upload, 
  ChevronDown, 
  ChevronUp,
  Settings,
  X,
  RefreshCw,
  User
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { saveAs } from "file-saver";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { 
  Teacher, 
  TeachersDict, 
  Batch, 
  BatchesDict, 
  AppData, 
  Agenda, 
  BatchTeacherEntry, 
  EfetivoCategories, 
  Absence,
  Occurrence,
  OccurrencesDict,
  OccurrenceNature,
  SubstitutionReason
} from "./types";
import { generateDocx } from "./lib/docx";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "cadastrar" | "editar" | "htpc" | "rh" | "config">("dashboard");
  const [data, setData] = useState<AppData>({ teachers: {}, batches: {}, occurrences: {} });
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveTeachers = async (newTeachers: TeachersDict) => {
    try {
      await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teachers: newTeachers }),
      });
      setData(prev => ({ ...prev, teachers: newTeachers }));
    } catch (error) {
      console.error("Erro ao salvar professores:", error);
    }
  };

  const saveBatches = async (newBatches: BatchesDict) => {
    try {
      await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batches: newBatches }),
      });
      setData(prev => ({ ...prev, batches: newBatches }));
    } catch (error) {
      console.error("Erro ao salvar lotes:", error);
    }
  };

  const saveOccurrences = async (newOccs: OccurrencesDict) => {
    try {
      await fetch("/api/occurrences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occurrences: newOccs }),
      });
      setData(prev => ({ ...prev, occurrences: newOccs }));
    } catch (error) {
      console.error("Erro ao salvar ocorrências:", error);
    }
  };

  const handleBackup = async () => {
    window.location.href = "/api/backup";
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("backup", file);

    try {
      await fetch("/api/restore", {
        method: "POST",
        body: formData,
      });
      fetchData();
      alert("Backup restaurado com sucesso!");
    } catch (error) {
      console.error("Erro ao restaurar backup:", error);
      alert("Falha ao restaurar backup.");
    }
  };

  return (
    <div className="h-screen w-full bg-[#f4f7f9] flex flex-col overflow-hidden font-sans text-slate-900">
      {/* Header Section with Editorial Typography */}
      <header className="bg-[#004a99] text-white px-8 py-6 flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-xs font-semibold tracking-widest uppercase opacity-70 mb-1">MUNICÍPIO DE TEODORO SAMPAIO</h2>
          <h1 className="text-4xl font-serif font-bold italic tracking-tight">EMEF “Pedro Caminoto”</h1>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium opacity-80">Gestão Pedagógica</p>
          <p className="text-xs font-mono opacity-60">Portal Administrativo v2.4</p>
        </div>
      </header>

      {/* Navigation Tabs - Styled for Hierarchy */}
      <nav className="bg-[#003d80] px-8 flex gap-2 shrink-0">
        <TabButton 
          active={activeTab === "dashboard"} 
          onClick={() => setActiveTab("dashboard")}
          icon={<LayoutDashboard size={16} />}
          label="Dashboard"
        />
        <TabButton 
          active={activeTab === "cadastrar"} 
          onClick={() => setActiveTab("cadastrar")}
          icon={<PlusCircle size={16} />}
          label="Cadastrar"
        />
        <TabButton 
          active={activeTab === "editar"} 
          onClick={() => setActiveTab("editar")}
          icon={<Edit size={16} />}
          label="Editar"
        />
        <TabButton 
          active={activeTab === "htpc"} 
          onClick={() => setActiveTab("htpc")}
          icon={<FileText size={16} />}
          label="Relatório Suporte"
        />
        <TabButton 
          active={activeTab === "rh"} 
          onClick={() => setActiveTab("rh")}
          icon={<History size={16} />}
          label="RH"
        />
        <TabButton 
          active={activeTab === "config"} 
          onClick={() => setActiveTab("config")}
          icon={<Settings size={16} />}
          label="Ajustes"
        />
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {loading ? (
            <div key="loading" className="flex-1 flex items-center justify-center bg-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004a99]"></div>
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex overflow-hidden"
            >
              {activeTab === "dashboard" && <Dashboard teachers={data.teachers} occurrences={data.occurrences} />}
              {activeTab === "cadastrar" && <CadastrarTab onSave={saveTeachers} teachers={data.teachers} />}
              {activeTab === "editar" && <EditarTab teachers={data.teachers} onSave={saveTeachers} />}
              {activeTab === "htpc" && <HTPCTab teachers={data.teachers} onSaveBatch={saveBatches} batches={data.batches} />}
              {activeTab === "rh" && <RHTab teachers={data.teachers} occurrences={data.occurrences} onSaveOccurrences={saveOccurrences} />}
              {activeTab === "config" && (
                <div className="flex-1 p-8 bg-white overflow-y-auto">
                  <div className="max-w-4xl mx-auto space-y-12">
                    <div>
                      <h3 className="text-2xl font-serif italic font-bold border-b-2 border-slate-900 pb-2 mb-8 uppercase tracking-tighter">Sistema & Backup</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <button 
                          onClick={handleBackup}
                          className="flex flex-col items-center gap-4 p-8 border-2 border-slate-100 bg-slate-50 rounded-xl hover:bg-slate-100 hover:border-blue-200 transition-all text-center group"
                        >
                          <div className="p-4 bg-blue-600 text-white rounded-full shadow-lg group-hover:scale-110 transition-transform">
                            <Download size={32} />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg uppercase tracking-tight">Exportar Dados</h4>
                            <p className="text-sm text-slate-500 font-medium">Baixar arquivo JSON com todos os registros atuais do sistema.</p>
                          </div>
                        </button>
                        
                        <div className="flex flex-col items-center gap-4 p-8 border-2 border-slate-100 bg-slate-50 rounded-xl hover:bg-slate-100 hover:border-blue-200 transition-all text-center group relative">
                          <input 
                            type="file" 
                            accept=".json" 
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            onChange={handleRestore}
                          />
                          <div className="p-4 bg-blue-600 text-white rounded-full shadow-lg group-hover:scale-110 transition-transform">
                            <Upload size={32} />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg uppercase tracking-tight">Importar Backup</h4>
                            <p className="text-sm text-slate-500 font-medium">Restaurar registros a partir de um arquivo de backup previamente salvo.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Status Bar */}
      <footer className="bg-white border-t border-slate-200 px-8 py-2 flex justify-between text-[10px] font-mono text-slate-400 shrink-0 uppercase tracking-tighter">
        <div>Database: Local Persistent (dados_professores.json)</div>
        <div className="flex gap-4">
          <span>Server: Node/Express v4</span>
          <span>Environment: Production Ready</span>
          <span className="text-blue-600 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" /> System Active
          </span>
        </div>
      </footer>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-6 py-4 text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-2",
        active 
          ? "text-white border-b-4 border-white opacity-100" 
          : "text-blue-200 hover:text-white opacity-70"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// --- SUB-COMPONENTS ---

function CadastrarTab({ onSave, teachers }: { onSave: (t: TeachersDict) => void; teachers: TeachersDict }) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<Teacher>({
    defaultValues: {
      ativo: true,
      isAulaLivre: false,
      isOutrasSedes: false,
      sedeResponsavel: "",
      cargaHorariaSemanal: "0",
      cargaHorariaMensal: "0",
      situacao: "ACTS",
      agenda: {
        Segunda: emptyAgendaEntry(),
        Terça: emptyAgendaEntry(),
        Quarta: emptyAgendaEntry(),
        Quinta: emptyAgendaEntry(),
        Sexta: emptyAgendaEntry()
      }
    }
  });

  const situacao = watch("situacao");

  const onSubmit = (data: Teacher) => {
    if (!data.nome) return alert("Por favor, insira o nome.");
    const updated = { ...teachers, [data.nome]: data };
    onSave(updated);
    reset();
    alert("Docente cadastrado com sucesso!");
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* Column 1: Personal Information */}
      <section className="w-1/3 p-8 border-r border-slate-200 overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="relative">
            <span className="text-6xl font-serif italic text-slate-100 absolute -top-6 -left-4 -z-0 select-none">01</span>
            <h3 className="text-xl font-bold border-b-2 border-slate-900 pb-2 mb-6 uppercase tracking-tighter relative z-10">Dados do Docente</h3>
            
            <div className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Nome Completo</label>
                  <input {...register("nome")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-medium shadow-inner" placeholder="PHELIIPE CAMINOTO" />
                </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" {...register("isAulaLivre")} id="aula-livre" className="w-4 h-4 accent-amber-600 cursor-pointer" />
                      <label htmlFor="aula-livre" className="text-[9px] font-bold text-slate-600 uppercase cursor-pointer select-none">Aula Livre</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" {...register("isOutrasSedes")} id="outras-sedes" className="w-4 h-4 accent-purple-600 cursor-pointer" />
                      <label htmlFor="outras-sedes" className="text-[9px] font-bold text-slate-600 uppercase cursor-pointer select-none">Outras Sedes</label>
                    </div>
                  </div>
              </div>
              {watch("isOutrasSedes") && (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Escola Sede Responsável</label>
                  <input {...register("sedeResponsavel")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-medium" placeholder="Ex: EMEF Prof. Fulano" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">RG</label>
                  <input {...register("rg")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono uppercase" placeholder="00.000.000-0" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Situação</label>
                  <select {...register("situacao")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-medium">
                    <option value="ACTS">ACTS</option>
                    <option value="EFETIVO">EFETIVO</option>
                    <option value="SUBSTITUTO">SUBSTITUTO</option>
                    <option value="PROFISSIONAL DE APOIO">PROFISSIONAL DE APOIO</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">CPF</label>
                  <input {...register("cpf")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono uppercase" placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">PIS</label>
                  <input 
                    {...register("pis")} 
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, "");
                      if (v.length > 11) v = v.substring(0, 11);
                      if (v.length > 2) v = v.replace(/^(\d{3})(\d)/, "$1.$2");
                      if (v.length > 8) v = v.replace(/^(\d{3})\.(\d{5})(\d)/, "$1.$2.$3");
                      if (v.length > 11) v = v.replace(/^(\d{3})\.(\d{5})\.(\d{2})(\d)/, "$1.$2.$3-$4");
                      // Simple mask for PIS: xxx.xxxxx.xx-x
                      if (v.length > 3) {
                         const digits = e.target.value.replace(/\D/g, "");
                         let formatted = digits.substring(0, 3);
                         if (digits.length > 3) formatted += "." + digits.substring(3, 8);
                         if (digits.length > 8) formatted += "." + digits.substring(8, 10);
                         if (digits.length > 10) formatted += "-" + digits.substring(10, 11);
                         e.target.value = formatted;
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono uppercase" 
                    placeholder="000.00000.00-0" 
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Telefone</label>
                <input {...register("telefone")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Endereço Residencial</label>
                <input {...register("endereco")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" placeholder="Rua, Número, Bairro" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Banco</label>
                  <input {...register("banco")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" placeholder="Ex: Santander" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Local da Agência</label>
                  <input {...register("localAgencia")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" placeholder="Cidade" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Agência</label>
                  <input {...register("agencia")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Nº da Conta</label>
                  <input {...register("conta")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Processo Seletivo</label>
                  <input {...register("processoSeletivo")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Classificação</label>
                  <input {...register("classificacao")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={(situacao === "SUBSTITUTO" || situacao === "PROFISSIONAL DE APOIO") ? "hidden" : ""}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Carga Horária Semanal</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      {...register("cargaHorariaSemanal")} 
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm pr-10" 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setValue("cargaHorariaMensal", (val * 5).toString());
                      }}
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">h/a</span>
                  </div>
                </div>
                <div className={(situacao === "SUBSTITUTO" || situacao === "PROFISSIONAL DE APOIO") ? "hidden" : ""}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Carga Horária Mensal</label>
                  <div className="relative">
                    <input {...register("cargaHorariaMensal")} readOnly className="w-full bg-slate-100 border border-slate-200 rounded px-3 py-2 text-sm pr-10 text-slate-500" />
                    <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold">h/a</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Disciplina</label>
                  <input {...register("disciplina")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-medium" placeholder="Matemática" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Categoria</label>
                  <input {...register("categoria")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-medium" placeholder="A" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" {...register("ativo")} id="ativo" className="w-4 h-4 accent-blue-600 cursor-pointer" />
                <label htmlFor="ativo" className="text-xs font-bold text-slate-700 uppercase cursor-pointer select-none">Professor Ativo no Sistema</label>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-[#0056b3] text-white font-bold py-4 rounded shadow-lg hover:bg-[#003d80] transition-all uppercase tracking-widest text-xs">
            Salvar Registro
          </button>
        </form>
      </section>

      {/* Column 2: Schedule Grid */}
      <section className="flex-1 p-8 bg-[#f8fafc] flex flex-col overflow-hidden">
        <div className="flex justify-between items-baseline mb-6">
          <h3 className="text-xl font-bold uppercase tracking-tighter">Horários Fixos</h3>
          <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Distribuição de Carga Horária Semanal</p>
        </div>

        <div className="flex-1 border border-slate-200 rounded-lg overflow-y-auto bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white sticky top-0 z-20">
                <th className="p-3 text-[10px] font-bold text-left tracking-widest border-r border-slate-700 uppercase">Dia</th>
                <th className="p-3 text-[10px] font-bold tracking-widest border-r border-slate-700 uppercase">HTPC</th>
                <th className="p-3 text-[10px] font-bold tracking-widest border-r border-slate-700 uppercase">HSP (I)</th>
                <th className="p-3 text-[10px] font-bold tracking-widest border-r border-slate-700 uppercase">HSP (II)</th>
                <th className="p-3 text-[10px] font-bold tracking-widest uppercase">HE</th>
              </tr>
            </thead>
            <tbody className="text-[11px] font-mono">
              {["Segunda", "Terça", "Quarta", "Quinta", "Sexta"].map((dia) => (
                <tr key={dia} className="border-b border-slate-100">
                  <td className="p-3 font-sans font-bold bg-slate-50 border-r w-32 uppercase text-slate-700">{dia}</td>
                  <ScheduleCell register={register} name={`agenda.${dia}.HTPC`} />
                  <ScheduleCell register={register} name={`agenda.${dia}.HSP1`} />
                  <ScheduleCell register={register} name={`agenda.${dia}.HSP2`} />
                  <ScheduleCell register={register} name={`agenda.${dia}.HE`} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 p-4 border-l-4 border-blue-500 bg-blue-50 text-[11px] text-blue-800 italic leading-relaxed">
          <strong>Nota:</strong> O preenchimento correto dos horários é fundamental para a precisão dos relatórios gerados pelo sistema Pedro Caminoto.
        </div>
      </section>
    </div>
  );
}

function ScheduleCell({ register, name }: { register: any; name: string }) {
  return (
    <td className="p-2 border-r last:border-r-0">
      <div className="flex items-center gap-1 justify-center">
        <input 
          {...register(`${name}.0`)} 
          className="w-14 bg-blue-50 border border-blue-100 text-center rounded py-1 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono transition-colors" 
          placeholder="00:00"
        />
        <span className="opacity-30 text-slate-400 font-sans">-</span>
        <input 
          {...register(`${name}.1`)} 
          className="w-14 bg-blue-50 border border-blue-100 text-center rounded py-1 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono transition-colors" 
          placeholder="00:00"
        />
      </div>
    </td>
  );
}

function EditarTab({ teachers, onSave }: { teachers: TeachersDict; onSave: (t: TeachersDict) => void }) {
  const [selectedProf, setSelectedProf] = useState("");
  const { register, handleSubmit, reset, setValue, watch } = useForm<Teacher>();

  const situacao = watch("situacao");

  useEffect(() => {
    if (selectedProf && teachers[selectedProf]) {
      reset(teachers[selectedProf]);
    }
  }, [selectedProf, teachers, reset]);

  const onSubmit = (newData: Teacher) => {
    const updated = { ...teachers };
    if (newData.nome !== selectedProf) delete updated[selectedProf];
    updated[newData.nome] = newData;
    onSave(updated);
    setSelectedProf(newData.nome);
    alert("Dados atualizados!");
  };

  const handleDelete = () => {
    if (window.confirm(`Excluir ${selectedProf}?`)) {
      const updated = { ...teachers };
      delete updated[selectedProf];
      onSave(updated);
      setSelectedProf("");
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      <section className="w-1/3 p-8 border-r border-slate-200 overflow-y-auto">
        <div className="space-y-8">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Localizar Docente</label>
            <select 
              value={selectedProf} 
              onChange={(e) => setSelectedProf(e.target.value)}
              className="w-full bg-slate-900 text-white rounded px-4 py-3 text-sm font-bold focus:outline-none border-b-4 border-blue-600 cursor-pointer shadow-lg"
            >
              <option value="">-- SELECIONE PARA EDITAR --</option>
              {Object.keys(teachers).sort().map(name => <option key={name} value={name}>{name.toUpperCase()}</option>)}
            </select>
          </div>

          {selectedProf && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="relative">
                <span className="text-6xl font-serif italic text-slate-100 absolute -top-6 -left-4 -z-0 select-none">02</span>
                <h3 className="text-xl font-bold border-b-2 border-slate-900 pb-2 mb-6 uppercase tracking-tighter relative z-10">Editar Perfil</h3>
                
                <div className="space-y-4">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Nome</label>
                      <input {...register("nome")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-medium shadow-inner" />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" {...register("isAulaLivre")} id="edit-aula-livre" className="w-4 h-4 accent-amber-600" />
                        <label htmlFor="edit-aula-livre" className="text-[9px] font-bold text-slate-600 uppercase cursor-pointer">Aula Livre</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" {...register("isOutrasSedes")} id="edit-outras-sedes" className="w-4 h-4 accent-purple-600" />
                        <label htmlFor="edit-outras-sedes" className="text-[9px] font-bold text-slate-600 uppercase cursor-pointer">Outras Sedes</label>
                      </div>
                    </div>
                  </div>
                  {watch("isOutrasSedes") && (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Escola Sede Responsável</label>
                      <input {...register("sedeResponsavel")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-medium" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">RG</label>
                      <input {...register("rg")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono uppercase" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Situação</label>
                      <select {...register("situacao")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm">
                        <option value="ACTS">ACTS</option>
                        <option value="EFETIVO">EFETIVO</option>
                        <option value="SUBSTITUTO">SUBSTITUTO</option>
                        <option value="PROFISSIONAL DE APOIO">PROFISSIONAL DE APOIO</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">CPF</label>
                      <input {...register("cpf")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono uppercase" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">PIS</label>
                      <input 
                        {...register("pis")} 
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          let formatted = digits.substring(0, 3);
                          if (digits.length > 3) formatted += "." + digits.substring(3, 8);
                          if (digits.length > 8) formatted += "." + digits.substring(8, 10);
                          if (digits.length > 10) formatted += "-" + digits.substring(10, 11);
                          e.target.value = formatted;
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono uppercase" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Telefone</label>
                    <input {...register("telefone")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Endereço Residencial</label>
                    <input {...register("endereco")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Banco</label>
                      <input {...register("banco")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Local da Agência</label>
                      <input {...register("localAgencia")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Agência</label>
                      <input {...register("agencia")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Nº Conta</label>
                      <input {...register("conta")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Processo Seletivo</label>
                      <input {...register("processoSeletivo")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Classificação</label>
                      <input {...register("classificacao")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={(situacao === "SUBSTITUTO" || situacao === "PROFISSIONAL DE APOIO") ? "hidden" : ""}>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">CH Semanal (h/a)</label>
                      <input 
                        type="number" 
                        {...register("cargaHorariaSemanal")} 
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setValue("cargaHorariaMensal", (val * 5).toString());
                        }}
                      />
                    </div>
                    <div className={(situacao === "SUBSTITUTO" || situacao === "PROFISSIONAL DE APOIO") ? "hidden" : ""}>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">CH Mensal (h/a)</label>
                      <input {...register("cargaHorariaMensal")} readOnly className="w-full bg-slate-100 border border-slate-200 rounded px-3 py-2 text-sm text-slate-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Disciplina</label>
                      <input {...register("disciplina")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Categoria</label>
                      <input {...register("categoria")} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <input type="checkbox" {...register("ativo")} id="edit-ativo" className="w-4 h-4 accent-blue-600" />
                    <label htmlFor="edit-ativo" className="text-xs font-bold text-slate-700 uppercase cursor-pointer">Ativo no Sistema</label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button type="submit" className="w-full bg-[#0056b3] text-white font-bold py-4 rounded shadow-md hover:bg-[#003d80] transition-all uppercase tracking-widest text-xs">
                  Atualizar Dados
                </button>
                <button type="button" onClick={handleDelete} className="w-full bg-white text-[#bd2130] border border-[#bd2130] font-bold py-2 rounded hover:bg-red-50 transition-all uppercase tracking-widest text-[10px]">
                  Excluir Registro
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <section className="flex-1 p-8 bg-[#f8fafc] flex flex-col overflow-hidden">
        {selectedProf ? (
          <>
            <div className="flex justify-between items-baseline mb-6">
              <h3 className="text-xl font-bold uppercase tracking-tighter">Carga Horária</h3>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Modificar Grade Semanal</p>
            </div>
            <div className="flex-1 border border-slate-200 rounded-lg overflow-y-auto bg-white shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white sticky top-0 z-20">
                    <th className="p-3 text-[10px] font-bold text-left tracking-widest border-r border-slate-700 uppercase">Dia</th>
                    <th className="p-3 text-[10px] font-bold tracking-widest border-r border-slate-700 uppercase">HTPC</th>
                    <th className="p-3 text-[10px] font-bold tracking-widest border-r border-slate-700 uppercase">HSP (I)</th>
                    <th className="p-3 text-[10px] font-bold tracking-widest border-r border-slate-700 uppercase">HSP (II)</th>
                    <th className="p-3 text-[10px] font-bold tracking-widest uppercase">HE</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-mono">
                  {["Segunda", "Terça", "Quarta", "Quinta", "Sexta"].map((dia) => (
                    <tr key={dia} className="border-b border-slate-100">
                      <td className="p-3 font-sans font-bold bg-slate-50 border-r w-32 uppercase text-slate-700">{dia}</td>
                      <ScheduleCell register={register} name={`agenda.${dia}.HTPC`} />
                      <ScheduleCell register={register} name={`agenda.${dia}.HSP1`} />
                      <ScheduleCell register={register} name={`agenda.${dia}.HSP2`} />
                      <ScheduleCell register={register} name={`agenda.${dia}.HE`} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-200 font-serif italic text-4xl select-none">
            Selecione um docente
          </div>
        )}
      </section>
    </div>
  );
}

function HTPCTab({ teachers, onSaveBatch, batches }: { teachers: TeachersDict; onSaveBatch: (b: BatchesDict) => void; batches: BatchesDict }) {
  const [loteName, setLoteName] = useState("");
  const [startDate, setStartDate] = useState("2026-03-15");
  const [endDate, setEndDate] = useState("2026-04-13");
  const [selectedProfs, setSelectedProfs] = useState<Set<string>>(new Set());

  const activeTeachers = (Object.values(teachers) as Teacher[])
    .filter(t => t.ativo && t.situacao !== "SUBSTITUTO")
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const toggleProf = (nome: string) => {
    const next = new Set(selectedProfs);
    if (next.has(nome)) next.delete(nome);
    else next.add(nome);
    setSelectedProfs(next);
  };

  const toggleAll = (selected: boolean) => {
    if (selected) {
      setSelectedProfs(new Set(activeTeachers.map(t => t.nome)));
    } else {
      setSelectedProfs(new Set());
    }
  };

  const generateBatch = () => {
    if (!loteName) return alert("Dê um nome ao relatório.");
    if (selectedProfs.size === 0) return alert("Selecione ao menos um professor.");

    const id = `${loteName}_${new Date().getTime()}`;
    const professors: { [name: string]: BatchTeacherEntry } = {};
    
    selectedProfs.forEach(name => {
      professors[name] = {
        teacher: teachers[name],
        absences: []
      };
    });

    const newBatch: Batch = {
      nome: loteName,
      tipo: "EFETIVO", // Default for HTPC
      reportType: "HTPC",
      inicio: startDate,
      fim: endDate,
      inicio_f: format(parseISO(startDate), "dd/MM/yyyy"),
      fim_f: format(parseISO(endDate), "dd/MM/yyyy"),
      professores: professors
    };

    onSaveBatch({ ...batches, [id]: newBatch });
    setLoteName("");
    setSelectedProfs(new Set());
    alert("Relatório Suporte gerado!");
  };

  const htpcBatches = Object.entries(batches)
    .filter(([_, b]) => b.reportType === "HTPC")
    .sort((a, b) => b[1].nome.localeCompare(a[1].nome));

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* Configuration Column */}
      <section className="w-1/3 p-8 border-r border-slate-200 overflow-y-auto space-y-8">
        <div>
          <h3 className="text-xl font-bold border-b-2 border-slate-900 pb-2 mb-6 uppercase tracking-tighter">Gerar Novo Suporte</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Título do Relatório</label>
              <input 
                value={loteName}
                onChange={(e) => setLoteName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-medium" 
                placeholder="SUPORTE MARÇO 2026" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Data Início</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Data Fim</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono" />
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selecionar Docentes ({selectedProfs.size})</label>
                <button 
                  onClick={() => toggleAll(selectedProfs.size < activeTeachers.length)}
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  {selectedProfs.size < activeTeachers.length ? "MARCAR TODOS" : "DESMARCAR TODOS"}
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto border border-slate-100 rounded bg-slate-50 p-2 space-y-1">
                {activeTeachers.map(t => (
                  <label key={t.nome} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors group">
                    <input 
                      type="checkbox" 
                      checked={selectedProfs.has(t.nome)}
                      onChange={() => toggleProf(t.nome)}
                      className="w-4 h-4 accent-blue-600 shadow-sm" 
                    />
                    <span className={cn("text-xs font-medium uppercase tracking-tight", selectedProfs.has(t.nome) ? "text-blue-700 font-bold" : "text-slate-600")}>
                      {t.nome}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              onClick={generateBatch}
              className="w-full bg-[#0056b3] text-white font-bold py-4 rounded shadow-lg hover:bg-[#003d80] transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
            >
              <Save size={16} /> Salvar e Gerar Relatório
            </button>
          </div>
        </div>
      </section>

      {/* History Column */}
      <section className="flex-1 p-8 bg-[#f8fafc] flex flex-col overflow-hidden">
        <h3 className="text-xl font-bold uppercase tracking-tighter mb-6">Histórico Suporte</h3>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {htpcBatches.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-300 font-serif italic text-2xl">
              Nenhum relatório gerado
            </div>
          ) : (
            htpcBatches.map(([id, batch]) => (
              <div key={id} className="bg-white border-l-4 border-blue-600 p-4 rounded-r-lg shadow-sm flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-tight">{batch.nome}</h4>
                  <div className="flex gap-4 text-[10px] text-slate-400 font-mono mt-1">
                    <span>Início: {batch.inicio_f}</span>
                    <span>Fim: {batch.fim_f}</span>
                    <span className="bg-blue-50 text-blue-600 px-2 rounded-full font-bold">{Object.keys(batch.professores).length} DOCENTES</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      const blob = await generateDocx(batch);
                      saveAs(blob, `${batch.nome}.docx`);
                    }}
                    className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm("Excluir este relatório?")) {
                        const next = { ...batches };
                        delete next[id];
                        onSaveBatch(next);
                      }
                    }}
                    className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function RHTab({ teachers, occurrences, onSaveOccurrences }: { teachers: TeachersDict; occurrences: OccurrencesDict; onSaveOccurrences: (o: OccurrencesDict) => void }) {
  const [view, setView] = useState<"history" | "new" | "report">("history");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New Occurrence form state
  const [situacao, setSituacao] = useState<"EFETIVO" | "ACTS" | "SUBSTITUTO" | "PROFISSIONAL DE APOIO">("EFETIVO");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [teacherName, setTeacherName] = useState("");
  const [nature, setNature] = useState<OccurrenceNature>("ATESTADO");
  const [totalClasses, setTotalClasses] = useState(0);
  
  // Substitution fields
  const [substitutedTeacherName, setSubstitutedTeacherName] = useState("");
  const [reason, setReason] = useState<SubstitutionReason>("Livre");

  // Report generation state
  const [reportType, setReportType] = useState<"EFETIVO/ACTS" | "SUBSTITUTO" | "PROFISSIONAL DE APOIO">("EFETIVO/ACTS");
  const [startDate, setStartDate] = useState("2026-03-15");
  const [endDate, setEndDate] = useState("2026-04-13");
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set());

  const teachersList = Object.values(teachers) as Teacher[];
  const activeTeachers = teachersList.filter(t => t.ativo).sort((a, b) => a.nome.localeCompare(b.nome));
  
  const filteredTeachers = activeTeachers.filter(t => t.situacao === situacao);
  const substitutedList = activeTeachers.filter(t => {
    if (situacao === "SUBSTITUTO") return t.situacao === "EFETIVO" || t.situacao === "ACTS";
    if (situacao === "PROFISSIONAL DE APOIO") return t.situacao === "PROFISSIONAL DE APOIO";
    if (situacao === "EFETIVO" || situacao === "ACTS") return t.situacao === "EFETIVO" || t.situacao === "ACTS";
    return false;
  });

  const reportFilteredTeachers = activeTeachers.filter(t => {
    if (reportType === "EFETIVO/ACTS") return t.situacao === "EFETIVO" || t.situacao === "ACTS";
    if (reportType === "SUBSTITUTO") return t.situacao === "SUBSTITUTO";
    return t.situacao === "PROFISSIONAL DE APOIO";
  });

  const natures: OccurrenceNature[] = [
    "ATESTADO", "DOAÇÃO DE SANGUE", "EFETIVO EXERCÍCIO", "FALTA ABONADA", 
    "FÉRIAS", "FOLGA ANIVERSÁRIO", "LICENÇA PRÊMIO", "LICENÇA SAÚDE", 
    "LUTO", "OUTRAS AUSÊNCIAS", "RECESSO", "SERVIÇO OBRIGATÓRIO", "TELETRABALHO", "SUBSTITUIÇÃO", "FALTA INJUSTIFICADA", "AUSÊNCIA SUPORTE"
  ];

  const reasons: SubstitutionReason[] = [
    "Abonada", "Atestado", "Livre", "Falta injustificada", "Aniversário", 
    "Efetivo Exercício", "Doação Sangue", "Luto", "Licença Saúde", 
    "Licença Prêmio", "Férias", "Recesso", "Ausência Suporte"
  ];

  const handleSave = () => {
    if (!teacherName) return alert("Selecione um professor.");
    const isSub = situacao === "SUBSTITUTO" || situacao === "PROFISSIONAL DE APOIO" || (situacao !== "SUBSTITUTO" && situacao !== "PROFISSIONAL DE APOIO" && nature === "SUBSTITUIÇÃO");
    if (isSub && !substitutedTeacherName) return alert("Selecione o professor substituído.");

    const id = editingId || `${new Date().getTime()}`;
    const newOcc: Occurrence = {
      id,
      type: isSub ? "SUBSTITUTION" : "STANDARD",
      date,
      teacherName,
      situacao,
      nature: (situacao !== "SUBSTITUTO" && situacao !== "PROFISSIONAL DE APOIO") ? nature : undefined,
      totalClasses,
      substitutedTeacherName: isSub ? substitutedTeacherName : undefined,
      reason: isSub ? reason : undefined,
    };

    const nextOccurrences = { ...occurrences, [id]: newOcc };

    const substituteTeacher = teachers[teacherName];
    const isAulaLivreSubstitute = substituteTeacher?.isAulaLivre;
    
    const titularTeacher = teachers[substitutedTeacherName || ""];
    const isOutrasSedesTitular = titularTeacher?.isOutrasSedes;

    // Auto-register or update absence for substituted teacher
    if (isSub && substitutedTeacherName && !isAulaLivreSubstitute) {
      // Map substitution reason to occurrence nature
      let mappedNature: OccurrenceNature = "OUTRAS AUSÊNCIAS";
      const r = reason.toLowerCase();
      if (r.includes("atestado")) mappedNature = "ATESTADO";
      else if (r.includes("abonada")) mappedNature = "FALTA ABONADA";
      else if (r.includes("aniversário")) mappedNature = "FOLGA ANIVERSÁRIO";
      else if (r.includes("injustificada")) mappedNature = "FALTA INJUSTIFICADA";
      else if (r.includes("exercício")) mappedNature = "EFETIVO EXERCÍCIO";
      else if (r.includes("livre")) mappedNature = "EFETIVO EXERCÍCIO";
      else if (r.includes("saúde")) mappedNature = "LICENÇA SAÚDE";
      else if (r.includes("prêmio")) mappedNature = "LICENÇA PRÊMIO";
      else if (r.includes("luto")) mappedNature = "LUTO";
      else if (r.includes("doação")) mappedNature = "DOAÇÃO DE SANGUE";
      else if (r.includes("férias")) mappedNature = "FÉRIAS";
      else if (r.includes("recesso")) mappedNature = "RECESSO";
      else if (r.includes("suporte")) mappedNature = "AUSÊNCIA SUPORTE";

      const subTeacher = teachers[substitutedTeacherName];
      if (subTeacher) {
        // Find existing mirrored record by linkedId OR identical core details (ignoring substitute name to avoid duplicates)
        const existingMirrored = Object.values(occurrences).find(occ => 
          occ.linkedId === id ||
          (occ.type === "STANDARD" && 
           occ.teacherName === substitutedTeacherName && 
           occ.date === date && 
           occ.nature === mappedNature &&
           occ.totalClasses === totalClasses)
        );

        const mirroredId = existingMirrored?.id || `auto-${id}`;
        
        nextOccurrences[mirroredId] = {
          id: mirroredId,
          type: "STANDARD",
          date,
          teacherName: substitutedTeacherName,
          situacao: subTeacher.situacao,
          nature: mappedNature,
          totalClasses,
          substitutedBy: teacherName,
          linkedId: id
        };
      }
    }

    onSaveOccurrences(nextOccurrences);
    alert(editingId ? "Ocorrência atualizada!" : "Ocorrência registrada!");
    resetForm();
  };

  const startEdit = (occ: Occurrence) => {
    setEditingId(occ.id);
    setTeacherName(occ.teacherName);
    setSituacao(occ.situacao);
    setDate(occ.date);
    setTotalClasses(occ.totalClasses);
    if (occ.type === "STANDARD") {
      setNature(occ.nature as OccurrenceNature);
    } else {
      setSubstitutedTeacherName(occ.substitutedTeacherName!);
      setReason(occ.reason as SubstitutionReason);
    }
    setView("new");
  };

  const handleSyncRecords = () => {
    const allOccs = Object.values(occurrences);
    
    // Passo 1: Crítica de Relatório (Deduplicação)
    // Remove registros onde substituto, substituído, dia, aulas e motivo sejam idênticos
    const uniqueOccsDict: OccurrencesDict = {};
    const seenSubstitutions = new Set<string>();
    const seenStandards = new Set<string>();
    let removedCount = 0;

    // Ordenar para manter consistência
    const sortedAll = allOccs.sort((a,b) => a.id.localeCompare(b.id));

    sortedAll.forEach(occ => {
      if (occ.type === "SUBSTITUTION") {
        const key = `${occ.teacherName}-${occ.substitutedTeacherName}-${occ.date}-${occ.totalClasses}-${occ.reason}`;
        if (seenSubstitutions.has(key)) {
          removedCount++;
        } else {
          seenSubstitutions.add(key);
          uniqueOccsDict[occ.id] = occ;
        }
      } else {
        // Nature (STANDARD)
        // Key ignores substitutedBy to catch duplicates where different substitutes generated the same absence record
        const key = `${occ.teacherName}-${occ.date}-${occ.nature}-${occ.totalClasses}`;
        if (seenStandards.has(key)) {
          removedCount++;
        } else {
          seenStandards.add(key);
          uniqueOccsDict[occ.id] = occ;
        }
      }
    });

    // Limpeza de órfãos (mirrors que perderam o pai na deduplicação)
    Object.keys(uniqueOccsDict).forEach(id => {
      const occ = uniqueOccsDict[id];
      if (occ.linkedId && !uniqueOccsDict[occ.linkedId]) {
        delete uniqueOccsDict[id];
        removedCount++;
      }
    });

    const dedupedOccs = Object.values(uniqueOccsDict);

    // Passo 2: Sincronização (Existing logic using clean list)
    const substitutions = dedupedOccs.filter(o => o.type === "SUBSTITUTION" && o.substitutedTeacherName);
    
    let createdCount = 0;
    const nextOccs = { ...uniqueOccsDict };

    substitutions.forEach(sub => {
      const titularName = sub.substitutedTeacherName!;
      const titular = teachers[titularName];
      if (!titular) return;

      // Determine the nature based on reason
      let mappedNature: OccurrenceNature = "OUTRAS AUSÊNCIAS";
      const r = (sub.reason || "").toLowerCase();
      if (r.includes("atestado")) mappedNature = "ATESTADO";
      else if (r.includes("abonada")) mappedNature = "FALTA ABONADA";
      else if (r.includes("aniversário")) mappedNature = "FOLGA ANIVERSÁRIO";
      else if (r.includes("injustificada")) mappedNature = "FALTA INJUSTIFICADA";
      else if (r.includes("exercício")) mappedNature = "EFETIVO EXERCÍCIO";
      else if (r.includes("livre")) mappedNature = "EFETIVO EXERCÍCIO";
      else if (r.includes("saúde")) mappedNature = "LICENÇA SAÚDE";
      else if (r.includes("prêmio")) mappedNature = "LICENÇA PRÊMIO";
      else if (r.includes("luto")) mappedNature = "LUTO";
      else if (r.includes("doação")) mappedNature = "DOAÇÃO DE SANGUE";
      else if (r.includes("férias")) mappedNature = "FÉRIAS";
      else if (r.includes("recesso")) mappedNature = "RECESSO";
      else if (r.includes("suporte")) mappedNature = "AUSÊNCIA SUPORTE";

      // Check if record exists based on link or identical details (ignoring substitute to avoid duplication of titular absence)
      const exists = dedupedOccs.some(occ => 
        (occ.linkedId === sub.id) ||
        (occ.type === "STANDARD" && 
         occ.teacherName === titularName && 
         occ.date === sub.date && 
         occ.nature === mappedNature &&
         occ.totalClasses === sub.totalClasses)
      );

      if (!exists) {
        const newId = `sync-${sub.id}`;
        const newOcc: Occurrence = {
          id: newId,
          type: "STANDARD",
          date: sub.date,
          teacherName: titularName,
          situacao: titular.situacao,
          nature: mappedNature,
          totalClasses: sub.totalClasses,
          substitutedBy: sub.teacherName,
          linkedId: sub.id
        };
        nextOccs[newId] = newOcc;
        createdCount++;
      }
    });

    if (removedCount > 0 || createdCount > 0) {
      onSaveOccurrences(nextOccs);
      let msg = "";
      if (removedCount > 0) msg += `${removedCount} registros duplicados foram removidos. `;
      if (createdCount > 0) msg += `${createdCount} registros foram sincronizados com os titulares.`;
      alert(msg);
    } else {
      alert("A crítica do relatório não encontrou irregularidades ou faltas de sincronização!");
    }
  };

  const handleGenerateReport = async () => {
    if (selectedTeachers.size === 0) return alert("Selecione ao menos um professor.");
    
    try {
      const { generateRHReport } = await import("./lib/rhDocx");
      
      const teachersToReport = Array.from(selectedTeachers).map((name: string) => {
        const teacher = teachers[name];
        const teacherOccurrences = Object.values(occurrences).filter(occ => 
          occ.teacherName === name && 
          occ.date >= startDate && 
          occ.date <= endDate
        );

        return {
          teacher,
          occurrences: teacherOccurrences,
          period: { start: startDate, end: endDate }
        };
      });

      const blob = await generateRHReport(teachersToReport, teachers);
      saveAs(blob, `Relatorio_Mensal_RH_${format(new Date(), "dd-MM-yyyy")}.docx`);
      alert("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Erro ao gerar documento.");
    }
  };

  const resetForm = () => {
    setTeacherName("");
    setSubstitutedTeacherName("");
    setTotalClasses(0);
    setView("history");
    setSelectedTeachers(new Set());
    setEditingId(null);
  };

  const sortedOccurrences = Object.values(occurrences).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  if (view === "history") {
    return (
      <div className="flex-1 bg-white p-8 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-10">
          <div className="relative">
            <span className="text-8xl font-serif italic text-slate-50 absolute -top-12 -left-6 -z-0 select-none">RH</span>
            <h3 className="text-3xl font-serif italic font-bold border-b-4 border-slate-900 pb-2 uppercase tracking-tighter relative z-10 w-fit">Ocorrências de Ponto</h3>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setView("report")}
              className="bg-white text-slate-900 border-2 border-slate-900 px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-md"
            >
              <FileText size={20} /> GERAR RELATÓRIO
            </button>
            <button 
              onClick={() => setView("new")}
              className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-600 transition-all shadow-xl"
            >
              <PlusCircle size={20} /> CADASTRAR OCORRÊNCIA
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-4">
          {sortedOccurrences.length === 0 ? (
            <div className="p-20 text-center text-slate-300 font-serif italic text-2xl border-2 border-dashed border-slate-100 rounded-3xl">
              Nenhuma ocorrência registrada.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b-2 border-slate-900">
                  <th className="py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Data</th>
                  <th className="py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Professor</th>
                  <th className="py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Tipo</th>
                  <th className="py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Detalhamento</th>
                  <th className="py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">H.A</th>
                  <th className="py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedOccurrences.map(occ => (
                  <tr key={occ.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-4 font-mono text-xs">{format(parseISO(occ.date), "dd/MM/yyyy")}</td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs uppercase text-slate-700">{occ.teacherName}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{occ.situacao}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest",
                        occ.type === "SUBSTITUTION" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {occ.type === "SUBSTITUTION" ? "Substituição" : "Natureza"}
                      </span>
                    </td>
                    <td className="py-4 text-xs font-medium text-slate-600">
                      {occ.type === "SUBSTITUTION" ? (
                        <div className="flex flex-col">
                          <span>Substituiu: <span className="font-bold text-slate-800">{occ.substitutedTeacherName}</span></span>
                          <span className="text-[10px] italic">Motivo: {occ.reason}</span>
                        </div>
                      ) : (
                        <span>{occ.nature}</span>
                      )}
                    </td>
                    <td className="py-4 text-center font-bold text-slate-700">{occ.totalClasses}</td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => startEdit(occ)}
                          className="text-slate-300 hover:text-blue-600 transition-colors"
                          title="Editar ocorrência"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm("Remover esta ocorrência? Isso também removerá registros automáticos vinculados.")) {
                              const next = { ...occurrences };
                              // If it's a substitution, remove linked mirror records
                              if (occ.type === "SUBSTITUTION") {
                                Object.keys(next).forEach(key => {
                                  if (next[key].linkedId === occ.id) {
                                    delete next[key];
                                  }
                                });
                              }
                              delete next[occ.id];
                              onSaveOccurrences(next);
                            }
                          }}
                          className="text-slate-300 hover:text-red-600 transition-colors"
                          title="Excluir ocorrência"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  if (view === "report") {
    return (
      <div className="flex-1 bg-white p-8 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
            <h3 className="text-2xl font-serif italic font-bold uppercase tracking-tighter pb-1 border-b-2 border-slate-900">Gerador de Relatórios Mensais</h3>
          </div>
          <button 
            onClick={handleSyncRecords}
            className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-100 transition-colors shadow-sm"
          >
            <RefreshCw size={14} />
            Crítica de Relatório
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden gap-12">
          {/* Config Column */}
          <div className="w-1/3 space-y-8">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Qual a natureza do cadastro?</label>
                <div className="flex flex-col gap-2 p-1 bg-white border border-slate-200 rounded-xl">
                  {["EFETIVO/ACTS", "SUBSTITUTO", "PROFISSIONAL DE APOIO"].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setReportType(t as any);
                        setSelectedTeachers(new Set());
                      }}
                      className={cn(
                        "w-full py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                        reportType === t ? "bg-slate-900 text-white" : "text-slate-400"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Período do Lote</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono" />
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <button 
                  onClick={handleGenerateReport}
                  disabled={selectedTeachers.size === 0}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:shadow-none"
                >
                  <Download size={16} /> Gerar Relatório Word
                </button>
              </div>
            </div>

            <div className="p-6 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 text-[11px] leading-relaxed italic">
              O sistema puxará automaticamente todas as ocorrências registradas para os professores selecionados dentro do período informado.
            </div>
          </div>

          {/* Selection Column */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-baseline mb-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selecione os Docentes ({selectedTeachers.size})</h4>
              <button 
                onClick={() => {
                  if (selectedTeachers.size === reportFilteredTeachers.length) {
                    setSelectedTeachers(new Set());
                  } else {
                    setSelectedTeachers(new Set(reportFilteredTeachers.map(t => t.nome)));
                  }
                }}
                className="text-[9px] font-bold text-blue-600 uppercase tracking-widest hover:underline"
              >
                {selectedTeachers.size === reportFilteredTeachers.length ? "Desmarcar Todos" : "Marcar Todos"}
              </button>
            </div>
            
            <div className="flex-1 border border-slate-100 bg-slate-50/50 rounded-3xl overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reportFilteredTeachers.map(t => (
                  <div 
                    key={t.nome}
                    onClick={() => {
                      const next = new Set(selectedTeachers);
                      if (next.has(t.nome)) next.delete(t.nome);
                      else next.add(t.nome);
                      setSelectedTeachers(next);
                    }}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between",
                      selectedTeachers.has(t.nome) ? "bg-white border-blue-500 shadow-md ring-4 ring-blue-50" : "bg-white border-slate-100 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-tight text-slate-800">{t.nome}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{t.situacao}</span>
                    </div>
                    {selectedTeachers.has(t.nome) && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-white overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
          <h3 className="text-2xl font-serif italic font-bold uppercase tracking-tighter pb-1 border-b-2 border-slate-900">
            {editingId ? "Editar Ocorrência" : "Cadastrar Ocorrência"}
          </h3>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 space-y-8 shadow-sm">
          {/* Situation Picker */}
          {!editingId && (
            <div className="flex gap-4 p-1 bg-white border border-slate-200 rounded-2xl">
              {["EFETIVO", "ACTS", "SUBSTITUTO", "PROFISSIONAL DE APOIO"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSituacao(s as any);
                    setTeacherName("");
                  }}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                    situacao === s ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-900"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Data da Ocorrência</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono shadow-sm focus:border-blue-500 outline-none" 
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                {situacao === "SUBSTITUTO" || situacao === "PROFISSIONAL DE APOIO" ? "Substituto" : "Professor Titular"}
              </label>
              <select 
                value={teacherName}
                onChange={e => setTeacherName(e.target.value)}
                disabled={!!editingId}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:opacity-60"
              >
                <option value="">Selecione...</option>
                {filteredTeachers.map(t => <option key={t.nome} value={t.nome}>{t.nome}</option>)}
              </select>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {situacao !== "SUBSTITUTO" && situacao !== "PROFISSIONAL DE APOIO" && nature !== "SUBSTITUIÇÃO" ? (
              <motion.div 
                key="standard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-200"
              >
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Natureza da Ocorrência</label>
                  <select 
                    value={nature}
                    onChange={e => setNature(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:border-blue-500 outline-none"
                  >
                    {natures.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Quantidade de Aulas Perdidas</label>
                  <input 
                    type="number"
                    value={totalClasses || ""}
                    onChange={e => setTotalClasses(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:border-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="substitution"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 pt-8 border-t border-slate-200"
              >
                {situacao !== "SUBSTITUTO" && situacao !== "PROFISSIONAL DE APOIO" && (
                  <div className="pb-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Natureza da Ocorrência</label>
                    <select 
                      value={nature}
                      onChange={e => setNature(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:border-blue-500 outline-none"
                    >
                      {natures.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                      {situacao === "PROFISSIONAL DE APOIO" ? "Titular (P. Apoio)" : "Professor Substituído"}
                    </label>
                    <select 
                      value={substitutedTeacherName}
                      onChange={e => setSubstitutedTeacherName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:border-blue-500 outline-none"
                    >
                      <option value="">Selecione...</option>
                      {substitutedList.map(t => <option key={t.nome} value={t.nome}>{t.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Motivo da Ausência</label>
                    <select 
                      value={reason}
                      onChange={e => setReason(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:border-blue-500 outline-none"
                    >
                      {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Total de Aulas Substituídas</label>
                  <input 
                    type="number"
                    value={totalClasses || ""}
                    onChange={e => setTotalClasses(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:border-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={handleSave}
            className="w-full bg-[#0056b3] text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-[#003d80] transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3 mt-10 active:scale-[0.98]"
          >
            <History size={20} className={cn(editingId ? "animate-spin-slow" : "")} /> 
            {editingId ? "ATUALIZAR OCORRÊNCIA" : "SALVAR OCORRÊNCIA"}
          </button>
        </div>
      </div>
    </div>
  );
}

function emptyAgendaEntry(): any {
  return {
    HTPC: ["", ""],
    HSP1: ["", ""],
    HSP2: ["", ""],
    HE: ["", ""]
  };
}
