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

      // Wait for images to load before capturing
      const images = Array.from(element.getElementsByTagName('img')) as HTMLImageElement[];
      const imagePromises = images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve; // Continue even if an image fails
        });
      });
      await Promise.all(imagePromises);

      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: true, // Enable for debugging in browser console
        scrollY: -window.scrollY,
        windowHeight: element.scrollHeight,
        height: element.scrollHeight,
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
      
      // Attempt download and provide fallback if needed
      try {
        pdf.save(`bulletin_paie_${(data.employee.lastName || 'doc').replace(/\s+/g, '_')}_${(data.period || 'period').replace(/\s+/g, '_')}.pdf`);
      } catch (saveError) {
        console.warn("pdf.save() failed, trying blob URL fallback:", saveError);
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bulletin_paie_${(data.employee.lastName || 'doc').replace(/\s+/g, '_')}_${(data.period || 'period').replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Erreur détaillée lors de la génération du PDF:", error);
      alert("La génération directe du PDF a échoué. \n\nASTUCE : Cliquez sur le bouton 'Imprimer' juste à côté, puis choisissez l'option 'Enregistrer au format PDF' dans les paramètres de votre imprimante.");
    } finally {
      setIsDownloading(false);
    }
  };

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

      <div ref={slipRef} id="payroll-slip" className="bg-[#ffffff] p-12 shadow-sm border border-[#e2e8f0] max-w-[210mm] mx-auto min-h-[297mm] font-mono text-[10px] leading-tight text-[#1e293b] rounded-xl">
        {/* Header */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div className="space-y-1">
            <div className="flex items-center gap-6 mb-6">
              {data.company.logo && (
                <img src={data.company.logo} alt="Logo" className="h-20 w-auto object-contain" referrerPolicy="no-referrer" />
              )}
            </div>
            <div className="text-[9px] space-y-0.5">
              <p>{data.company.address}</p>
              <p>Tél: {data.company.phone} | Email: {data.company.email}</p>
              <p className="font-bold">N° RIB: {data.company.rib}</p>
              <p>N° RCCM: {data.company.rccm} | N° IFU: {data.company.ifu}</p>
              <p>Régime d’imposition: {data.company.regime} | Division fiscale: {data.company.division}</p>
            </div>
          </div>
          <div className="space-y-1 border border-[#e2e8f0] p-4 rounded-lg">
            <h1 className="text-sm font-bold uppercase mb-2 text-[#1e293b]">Salarié</h1>
            <p className="font-bold text-sm">{data.employee.firstName} {data.employee.lastName}</p>
            <p>{data.employee.address}</p>
            {data.employee.residence && <p>Résidence: {data.employee.residence}</p>}
            <div className="pt-2 space-y-1">
              <p>Poste: {data.employee.position}</p>
              {data.employee.socialSecurityNumber && <p>N° SS: {data.employee.socialSecurityNumber}</p>}
              {data.employee.cnib && <p>N° CNIB: {data.employee.cnib}</p>}
            </div>
          </div>
        </div>

        <div className="border-y border-[#e2e8f0] py-3 mb-8 flex justify-between items-center px-4 bg-[#fafafa]">
          <span className="font-bold text-xs">BULLETIN DE PAIE</span>
          <span className="font-bold">Période: {data.period}</span>
          <span>Date de paiement: {data.paymentDate}</span>
        </div>

        {/* Table */}
        <table className="w-full border-collapse mb-8 text-[#1e293b]">
          <thead>
            <tr className="border-b border-[#e2e8f0] text-left text-[#64748b]">
              <th className="py-2 font-bold uppercase">Libellé</th>
              <th className="py-2 font-bold uppercase text-right">Base</th>
              <th className="py-2 font-bold uppercase text-right">Taux</th>
              <th className="py-2 font-bold uppercase text-right">Gains</th>
              <th className="py-2 font-bold uppercase text-right">Retenues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f9fafb]">
            {data.lines.map((line, idx) => (
              <tr key={idx} className={line.type === 'info' ? 'text-[#64748b] italic' : ''}>
                <td className="py-1.5">{line.label}</td>
                <td className="py-1.5 text-right">{line.base?.toFixed(2) || ''}</td>
                <td className="py-1.5 text-right">{line.rate ? (line.rate * 100).toFixed(2) + '%' : ''}</td>
                <td className="py-1.5 text-right font-medium">
                  {line.amount > 0 ? line.amount.toFixed(2) : ''}
                </td>
                <td className="py-1.5 text-right font-medium text-[#dc2626]">
                  {line.amount < 0 ? Math.abs(line.amount).toFixed(2) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-auto space-y-4">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <div className="flex justify-between border-b border-[#e2e8f0] py-1">
                <span>SALAIRE BRUT</span>
                <span className="font-bold">{data.grossSalary.toFixed(2)} FCFA</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between border-b border-[#e2e8f0] py-1">
                <span>NET À PAYER</span>
                <span className="font-bold">{data.netPay.toFixed(2)} FCFA</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1e293b] text-white p-6 flex justify-between items-center rounded-lg mt-8 shadow-sm">
            <span className="text-lg font-bold uppercase tracking-widest">Net à payer</span>
            <span className="text-3xl font-black">{data.netPay.toFixed(2)} FCFA</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#f1f5f9] text-center text-[8px] text-[#94a3b8] no-print">
          Généré par {data.company.name}
        </div>
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
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 overflow-hidden">
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
              
              <div className="flex-1 overflow-auto rounded-xl bg-[#64748b] shadow-2xl border border-white/10 p-4 md:p-8">
                <div className="mx-auto bg-[#ffffff] shadow-2xl p-12 ring-1 ring-black/5 origin-top" style={{ width: '210mm', minHeight: '297mm' }}>
                  {/* Re-rendering the slip content for the preview */}
                  {/* We reuse the exact same structures but wrapped in a container that matches A4 */}
                  <div className="font-mono text-[10px] leading-tight text-[#1e293b] space-y-12">
                    {/* Header */}
                    <div className="grid grid-cols-2 gap-12">
                      <div className="space-y-1">
                        <div className="flex items-center gap-6 mb-6">
                          {data.company.logo && <img src={data.company.logo} alt="Logo" className="h-20 w-auto object-contain" referrerPolicy="no-referrer" />}
                        </div>
                        <div className="text-[9px] space-y-0.5">
                          <p>{data.company.address}</p>
                          <p>Tél: {data.company.phone} | Email: {data.company.email}</p>
                          <p className="font-bold">N° RIB: {data.company.rib}</p>
                        </div>
                      </div>
                      <div className="space-y-1 border border-[#e2e8f0] p-4 rounded-lg">
                        <h1 className="text-sm font-bold uppercase mb-2">Salarié</h1>
                        <p className="font-bold text-sm">{data.employee.firstName} {data.employee.lastName}</p>
                        <p>{data.employee.address}</p>
                        <div className="pt-2 space-y-1">
                          <p>Poste: {data.employee.position}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-y border-[#e2e8f0] py-3 flex justify-between items-center px-4 bg-[#fafafa]">
                      <span className="font-bold text-xs uppercase">Bulletin de Paie</span>
                      <span className="font-bold">Période: {data.period}</span>
                    </div>

                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#e2e8f0] text-[#64748b] uppercase text-[9px] font-bold">
                          <th className="py-2">Libellé</th>
                          <th className="py-2 text-right">Base</th>
                          <th className="py-2 text-right">Gains</th>
                          <th className="py-2 text-right">Retenues</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.lines.map((line, idx) => (
                          <tr key={idx} className="border-b border-[#f9fafb]">
                            <td className="py-1.5">{line.label}</td>
                            <td className="py-1.5 text-right font-mono">{line.base?.toFixed(2)}</td>
                            <td className="py-1.5 text-right font-bold">{line.amount > 0 ? line.amount.toFixed(2) : ''}</td>
                            <td className="py-1.5 text-right font-bold text-[#dc2626]">{line.amount < 0 ? Math.abs(line.amount).toFixed(2) : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-8 flex justify-end">
                      <div className="w-1/2 space-y-2">
                        <div className="flex justify-between border-b py-1"><span>BRUT</span><span className="font-bold">{data.grossSalary.toFixed(2)}</span></div>
                        <div className="flex justify-between bg-[#1e293b] text-white p-4 rounded mt-4">
                          <span className="font-bold uppercase">Net à payer</span>
                          <span className="text-xl font-black">{data.netPay.toFixed(2)} FCFA</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
