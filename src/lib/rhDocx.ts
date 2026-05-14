import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType, 
  BorderStyle,
  VerticalAlign,
  PageBreak,
  ImageRun
} from "docx";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Teacher, 
  Occurrence, 
  TeachersDict 
} from "../types";

interface TeacherReportData {
  teacher: Teacher;
  occurrences: Occurrence[];
  period: { start: string; end: string };
}

export async function generateRHReport(dataList: TeacherReportData[], allTeachers: TeachersDict): Promise<Blob> {
  const sections = dataList.map((data, index) => {
    const { teacher, occurrences, period } = data;
    
    // Sort occurrences by date
    const sorted = [...occurrences].sort((a, b) => a.date.localeCompare(b.date));

    // Group standard occurrences by nature, and then by date within nature to sum hours and avoid duplicates
    const standardByNature: { [key: string]: { [date: string]: number } } = {};
    const unjustifiedOccurrences: { [date: string]: number } = {};
    
    sorted.filter(o => o.type === "STANDARD").forEach(o => {
      let nat = o.nature || "OUTRAS AUSÊNCIAS";
      const ha = Number(o.totalClasses) || 0;
      
      if (nat === "FALTA INJUSTIFICADA" || nat === "AUSÊNCIA SUPORTE") {
        unjustifiedOccurrences[o.date] = (unjustifiedOccurrences[o.date] || 0) + ha;
        nat = "OUTRAS AUSÊNCIAS";
      }
      
      if (!standardByNature[nat]) standardByNature[nat] = {};
      standardByNature[nat][o.date] = (standardByNature[nat][o.date] || 0) + ha;
    });

    // Get substitutions (where this teacher is the active one)
    const substitutions = sorted.filter(o => o.type === "SUBSTITUTION");

    // Identify substitutions for "Outras Sedes"
    const outrasSedesSubstitutions = substitutions.filter(s => {
      const substituted = allTeachers[s.substitutedTeacherName || ""];
      return substituted?.isOutrasSedes;
    });

    // Group Otras Sedes by Sede Responsavel
    const outrasSedesBySede: { [sede: string]: { sum: number; occurrences: Occurrence[] } } = {};
    outrasSedesSubstitutions.forEach(s => {
      const substituted = allTeachers[s.substitutedTeacherName || ""];
      const sede = substituted?.sedeResponsavel || "Sede Não Informada";
      if (!outrasSedesBySede[sede]) outrasSedesBySede[sede] = { sum: 0, occurrences: [] };
      outrasSedesBySede[sede].sum += s.totalClasses;
      outrasSedesBySede[sede].occurrences.push(s);
    });

    const naturesList = [
      { label: "ATESTADO", key: "ATESTADO" },
      { label: "DOAÇÃO DE SANGUE", key: "DOAÇÃO DE SANGUE" },
      { label: "EFETIVO EXERCÍCIO", key: "EFETIVO EXERCÍCIO" },
      { label: "FALTA ABONADA", key: "FALTA ABONADA" },
      { label: "FÉRIAS", key: "FÉRIAS" },
      { label: "FOLGA ANIVERSÁRIO", key: "FOLGA ANIVERSÁRIO" },
      { label: "LICENÇA PRÊMIO", key: "LICENÇA PRÊMIO" },
      { label: "LICENÇA SAÚDE", key: "LICENÇA SAÚDE" },
      { label: "LUTO", key: "LUTO" },
      { label: "OUTRAS AUSÊNCIAS", key: "OUTRAS AUSÊNCIAS" },
      { label: "RECESSO", key: "RECESSO" },
      { label: "SERVIÇO OBRIGATÓRIO", key: "SERVIÇO OBRIGATÓRIO" },
      { label: "TELETRABALHO", key: "TELETRABALHO" },
    ];

    const isSubstituteReport = teacher.situacao === "SUBSTITUTO" || teacher.situacao === "PROFISSIONAL DE APOIO";

    if (isSubstituteReport) {
      const totalHA = substitutions.reduce((acc, s) => acc + s.totalClasses, 0);
      const startF = format(parseISO(period.start), "dd 'DE' MMMM", { locale: ptBR }).toUpperCase();
      const endF = format(parseISO(period.end), "dd 'DE' MMMM 'DE' yyyy", { locale: ptBR }).toUpperCase();

      const reportTitle = teacher.situacao === "PROFISSIONAL DE APOIO" 
        ? "RELATÓRIO MENSAL DE SUBSTITUIÇÃO - APOIO" 
        : "RELATÓRIO MENSAL DE SUBSTITUIÇÃO";

      return {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "MUNICÍPIO TEODORO SAMPAIO", bold: true, size: 24 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "SECRETARIA MUNICIPAL DE EDUCAÇÃO", size: 18 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "EMEF PEDRO CAMINOTO", bold: true, size: 20 })],
          }),
          new Paragraph({ spacing: { before: 200 } }),

          new Paragraph({
            children: [new TextRun({ text: "CONTROLE INTERNO Nº ______/2026", bold: true, underline: {}, size: 22 })],
          }),
          new Paragraph({ spacing: { before: 400 } }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: reportTitle, bold: true, size: 24 })],
          }),
          new Paragraph({ spacing: { before: 400 } }),

          new Paragraph({
            children: [new TextRun({ text: `Comunicamos a Coordenadoria de Gestão de Pessoal que o(a) ${teacher.situacao === "PROFISSIONAL DE APOIO" ? "Profissional de Apoio" : "Professor(a)"}:`, size: 20 })],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                   new TableCell({
                    columnSpan: 2,
                    children: [new Paragraph({ children: [new TextRun({ text: teacher.situacao === "PROFISSIONAL DE APOIO" ? "Profissional: " : "Professor (a): ", bold: true }), new TextRun({ text: teacher.nome, bold: true })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "CPF: ", bold: true }), new TextRun({ text: teacher.cpf || "" })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "PIS: ", bold: true }), new TextRun({ text: teacher.pis || "" })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Nº Agência Bancária: ", bold: true }), new TextRun({ text: teacher.agencia || "" })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Nº Conta Corrente: ", bold: true }), new TextRun({ text: teacher.conta || "" })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Banco: ", bold: true }), new TextRun({ text: teacher.banco || "" })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Local da Agência: ", bold: true }), new TextRun({ text: teacher.localAgencia || "TEODORO SAMPAIO" })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 2,
                    children: [new Paragraph({ children: [new TextRun({ text: "Período Fechamento: ", bold: true }), new TextRun({ text: `${startF} À ${endF}` })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 2,
                    children: [new Paragraph({ children: [new TextRun({ text: "Endereço: ", bold: true }), new TextRun({ text: teacher.endereco || "" })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Processo Seletivo: ", bold: true }), new TextRun({ text: teacher.processoSeletivo || "" })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Classificação: ", bold: true }), new TextRun({ text: teacher.classificacao || "" })] })],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ spacing: { before: 400 } }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: teacher.situacao === "PROFISSIONAL DE APOIO" ? "Profissional Substituído" : "Professor Substituído", bold: true, italics: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Categoria", bold: true, italics: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Data", bold: true, italics: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Ausência", bold: true, italics: true, size: 18 })] })] }),
                  new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "T. Aulas", bold: true, italics: true, size: 18 })] })] }),
                ],
              }),
              ...substitutions.map(s => {
                return new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.substitutedTeacherName || "", size: 16 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: teacher.situacao === "PROFISSIONAL DE APOIO" ? "PROF. APOIO" : "PEB II", size: 16 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: format(parseISO(s.date), "dd/MM/yyyy"), size: 16 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: s.reason || "", size: 16 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(s.totalClasses).padStart(2, '0'), size: 16 })] })] }),
                  ],
                });
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [] }),
                  new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Total de Aulas (HA):", bold: true, size: 16 })] })] }),
                  new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${totalHA} h/a`, bold: true, size: 18 })] })] }),
                ],
              }),
            ],
          }),

          ...(Object.entries(outrasSedesBySede).length > 0 ? [
            new Paragraph({ spacing: { before: 300 } }),
            new Paragraph({
              children: [
                new TextRun({ text: "OCORRÊNCIAS EM OUTRAS SEDES:", bold: true, color: "C00000", size: 18 }),
              ],
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Sede Responsável", bold: true, size: 14 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Substituído", bold: true, size: 14 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Motivo", bold: true, size: 14 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Substituto", bold: true, size: 14 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Data", bold: true, size: 14 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Aulas", bold: true, size: 14 })] })] }),
                  ],
                }),
                ...Object.entries(outrasSedesBySede).flatMap(([sede, info]) => 
                  info.occurrences.map(o => new TableRow({
                    children: [
                      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: sede, size: 12 })] })] }),
                      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: o.substitutedTeacherName || "", size: 12 })] })] }),
                      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: o.reason || "", size: 12 })] })] }),
                      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: o.teacherName || "", size: 12 })] })] }),
                      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: format(parseISO(o.date), "dd/MM/yyyy"), size: 12 })] })] }),
                      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${o.totalClasses} h/a`, size: 12 })] })] }),
                    ],
                  }))
                ),
                new TableRow({
                  children: [
                    new TableCell({ columnSpan: 5, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "SOMA TOTAL EM OUTRAS SEDES:", bold: true, size: 14 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${outrasSedesSubstitutions.reduce((acc, s) => acc + s.totalClasses, 0)} h/a`, bold: true, size: 14 })] })] }),
                  ],
                }),
              ],
            }),
            new Paragraph({ spacing: { before: 100 } }),
            new Paragraph({
              children: [
                new TextRun({ 
                  text: "OBSERVAÇÃO: O usuário deve enviar por e-mail as aulas acima para cada escola sede responsável informada.", 
                  bold: true, 
                  italics: true,
                  color: "C00000",
                  size: 14 
                }),
              ],
            }),
          ] : []),

          new Paragraph({ spacing: { before: 1200 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Teodoro Sampaio, ${format(parseISO(period.end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.`, size: 18 })],
          }),
          
          new Paragraph({ spacing: { before: 1000 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "_______________________________________________________", size: 18 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Maria Aparecida Ferreira Lifante", bold: true, size: 18 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "RG: 23.651.396-5", size: 16 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Diretora de Escola", size: 16 }),
            ],
          }),
        ],
      };
    }

    // Standard Template (EFETIVO / ACTS)
    const totalUnjustified = Object.values(unjustifiedOccurrences).reduce((acc, v) => acc + v, 0);
    const totalAbsences = Object.values(standardByNature).reduce((acc, dates) => acc + Object.values(dates).reduce((sub, v) => sub + v, 0), 0);
    const totalToPay = (parseInt(teacher.cargaHorariaMensal) || 0) - totalUnjustified;

    const unjustifiedDates = Object.keys(unjustifiedOccurrences).sort().map(d => format(parseISO(d), "dd/MM/yyyy")).join(", ");
    const observationText = totalUnjustified > 0 
      ? `Faltas injustificadas ocorridas em: ${unjustifiedDates}.` 
      : "";

    const startF = format(parseISO(period.start), "dd 'DE' MMMM", { locale: ptBR }).toUpperCase();
    const endF = format(parseISO(period.end), "dd 'DE' MMMM 'DE' yyyy", { locale: ptBR }).toUpperCase();

    return {
      properties: {},
      children: [
        // Header
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "MUNICÍPIO DE TEODORO SAMPAIO", bold: true, size: 20 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "CNPJ Nº. 44.951.515/0001-42", size: 16 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "EMEF \"PEDRO CAMINOTO\"", bold: true, size: 22 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "R. PROFESSORA APARECIDA MARIA DE SOUZA, Nº. 1.700 – VILA FURLAN – FONE: (18) 3282-3533.", size: 14 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "emef.pcaminoto@pmteodorosampaio.sp.gov.br", color: "4472c4", underline: {}, size: 14 }),
          ],
        }),
        new Paragraph({ spacing: { before: 200 } }),

        new Paragraph({
          children: [
            new TextRun({ text: "RELATÓRIO MENSAL DE FREQUÊNCIA", bold: true, underline: {}, size: 20 }),
          ],
        }),
        new Paragraph({ spacing: { before: 100 } }),

        // Teacher Info Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  columnSpan: 2,
                  children: [new Paragraph({ children: [new TextRun({ text: "Professor(a): ", bold: false }), new TextRun({ text: teacher.nome, bold: true })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "RG: ", bold: true }), new TextRun({ text: teacher.rg || "" })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Categoria: ", bold: true }), new TextRun({ text: `PEB II - ${teacher.situacao}` })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Carga Horária Semanal: ", bold: true }), new TextRun({ text: `${teacher.cargaHorariaSemanal} h/a` })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Carga Horária Mensal: ", bold: true }), new TextRun({ text: `${teacher.cargaHorariaMensal} h/a` })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  columnSpan: 2,
                  children: [new Paragraph({ children: [new TextRun({ text: "Período Fechamento: ", bold: true }), new TextRun({ text: `${startF} À ${endF}` })] })],
                }),
              ],
            }),
          ],
        }),
        new Paragraph({ spacing: { before: 200 } }),

        // Main Frequency Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL DE COMPARECIMENTOS:", size: 16 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "30 DIAS", size: 16 })] })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL DE AUSÊNCIAS INJUSTIFICADAS:", size: 16 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: totalUnjustified > 0 ? `${totalUnjustified} h/a` : "", size: 16 })] })] }),
              ],
            }),
            ...naturesList.map(n => {
              const dailyData = standardByNature[n.key] || {};
              const sortedDates = Object.keys(dailyData).sort();
              
              return new TableRow({
                children: [
                  new TableCell({ 
                    verticalAlign: VerticalAlign.CENTER,
                    children: [new Paragraph({ children: [new TextRun({ text: n.label, size: 16 })] })] 
                  }),
                  new TableCell({ 
                    children: sortedDates.length > 0 
                      ? sortedDates.map(d => new Paragraph({ children: [new TextRun({ text: format(parseISO(d), "dd/MM/yyyy"), size: 16 })] }))
                      : [new Paragraph({ children: [new TextRun({ text: "" })] })]
                  }),
                  new TableCell({ 
                    children: sortedDates.length > 0
                      ? sortedDates.map(d => new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${dailyData[d]} h/a`, size: 16 })] }))
                      : [new Paragraph({ children: [new TextRun({ text: "" })] })]
                  }),
                ],
              });
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL DE AUSÊNCIAS:", bold: true, size: 16 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: totalAbsences > 0 ? `${totalAbsences} h/a` : "", bold: true, size: 16 })] })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL GERAL A PAGAR:", bold: true, size: 16 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${totalToPay} h/a`, bold: true, size: 16 })] })] }),
              ],
            }),
          ],
        }),
        new Paragraph({ spacing: { before: 200 } }),

        // Observation
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "OBSERVAÇÃO:", bold: true, size: 16 })] }),
                    new Paragraph({ children: [new TextRun({ text: observationText, size: 14 })] }),
                    new Paragraph({ children: [new TextRun({ text: "\n" })] }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new Paragraph({ spacing: { before: 200 } }),

        // Substitutions Header
        new Paragraph({
          children: [
            new TextRun({ text: "SUBSTITUIÇÕES:", bold: true, size: 16 }),
          ],
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Professor Substituído", size: 14 })] })] }),
                new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Data", size: 14 })] })] }),
                new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Ausência", size: 14 })] })] }),
                new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Total de Aulas", size: 14 })] })] }),
              ],
            }),
            ...substitutions.map(s => new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.substitutedTeacherName || "", size: 14 })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: format(parseISO(s.date), "dd/MM/yyyy"), size: 14 })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: s.reason || "", size: 14 })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${s.totalClasses} h/a`, size: 14 })] })] }),
              ],
            })),
            new TableRow({
              children: [
                new TableCell({ columnSpan: 3, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "TOTAL", bold: true, size: 16 })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${substitutions.reduce((acc, s) => acc + s.totalClasses, 0)} h/a`, bold: true, size: 16 })] })] }),
              ],
            }),
          ],
        }),

        ...(Object.entries(outrasSedesBySede).length > 0 ? [
            new Paragraph({ spacing: { before: 300 } }),
            new Paragraph({
              children: [
                new TextRun({ text: "OCORRÊNCIAS EM OUTRAS SEDES:", bold: true, color: "C00000", size: 18 }),
              ],
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Sede Responsável", bold: true, size: 14 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Substituído", bold: true, size: 14 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Motivo", bold: true, size: 14 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Substituto", bold: true, size: 14 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Data", bold: true, size: 14 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Aulas", bold: true, size: 14 })] })] }),
                  ],
                }),
                ...Object.entries(outrasSedesBySede).flatMap(([sede, info]) => 
                  info.occurrences.map(o => new TableRow({
                    children: [
                      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: sede, size: 12 })] })] }),
                      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: o.substitutedTeacherName || "", size: 12 })] })] }),
                      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: o.reason || "", size: 12 })] })] }),
                      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: o.teacherName || "", size: 12 })] })] }),
                      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: format(parseISO(o.date), "dd/MM/yyyy"), size: 12 })] })] }),
                      new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${o.totalClasses} h/a`, size: 12 })] })] }),
                    ],
                  }))
                ),
                new TableRow({
                  children: [
                    new TableCell({ columnSpan: 5, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "SOMA TOTAL EM OUTRAS SEDES:", bold: true, size: 14 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${outrasSedesSubstitutions.reduce((acc, s) => acc + s.totalClasses, 0)} h/a`, bold: true, size: 14 })] })] }),
                  ],
                }),
              ],
            }),
            new Paragraph({ spacing: { before: 100 } }),
            new Paragraph({
              children: [
                new TextRun({ 
                  text: "OBSERVAÇÃO: O usuário deve enviar por e-mail as aulas acima para cada escola sede responsável informada.", 
                  bold: true, 
                  italics: true,
                  color: "C00000",
                  size: 14 
                }),
              ],
            }),
          ] : []),

        new Paragraph({ spacing: { before: 800 } }),

        // Date and Signature
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ 
              text: `Teodoro Sampaio, ${format(parseISO(period.end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.`,
              size: 18
            }),
          ],
        }),
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "_______________________________________________________", size: 18 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Maria Aparecida Ferreira Lifante", bold: true, size: 18 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "RG: 23.651.396-5", size: 16 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Diretora de Escola", size: 16 }),
          ],
        }),
      ],
    };
  });

  const doc = new Document({
    sections: sections,
  });

  return await Packer.toBlob(doc);
}

