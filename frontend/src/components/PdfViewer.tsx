import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertCircle, 
  Loader2, ExternalLink, Maximize2, Minimize2, RotateCcw, Sparkles 
} from 'lucide-react';
import { getInlineMediaUrl, openPdfInNewTab } from '../utils/mediaUtils';

interface PdfViewerProps {
  url: string;
  title?: string;
}

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url, title }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [inputPage, setInputPage] = useState<string>('1');

  // Load PDF.js library dynamically
  useEffect(() => {
    let isMounted = true;

    const loadPdfJs = () => {
      if (window.pdfjsLib) {
        return Promise.resolve(window.pdfjsLib);
      }

      return new Promise((resolve, reject) => {
        const existingScript = document.getElementById('pdfjs-script');
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve(window.pdfjsLib));
          existingScript.addEventListener('error', () => reject(new Error('Error al cargar PDF.js')));
          return;
        }

        const script = document.createElement('script');
        script.id = 'pdfjs-script';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve(window.pdfjsLib);
          } else {
            reject(new Error('PDF.js no disponible'));
          }
        };
        script.onerror = () => reject(new Error('No se pudo cargar la librería de previsualización'));
        document.head.appendChild(script);
      });
    };

    setLoading(true);
    setError(null);

    loadPdfJs()
      .then(async (pdfjs) => {
        if (!isMounted) return;
        const targetPdfUrl = getInlineMediaUrl(url);
        try {
          return await pdfjs.getDocument({ url: targetPdfUrl, withCredentials: false }).promise;
        } catch (directErr) {
          console.warn('Carga directa de PDF.js falló, intentando con ArrayBuffer:', directErr);
          const res = await fetch(targetPdfUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buffer = await res.arrayBuffer();
          return await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
        }
      })
      .then((doc) => {
        if (!isMounted || !doc) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setPageNum(1);
        setInputPage('1');
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error al cargar PDF:', err);
        setError('No se pudo renderizar la vista previa interactiva.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  // Keep input page state in sync with pageNum
  useEffect(() => {
    setInputPage(pageNum.toString());
  }, [pageNum]);

  // Render current page onto canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask: any = null;
    setRendering(true);

    pdfDoc
      .getPage(pageNum)
      .then((page: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        return renderTask.promise;
      })
      .then(() => {
        setRendering(false);
      })
      .catch((err: any) => {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error al renderizar página:', err);
        }
        setRendering(false);
      });

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNum, scale]);

  const changePage = useCallback((offset: number) => {
    setPageNum((prev) => Math.min(Math.max(prev + offset, 1), numPages));
  }, [numPages]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value);
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(inputPage, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
      setPageNum(parsed);
    } else {
      setInputPage(pageNum.toString());
    }
  };

  const changeScale = useCallback((delta: number) => {
    setScale((prev) => Math.min(Math.max(Number((prev + delta).toFixed(1)), 0.6), 2.5));
  }, []);

  const resetScale = useCallback(() => {
    setScale(1.1);
  }, []);

  // Keyboard Shortcuts for page navigation & zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        changePage(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        changePage(-1);
      } else if (e.key === '+' || e.key === '=') {
        changeScale(0.2);
      } else if (e.key === '-') {
        changeScale(-0.2);
      } else if (e.key === '0') {
        resetScale();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changePage, changeScale, resetScale]);

  // Toggle Fullscreen state
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => setIsFullscreen(true));
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => setIsFullscreen(false));
      } else {
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[52vh] sm:h-[62vh] flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-xl p-8 shadow-inner">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-wide">
            Cargando visualizador interactivo...
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Procesando documento PDF de alta resolución
          </p>
        </div>
      </div>
    );
  }

  if (error || !pdfDoc) {
    return (
      <div className="w-full h-[52vh] sm:h-[62vh] flex flex-col items-center justify-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-slate-950/60 p-8 text-center shadow-lg">
        <div className="p-4 rounded-2xl bg-amber-500/15 text-amber-500 shadow-inner">
          <AlertCircle size={38} />
        </div>
        <div className="max-w-md space-y-1">
          <h4 className="text-base font-black text-slate-900 dark:text-white">Vista previa rápida</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            No se pudo renderizar la vista previa en lienzo. Puedes abrirlo directamente o descargarlo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openPdfInNewTab(url)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider transition shadow-md shadow-indigo-600/25 cursor-pointer"
        >
          <ExternalLink size={15} /> Abrir PDF en nueva pestaña
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full flex flex-col gap-0 transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-6 h-screen w-screen' : 'h-full'
      }`}
    >
      {/* Sticky Controls Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-t-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 border-b-0 shadow-sm text-xs font-semibold shrink-0 z-10">
        
        {/* Page Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => changePage(-1)}
            disabled={pageNum <= 1 || rendering}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer active:scale-95 shadow-sm"
            title="Página Anterior (Flecha Izquierda)"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Interactive Direct Page Input */}
          <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 shadow-inner">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:inline">
              PÁG.
            </span>
            <input
              type="text"
              value={inputPage}
              onChange={handlePageInputChange}
              onFocus={(e) => e.target.select()}
              className="w-7 text-center bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-white/10 font-bold text-indigo-600 dark:text-indigo-400 text-xs py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-slate-600 dark:text-slate-300 font-bold text-[11px]">
              / {numPages}
            </span>
          </form>

          <button
            type="button"
            onClick={() => changePage(1)}
            disabled={pageNum >= numPages || rendering}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer active:scale-95 shadow-sm"
            title="Página Siguiente (Flecha Derecha)"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1.5">
          {/* Reset Zoom */}
          <button
            type="button"
            onClick={resetScale}
            disabled={scale === 1.1 || rendering}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer active:scale-95 shadow-sm"
            title="Restablecer Zoom (Tecla 0)"
          >
            <RotateCcw size={14} />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => changeScale(-0.2)}
            disabled={scale <= 0.6 || rendering}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer active:scale-95 shadow-sm"
            title="Alejar (Tecla -)"
          >
            <ZoomOut size={15} />
          </button>

          {/* Scale Percentage Badge */}
          <span className="text-slate-700 dark:text-slate-300 font-extrabold w-11 text-center text-[11px] bg-slate-100 dark:bg-slate-950 py-1 px-1 rounded-md border border-slate-200 dark:border-white/5">
            {Math.round(scale * 100)}%
          </span>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => changeScale(0.2)}
            disabled={scale >= 2.5 || rendering}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer active:scale-95 shadow-sm"
            title="Acercar (Tecla +)"
          >
            <ZoomIn size={15} />
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-white/10 mx-0.5" />

          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 hover:text-white dark:bg-indigo-500/20 dark:hover:bg-indigo-500 dark:text-indigo-400 dark:hover:text-white transition cursor-pointer active:scale-95 shadow-sm font-bold flex items-center gap-1"
            title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Reading Progress Line */}
      <div className="w-full h-0.5 bg-slate-200 dark:bg-slate-900 overflow-hidden shrink-0">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-300"
          style={{ width: `${(pageNum / numPages) * 100}%` }}
        />
      </div>

      {/* Canvas Viewport Area — scroll starts from TOP of PDF */}
      <div className={`w-full flex-1 overflow-auto rounded-b-xl border border-slate-200/90 dark:border-white/10 border-t-0 bg-[#404040] dark:bg-slate-950 relative custom-scrollbar ${
        isFullscreen ? 'max-h-full' : ''
      }`}
        style={isFullscreen ? {} : { minHeight: '0' }}
      >
        {rendering && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20 transition-all duration-200">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <span className="text-xs font-bold text-slate-200 tracking-wider">Renderizando...</span>
          </div>
        )}
        
        {/* Canvas anchored at top-center — no vertical centering */}
        <div className="flex justify-center items-start w-full py-6 px-4">
          <div className="relative transition-transform duration-200 ease-out">
            <canvas 
              ref={canvasRef} 
              className="max-w-full rounded bg-white shadow-[0_8px_40px_rgba(0,0,0,0.55)] ring-1 ring-black/10" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
