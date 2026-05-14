/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AgendaEntry {
  HTPC: [string, string];
  HSP1: [string, string];
  HSP2: [string, string];
  HE: [string, string];
}

export interface Agenda {
  [key: string]: AgendaEntry;
}

export interface Teacher {
  nome: string;
  rg: string;
  cpf: string;
  pis: string;
  telefone: string;
  endereco: string;
  situacao: "ACTS" | "EFETIVO" | "SUBSTITUTO" | "PROFISSIONAL DE APOIO";
  disciplina: string;
  categoria: string;
  banco: string;
  agencia: string;
  conta: string;
  localAgencia: string;
  processoSeletivo: string;
  classificacao: string;
  cargaHorariaSemanal: string;
  cargaHorariaMensal: string;
  agenda: Agenda;
  ativo: boolean;
  isAulaLivre?: boolean;
  isOutrasSedes?: boolean;
  sedeResponsavel?: string;
}

export interface Absence {
  data: string;
  tipo: string; // Used for "Ausência" type (Livre, Abonada, etc.)
  justificativa?: string; // Used for "Professor Substituído" name
  categoria?: string; // Used for "Categoria" in substitution report
  aulas?: string; // Total de Aulas (h/a)
}

export interface EfetivoCategories {
  comparecimentos: string;
  ausenciasInjustificadas: { dates: string; ha: string };
  atestado: { dates: string; ha: string };
  doacaoSangue: { dates: string; ha: string };
  efetivoExercicio: { dates: string; ha: string };
  faltaAbonada: { dates: string; ha: string };
  ferias: { dates: string; ha: string };
  folgaAniversario: { dates: string; ha: string };
  licencaPremio: { dates: string; ha: string };
  licencaSaude: { dates: string; ha: string };
  luto: { dates: string; ha: string };
  outrasAusencias: { dates: string; ha: string };
  recesso: { dates: string; ha: string };
  servicoObrigatorio: { dates: string; ha: string };
  teletrabalho: { dates: string; ha: string };
}

export interface BatchTeacherEntry {
  teacher: Teacher;
  absences: Absence[]; // Primarily for Substitutos, but can be used for both
  efetivoData?: EfetivoCategories;
  observacao?: string;
}

export interface Batch {
  nome: string;
  tipo: "EFETIVO" | "SUBSTITUTO" | "APOIO";
  reportType?: "RH" | "HTPC";
  inicio: string;
  fim: string;
  inicio_f: string;
  fim_f: string;
  professores: { [name: string]: BatchTeacherEntry };
}

export interface BatchesDict {
  [id: string]: Batch;
}

export interface TeachersDict {
  [name: string]: Teacher;
}

export interface AppData {
  teachers: TeachersDict;
  batches: BatchesDict;
  occurrences: OccurrencesDict;
}

export type OccurrenceNature = 
  | "ATESTADO" 
  | "DOAÇÃO DE SANGUE" 
  | "EFETIVO EXERCÍCIO" 
  | "FALTA ABONADA" 
  | "FÉRIAS" 
  | "FOLGA ANIVERSÁRIO" 
  | "LICENÇA PRÊMIO" 
  | "LICENÇA SAÚDE" 
  | "LUTO" 
  | "OUTRAS AUSÊNCIAS" 
  | "RECESSO" 
  | "SERVIÇO OBRIGATÓRIO" 
  | "TELETRABALHO"
  | "SUBSTITUIÇÃO"
  | "FALTA INJUSTIFICADA"
  | "AUSÊNCIA SUPORTE";

export type SubstitutionReason = "Abonada" | "Atestado" | "Livre" | "Falta injustificada" | "Aniversário" | "Efetivo Exercício" | "Doação Sangue" | "Luto" | "Licença Saúde" | "Licença Prêmio" | "Férias" | "Recesso" | "Ausência Suporte";

export interface Occurrence {
  id: string;
  type: "STANDARD" | "SUBSTITUTION";
  date: string;
  teacherName: string;
  situacao: "EFETIVO" | "ACTS" | "SUBSTITUTO" | "PROFISSIONAL DE APOIO";
  
  // Standard
  nature?: OccurrenceNature;
  totalClasses: number;
  substitutedBy?: string;
  
  // Substitution
  substitutedTeacherName?: string;
  reason?: SubstitutionReason;
  linkedId?: string;
}

export interface OccurrencesDict {
  [id: string]: Occurrence;
}