export async function generateDashboardReport(
  occurrences: Occurrence[], 
  filterInfo: { teacher?: string; nature?: string; start?: string; end?: string },
  metrics: { totalSubstituted: number; totalAbsences: number },
  images?: { pieChart?: Uint8Array; barChart?: Uint8Array }
): Promise<Blob> {
  const sorted = [...occurrences].sort((a, b) => a.date.localeCompare(b.date));

  const rows = sorted.map(occ => new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: format(parseISO(occ.date), "dd/MM/yyyy"), size: 16 })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: occ.teacherName, size: 16 })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: occ.type === "SUBSTITUTION" ? "SUBSTITUIÇÃO" : (occ.nature || ""), size: 16 })] })] }),
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${occ.totalClasses} h/a`, size: 16 })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: occ.type === "SUBSTITUTION" ? `Subst: ${occ.substitutedTeacherName}` : (occ.reason || ""), size: 14, italics: true })] })] }),
    ],
  }));

  const children: any[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "EMEF PEDRO CAMINOTO", bold: true, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "RELATÓRIO DE OCORRÊNCIAS - GESTÃO", bold: true, size: 20 })],
    }),
    new Paragraph({ spacing: { before: 200 } }),
    new Paragraph({
      children: [
        new TextRun({ text: "Relatório gerado em: ", bold: true, size: 14 }),
        new TextRun({ text: format(new Date(), "dd/MM/yyyy HH:mm"), size: 14 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Filtros: ", bold: true, size: 14 }),
        new TextRun({ text: `Docente: ${filterInfo.teacher || "Todos"} | Natureza: ${filterInfo.nature || "Todas"} | Período: ${filterInfo.start || "Início"} até ${filterInfo.end || "Fim"}` , size: 14}),
      ],
    }),
    new Paragraph({ spacing: { before: 200 } }),
    new Paragraph({
      children: [
        new TextRun({ text: "Métricas do Período:", bold: true, size: 16, underline: {} }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Total de Aulas Substituídas: ", size: 14 }),
        new TextRun({ text: `${metrics.totalSubstituted} h/a`, bold: true, size: 14 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Ausências Registradas: ", size: 14 }),
        new TextRun({ text: `${metrics.totalAbsences} ocorrências`, bold: true, size: 14 }),
      ],
    }),
    new Paragraph({ spacing: { before: 400 } }),
  ];

  if (images?.pieChart) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "Distribuição por Tipo de Ocorrência", bold: true, size: 14 }),
      ],
    }));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          data: images.pieChart,
          transformation: { width: 400, height: 250 },
        } as any),
      ],
    }));
    children.push(new Paragraph({ spacing: { before: 200 } }));
  }

  if (images?.barChart) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "Top 10 Substitutos (Total h/a)", bold: true, size: 14 }),
      ],
    }));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          data: images.barChart,
          transformation: { width: 400, height: 250 },
        } as any),
      ],
    }));
    children.push(new Paragraph({ spacing: { before: 200 } }));
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Detalhamento de Ocorrências:", bold: true, size: 16, underline: {} }),
      ],
    }),
    new Paragraph({ spacing: { before: 200 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "DATA", bold: true, size: 16 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "DOCENTE", bold: true, size: 16 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "NATUREZA", bold: true, size: 16 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "AULAS", bold: true, size: 16 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "DETALHES", bold: true, size: 16 })] })] }),
          ],
        }),
        ...rows,
      ],
    })
  );

  const doc = new Document({
    sections: [{
      children: children,
    }],
  });

  return await Packer.toBlob(doc);
}
