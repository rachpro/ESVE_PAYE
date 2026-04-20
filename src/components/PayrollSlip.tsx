import React, { useRef } from 'react';
import { PayrollSlipData } from '../types';
import { Printer, Download, Eye, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';

interface PayrollSlipProps {
  data: PayrollSlipData;
}

export const PayrollSlip: React.FC<PayrollSlipProps> = ({ data }) => {
  const slipRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [showFullPreview, setShowFullPreview] = React.useState(false);

  const handlePrint = () => {
    window.print();
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
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Forcefully remove modern CSS color functions from all style tags in the clone
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            // Aggressive replacement for any oklab/oklch strings
            styleTags[i].innerHTML = styleTags[i].innerHTML.replace(/okl(ab|ch)\s*\([^)]+\)/gi, '#000000');
            // Also replace any variables that might be holding these colors
            styleTags[i].innerHTML = styleTags[i].innerHTML.replace(/--[\w-]+\s*:\s*okl(ab|ch)\s*\([^)]+\)/gi, '--fixed: #000000');
          }

          const elements = clonedDoc.querySelectorAll('*');
          elements.forEach(el => {
            const node = el as HTMLElement;
            try {
              const style = window.getComputedStyle(node);
              const propsToFix = [
                'color', 'backgroundColor', 'borderColor', 'outlineColor', 
                'fill', 'stroke', 'boxShadow', 'textShadow', 'borderTopColor', 
                'borderBottomColor', 'borderLeftColor', 'borderRightColor'
              ];
              
              propsToFix.forEach(prop => {
                const val = style.getPropertyValue(prop);
                if (val && (val.includes('okl') || val.includes('var('))) {
                  // Apply standard fallback with !important to ensure override
                  let fallback = '#1e293b'; 
                  if (prop.toLowerCase().includes('background')) fallback = '#ffffff';
                  if (val.includes('blue') || val.includes('2563eb')) fallback = '#2563eb';
                  if (val.includes('slate') || val.includes('64748b')) fallback = '#64748b';
                  
                  node.style.setProperty(prop, fallback, 'important');
                }
              });
            } catch (e) {
              // ignore
            }
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
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
      alert("Erreur de génération. Utilisez le bouton 'Imprimer' à la place.");
    } finally {
      setIsDownloading(false);
    }
  };

  const renderSlip = () => (
    <div className="bg-[#ffffff] p-8 shadow-sm border border-[#e2e8f0] w-full max-w-[210mm] mx-auto min-h-[297mm] font-sans text-[11px] leading-relaxed text-[#1e293b] flex flex-col">
      {/* Top Header */}
      <div className="flex justify-between items-start mb-8 border-b pb-6">
        <div className="w-1/2 space-y-1">
          <h2 className="text-xl font-black text-[#2563eb] mb-1">{data.company.name}</h2>
          <p className="text-[10px] text-[#64748b] leading-tight max-w-[300px]">
            {data.company.sector && <span>{data.company.sector}<br/></span>}
            {data.company.address}<br/>
            RCCM : {data.company.rccm || '-'} | IFU : {data.company.ifu || '-'}<br/>
            N° CNSS employeur : {data.company.cnssEmployer || '-'}
          </p>
        </div>
        <div className="w-1/2 text-right flex flex-col items-end">
          <div className="text-right">
             <h1 className="text-2xl font-black text-[#1e293b] mb-1">BULLETIN DE PAIE</h1>
             <p className="text-sm font-bold bg-[#f1f5f9] px-3 py-1 rounded inline-block">Période : {data.period}</p>
          </div>
          <div className="mt-4 text-[10px] text-[#64748b] space-y-0.5">
            <p>Date de paiement : {new Date(data.paymentDate).toLocaleDateString('fr-FR')}</p>
            <p>Convention collective : {data.convention || 'Générale'}</p>
          </div>
        </div>
      </div>

      {/* Employee Info Block */}
      <div className="mb-6">
        <h3 className="bg-[#f1f5f9] px-3 py-1.5 font-bold text-xs uppercase mb-2 border-l-4 border-[#2563eb]">Informations du salarié</h3>
        <div className="grid grid-cols-2 border border-[#e2e8f0] overflow-hidden rounded">
          <div className="grid grid-cols-2 divide-x divide-[#e2e8f0] border-b border-[#e2e8f0]">
            <div className="p-2 bg-[#fafafa] font-bold">Nom et Prénoms</div>
            <div className="p-2 uppercase font-black">{data.employee.lastName} {data.employee.firstName}</div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[#e2e8f0] border-b border-[#e2e8f0]">
            <div className="p-2 bg-[#fafafa] font-bold">N° Matricule</div>
            <div className="p-2 font-mono">{data.employee.matricule || '-'}</div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[#e2e8f0] border-b border-[#e2e8f0]">
            <div className="p-2 bg-[#fafafa] font-bold">Poste / Fonction</div>
            <div className="p-2">{data.employee.position}</div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[#e2e8f0] border-b border-[#e2e8f0]">
            <div className="p-2 bg-[#fafafa] font-bold">Date d'embauche</div>
            <div className="p-2">{data.employee.hireDate ? new Date(data.employee.hireDate).toLocaleDateString('fr-FR') : '-'}</div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[#e2e8f0]">
            <div className="p-2 bg-[#fafafa] font-bold">Catégorie / Échelon</div>
            <div className="p-2">{data.employee.category || '-'}</div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[#e2e8f0]">
            <div className="p-2 bg-[#fafafa] font-bold">Ancienneté</div>
            <div className="p-2">{data.employee.seniority || '-'}</div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[#e2e8f0] border-t border-[#e2e8f0]">
            <div className="p-2 bg-[#fafafa] font-bold">N° CNSS salarié</div>
            <div className="p-2 font-mono">{data.employee.socialSecurityNumber || '-'}</div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[#e2e8f0] border-t border-[#e2e8f0]">
            <div className="p-2 bg-[#fafafa] font-bold">Mode de paiement</div>
            <div className="p-2">{data.employee.paymentMode || 'Virement bancaire'}</div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1">
        <table className="w-full border border-[#cbd5e1] text-[10px]">
          <thead className="bg-[#1e293b] text-white uppercase font-bold text-[9px]">
            <tr>
              <th className="p-2 text-left w-[40%]">Désignation</th>
              <th className="p-2 text-right">Base (FCFA)</th>
              <th className="p-2 text-center">Taux</th>
              <th className="p-2 text-right">Retenue Sal.</th>
              <th className="p-2 text-right border-l border-white/20">Charge Pat.</th>
            </tr>
          </thead>
          <tbody>
            {/* I. REMUNERATIONS */}
            <tr className="bg-[#f8fafc] font-black italic">
              <td colSpan={5} className="p-2 border-b border-[#e2e8f0] text-[#2563eb]">I. RÉMUNÉRATIONS ET PRIMES</td>
            </tr>
            {data.lines.filter(l => l.type === 'earning').map((line, idx) => (
              <tr key={`earning-${idx}`} className="border-b border-[#e2e8f0]">
                <td className="p-2">{line.label}</td>
                <td className="p-2 text-right">{line.amount.toLocaleString()} FCFA</td>
                <td className="p-2 text-center">—</td>
                <td className="p-2 text-right opacity-50">—</td>
                <td className="p-2 text-right border-l border-[#e2e8f0] opacity-50">—</td>
              </tr>
            ))}
            <tr className="bg-[#f0f9ff] font-bold">
              <td colSpan={1} className="p-2 text-[#0369a1]">SALAIRE BRUT :</td>
              <td colSpan={1} className="p-2 text-right text-[#0369a1]">{data.grossSalary.toLocaleString()} FCFA</td>
              <td colSpan={3}></td>
            </tr>

            {/* II. COTISATIONS */}
            <tr className="bg-[#f8fafc] font-black italic">
              <td colSpan={5} className="p-2 border-b border-[#e2e8f0] text-[#2563eb]">II. COTISATIONS SOCIALES</td>
            </tr>
            {data.lines.filter(l => l.type === 'deduction' && l.category === 'social').map((line, idx) => (
              <tr key={`social-${idx}`} className="border-b border-[#e2e8f0]">
                <td className="p-2">{line.label}</td>
                <td className="p-2 text-right">{line.base?.toLocaleString() || (line.amount / (line.rate ? (line.rate / 100) : 1)).toLocaleString()} FCFA</td>
                <td className="p-2 text-center">{line.rate}%</td>
                <td className="p-2 text-right font-black text-red-600">{line.amount.toLocaleString()} FCFA</td>
                <td className="p-2 text-right border-l border-[#e2e8f0] font-bold">{line.employerAmount?.toLocaleString() || '-'} FCFA</td>
              </tr>
            ))}

            {/* III. IUTS */}
            <tr className="bg-[#f8fafc] font-black italic">
              <td colSpan={5} className="p-2 border-b border-[#e2e8f0] text-[#2563eb]">III. IMPÔT SUR LE REVENU (IUTS)</td>
            </tr>
            {data.lines.filter(l => l.category === 'tax').map((line, idx) => (
              <tr key={`tax-${idx}`} className="border-b border-[#e2e8f0]">
                <td className="p-2">{line.label}</td>
                <td className="p-2 text-right">{line.base?.toLocaleString() || '-'} FCFA</td>
                <td className="p-2 text-center">{line.rate ? `${line.rate}%` : '—'}</td>
                <td className="p-2 text-right font-black text-red-600">{line.amount.toLocaleString()} FCFA</td>
                <td className="p-2 text-right border-l border-[#e2e8f0] opacity-50">—</td>
              </tr>
            ))}

            {/* OTHER DEDUCTIONS */}
            {data.lines.filter(l => l.type === 'deduction' && !l.category).map((line, idx) => (
              <tr key={`other-${idx}`} className="border-b border-[#e2e8f0]">
                <td className="p-2">{line.label}</td>
                <td className="p-2 text-right">{line.amount.toLocaleString()} FCFA</td>
                <td className="p-2 text-center">—</td>
                <td className="p-2 text-right font-black text-red-600">{line.amount.toLocaleString()} FCFA</td>
                <td className="p-2 text-right border-l border-[#e2e8f0] opacity-50">—</td>
              </tr>
            ))}

            {/* IV. RECAP */}
            <tr className="bg-[#fcf8e3] font-bold">
              <td colSpan={1} className="p-2">Total des retenues salariales</td>
              <td colSpan={2}></td>
              <td colSpan={1} className="p-2 text-right text-red-700">{(data.grossSalary - data.netPay).toLocaleString()} FCFA</td>
              <td colSpan={1} className="p-2 text-right border-l border-[#e2e8f0] text-blue-700">{(data.totalEmployerCost - data.grossSalary).toLocaleString()} FCFA</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Net section */}
      <div className="mt-6">
        <div className="flex items-stretch rounded overflow-hidden shadow-lg border border-[#2563eb]">
          <div className="bg-[#2563eb] text-white p-4 flex-1">
            <h4 className="text-lg font-black uppercase tracking-tight">NET À PAYER AU SALARIÉ</h4>
            <p className="text-[9px] opacity-70 italic">Salaire brut ({data.grossSalary.toLocaleString()}) – Retenues ({(data.grossSalary - data.netPay).toLocaleString()})</p>
          </div>
          <div className="bg-white flex items-center justify-center px-10 border-l border-[#2563eb]">
            <span className="text-3xl font-black text-[#214187] whitespace-nowrap">{data.netPay.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>
      </div>

      {/* Leave section */}
      <div className="mt-4 bg-[#f8fafc] border border-[#e2e8f0] p-2 flex justify-between text-[9px] font-bold text-[#64748b] rounded">
        <span>Congés acquis : 2,5 j/mois → {data.leaveAcquired || 2.5} j</span>
        <span>Congés pris ce mois : {data.leaveTaken || 0} j</span>
        <span>Solde congés : {data.leaveBalance || 22.5} j</span>
      </div>

      {/* Signature Section */}
      <div className="mt-8 grid grid-cols-2 gap-12">
        <div className="space-y-4">
          <div>
            <p className="font-bold text-xs uppercase underline">L'Employeur</p>
            <p className="text-[10px] text-[#64748b]">Direction Générale / DRH</p>
          </div>
          <div className="mt-4 pt-8">
            <p className="text-[10px] italic mb-1">Cachet & Signature :</p>
            <div className="h-20 border-b border-black"></div>
          </div>
        </div>
        <div className="space-y-4 text-right">
          <div>
            <p className="font-bold text-xs uppercase underline">Le Salarié</p>
            <p className="text-[10px] text-[#64748b]">Signature précédée de la mention « Lu et approuvé »</p>
          </div>
          <div className="mt-4 pt-8">
            <p className="text-[10px] italic mb-1">Signature :</p>
            <div className="h-20 border-b border-black"></div>
          </div>
        </div>
      </div>

      {/* Footer Legal */}
      <div className="mt-auto pt-8 flex flex-col items-center gap-2 border-t mt-12">
        <p className="text-[9px] text-[#94a3b8] italic text-center leading-tight">
          Ce bulletin de paie doit être conservé sans limitation de durée | Conformément au Code du Travail du Burkina Faso (Loi n°028-2008/AN)
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-3 no-print">
        <button 
          onClick={() => setShowFullPreview(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-[#1e293b]"
        >
          <Eye size={16} />
          Aperçu PDF
        </button>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-[#1e293b]"
        >
          <Printer size={16} />
          Imprimer
        </button>
        <button 
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:opacity-90 transition-colors text-sm font-semibold disabled:opacity-70"
        >
          {isDownloading ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Download size={16} />
          )}
          {isDownloading ? 'Génération...' : 'Télécharger PDF'}
        </button>
      </div>

      <div ref={slipRef} id="payroll-slip" className="max-w-[210mm] mx-auto print:shadow-none">
        {renderSlip()}
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .no-print { display: none; }
          #payroll-slip { 
            box-shadow: none; 
            border: none;
            padding: 0;
            margin: 0;
            width: 100%;
          }
        }
      `}</style>

      {/* Full Screen Preview Modal */}
      <AnimatePresence>
        {showFullPreview && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 overflow-hidden underline-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-5xl h-full flex flex-col gap-4"
            >
              <div className="flex justify-between items-center text-white">
                <div>
                  <h2 className="text-xl font-bold">Aperçu du Bulletin de Paie</h2>
                  <p className="text-sm opacity-70">{data.employee.firstName} {data.employee.lastName} - {data.period}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-6 py-2 bg-[#2563eb] text-white rounded-full hover:opacity-90 transition-all font-bold"
                  >
                    <Download size={18} />
                    {isDownloading ? 'Génération...' : 'Télécharger maintenant'}
                  </button>
                  <button 
                    onClick={() => setShowFullPreview(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto rounded-xl bg-[#64748b] shadow-2xl border border-white/10 p-4 md:p-8 flex justify-center">
                <div className="origin-top scale-75 md:scale-90 lg:scale-100">
                   {renderSlip()}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
