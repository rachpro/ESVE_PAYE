import React, { useRef } from 'react';
import { Decharge } from '../types';
import { Printer, Download, Eye, X, PenTool, Trash2, Save } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import SignatureCanvas from 'react-signature-canvas';
import { DEFAULT_COMPANY } from '../lib/calculations';

interface DechargeDocumentProps {
  data: Decharge;
  onUpdate?: (updated: Decharge) => void;
}

export const DechargeDocument: React.FC<DechargeDocumentProps> = ({ data, onUpdate }) => {
  const docRef = useRef<HTMLDivElement>(null);
  const signaturePad = useRef<SignatureCanvas | null>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [showFullPreview, setShowFullPreview] = React.useState(false);
  const [showSignaturePad, setShowSignaturePad] = React.useState(false);

  const clearSignature = () => {
    if (onUpdate) {
      onUpdate({ ...data, signature: undefined });
    }
  };

  const saveSignature = () => {
    if (signaturePad.current && onUpdate) {
      if (signaturePad.current.isEmpty()) return;
      const signatureDataUrl = signaturePad.current.getTrimmedCanvas().toDataURL('image/png');
      onUpdate({ ...data, signature: signatureDataUrl });
      setShowSignaturePad(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!docRef.current || isDownloading) return;
    
    try {
      setIsDownloading(true);
      const element = docRef.current;

      // Wait for images to load
      const images = Array.from(element.getElementsByTagName('img')) as HTMLImageElement[];
      const imagePromises = images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });
      await Promise.all(imagePromises);

      // Delay for DOM settling
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: true,
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
      
      // Si la hauteur dépasse celle de la page A4, on rétrécit pour que tout rentre sur une seule page
      if (finalHeight > pdfPageHeight) {
        finalHeight = pdfPageHeight;
        finalWidth = (canvas.width * pdfPageHeight) / canvas.height;
      }
      
      // On centre horizontalement si c'est plus étroit
      const xOffset = (pdfWidth - finalWidth) / 2;
      
      pdf.addImage(imgData, 'JPEG', xOffset, 0, finalWidth, finalHeight);

      // Attempt download and provide fallback if needed
      try {
        pdf.save(`decharge_${(data.beneficiaryName || 'doc').replace(/\s+/g, '_')}_${data.date || 'date'}.pdf`);
      } catch (saveError) {
        console.warn("pdf.save() failed, trying blob URL fallback:", saveError);
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `decharge_${(data.beneficiaryName || 'doc').replace(/\s+/g, '_')}_${data.date || 'date'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Erreur détaillée PDF:", error);
      alert("Le téléchargement direct a échoué. \n\nSOLUTION : Utilisez le bouton 'Imprimer' et sélectionnez 'Enregistrer au format PDF'.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <h2 className="text-xl font-bold text-[#1e293b]">Aperçu de la Décharge</h2>
            <div className="flex gap-3">
              {!data.signature && (
                <button 
                  onClick={() => setShowSignaturePad(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-semibold hover:bg-amber-100 transition-all"
                >
                  <PenTool size={18} />
                  Signer
                </button>
              )}
              {data.signature && (
                <button 
                  onClick={clearSignature}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-all"
                >
                  <Trash2 size={18} />
                  Effacer Signature
                </button>
              )}
              <button 
                onClick={() => setShowFullPreview(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#64748b] hover:bg-gray-50 transition-all"
          >
            <Eye size={18} />
            Aperçu PDF
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-lg text-sm font-semibold text-[#64748b] hover:bg-gray-50 transition-all"
          >
            <Printer size={18} />
            Imprimer
          </button>
          <button 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm disabled:opacity-70"
          >
            {isDownloading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Download size={18} />
            )}
            {isDownloading ? 'Génération...' : 'Télécharger PDF'}
          </button>
        </div>
      </div>

      <div ref={docRef} className="bg-[#ffffff] p-16 shadow-sm border border-[#e2e8f0] max-w-[210mm] mx-auto min-h-[297mm] font-serif text-[14px] leading-relaxed text-[#1e293b] rounded-xl">
        <div className="text-center mb-16">
          <h1 className="text-3xl font-bold uppercase tracking-widest border-b-2 border-[#1e293b] pb-4 inline-block">
            DÉCHARGE
          </h1>
        </div>

        <div className="space-y-8">
          <p className="text-justify">
            Je soussigné(e) : <span className="font-bold px-2 inline-block">{data.beneficiaryName}</span>
          </p>

          <p className="text-justify">
            CNI n° : <span className="font-bold px-2">{data.cnib}</span> du <span className="font-bold px-2">{data.cnibDate}</span>
          </p>

          <div className="flex gap-12">
            <p className="text-justify">
              Téléphone : <span className="font-bold px-2">{data.phone}</span>
            </p>
            {data.beneficiaryEmail && (
              <p className="text-justify">
                Email : <span className="font-bold px-2 italic">{data.beneficiaryEmail}</span>
              </p>
            )}
          </div>

          <p className="text-justify">
            Reconnais avoir reçu de : <span className="font-bold px-2">{data.payerName}</span>
            {data.payerPhone && <span className="text-xs ml-2 opacity-70">(Tél: {data.payerPhone})</span>}
          </p>

          <p className="text-justify">
            Adresse : <span className="font-bold px-2">{data.payerAddress}</span>
            {data.payerEmail && <span className="text-xs ml-2 opacity-70">(Email: {data.payerEmail})</span>}
          </p>

          <p className="text-justify">
            La somme de : <span className="font-bold px-2">{data.amount.toLocaleString()} FCFA</span>
          </p>

          <p className="text-justify italic">
            (<span className="font-bold px-2">{data.amountInWords}</span>)
          </p>

          <p className="text-justify">
            Au titre de : <span className="font-bold px-2">{data.purpose}</span>
          </p>

          <div className="flex gap-8 items-center">
            <span>Mode de paiement :</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={data.paymentMode === 'Espèces'} readOnly /> Espèces
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={data.paymentMode === 'Chèque'} readOnly /> Chèque
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={data.paymentMode === 'Virement'} readOnly /> Virement
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={data.paymentMode === 'MobileMoney'} readOnly /> Mobile Money
              </label>
            </div>
          </div>

          <p className="text-justify">
            Date du paiement : <span className="font-bold px-2">{data.paymentDate}</span>
          </p>

          {data.additionalNotes && (
            <div className="mt-8 p-4 bg-[#f8fafc] border border-[#f1f5f9] rounded-lg text-sm italic">
              <p className="font-bold not-italic mb-1 underline">Notes complémentaires :</p>
              {data.additionalNotes}
            </div>
          )}

          <p className="mt-12">
            En foi de quoi, la présente décharge est établie pour servir et valoir ce que de droit.
          </p>

          <div className="flex justify-end mt-16">
            <div className="text-right space-y-8">
              <p>Fait à : <span className="font-bold px-2">{data.location}</span> Le : <span className="font-bold px-2">{data.date}</span></p>
              
              <div className="pt-8">
                <p className="font-bold mb-4">Signature du bénéficiaire :</p>
                <div className="h-32 w-64 border border-dashed border-[#d1d5db] mt-4 ml-auto flex items-center justify-center relative overflow-hidden bg-[#f9fafb]">
                  {data.signature ? (
                    <img src={data.signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-[#94a3b8] no-print">Zone de signature</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-16 text-center text-[10px] text-[#9ca3af] border-t border-[#f3f4f6] no-print">
          Généré par {DEFAULT_COMPANY.name}
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .no-print { display: none; }
          .bg-white { box-shadow: none !important; border: none !important; }
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
                  <h2 className="text-xl font-bold">Aperçu de la Décharge</h2>
                  <p className="text-sm opacity-70">{data.beneficiaryName} - {new Date(data.date).toLocaleDateString()}</p>
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
              
              <div className="flex-1 overflow-auto rounded-xl bg-gray-500 shadow-2xl border border-white/10 p-4 md:p-8">
          <div className="mx-auto bg-white shadow-2xl p-16 ring-1 ring-black/5 origin-top" style={{ width: '210mm', minHeight: '297mm' }}>
            <div className="text-center mb-16">
              <h1 className="text-3xl font-bold uppercase tracking-widest border-b-2 border-[#1e293b] pb-4 inline-block">
                DÉCHARGE
              </h1>
            </div>
            <div className="space-y-8 font-serif text-[14px]">
              <p>Je soussigné(e) : <span className="font-bold">{data.beneficiaryName}</span></p>
              <p>CNI n° : <span className="font-bold">{data.cnib}</span> du <span className="font-bold">{data.cnibDate}</span></p>
              <p>Reconnais avoir reçu de : <span className="font-bold">{data.payerName}</span></p>
              <p>La somme de : <span className="font-bold">{data.amount.toLocaleString()} FCFA ({data.amountInWords})</span></p>
              <p>Au titre de : <span className="font-bold">{data.purpose}</span></p>
              <p>Date du paiement : <span className="font-bold">{data.paymentDate}</span></p>
              <div className="flex justify-end mt-16 text-right">
                <div className="w-1/2">
                  <p>Fait à : <span className="font-bold">{data.location}</span> Le : <span className="font-bold">{data.date}</span></p>
                  <p className="mt-8 font-bold underline">Signature :</p>
                  <div className="h-24 w-full border border-dashed border-[#e2e8f0] mt-2 ml-auto flex items-center justify-center">
                    {data.signature && <img src={data.signature} alt="Signature Preview" className="max-h-full max-w-full object-contain" />}
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

      {/* Signature Pad Modal */}
      <AnimatePresence>
        {showSignaturePad && (
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">Signature Numérique</h3>
                <button onClick={() => setShowSignaturePad(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 bg-gray-50">
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl overflow-hidden shadow-inner">
                  <SignatureCanvas 
                    ref={signaturePad}
                    penColor="black"
                    canvasProps={{
                      className: "signature-canvas w-full h-64 cursor-crosshair"
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-3 text-center italic">
                  Utilisez votre souris ou votre écran tactile pour signer ci-dessus.
                </p>
              </div>
              <div className="p-6 border-t border-gray-100 flex gap-4">
                <button 
                  onClick={() => signaturePad.current?.clear()}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Réinitialiser
                </button>
                <button 
                  onClick={saveSignature}
                  className="flex-1 px-4 py-3 bg-[#2563eb] text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                >
                  <Save size={16} />
                  Valider
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
