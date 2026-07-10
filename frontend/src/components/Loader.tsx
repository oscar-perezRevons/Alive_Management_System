import React from 'react';

interface LoaderProps {
  text?: string;
}

export const Loader: React.FC<LoaderProps> = ({ text = "Cargando Información..." }) => {
  return (
    <div className="flex-1 min-h-[70vh] w-full flex flex-col items-center justify-center relative select-none animate-fadeIn">
      {/* Background glow bubble */}
      <div className="absolute w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none -z-10 animate-pulse"></div>
      
      <style>{`
        @keyframes loading-bar-flow {
          0%, 100% { 
            opacity: 0.25; 
            transform: scaleX(0.85); 
            background-color: rgb(129, 140, 248); /* indigo-400 */
          }
          50% { 
            opacity: 1; 
            transform: scaleX(1.15); 
            background-color: rgb(167, 139, 250); /* purple-400 */
            box-shadow: 0 0 15px rgba(139, 92, 246, 0.6);
          }
        }
        .animate-loading-bar-1 { animation: loading-bar-flow 1.6s infinite ease-in-out; }
        .animate-loading-bar-2 { animation: loading-bar-flow 1.6s infinite ease-in-out; animation-delay: 0.25s; }
        .animate-loading-bar-3 { animation: loading-bar-flow 1.6s infinite ease-in-out; animation-delay: 0.5s; }
      `}</style>

      <div className="flex items-center gap-4 relative z-10">
        <div className="w-10 h-1 rounded-full animate-loading-bar-1 transition-all duration-300"></div>
        <div className="w-10 h-1 rounded-full animate-loading-bar-2 transition-all duration-300"></div>
        <div className="w-10 h-1 rounded-full animate-loading-bar-3 transition-all duration-300"></div>
        
        {/* Hexagon with vertical pause lines */}
        <div className="ml-1 relative">
          <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500/10 blur-xl rounded-full animate-pulse"></div>
          <svg 
            className="w-16 h-16 text-indigo-600 dark:text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.65)] hover:scale-105 transition-transform duration-300 shrink-0" 
            viewBox="0 0 100 100" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="5.5"
          >
            {/* Symmetrical Hexagon points */}
            <polygon 
              points="50,6 88,28 88,72 50,94 12,72 12,28" 
              className="animate-pulse"
              style={{ animationDuration: '3s' }}
            />
            {/* Symmetrical columns inside */}
            <line x1="43" y1="36" x2="43" y2="64" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" />
            <line x1="57" y1="36" x2="57" y2="64" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <p className="text-[10px] sm:text-xs text-slate-450 dark:text-slate-500 font-black uppercase tracking-[0.2em] animate-pulse mt-8 text-center px-4">
        {text}
      </p>
    </div>
  );
};
