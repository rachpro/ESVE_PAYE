import React, { useRef } from 'react';
import { PayrollSlipData } from '../types';
import { Printer, Download, Eye, X } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';

interface PayrollSlipProps {
  data: PayrollSlipData;
  autoDownload?: boolean;
  onComplete?: () => void;
}

export const PayrollSlip: React.FC<PayrollSlipProps> = ({ data, autoDownload, onComplete }) => {
  const slipRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [showFullPreview, setShowFullPreview] = React.useState(false);

  React.useEffect(() => {
    if (autoDownload) {
      const timer = setTimeout(() => {
        if (slipRef.current) {
          handleDownloadPDF().then(() => {
            if (onComplete) onComplete();
          });
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoDownload]);

  const handlePrint = () => {
    if (!slipRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("La fenêtre d'impression a été bloquée. Veuillez autoriser les pop-ups pour cette application.");
      return;
    }

    const content = slipRef.current.innerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>Impression Bulletin de Paie - ${data.employee.lastName}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 20px; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            @page { size: A4; margin: 0; }
            @media print {
              body { padding: 0; margin: 0; }
            }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
          <div class="max-w-[210mm] mx-auto">
            ${content}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    if (!slipRef.current || isDownloading) return;
    
    try {
      setIsDownloading(true);
      const element = slipRef.current;

      const images = Array.from(element.getElementsByTagName('img')) as HTMLImageElement[];
      const imagePromises = images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });
      await Promise.all(imagePromises);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            try {
              let cssText = styleTags[i].innerHTML;
              cssText = cssText.replace(/okl(ab|ch)\s*\([^)]+\)/gi, '#000000');
              cssText = cssText.replace(/--[\w-]+\s*:\s*okl(ab|ch)\s*\([^)]+\)/gi, '--fixed-color: #000000');
              styleTags[i].innerHTML = cssText;
            } catch (styleErr) { /* ignore */ }
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      let finalWidth = pdfWidth;
      let finalHeight = (canvas.height * pdfWidth) / canvas.width;
      
      if (finalHeight > pdfPageHeight) {
        finalHeight = pdfPageHeight;
        finalWidth = (canvas.width * pdfPageHeight) / canvas.height;
      }
      
      const xOffset = (pdfWidth - finalWidth) / 2;
      pdf.addImage(imgData, 'JPEG', xOffset, 0, finalWidth, finalHeight);
      pdf.save(`bulletin_paie_${(data.employee.lastName || 'doc').replace(/\s+/g, '_')}_${(data.period || 'period').replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Erreur PDF:", error);
      alert("Le téléchargement direct a échoué. Utilisez la fonction 'Imprimer' et sauvegardez en PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const renderSlip = () => {
    const config = data.company.templateConfig || {
      showCategory: true,
      showSeniority: true,
      showContractType: true,
      showSocialSecurity: true,
      showNiveau: true,
      showCoefficient: true,
      showIndice: true,
      showDepartment: false,
      showQualification: false,
      showLeaveInfo: true,
    };

    const visibleFields = [
      { label: 'Matricule', value: data.employee.matricule || '-', isMono: true },
      { label: 'Coefficient', value: data.employee.coefficient || '-' },
      { label: 'Horaire', value: `${(data.employee.workingHours || 173.33).toLocaleString('fr-FR', { minimumFractionDigits: 3 })}` },
      { label: 'Emploi', value: data.employee.position },
      { label: 'Convention collective', value: data.convention || 'CCN' },
    ];

    const extraFields = [
      { label: 'Nom et Prénoms', value: `${data.employee.lastName} ${data.employee.firstName}`, isBold: true },
      { label: "Date d'embauche", value: data.employee.hireDate ? new Date(data.employee.hireDate).toLocaleDateString('fr-FR') : '-' },
      ...(config.showCategory ? [{ label: 'Catégorie / Échelon', value: data.employee.category || '-' }] : []),
      ...(config.showSeniority ? [{ label: 'Ancienneté', value: data.employee.seniority || '-' }] : []),
      ...(config.showSocialSecurity ? [{ label: 'N° CNSS salarié', value: data.employee.socialSecurityNumber || '-', isMono: true }] : []),
    ];

    return (
    <div className="bg-[#ffffff] p-6 w-full max-w-[210mm] mx-auto min-h-[297mm] font-sans text-[10px] leading-snug text-[#1e293b] flex flex-col shadow-none border-none relative">
      {/* Top Header */}
      <div className="flex justify-between items-start mb-4 border-b-2 border-blue-600 pb-4">
        <div className="w-1/2 space-y-0.5">
          <h2 className="text-xl font-black text-[#2563eb] mb-0.5 uppercase leading-tight">{data.company.name}</h2>
          <div className="text-[9px] text-[#64748b] leading-tight space-y-0.5">
            <p className="font-bold">{data.company.address}</p>
            {data.company.phone && <p>Tél: {data.company.phone}</p>}
            <p>RCCM : {data.company.rccm || '-'} | IFU : {data.company.ifu || '-'}</p>
            <p>N° SIRET : {data.company.siret || '-'} | APE / NAF : {data.company.ape || '-'}</p>
            <p>N° CNSS employeur : {data.company.cnssEmployer || '-'}</p>
          </div>
        </div>
        <div className="w-1/2 text-right">
           <h1 className="text-2xl font-black text-[#1e293b] mb-0.5 tracking-tighter">BULLETIN DE PAIE</h1>
           <div className="space-y-0.5 mt-1">
             <p className="text-xs font-black bg-[#2563eb] text-white px-3 py-1 rounded inline-block">Période : {data.period}</p>
             <div className="text-[9px] text-[#64748b] pt-1 font-bold uppercase tracking-wider">
               <p>Date de paiement : {new Date(data.paymentDate).toLocaleDateString('fr-FR')}</p>
               <p>Convention : {data.convention || 'Commerce Général'}</p>
             </div>
           </div>
        </div>
      </div>

      {/* Employee Info Block */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="border-2 border-[#1e293b] rounded overflow-hidden shadow-sm">
            {visibleFields.map((field, idx) => (
              <div key={idx} className={`grid grid-cols-2 divide-x-2 divide-[#1e293b] ${idx < visibleFields.length - 1 ? 'border-b-2 border-[#1e293b]' : ''}`}>
                <div className="p-1 px-2 bg-[#f8fafc] font-black text-[#64748b] text-[8px] uppercase flex items-center">
                  {field.label}
                </div>
                <div className="p-1 px-2 flex items-center font-bold text-[#1e293b] text-[9px]">
                  {field.value}
                </div>
              </div>
            ))}
          </div>
          <div className="border-2 border-[#1e293b] rounded overflow-hidden shadow-sm">
            {extraFields.map((field, idx) => (
              <div key={idx} className={`grid grid-cols-2 divide-x-2 divide-[#1e293b] ${idx < extraFields.length - 1 ? 'border-b-2 border-[#1e293b]' : ''}`}>
                <div className="p-1 px-2 bg-[#f8fafc] font-black text-[#64748b] text-[8px] uppercase flex items-center">
                  {field.label}
                </div>
                <div className={`p-1 px-2 flex items-center leading-tight ${field.isBold ? 'font-black text-[10px] uppercase text-[#1e293b]' : 'font-bold text-[#1e293b] text-[9px]'}`}>
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Optional Extra Fields & Leave Info (Compact Row) */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="grid grid-cols-3 gap-1">
            {config.showNiveau && data.employee.niveau && <div className="bg-[#f8fafc] border border-[#e2e8f0] p-1.5 rounded text-[8px] font-bold uppercase"><span className="text-[#64748b]">Niveau:</span> {data.employee.niveau}</div>}
            {config.showCoefficient && data.employee.coefficient && <div className="bg-[#f8fafc] border border-[#e2e8f0] p-1.5 rounded text-[8px] font-bold uppercase"><span className="text-[#64748b]">Coeff:</span> {data.employee.coefficient}</div>}
            {config.showIndice && data.employee.indice && <div className="bg-[#f8fafc] border border-[#e2e8f0] p-1.5 rounded text-[8px] font-bold uppercase"><span className="text-[#64748b]">Indice:</span> {data.employee.indice}</div>}
          </div>
          {config.showLeaveInfo !== false && (
            <div className="bg-blue-50/50 border border-blue-100 rounded px-3 py-1 flex justify-between items-center text-[8px] font-bold text-blue-800">
              <span>Congés Acquis: {data.leaveAcquired || 2.5}j</span>
              <span className="w-px h-3 bg-blue-200"></span>
              <span>Pris: {data.leaveTaken || 0}j</span>
              <span className="w-px h-3 bg-blue-200"></span>
              <span className="text-blue-900">Solde: {data.leaveBalance || 22.5}j</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1">
        <table className="w-full border-2 border-[#1e293b] text-[9px] border-collapse">
          <thead className="bg-[#f8fafc] text-[#1e293b] uppercase font-black text-[7px] tracking-tight border-b-2 border-[#1e293b]">
            <tr className="divide-x divide-[#1e293b]">
              <th rowSpan={2} className="p-1 px-2 text-left align-middle w-[25%] uppercase">Désignation</th>
              <th rowSpan={2} className="p-1 px-1 text-center align-middle w-12 border-l-2 border-[#1e293b]">Nombre</th>
              <th rowSpan={2} className="p-1 px-1 text-right align-middle w-20">Base</th>
              <th colSpan={3} className="p-1 text-center border-b border-[#1e293b]">Part salariale</th>
              <th colSpan={3} className="p-1 text-center border-l-2 border-[#1e293b] border-b border-[#1e293b]">Part patronale</th>
            </tr>
            <tr className="divide-x divide-[#1e293b]">
              <th className="p-1 text-center w-12">Taux</th>
              <th className="p-1 text-right w-20">Gain</th>
              <th className="p-1 text-right w-20 border-r-2 border-[#1e293b]">Retenue</th>
              <th className="p-1 text-center w-12">Taux</th>
              <th className="p-1 text-right w-20">Retenue (+)</th>
              <th className="p-1 text-right w-20">Retenue (-)</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.filter(l => l.label === "NB Charges").map((line, idx) => (
              <tr key={`info-${idx}`} className="border-b border-[#1e293b] leading-tight">
                <td className="p-1 px-2 font-medium">{line.label}</td>
                <td className="p-1 px-1 text-center font-bold border-l-2 border-[#1e293b]">{line.nombre?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '1,00'}</td>
                <td className="p-1 px-1 text-right font-bold border-l border-[#1e293b]">{line.base?.toLocaleString() || '0'}</td>
                <td className="p-1 px-1 text-center text-gray-300 border-l border-[#1e293b]">—</td>
                <td className="p-1 px-1 text-right font-bold border-l border-[#1e293b]">{line.amount?.toLocaleString() || '0'}</td>
                <td className="p-1 px-1 text-right text-gray-300 border-l border-[#1e293b] border-r-2">—</td>
                <td className="p-1 px-1 text-center text-gray-300">—</td>
                <td className="p-1 px-1 text-right text-gray-300 border-l border-[#1e293b]">—</td>
                <td className="p-1 px-1 text-right text-gray-300 border-l border-[#1e293b]">—</td>
              </tr>
            ))}

            {data.lines.filter(l => l.type === 'earning' || l.label === "SALAIRE BRUT").map((line, idx) => (
              <tr key={`${line.label}-${idx}`} className={`border-b leading-tight ${line.label === "SALAIRE BRUT" ? "bg-gray-50 font-black border-t-2 border-b-2 border-[#1e293b]" : "border-gray-100"}`}>
                <td className="p-1 px-2 font-medium">{line.label}</td>
                <td className="p-1 px-1 text-center font-bold border-l-2 border-[#1e293b]">{line.nombre?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || (line.label === "SALAIRE BRUT" ? '' : '30,00')}</td>
                <td className="p-1 px-1 text-right font-bold border-l border-[#1e293b]">{line.base?.toLocaleString() || (line.label === "SALAIRE BRUT" ? line.amount.toLocaleString() : line.amount.toLocaleString())}</td>
                <td className="p-1 px-1 text-center font-bold border-l border-[#1e293b] line-clamp-1">
                  {line.rate ? line.rate.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : 
                  (line.label === "SALAIRE BRUT" ? '' : (line.label.toLowerCase().includes('base') || line.label.toLowerCase().includes('salaire') || line.label.toLowerCase().includes('indemnité') ? '3000,00' : ''))}
                </td>
                <td className="p-1 px-1 text-right font-bold border-l border-[#1e293b]">{line.amount.toLocaleString()}</td>
                <td className="p-1 px-1 text-right text-gray-300 border-l border-[#1e293b] border-r-2">—</td>
                <td className="p-1 px-1 text-center text-gray-400 border-l border-[#1e293b]">—</td>
                <td className="p-1 px-1 text-right text-gray-300 border-l border-[#1e293b]">—</td>
                <td className="p-1 px-1 text-right text-gray-300 border-l border-[#1e293b]">—</td>
              </tr>
            ))}

            {/* Removed redundant hardcoded Total Brut row as it's now a dynamic line if present */}
            {!data.lines.some(l => l.label === "SALAIRE BRUT") && (
              <tr className="bg-white font-bold border-b-2 border-[#1e293b]">
                <td colSpan={1} className="p-1.5 px-10 text-[9px] uppercase italic text-center">Total Brut</td>
                <td className="border-l-2 border-[#1e293b]"></td>
                <td className="border-l border-[#1e293b]"></td>
                <td className="border-l border-[#1e293b]"></td>
                <td className="p-1.5 text-right text-[10px] border-l border-[#1e293b] bg-gray-50">{data.grossSalary.toLocaleString()}</td>
                <td className="border-l border-[#1e293b] border-r-2"></td>
                <td className="border-l border-[#1e293b]"></td>
                <td className="border-l border-[#1e293b]"></td>
                <td className="border-l border-[#1e293b]"></td>
              </tr>
            )}

            {data.lines.filter(l => l.type === 'deduction' && l.label !== "RETENUE FSP 1%").map((line, idx) => (
              <tr key={`deduction-${idx}`} className="border-b border-gray-100 leading-tight">
                <td className="p-1 px-2 font-medium">{line.label}</td>
                <td className="p-1 px-1 text-center text-gray-300 border-l-2 border-[#1e293b]"></td>
                <td className="p-1 px-1 text-right font-bold border-l border-[#1e293b]">{line.base?.toLocaleString() || (line.label === "TPA" ? data.grossSalary.toLocaleString() : '')}</td>
                <td className="p-1 px-1 text-center font-bold border-l border-[#1e293b]">{line.rate ? Number(line.rate).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : (Number(line.amount) > 0 ? '' : '0,00')}</td>
                <td className="p-1 px-1 text-right text-gray-300 border-l border-[#1e293b]"></td>
                <td className="p-1 px-1 text-right font-bold border-l border-[#1e293b] border-r-2">{Number(line.amount) > 0 ? line.amount.toLocaleString() : '0'}</td>
                <td className="p-1 px-1 text-center font-bold border-l border-[#1e293b]">{line.employerRate ? Number(line.employerRate).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : ''}</td>
                <td className="p-1 px-1 text-right text-gray-300 border-l border-[#1e293b]"></td>
                <td className="p-1 px-1 text-right font-bold border-l border-[#1e293b] text-slate-800">{line.employerAmount?.toLocaleString() || '0'}</td>
              </tr>
            ))}

            <tr className="bg-white font-bold border-t-2 border-[#1e293b] border-b-2">
              <td colSpan={1} className="p-1.5 px-10 text-[9px] uppercase italic text-center">Total Cotisations</td>
              <td className="border-l-2 border-[#1e293b]"></td>
              <td className="border-l border-[#1e293b]"></td>
              <td className="border-l border-[#1e293b]"></td>
              <td className="border-l border-[#1e293b]"></td>
              <td className="p-1.5 text-right text-[10px] border-l border-[#1e293b] border-r-2 bg-gray-50">{data.lines.filter(l => l.type === 'deduction' && l.label !== "RETENUE FSP 1%").reduce((acc, l) => acc + Number(l.amount), 0).toLocaleString()}</td>
              <td className="border-l border-[#1e293b]"></td>
              <td className="border-l border-[#1e293b]"></td>
              <td className="p-1.5 text-right text-[10px] border-l border-[#1e293b] bg-gray-50">{data.totalEmployerCharges?.toLocaleString()}</td>
            </tr>

            {/* FSP Section with Sage rendering */}
            {data.lines.filter(l => l.label === "RETENUE FSP 1%").map((line, idx) => (
              <tr key={`fsp-${idx}`} className="leading-tight border-b-2 border-[#1e293b]">
                <td className="p-1 px-2 font-bold uppercase">{line.label}</td>
                <td className="p-1 px-1 text-center text-gray-300 border-l-2 border-[#1e293b]"></td>
                <td className="p-1 px-1 text-right font-bold border-l border-[#1e293b]">{line.base?.toLocaleString() || (idx === 0 ? data.grossSalary.toLocaleString() : '')}</td>
                <td className="p-1 px-1 text-center font-bold border-l border-[#1e293b]">{line.rate ? Number(line.rate).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '1,00'}</td>
                <td className="p-1 px-1 text-right text-gray-300 border-l border-[#1e293b]"></td>
                <td className="p-1 px-1 text-right font-black border-l border-[#1e293b] border-r-2 text-[10px]">{line.amount.toLocaleString()}</td>
                <td className="p-1 px-1 text-center border-l border-[#1e293b]"></td>
                <td className="p-1 px-1 text-right border-l border-[#1e293b]"></td>
                <td className="p-1 px-1 text-right border-l border-[#1e293b]"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Net Pay Bar (Prominent Styling) */}
      <div className="mt-4">
        <div className="flex items-stretch rounded-xl overflow-hidden border-8 border-[#1e293b] shadow-xl">
          <div className="bg-[#1e293b] text-white p-5 flex-1 flex flex-col justify-center">
            <h4 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">NET À PAYER AU SALARIÉ</h4>
            <p className="text-[10px] text-blue-400 italic font-bold">Total net après déduction des cotisations et impôts</p>
          </div>
          <div className="bg-blue-600 flex items-center justify-center px-12 border-l-8 border-[#1e293b]">
            <span className="text-4xl font-black text-white tabular-nums tracking-tighter drop-shadow-md">
              {data.netPay.toLocaleString('fr-FR')} 
              <span className="text-xl opacity-80 ml-2">FCFA</span>
            </span>
          </div>
        </div>
      </div>

      {/* Cumuls Table (Compact) */}
      {data.ytdGrossSalary ? (
        <div className="mt-4 border-2 border-[#cbd5e1] rounded-lg overflow-hidden">
          <table className="w-full text-center text-[9px] border-collapse">
            <thead className="bg-[#f8fafc] border-b-2 border-[#cbd5e1]">
              <tr className="divide-x-2 divide-[#cbd5e1] text-[#1e293b] font-black uppercase tracking-widest text-[8px]">
                <th className="py-1.5 w-24 italic bg-slate-50">CUMULS</th>
                <th className="py-1.5">Salaire Brut</th>
                <th className="py-1.5">Net Imposable</th>
                <th className="py-1.5">Charges Sal.</th>
                <th className="py-1.5">Charges Pat.</th>
                <th className="py-1.5">IUTS</th>
                <th className="py-1.5">Heures Trav.</th>
              </tr>
            </thead>
            <tbody>
              <tr className="divide-x-2 divide-[#cbd5e1] font-bold">
                <td className="py-1.5 bg-[#f8fafc] uppercase text-[8px] font-black">Période</td>
                <td className="py-1.5">{data.grossSalary.toLocaleString()}</td>
                <td className="py-1.5">{data.netImposable?.toLocaleString() || '-'}</td>
                <td className="py-1.5">{(data.grossSalary - data.netPay).toLocaleString()}</td>
                <td className="py-1.5">{(data.totalEmployerCost - data.grossSalary).toLocaleString()}</td>
                <td className="py-1.5">{data.incomeTax.toLocaleString()}</td>
                <td className="py-1.5">{data.workingHours || '173'}</td>
              </tr>
              <tr className="divide-x-2 divide-[#cbd5e1] border-t-2 border-[#cbd5e1] text-[#1e293b] bg-slate-50 font-black">
                <td className="py-1.5 bg-[#f8fafc] italic">Cumul Annuel</td>
                <td className="py-1.5">{data.ytdGrossSalary.toLocaleString()}</td>
                <td className="py-1.5">{data.ytdNetImposable?.toLocaleString() || '-'}</td>
                <td className="py-1.5">{data.ytdEmployeeCharges?.toLocaleString() || '-'}</td>
                <td className="py-1.5">{data.ytdEmployerCharges?.toLocaleString() || '-'}</td>
                <td className="py-1.5">{data.ytdIncomeTax?.toLocaleString() || '-'}</td>
                <td className="py-1.5">{data.ytdWorkingHours || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Signature Section (Compact) */}
      <div className="mt-6 grid grid-cols-2 gap-10 mb-4 px-4">
        <div className="space-y-4">
          <div className="border-b-4 border-[#2563eb] pb-0.5 w-fit">
            <p className="font-black text-[11px] uppercase tracking-widest text-[#2563eb]">L'EMPLOYEUR</p>
          </div>
          <div className="h-20 w-full border-2 border-dashed border-gray-200 bg-[#fefefe] rounded-xl flex flex-col items-center justify-center text-gray-300">
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Cachet et Signature</span>
          </div>
        </div>
        <div className="space-y-4 text-right">
          <div className="border-b-4 border-[#1e293b] pb-0.5 w-fit ml-auto">
            <p className="font-black text-[11px] uppercase tracking-widest text-[#1e293b]">LE SALARIÉ</p>
          </div>
          <p className="text-[8px] text-[#64748b] leading-tight font-bold italic uppercase">Signature précédée de la mention « Lu et approuvé »</p>
          <div className="h-20 w-full border-b-2 border-[#1e293b] mt-2 relative">
            {data.signatureDate && (
              <span className="absolute bottom-1 left-0 text-[7px] text-gray-400 font-bold">Fait le : {new Date(data.signatureDate).toLocaleDateString('fr-FR')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Legal */}
      <div className="mt-auto pt-4 border-t-2 border-dashed border-gray-100 flex flex-col items-center gap-1">
        {config.slipFooterText ? (
          <p className="text-[9px] text-[#64748b] text-center w-full max-w-lg leading-relaxed font-bold whitespace-pre-wrap">
            {config.slipFooterText}
          </p>
        ) : null}
        <p className="text-[8px] text-[#94a3b8] italic text-center w-full max-w-lg leading-relaxed font-medium">
          Ce bulletin de paie doit être conservé sans limitation de durée | Conformément au Code du Travail du Burkina Faso (Loi n°028-2008/AN)
        </p>
      </div>
    </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-3 no-print">
        <button 
          onClick={() => setShowFullPreview(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl hover:bg-gray-50 transition-all text-sm font-bold text-[#64748b] shadow-sm"
        >
          <Eye size={18} />
          Aperçu
        </button>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl hover:bg-gray-50 transition-all text-sm font-bold text-[#64748b] shadow-sm"
        >
          <Printer size={18} />
          Imprimer
        </button>
        <button 
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#2563eb] text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all text-sm font-bold disabled:opacity-70 shadow-md shadow-blue-100"
        >
          {isDownloading ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Download size={18} />
          )}
          {isDownloading ? 'Génération...' : 'Télécharger PDF'}
        </button>
      </div>

      <div ref={slipRef} id="payroll-slip" className="max-w-[210mm] mx-auto print:shadow-none bg-white rounded-2xl shadow-xl overflow-hidden">
        {renderSlip()}
      </div>

      {/* Full Screen Preview Modal */}
      <AnimatePresence>
        {showFullPreview && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-6xl h-full flex flex-col gap-6"
            >
              <div className="flex justify-between items-center text-white px-2">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight underline decoration-blue-500 underline-offset-8">Aperçu du Bulletin</h2>
                  <p className="text-sm text-gray-400 font-medium">{data.employee.firstName} {data.employee.lastName.toUpperCase()} — {data.period}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all font-bold backdrop-blur-md border border-white/20"
                  >
                    <Printer size={18} />
                    Imprimer
                  </button>
                  <button 
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#2563eb] text-white rounded-full hover:shadow-2xl hover:shadow-blue-500/30 transition-all font-black border-2 border-blue-400 shadow-xl"
                  >
                    <Download size={20} />
                    {isDownloading ? 'Génération...' : 'Télécharger'}
                  </button>
                  <button onClick={() => setShowFullPreview(false)} className="p-3 bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 rounded-full transition-all border border-white/10">
                    <X size={32} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto rounded-[2rem] bg-[#1e293b]/60 shadow-inner border border-white/5 p-8 flex justify-center custom-scrollbar">
                <div className="bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] origin-top transform scale-[0.6] sm:scale-[0.75] md:scale-[0.85] lg:scale-100 transition-transform duration-500">
                   {renderSlip()}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }

        @media print {
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .no-print, header, nav, aside, footer { display: none !important; }
          #payroll-slip { 
            box-shadow: none !important; 
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
          }
          .rounded-2xl { border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
};
