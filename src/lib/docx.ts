import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  PageBreak,
  Header,
  Footer,
  VerticalAlign,
  HeightRule,
} from "docx";
import { format, parseISO, addDays, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Batch, Teacher } from "../types";

export async function generateDocx(batch: Batch): Promise<Blob> {
  if (batch.reportType === "HTPC") {
    return generateHTPCDocx(batch);
  }
  return generateRHDocx(batch);
}

export async function generateRHDocx(batch: Batch): Promise<Blob> {
  const sections = [];
  const entries = Object.values(batch.professores);

  for (let i = 0; i < entries.length; i++) {
    const { teacher: t, absences, observacao } = entries[i];
    const isSubstituto = t.situacao === "SUBSTITUTO";
    const children: any[] = [];

    // Header
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "MUNICÍPIO DE TEODORO SAMPAIO", bold: true, size: 24 }),
          new TextRun({ text: "\nCNPJ Nº. 44.951.515/0001-42", size: 18 }),
          new TextRun({ text: "\nEMEF “PEDRO CAMINOTO”", bold: true, size: 20 }),
          new TextRun({
            text: "\nR. PROFESSORA APARECIDA MARIA DE SOUZA, Nº. 1.700 – VILA FURLAN – FONE: (18) 3282-3533.",
            size: 16,
          }),
          new TextRun({ text: "\nemef.pcaminoto@pmteodorosampaio.sp.gov.br", size: 16 }),
        ],
      })
    );

    children.push(new Paragraph({ text: "", spacing: { before: 200, after: 200 } }));

    if (!isSubstituto && batch.tipo === "EFETIVO") {
      // Template 1: RELATÓRIO MENSAL DE FREQUÊNCIA
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "RELATÓRIO MENSAL DE FREQUÊNCIA", bold: true, size: 22, underline: {} })]
      }));
      children.push(new Paragraph({ text: "" }));

      // Info Box (Efetivo)
      const infoTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Professor(a): ${t.nome.toUpperCase()}`, bold: true, size: 18 })] })], columnSpan: 2 }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `RG: ${t.rg}`, bold: true, size: 18 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Categoria: ${t.categoria} - ${t.situacao}`, bold: true, size: 18 })] })] }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Carga Horária Semanal: ${t.cargaHorariaSemanal} h/a`, bold: true, size: 18 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Carga Horária Mensal: ${t.cargaHorariaMensal} h/a`, bold: true, size: 18 })] })] }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Período Fechamento: ${batch.inicio_f} À ${batch.fim_f}`, bold: true, size: 18 })] })], columnSpan: 2 }),
            ],
          }),
        ],
      });
      children.push(infoTable);
      children.push(new Paragraph({ text: "" }));

      // Frequency Categories Table
      const catTableRows: TableRow[] = [];
      const data = entries[i].efetivoData || emptyEfetivoData();
      
      const config = {
        comparecimentos: "TOTAL DE COMPARECIMENTOS",
        ausenciasInjustificadas: "TOTAL DE AUSÊNCIAS INJUSTIFICADAS",
        atestado: "ATESTADO",
        doacaoSangue: "DOAÇÃO DE SANGUE",
        efetivoExercicio: "EFETIVO EXERCÍCIO",
        faltaAbonada: "FALTA ABONADA",
        ferias: "FÉRIAS",
        folgaAniversario: "FOLGA ANIVERSÁRIO",
        licencaPremio: "LICENÇA PRÊMIO",
        licencaSaude: "LICENÇA SAÚDE",
        luto: "LUTO",
        outrasAusencias: "OUTRAS AUSÊNCIAS",
        recesso: "RECESSO",
        servicoObrigatorio: "SERVIÇO OBRIGATÓRIO",
        teletrabalho: "TELETRABALHO"
      };

      let totalAusencia = 0;

      Object.entries(config).forEach(([key, label]) => {
        let dates = "";
        let ha = "";
        
        if (key === "comparecimentos") {
          dates = "";
          ha = data.comparecimentos || "30 DIAS";
        } else {
          const item = (data as any)[key];
          dates = item.dates || "";
          ha = item.ha ? `${item.ha} h/a` : "";
          totalAusencia += parseFloat(item.ha || "0");
        }
        
        catTableRows.push(new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, size: 16, bold: true })] })], width: { size: 30, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: dates, size: 16 })] })], width: { size: 50, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: ha, size: 16, bold: true })] })], width: { size: 20, type: WidthType.PERCENTAGE } }),
          ]
        }));
      });

      const chMensalValue = parseFloat(t.cargaHorariaMensal) || 0;
      const totalPagarValue = chMensalValue - totalAusencia;

      // Total rows
      catTableRows.push(new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL DE AUSÊNCIAS", size: 16, bold: true })] })], width: { size: 80, type: WidthType.PERCENTAGE }, columnSpan: 2 }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: totalAusencia > 0 ? `${totalAusencia} h/a` : "", size: 16, bold: true })] })], width: { size: 20, type: WidthType.PERCENTAGE } }),
          ]
      }));
      catTableRows.push(new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL GERAL A PAGAR", size: 16, bold: true })] })], width: { size: 80, type: WidthType.PERCENTAGE }, columnSpan: 2 }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${totalPagarValue} h/a`, size: 16, bold: true })] })], width: { size: 20, type: WidthType.PERCENTAGE } }),
          ]
      }));

      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: catTableRows }));
      children.push(new Paragraph({ text: "" }));
      
      // Observacao
      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            height: { value: 600, rule: HeightRule.ATLEAST },
            children: [
              new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun({ text: "OBSERVAÇÃO:", bold: true, size: 18 })] }),
                  new Paragraph({ children: [new TextRun({ text: observacao || "", size: 16 })] }),
                ],
              })
            ]
          })
        ]
      }));
      children.push(new Paragraph({ text: "" }));

      // Substituicoes Section (Bottom for Efetivo)
      children.push(new Paragraph({ children: [new TextRun({ text: "SUBSTITUIÇÕES:", bold: true, size: 18 })] }));
      
      const totalSubAulas = absences.reduce((acc, a) => acc + (parseFloat(a.aulas || "0")), 0);
      
      const subTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: ["Professor Substituído", "Data", "Ausência", "Total de Aulas"].map(h => 
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, size: 14, bold: true })] })] }))
          }),
          ...absences.map(abs => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: abs.justificativa || "", size: 14 })] })] }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: abs.data ? format(parseISO(abs.data), "dd/MM/yyyy") : "", size: 14 })] })] }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: abs.tipo, size: 14 })] })] }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: abs.aulas ? `${abs.aulas} h/a` : "", size: 14 })] })] }),
            ]
          })),
          ...(absences.length < 3 ? Array(3 - absences.length).fill(null).map(() => new TableRow({
            height: { value: 400, rule: HeightRule.ATLEAST },
            children: Array(4).fill(null).map(() => new TableCell({ children: [new Paragraph({ text: "" })] }))
          })) : []),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "TOTAL", bold: true, size: 16 })] })], columnSpan: 3 }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${totalSubAulas} h/a`, bold: true, size: 16 })] })] }),
            ]
          })
        ]
      });
      children.push(subTable);

    } else {
      // Template 2: RELATÓRIO MENSAL DE SUBSTITUIÇÃO (For SUBSTUTUTO batch type)
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "RELATÓRIO MENSAL DE SUBSTITUIÇÃO", bold: true, size: 22, underline: {} })]
      }));
      children.push(new Paragraph({ text: "" }));
      children.push(new Paragraph({ children: [new TextRun({ text: "Comunicamos a Coordenadoria de Gestão de Pessoal que a Professor(a):", size: 16 })] }));

      // Info Box (Substituto)
      const subInfoTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Professor (a): ${t.nome.toUpperCase()}`, bold: true, size: 18 })] })], columnSpan: 2 })] }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `CPF: ${t.cpf}`, bold: true, size: 18 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `PIS: ${t.pis}`, bold: true, size: 18 })] })] }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Nº Agência Bancária: ${t.agencia}`, bold: true, size: 18 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Nº Conta Corrente: ${t.conta}`, bold: true, size: 18 })] })] }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Banco: ${t.banco}`, bold: true, size: 18 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Local da Agência: ${t.localAgencia}`, bold: true, size: 18 })] })] }),
            ]
          }),
          new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Período Fechamento: ${batch.inicio_f} À ${batch.fim_f}`, bold: true, size: 18 })] })], columnSpan: 2 })] }),
          new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Endereço: ${t.endereco}`, bold: true, size: 18 })] })], columnSpan: 2 })] }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Processo Seletivo: ${t.processoSeletivo}`, bold: true, size: 18 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Classificação: ${t.classificacao}`, bold: true, size: 18 })] })] }),
            ]
          }),
        ]
      });
      children.push(subInfoTable);
      children.push(new Paragraph({ text: "" }));

      // Substitution Details Table
      const detailTableRows: TableRow[] = [
        new TableRow({
          children: ["Professor Substituído", "Categoria", "Data", "Ausência", "T. Aulas"].map(h => 
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, size: 14, bold: true })] })] }))
        })
      ];

      absences.forEach(abs => {
        detailTableRows.push(new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: abs.justificativa || "", size: 14 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: abs.categoria || "", size: 14 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: abs.data ? format(parseISO(abs.data), "dd/MM/yyyy") : "", size: 14 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: abs.tipo, size: 14 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: abs.aulas || "", size: 14 })] })] }),
          ]
        }));
      });

      // Fill empty rows if needed
      while (detailTableRows.length < 5) {
        detailTableRows.push(new TableRow({
          height: { value: 400, rule: HeightRule.ATLEAST },
          children: Array(5).fill(null).map(() => new TableCell({ children: [new Paragraph({ text: "" })] }))
        }));
      }

      const totalAulas = absences.reduce((acc, a) => acc + (parseFloat(a.aulas || "0")), 0);
      detailTableRows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Total de Aulas (HA):", bold: true, size: 16 })] })], columnSpan: 4 }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${totalAulas} h/a`, bold: true, size: 16 })] })] }),
        ]
      }));

      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: detailTableRows }));
    }

    // Common Footer (City and Date)
    children.push(new Paragraph({ text: "", spacing: { before: 800 } }));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Teodoro Sampaio, ${batch.fim_f.split('/')[0]} de ${format(parseISO(batch.fim), "MMMM", { locale: ptBR })} de ${batch.fim_f.split('/')[2]}.`, size: 18 })]
    }));

    if (i < entries.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }

    sections.push({
      properties: {
        margin: { top: 576, bottom: 576, left: 720, right: 720 },
      },
      children,
    });
  }

  const doc = new Document({ sections });
  return Packer.toBlob(doc);
}

export async function generateHTPCDocx(batch: Batch): Promise<Blob> {
  const sections = [];
  const entries = Object.values(batch.professores);

  for (let i = 0; i < entries.length; i++) {
    const { teacher: t } = entries[i];
    const children: any[] = [];

    // Common Header
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "MUNICÍPIO DE TEODORO SAMPAIO", bold: true, size: 24 }),
          new TextRun({ text: "\nCNPJ Nº. 44.951.515/0001-42", size: 18 }),
          new TextRun({ text: "\nEMEF “PEDRO CAMINOTO”", bold: true, size: 20 }),
          new TextRun({
            text: "\nR. PROFESSORA APARECIDA MARIA DE SOUZA, Nº. 1.700 – VILA FURLAN – FONE: (18) 3282-3533.",
            size: 16,
          }),
          new TextRun({ text: "\nemef.pcaminoto@pmteodorosampaio.sp.gov.br", size: 16 }),
        ],
      })
    );

    children.push(new Paragraph({ text: "", spacing: { before: 200, after: 200 } }));

    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "CONTROLE DE SUPORTE PEDAGÓGICO", bold: true, size: 22, underline: {} })]
    }));

    children.push(new Paragraph({ text: "", spacing: { before: 200 } }));

    // Info Table
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Professor(a): ${t.nome.toUpperCase()}`, bold: true, size: 18 })] })], columnSpan: 2 }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `RG: ${t.rg}`, bold: true, size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Categoria: ${t.categoria} - ${t.situacao}`, bold: true, size: 18 })] })] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Carga Horária Semanal: ${t.cargaHorariaSemanal} h/a`, bold: true, size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Disciplina: ${t.disciplina}`, bold: true, size: 18 })] })] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Mês de Referência: ${format(parseISO(batch.fim), "MMMM 'de' yyyy", { locale: ptBR })}`, bold: true, size: 18 })] })], columnSpan: 2 }),
          ],
        }),
      ]
    }));

    children.push(new Paragraph({ text: "", spacing: { before: 400 } }));

    // Schedule Table
    const tableRows: TableRow[] = [
      new TableRow({
        children: ["DIA DA SEMANA", "HTPC", "HSP (I)", "HSP (II)", "HE"].map(h => 
          new TableCell({ 
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, size: 14, bold: true })] })],
            shading: { fill: "f0f0f0" }
          })
        )
      })
    ];

    const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
    dias.forEach(dia => {
      const entry = t.agenda[dia] || { HTPC: ["", ""], HSP1: ["", ""], HSP2: ["", ""], HE: ["", ""] };
      tableRows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: dia.toUpperCase(), size: 14, bold: true })] })], shading: { fill: "f9f9f9" } }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${entry.HTPC[0]} - ${entry.HTPC[1]}`, size: 14 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${entry.HSP1[0]} - ${entry.HSP1[1]}`, size: 14 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${entry.HSP2[0]} - ${entry.HSP2[1]}`, size: 14 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${entry.HE[0]} - ${entry.HE[1]}`, size: 14 })] })] }),
        ]
      }));
    });

    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }));

    // Footer
    children.push(new Paragraph({ text: "", spacing: { before: 800 } }));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "________________________________________", size: 18 })],
    }));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "ASSINATURA DO PROFESSOR", bold: true, size: 16 })],
    }));

    children.push(new Paragraph({ text: "", spacing: { before: 400 } }));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Teodoro Sampaio, ${batch.fim_f.split('/')[0]} de ${format(parseISO(batch.fim), "MMMM", { locale: ptBR })} de ${batch.fim_f.split('/')[2]}.`, size: 18 })]
    }));

    if (i < entries.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }

    sections.push({
      properties: { margin: { top: 576, bottom: 576, left: 720, right: 720 } },
      children,
    });
  }

  const doc = new Document({ sections });
  return Packer.toBlob(doc);
}

function emptyEfetivoData(): any {
  return {
    comparecimentos: "30 DIAS",
    ausenciasInjustificadas: { dates: "", ha: "" },
    atestado: { dates: "", ha: "" },
    doacaoSangue: { dates: "", ha: "" },
    efetivoExercicio: { dates: "", ha: "" },
    faltaAbonada: { dates: "", ha: "" },
    ferias: { dates: "", ha: "" },
    folgaAniversario: { dates: "", ha: "" },
    licencaPremio: { dates: "", ha: "" },
    licencaSaude: { dates: "", ha: "" },
    luto: { dates: "", ha: "" },
    outrasAusencias: { dates: "", ha: "" },
    recesso: { dates: "", ha: "" },
    servicoObrigatorio: { dates: "", ha: "" },
    teletrabalho: { dates: "", ha: "" },
  };
}
