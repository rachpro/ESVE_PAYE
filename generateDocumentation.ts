import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
import * as fs from 'fs';

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "Documentation du Module de Paie (Standard Sage OHADA)",
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                text: "Ce document détaille le fonctionnement interne des calculs de paie de l'application, alignés sur les règles fiscales du Burkina Faso et les standards du logiciel Sage.",
                spacing: { after: 400 },
            }),

            new Paragraph({
                text: "1. Concepts de Base : Salaire de Base vs Salaire Brut",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "• Salaire de Base : ", bold: true }),
                    new TextRun("C'est le montant contractuel fixe. Il sert de base de calcul pour la plupart des rubriques."),
                ],
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "• Salaire Brut : ", bold: true }),
                    new TextRun("C'est la somme de tous les gains (Base + Indemnités de logement, transport, fonction + Primes + Heures Supplémentaires)."),
                ],
                spacing: { after: 200 },
            }),

            new Paragraph({
                text: "2. Cotisations Sociales (CNSS)",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                text: "Conformément à la demande, la CNSS est calculée sur la totalité du Salaire Brut (sans plafond).",
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "• Part Salariale : ", bold: true }),
                    new TextRun("5,5 % du Brut (Pension de vieillesse)."),
                ],
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "• Part Patronale : ", bold: true }),
                    new TextRun("16 % au total (Risques : 3.5%, Vieillesse : 5.5%, Famille : 7%)."),
                ],
                spacing: { after: 200 },
            }),

            new Paragraph({
                text: "3. Calcul de l'IUTS (Système Progressif Sage)",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                text: "L'IUTS est calculé en trois étapes distinctes :",
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Étape A - Détermination du Net Imposable : ", bold: true }),
                    new TextRun("Salaire Brut - CNSS Salariale."),
                ],
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Étape B - Application du Barème par Tranches : ", bold: true }),
                    new TextRun("Le montant passe par un entonnoir fiscal :"),
                ],
            }),

            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tranche (FCFA)", bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Taux", bold: true })] })] }),
                    ]}),
                    new TableRow({ children: [new TableCell({ children: [new Paragraph("0 à 30 000")] }), new TableCell({ children: [new Paragraph("0 %")] })]}),
                    new TableRow({ children: [new TableCell({ children: [new Paragraph("30 001 à 50 000")] }), new TableCell({ children: [new Paragraph("12,1 %")] })]}),
                    new TableRow({ children: [new TableCell({ children: [new Paragraph("50 001 à 80 000")] }), new TableCell({ children: [new Paragraph("13,9 %")] })]}),
                    new TableRow({ children: [new TableCell({ children: [new Paragraph("80 001 à 120 000")] }), new TableCell({ children: [new Paragraph("15,7 %")] })]}),
                    new TableRow({ children: [new TableCell({ children: [new Paragraph("120 001 à 170 000")] }), new TableCell({ children: [new Paragraph("18,4 %")] })]}),
                    new TableRow({ children: [new TableCell({ children: [new Paragraph("170 001 à 250 000")] }), new TableCell({ children: [new Paragraph("21,7 %")] })]}),
                    new TableRow({ children: [new TableCell({ children: [new Paragraph("Plus de 250 000")] }), new TableCell({ children: [new Paragraph("25 %")] })]}),
                ],
            }),

            new Paragraph({
                children: [
                    new TextRun({ text: "Étape C - Réduction pour Charges de Famille : ", bold: true }),
                    new TextRun("Une réduction est appliquée sur l'impôt calculé :"),
                ],
                spacing: { before: 200 },
            }),
            new Paragraph({ text: "• 1 charge : - 8 %" }),
            new Paragraph({ text: "• 2 charges : - 10 %" }),
            new Paragraph({ text: "• 3 charges : - 12 %" }),
            new Paragraph({ text: "• 4 charges : - 14 %" }),

            new Paragraph({
                text: "4. Fonds de Soutien Patriotique (FSP)",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400 },
            }),
            new Paragraph({
                text: "Le FSP est calculé à hauteur de 1 % sur le Salaire Net à payer avant FSP (C'est-à-dire : Brut - CNSS - IUTS).",
            }),

            new Paragraph({
                text: "Conclusion",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400 },
            }),
            new Paragraph({
                text: "Grâce à cette automatisation, l'utilisateur saisit uniquement son Salaire de Base et ses indemnités, et l'application s'occupe de toute la complexité fiscale pour générer un bulletin conforme aux normes OHADA et au logiciel Sage.",
            }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync('documentation_paie.docx', buffer);
    console.log("Document Word généré avec succès à la racine du projet.");
});
