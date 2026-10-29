import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  ChefHat,
  FileText,
  List,
  LayoutGrid,
  X
} from 'lucide-react';
import { Section, Recipe } from '../types';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PdfReaderViewProps {
  sections: Section[];
  recipes: Recipe[];
  initialPage?: number;
  onOpenRecipe: (recipe: Recipe) => void;
}

export function PdfReaderView({
  sections,
  recipes,
  initialPage = 1,
  onOpenRecipe,
}: PdfReaderViewProps) {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(222);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'chapters'>('canvas');
  const [searchPageInput, setSearchPageInput] = useState<string>('');
  const [showChapterModal, setShowChapterModal] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<any>(null);
  const chaptersScrollRef = useRef<HTMLDivElement | null>(null);

  // Drag-to-scroll state
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [initialScrollLeft, setInitialScrollLeft] = useState(0);

  const pdfUrl = '/assets/aistudio/La_cucina_di_Stare_bene_come_una_volta_3e8d257b.pdf';

  // Find if current page is a recipe or section
  const currentRecipe = recipes.find((r) => r.page === currentPage);
  const currentSection = sections.find((s) => s.page === currentPage);

  // Initialize PDF document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setLoadError(null);

    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const doc = await loadingTask.promise;
        if (!isCancelled) {
          pdfDocRef.current = doc;
          setTotalPages(doc.numPages);
          setLoading(false);
          renderPage(currentPage, doc, zoomScale);
        }
      } catch (err: any) {
        console.error('Error loading PDF document:', err);
        if (!isCancelled) {
          setLoadError('Impossibile caricare il file PDF nel visualizzatore.');
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Re-render page when currentPage or zoomScale changes
  useEffect(() => {
    if (pdfDocRef.current && viewMode === 'canvas') {
      renderPage(currentPage, pdfDocRef.current, zoomScale);
    }
  }, [currentPage, zoomScale, viewMode]);

  // When initialPage changes from outside
  useEffect(() => {
    if (initialPage && initialPage !== currentPage) {
      setCurrentPage(initialPage);
      setViewMode('canvas');
    }
  }, [initialPage]);

  const renderPage = async (
    pageNum: number,
    doc: pdfjsLib.PDFDocumentProxy,
    scaleFactor: number
  ) => {
    try {
      if (!canvasRef.current) return;
      setLoading(true);

      // Cancel any ongoing render task
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await doc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      const containerWidth = canvas.parentElement?.clientWidth || window.innerWidth - 32;
      const unscaledViewport = page.getViewport({ scale: 1 });
      
      const baseScale = Math.min(2.0, (containerWidth / unscaledViewport.width) * 1.5);
      const effectiveScale = baseScale * scaleFactor;
      const viewport = page.getViewport({ scale: effectiveScale });

      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

      const renderContext = {
        canvasContext: context,
        transform: transform,
        viewport: viewport,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;
      setLoading(false);
    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Page render error:', err);
      }
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleJumpPage = (pageNum: number) => {
    const target = Math.max(1, Math.min(totalPages, pageNum));
    setCurrentPage(target);
    setViewMode('canvas');
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(searchPageInput, 10);
    if (!isNaN(p)) {
      handleJumpPage(p);
      setSearchPageInput('');
    }
  };

  // Chapter scroller helper
  const handleScrollChapters = (direction: 'left' | 'right') => {
    if (chaptersScrollRef.current) {
      const amount = direction === 'left' ? -260 : 260;
      chaptersScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Drag to scroll for chapters bar
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!chaptersScrollRef.current) return;
    setIsMouseDown(true);
    setStartX(e.pageX - chaptersScrollRef.current.offsetLeft);
    setInitialScrollLeft(chaptersScrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !chaptersScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - chaptersScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    chaptersScrollRef.current.scrollLeft = initialScrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsMouseDown(false);
  };

  return (
    <div className="space-y-3.5 pb-24 max-w-4xl mx-auto px-3 sm:px-4 pt-2">
      {/* Top Header Card */}
      <div className="bg-[#fcfaf6] rounded-2xl p-3 sm:p-4 border border-[#e6decb] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#2c241d] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#c25e3f]" />
            <span>Sfoglia il Ricettario</span>
          </h2>
          <p className="text-xs text-[#786d5e] mt-0.5">
            200 ricette di casa · Eugenia Mazzaglia · Pagina {currentPage} di {totalPages}
          </p>
        </div>

        {/* View Mode Toggle & PDF Downloads */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#f0ebd9] p-1 rounded-xl">
            <button
              onClick={() => setViewMode('canvas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'canvas'
                  ? 'bg-white text-[#2c241d] shadow-xs'
                  : 'text-[#706456] hover:text-[#2c241d]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#c25e3f]" />
              <span>Pagine Grafiche</span>
            </button>
            <button
              onClick={() => setViewMode('chapters')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'chapters'
                  ? 'bg-white text-[#2c241d] shadow-xs'
                  : 'text-[#706456] hover:text-[#2c241d]'
              }`}
            >
              <List className="w-3.5 h-3.5 text-[#c25e3f]" />
              <span>Indice Capitoli</span>
            </button>
          </div>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#e6decb] text-xs font-medium text-[#5c4a3b] hover:bg-[#faf6ee] shadow-xs active:scale-95 transition-all"
            title="Apri PDF originale nel browser"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#c25e3f]" />
            <span className="hidden sm:inline">Apri File</span>
          </a>

          <a
            href={pdfUrl}
            download="La_cucina_di_Stare_bene_come_una_volta.pdf"
            className="p-2 rounded-xl bg-white border border-[#e6decb] text-[#5c4a3b] hover:bg-[#faf6ee] shadow-xs active:scale-95 transition-all"
            title="Scarica PDF completo sul telefono"
            aria-label="Scarica PDF"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Chapter Carousel Header with Left / Right Scroll Arrows and Grid Jumper */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] font-bold text-[#8c7b6b] uppercase tracking-wider">
            Capitoli del Libro
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowChapterModal(true)}
              className="text-[11px] font-medium text-[#c25e3f] hover:underline flex items-center gap-1 px-1.5 py-0.5 rounded"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Tutti i capitoli</span>
            </button>

            {/* Scroll Navigation Chevrons */}
            <div className="flex items-center gap-0.5 ml-1">
              <button
                onClick={() => handleScrollChapters('left')}
                className="w-7 h-7 rounded-lg bg-white border border-[#e6decb] text-[#5c4a3b] hover:bg-[#faf6ee] active:scale-95 flex items-center justify-center shadow-2xs"
                title="Scorri a sinistra"
                aria-label="Scorri capitoli a sinistra"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScrollChapters('right')}
                className="w-7 h-7 rounded-lg bg-white border border-[#e6decb] text-[#5c4a3b] hover:bg-[#faf6ee] active:scale-95 flex items-center justify-center shadow-2xs"
                title="Scorri a destra"
                aria-label="Scorri capitoli a destra"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Track for chapters */}
        <div
          ref={chaptersScrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="scroll-touch-x custom-scrollbar-x flex items-center gap-1.5 pb-2 pt-0.5 select-none"
        >
          <button
            onClick={() => handleJumpPage(1)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap border shrink-0 transition-all ${
              currentPage === 1
                ? 'bg-[#c25e3f] text-white border-[#c25e3f] font-semibold'
                : 'bg-white text-[#5c4a3b] border-[#e6decb] hover:bg-[#faf6ee]'
            }`}
          >
            Copertina (p. 1)
          </button>
          <button
            onClick={() => handleJumpPage(2)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap border shrink-0 transition-all ${
              currentPage === 2
                ? 'bg-[#c25e3f] text-white border-[#c25e3f] font-semibold'
                : 'bg-white text-[#5c4a3b] border-[#e6decb] hover:bg-[#faf6ee]'
            }`}
          >
            Introduzione (p. 2)
          </button>
          <button
            onClick={() => handleJumpPage(3)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap border shrink-0 transition-all ${
              currentPage === 3
                ? 'bg-[#c25e3f] text-white border-[#c25e3f] font-semibold'
                : 'bg-white text-[#5c4a3b] border-[#e6decb] hover:bg-[#faf6ee]'
            }`}
          >
            Sommario (p. 3)
          </button>
          {sections.map((sec) => {
            const isCurrentSec = currentPage >= sec.page && currentPage < sec.page + sec.count + 1;
            return (
              <button
                key={sec.id}
                onClick={() => handleJumpPage(sec.page)}
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap border shrink-0 transition-all flex items-center gap-1 ${
                  isCurrentSec
                    ? 'bg-[#2c241d] text-white border-[#2c241d] font-semibold shadow-xs'
                    : 'bg-white text-[#5c4a3b] border-[#e6decb] hover:bg-[#faf6ee]'
                }`}
              >
                <span className="font-serif font-bold opacity-80">{sec.id}.</span>
                <span>{sec.name}</span>
                <span className="text-[10px] opacity-70">p. {sec.page}</span>
              </button>
            );
          })}
          <button
            onClick={() => handleJumpPage(218)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap border shrink-0 transition-all ${
              currentPage >= 218 && currentPage <= 221
                ? 'bg-[#c25e3f] text-white border-[#c25e3f] font-semibold'
                : 'bg-white text-[#5c4a3b] border-[#e6decb] hover:bg-[#faf6ee]'
            }`}
          >
            Indice A-Z (p. 218)
          </button>
          <button
            onClick={() => handleJumpPage(222)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap border shrink-0 transition-all ${
              currentPage === 222
                ? 'bg-[#c25e3f] text-white border-[#c25e3f] font-semibold'
                : 'bg-white text-[#5c4a3b] border-[#e6decb] hover:bg-[#faf6ee]'
            }`}
          >
            Buon Appetito (p. 222)
          </button>
        </div>
      </div>

      {/* Chapter Selection Modal */}
      {showChapterModal && (
        <div className="fixed inset-0 z-50 bg-[#2c241d]/50 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="bg-[#fcfaf6] w-full max-w-xl mx-auto rounded-t-3xl sm:rounded-3xl border border-[#ebdccb] shadow-2xl p-5 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#ebdccb]">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2c241d]">
                  Seleziona Capitolo
                </h3>
                <p className="text-xs text-[#786d5e]">
                  Salta direttamente a qualsiasi sezione del libro
                </p>
              </div>
              <button
                onClick={() => setShowChapterModal(false)}
                className="w-8 h-8 rounded-full bg-[#f2ecdf] text-[#5c4a3b] flex items-center justify-center hover:bg-[#ebdccb]"
                aria-label="Chiudi elenco capitoli"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto divide-y divide-[#f0ebd9] py-2 flex-1">
              <div className="grid grid-cols-3 gap-2 py-2">
                <button
                  onClick={() => {
                    handleJumpPage(1);
                    setShowChapterModal(false);
                  }}
                  className="p-2.5 text-center rounded-xl bg-white border border-[#e6decb] hover:bg-[#faf6ee]"
                >
                  <span className="text-xs font-semibold block text-[#2c241d]">Copertina</span>
                  <span className="text-[10px] text-[#8c7b6b]">Pagina 1</span>
                </button>
                <button
                  onClick={() => {
                    handleJumpPage(2);
                    setShowChapterModal(false);
                  }}
                  className="p-2.5 text-center rounded-xl bg-white border border-[#e6decb] hover:bg-[#faf6ee]"
                >
                  <span className="text-xs font-semibold block text-[#2c241d]">Introduzione</span>
                  <span className="text-[10px] text-[#8c7b6b]">Pagina 2</span>
                </button>
                <button
                  onClick={() => {
                    handleJumpPage(3);
                    setShowChapterModal(false);
                  }}
                  className="p-2.5 text-center rounded-xl bg-white border border-[#e6decb] hover:bg-[#faf6ee]"
                >
                  <span className="text-xs font-semibold block text-[#2c241d]">Sommario</span>
                  <span className="text-[10px] text-[#8c7b6b]">Pagina 3</span>
                </button>
              </div>

              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => {
                    handleJumpPage(sec.page);
                    setShowChapterModal(false);
                  }}
                  className="w-full py-2.5 px-2 text-left flex items-start justify-between hover:bg-[#faf6ee] rounded-xl transition-colors"
                >
                  <div className="pr-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif font-bold text-xs text-[#c25e3f]">
                        {sec.id.toString().padStart(2, '0')}.
                      </span>
                      <span className="text-xs font-semibold text-[#2c241d]">{sec.name}</span>
                    </div>
                    <span className="text-[11px] text-[#786d5e] block italic line-clamp-1">
                      «{sec.quote}»
                    </span>
                  </div>
                  <span className="text-xs font-mono font-medium text-[#c25e3f] bg-[#faebe6] px-2 py-0.5 rounded-md shrink-0">
                    pag. {sec.page}
                  </span>
                </button>
              ))}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    handleJumpPage(218);
                    setShowChapterModal(false);
                  }}
                  className="p-2.5 text-center rounded-xl bg-white border border-[#e6decb] hover:bg-[#faf6ee]"
                >
                  <span className="text-xs font-semibold block text-[#2c241d]">Indice A-Z</span>
                  <span className="text-[10px] text-[#8c7b6b]">Pagina 218</span>
                </button>
                <button
                  onClick={() => {
                    handleJumpPage(222);
                    setShowChapterModal(false);
                  }}
                  className="p-2.5 text-center rounded-xl bg-white border border-[#e6decb] hover:bg-[#faf6ee]"
                >
                  <span className="text-xs font-semibold block text-[#2c241d]">Buon Appetito</span>
                  <span className="text-[10px] text-[#8c7b6b]">Pagina 222</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* If this page corresponds to a Recipe: show convenient quick interactive banner! */}
      {currentRecipe && (
        <div className="bg-[#faebe6] border border-[#f0c3b5] rounded-2xl p-3 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-[#c25e3f] uppercase tracking-wider block font-serif">
              Ricetta N. {currentRecipe.id} di {currentRecipe.origin}
            </span>
            <h4 className="font-serif font-bold text-sm text-[#2c241d] truncate">
              {currentRecipe.title}
            </h4>
          </div>
          <button
            onClick={() => onOpenRecipe(currentRecipe)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c25e3f] text-white text-xs font-semibold shadow-xs active:scale-95 shrink-0 hover:bg-[#a94f34] transition-all"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Apri Scheda</span>
          </button>
        </div>
      )}

      {/* If this page is a Section Cover: show title & quote */}
      {currentSection && (
        <div className="bg-[#fcfaf6] border border-[#ebdccb] rounded-2xl p-3 animate-in fade-in">
          <span className="text-[10px] font-bold text-[#c25e3f] uppercase tracking-wider block font-serif">
            Copertina Sezione {currentSection.id} ({currentSection.count} ricette)
          </span>
          <p className="font-serif italic text-sm text-[#4a3d31] mt-0.5">
            «{currentSection.quote}»
          </p>
        </div>
      )}

      {/* CANVAS VIEW: Pure in-browser Canvas rendering with PDF.js */}
      {viewMode === 'canvas' && (
        <div className="space-y-3">
          {/* Controls Bar for Canvas */}
          <div className="bg-white rounded-2xl p-2.5 px-3 border border-[#e6decb] shadow-xs flex items-center justify-between gap-2">
            {/* Page navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="w-9 h-9 rounded-xl bg-[#faf6ee] border border-[#e6decb] text-[#2c241d] disabled:opacity-30 flex items-center justify-center active:scale-95 transition-all"
                aria-label="Pagina precedente"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={searchPageInput !== '' ? searchPageInput : currentPage}
                  onChange={(e) => setSearchPageInput(e.target.value)}
                  onBlur={() => setSearchPageInput('')}
                  className="w-12 h-9 text-center font-bold text-xs bg-[#faf6ee] border border-[#e6decb] rounded-xl text-[#2c241d] focus:outline-none focus:border-[#c25e3f]"
                  aria-label="Numero pagina"
                />
                <span className="text-xs text-[#8c7b6b] font-medium font-mono">
                  / {totalPages}
                </span>
              </form>

              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="w-9 h-9 rounded-xl bg-[#faf6ee] border border-[#e6decb] text-[#2c241d] disabled:opacity-30 flex items-center justify-center active:scale-95 transition-all"
                aria-label="Pagina successiva"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomScale((prev) => Math.max(0.6, prev - 0.2))}
                disabled={zoomScale <= 0.6}
                className="w-8 h-8 rounded-lg text-[#5c4a3b] hover:bg-[#faf6ee] disabled:opacity-30 flex items-center justify-center active:scale-95"
                title="Riduci zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomScale(1.0)}
                className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded text-[#786d5e] hover:bg-[#faf6ee]"
                title="Ripristina zoom 100%"
              >
                {Math.round(zoomScale * 100)}%
              </button>
              <button
                onClick={() => setZoomScale((prev) => Math.min(2.5, prev + 0.2))}
                disabled={zoomScale >= 2.5}
                className="w-8 h-8 rounded-lg text-[#5c4a3b] hover:bg-[#faf6ee] disabled:opacity-30 flex items-center justify-center active:scale-95"
                title="Aumenta zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas Rendering Box */}
          <div className="relative bg-[#eee8db] rounded-3xl p-2 sm:p-4 border border-[#ebdccb] overflow-x-auto min-h-[420px] flex items-center justify-center shadow-inner">
            {loading && (
              <div className="absolute inset-0 bg-[#f7f4ed]/70 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center gap-2 z-10">
                <div className="w-7 h-7 border-3 border-[#c25e3f] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-serif font-medium text-[#786d5e]">
                  Caricamento pagina {currentPage}...
                </span>
              </div>
            )}

            {loadError ? (
              <div className="text-center p-6 space-y-3 bg-white rounded-2xl max-w-sm mx-auto border border-[#e6decb]">
                <p className="text-xs text-[#b33a1e] font-medium">{loadError}</p>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#c25e3f] text-white text-xs font-semibold shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Apri PDF in una nuova scheda</span>
                </a>
              </div>
            ) : (
              <div className="relative flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="rounded-xl shadow-lg bg-white mx-auto transition-transform duration-100 max-w-full"
                />
              </div>
            )}
          </div>

          {/* Mobile Bottom Quick Navigation Pager */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="flex-1 min-h-[44px] rounded-2xl bg-white border border-[#ebdccb] text-[#2c241d] disabled:opacity-30 text-xs font-medium flex items-center justify-center gap-1 active:scale-95 shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Pag. precedente</span>
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="flex-1 min-h-[44px] rounded-2xl bg-[#c25e3f] text-white disabled:opacity-30 text-xs font-medium flex items-center justify-center gap-1 active:scale-95 shadow-xs hover:bg-[#a94f34]"
            >
              <span>Pag. successiva</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CHAPTERS INDEX VIEW: All 14 Sections and 200 Recipes with 1-tap jump */}
      {viewMode === 'chapters' && (
        <div className="space-y-4 animate-in fade-in">
          {sections.map((sec) => {
            const sectionRecipes = recipes.filter((r) => r.sectionId === sec.id);
            return (
              <div
                key={sec.id}
                className="bg-white rounded-2xl border border-[#ebdccb] p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-[#f2ecdf] pb-2">
                  <div>
                    <span className="text-[10px] font-bold text-[#c25e3f] uppercase font-serif tracking-wider">
                      Capitolo {sec.id.toString().padStart(2, '0')}
                    </span>
                    <h3 className="font-serif font-bold text-base text-[#2c241d]">
                      {sec.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleJumpPage(sec.page)}
                    className="text-xs font-medium text-[#c25e3f] hover:underline"
                  >
                    Vai a pag. {sec.page} &rarr;
                  </button>
                </div>

                <p className="font-serif italic text-xs text-[#6e5d4c]">
                  «{sec.quote}»
                </p>

                {/* List of recipes in this section */}
                <div className="divide-y divide-[#f7f4ed] pt-1">
                  {sectionRecipes.map((r) => (
                    <div
                      key={r.id}
                      className="py-2 flex items-center justify-between gap-2 hover:bg-[#faf7f2] rounded-lg px-1 transition-colors"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="text-xs font-bold text-[#c25e3f] font-mono shrink-0 w-6">
                          #{r.id}
                        </span>
                        <span className="text-xs text-[#2c241d] font-medium truncate">
                          {r.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleJumpPage(r.page)}
                          className="px-2 py-0.5 rounded-md bg-[#faf6ee] text-[11px] text-[#786d5e] hover:text-[#2c241d] border border-[#ebdccb]"
                        >
                          p. {r.page}
                        </button>
                        <button
                          onClick={() => onOpenRecipe(r)}
                          className="px-2 py-0.5 rounded-md bg-[#faebe6] text-[11px] text-[#c25e3f] font-semibold hover:bg-[#f5dad1]"
                        >
                          Scheda
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
