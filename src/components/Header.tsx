import { Sparkles, BookOpenCheck } from 'lucide-react';

interface HeaderProps {
  onInspireMe: () => void;
  favoritesCount: number;
}

export function Header({ onInspireMe }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#f7f4ed]/90 backdrop-blur-md border-b border-[#e6decb] transition-all">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#c25e3f]/10 border border-[#c25e3f]/20 flex items-center justify-center text-[#c25e3f]">
            <BookOpenCheck className="w-4 h-4 stroke-[2.2px]" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg leading-tight tracking-tight text-[#2c241d]">
              La Cucina di Stare Bene
            </h1>
            <p className="text-[10px] text-[#786d5e] font-sans -mt-0.5">
              200 ricette di Eugenia Mazzaglia
            </p>
          </div>
        </div>

        <button
          onClick={onInspireMe}
          title="Scegli una ricetta a sorpresa"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#c25e3f] hover:bg-[#a94f34] text-white text-xs font-medium shadow-xs active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Ispirami</span>
          <span className="xs:hidden">A caso</span>
        </button>
      </div>
    </header>
  );
}
