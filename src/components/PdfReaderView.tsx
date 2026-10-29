import { useState, useEffect } from 'react';
import { BookOpen, ExternalLink, Download, ChevronRight, FileText } from 'lucide-react';
import { Section } from '../types';

interface PdfReaderViewProps {
  sections: Section[];
  initialPage?: number;
}

export function PdfReaderView({ sections, initialPage = 1 }: PdfReaderViewProps) {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const pdfUrl = '/assets/aistudio/La_cucina_di_Stare_bene_come_una_volta_3e8d257b.pdf';

  useEffect(() => {
    if (initialPage) {
      setCurrentPage(initialPage);
    }
  }, [initialPage]);

  const handlePageJump = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto px-4 pt-3">
      {/* Title & Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#2c241d] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#c25e3f]" />
            <span>Il Libro Originale</span>
          </h2>
          <p className="text-xs text-[#786d5e]">
            "La cucina di Stare bene come una volta" di Eugenia Mazzaglia
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#ebdccb] text-xs font-semibold text-[#5c4a3b] hover:bg-[#faf6ee] active:scale-95 transition-all shadow-xs"
            title="Apri PDF a schermo intero"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#c25e3f]" />
            <span className="hidden xs:inline">Schermo Intero</span>
          </a>
          <a
            href={pdfUrl}
            download="La_cucina_di_Stare_bene_come_una_volta.pdf"
            className="p-2 rounded-xl bg-white border border-[#ebdccb] text-[#5c4a3b] hover:bg-[#faf6ee] active:scale-95 transition-all shadow-xs"
            title="Scarica PDF completo"
            aria-label="Scarica PDF"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Quick Chapter Selector */}
      <div className="bg-white rounded-2xl p-3 border border-[#ebdccb] shadow-xs space-y-2">
        <span className="text-[11px] font-bold text-[#8c7b6b] uppercase tracking-wider block">
          Salta al Capitolo
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          <button
            onClick={() => handlePageJump(1)}
            className={`px-2.5 py-1 rounded-xl text-xs whitespace-nowrap border transition-all ${
              currentPage === 1
                ? 'bg-[#c25e3f] text-white border-[#c25e3f] font-semibold'
                : 'bg-[#faf6ee] text-[#5c4a3b] border-[#ebdccb]'
            }`}
          >
            Copertina (Pag. 1)
          </button>
          <button
            onClick={() => handlePageJump(2)}
            className={`px-2.5 py-1 rounded-xl text-xs whitespace-nowrap border transition-all ${
              currentPage === 2
                ? 'bg-[#c25e3f] text-white border-[#c25e3f] font-semibold'
                : 'bg-[#faf6ee] text-[#5c4a3b] border-[#ebdccb]'
            }`}
          >
            Introduzione (Pag. 2)
          </button>
          <button
            onClick={() => handlePageJump(3)}
            className={`px-2.5 py-1 rounded-xl text-xs whitespace-nowrap border transition-all ${
              currentPage === 3
                ? 'bg-[#c25e3f] text-white border-[#c25e3f] font-semibold'
                : 'bg-[#faf6ee] text-[#5c4a3b] border-[#ebdccb]'
            }`}
          >
            Sommario (Pag. 3)
          </button>
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => handlePageJump(sec.page)}
              className={`px-2.5 py-1 rounded-xl text-xs whitespace-nowrap border transition-all ${
                currentPage === sec.page
                  ? 'bg-[#c25e3f] text-white border-[#c25e3f] font-semibold'
                  : 'bg-[#faf6ee] text-[#5c4a3b] border-[#ebdccb]'
              }`}
            >
              {sec.id}. {sec.name} (p. {sec.page})
            </button>
          ))}
          <button
            onClick={() => handlePageJump(218)}
            className={`px-2.5 py-1 rounded-xl text-xs whitespace-nowrap border transition-all ${
              currentPage === 218
                ? 'bg-[#c25e3f] text-white border-[#c25e3f] font-semibold'
                : 'bg-[#faf6ee] text-[#5c4a3b] border-[#ebdccb]'
            }`}
          >
            Indice A-Z (Pag. 218)
          </button>
        </div>
      </div>

      {/* Embedded PDF Viewer */}
      <div className="bg-white rounded-3xl border border-[#ebdccb] overflow-hidden shadow-sm flex flex-col h-[65vh] sm:h-[75vh]">
        <div className="bg-[#faf6ee] px-4 py-2 border-b border-[#ebdccb] flex items-center justify-between text-xs text-[#5c4a3b]">
          <span className="font-medium flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#c25e3f]" />
            Visualizzazione Pagina {currentPage}
          </span>
          <div className="flex items-center gap-2">
            <label htmlFor="jump-page" className="text-[11px] text-[#8c7b6b]">Vai a pag:</label>
            <input
              id="jump-page"
              type="number"
              min={1}
              max={222}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= 222) {
                  setCurrentPage(val);
                }
              }}
              className="w-14 h-7 text-center font-bold text-xs bg-white border border-[#ebdccb] rounded-md"
            />
          </div>
        </div>

        <iframe
          key={currentPage}
          src={`${pdfUrl}#page=${currentPage}&view=FitH`}
          title="Ricettario PDF originale"
          className="w-full flex-1 border-0"
        />
      </div>

      <div className="p-4 bg-[#fdf5e6] border border-[#eddcb5] rounded-2xl text-xs text-[#69543e] space-y-1">
        <p className="font-serif italic font-medium">
          Suggerimento per lo smartphone:
        </p>
        <p className="leading-relaxed">
          I browser mobili consentono anche di pizzicare per ingrandire (pinch-to-zoom) le tavole illustrative a colori o toccare "Schermo Intero" in alto per sfogliare il ricettario originale a tutto schermo.
        </p>
      </div>
    </div>
  );
}
