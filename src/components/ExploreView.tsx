import { useState, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Sparkles,
  Filter,
  SlidersHorizontal,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';
import { Recipe, Section } from '../types';
import { RecipeCard } from './RecipeCard';

interface ExploreViewProps {
  recipes: Recipe[];
  sections: Section[];
  favorites: number[];
  notes: Record<number, string>;
  onToggleFavorite: (e: React.MouseEvent, id: number) => void;
  onSelectRecipe: (recipe: Recipe) => void;
}

export function ExploreView({
  recipes,
  sections,
  favorites,
  notes,
  onToggleFavorite,
  onSelectRecipe,
}: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [maxMinutes, setMaxMinutes] = useState<number | null>(null);
  const [selectedPantryItem, setSelectedPantryItem] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAllSectionsModal, setShowAllSectionsModal] = useState(false);

  const sectionsScrollRef = useRef<HTMLDivElement>(null);

  // Drag-to-scroll tracking
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [initialScrollLeft, setInitialScrollLeft] = useState(0);

  // Common pantry ingredients for quick "Cosa c'è in frigo" filtering
  const pantryPills = [
    'uova',
    'ricotta',
    'pomodoro',
    'zucchine',
    'farro',
    'ceci',
    'fagioli',
    'limone',
    'menta',
    'rosmarino',
    'pane',
    'patate',
  ];

  // Recipe of the day based on day of year
  const recipeOfTheDay = useMemo(() => {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    const photoRecipes = recipes.filter((r) => r.hasPhoto);
    return photoRecipes[dayOfYear % photoRecipes.length] || recipes[0];
  }, [recipes]);

  // Filtering
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // 1. Text Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inTitle = recipe.title.toLowerCase().includes(query);
        const inOrigin = recipe.origin.toLowerCase().includes(query);
        const inSection = recipe.sectionName.toLowerCase().includes(query);
        const inIngredients = recipe.ingredients.some((ing) => ing.toLowerCase().includes(query));
        const inTip = recipe.nonnaTip.toLowerCase().includes(query);
        if (!inTitle && !inOrigin && !inSection && !inIngredients && !inTip) {
          return false;
        }
      }

      // 2. Section Filter
      if (selectedSectionId !== null && recipe.sectionId !== selectedSectionId) {
        return false;
      }

      // 3. Difficulty Filter
      if (selectedDifficulty !== null && recipe.difficulty !== selectedDifficulty) {
        return false;
      }

      // 4. Time Filter
      if (maxMinutes !== null) {
        const prepM = parseInt(recipe.prepTime, 10) || 15;
        if (prepM > maxMinutes) return false;
      }

      // 5. Pantry item filter
      if (selectedPantryItem !== null) {
        const hasItem = recipe.ingredients.some((ing) =>
          ing.toLowerCase().includes(selectedPantryItem.toLowerCase())
        );
        if (!hasItem) return false;
      }

      return true;
    });
  }, [recipes, searchQuery, selectedSectionId, selectedDifficulty, maxMinutes, selectedPantryItem]);

  const activeFiltersCount =
    (selectedSectionId !== null ? 1 : 0) +
    (selectedDifficulty !== null ? 1 : 0) +
    (maxMinutes !== null ? 1 : 0) +
    (selectedPantryItem !== null ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSectionId(null);
    setSelectedDifficulty(null);
    setMaxMinutes(null);
    setSelectedPantryItem(null);
  };

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  // Horizontal scroll helpers
  const handleScrollSections = (direction: 'left' | 'right') => {
    if (sectionsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      sectionsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Mouse drag handlers for desktop / trackpad compatibility
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sectionsScrollRef.current) return;
    setIsMouseDown(true);
    setStartX(e.pageX - sectionsScrollRef.current.offsetLeft);
    setInitialScrollLeft(sectionsScrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !sectionsScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - sectionsScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    sectionsScrollRef.current.scrollLeft = initialScrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsMouseDown(false);
  };

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto px-3 sm:px-4 pt-2">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-[#8c7b6b] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca ricetta, ingrediente, regione (es. cicoria, ricotta, Toscana)..."
            className="w-full h-11 pl-10 pr-20 bg-white rounded-2xl border border-[#e6decb] text-sm text-[#2c241d] placeholder-[#9c8e7e] shadow-xs focus:outline-none focus:border-[#c25e3f] focus:ring-1 focus:ring-[#c25e3f] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-10 p-1.5 text-[#8c7b6b] hover:text-[#2c241d]"
              aria-label="Cancella ricerca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-2 p-2 rounded-xl transition-all ${
              activeFiltersCount > 0 || showFilters
                ? 'bg-[#c25e3f] text-white shadow-xs'
                : 'text-[#706456] hover:bg-[#f2ecdf]'
            }`}
            aria-label="Filtri avanzati"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Advanced Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-4 border border-[#e6decb] shadow-sm space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#2c241d] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#c25e3f]" />
              Filtri Rapidi
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-[#c25e3f] hover:underline font-medium"
              >
                Azzera tutti ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* Difficulty */}
          <div>
            <span className="text-[11px] text-[#786d5e] font-medium block mb-1.5">
              Difficoltà:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { val: null, label: 'Tutte' },
                { val: 1, label: 'Facile' },
                { val: 2, label: 'Media' },
                { val: 3, label: 'Impegnativa' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setSelectedDifficulty(item.val)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                    selectedDifficulty === item.val
                      ? 'bg-[#c25e3f] text-white border-[#c25e3f]'
                      : 'bg-[#faf6ee] text-[#5c4a3b] border-[#ebdccb] hover:bg-[#f2ecdf]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Prep Time */}
          <div>
            <span className="text-[11px] text-[#786d5e] font-medium block mb-1.5">
              Tempo di preparazione:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { val: null, label: 'Qualsiasi' },
                { val: 10, label: '≤ 10 min' },
                { val: 20, label: '≤ 20 min' },
                { val: 30, label: '≤ 30 min' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setMaxMinutes(item.val)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                    maxMinutes === item.val
                      ? 'bg-[#c25e3f] text-white border-[#c25e3f]'
                      : 'bg-[#faf6ee] text-[#5c4a3b] border-[#ebdccb] hover:bg-[#f2ecdf]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pantry Ingredients Filter */}
          <div>
            <span className="text-[11px] text-[#786d5e] font-medium block mb-1.5">
              Cosa hai in casa oggi?
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {pantryPills.map((ing) => (
                <button
                  key={ing}
                  onClick={() =>
                    setSelectedPantryItem(selectedPantryItem === ing ? null : ing)
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs capitalize border transition-all ${
                    selectedPantryItem === ing
                      ? 'bg-[#435c44] text-white border-[#435c44] font-semibold'
                      : 'bg-[#f7f4ed] text-[#5c4a3b] border-[#ebdccb] hover:bg-[#f0e9dc]'
                  }`}
                >
                  {ing}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Horizontal Category Scroller for All 14 Book Sections */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-xs font-semibold text-[#5c4a3b] uppercase tracking-wider flex items-center gap-1.5">
            <span>Sezioni del Ricettario</span>
            <span className="text-[10px] text-[#8c7b6b] font-normal font-sans">
              (14 capitoli)
            </span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAllSectionsModal(true)}
              className="text-[11px] font-medium text-[#c25e3f] hover:underline flex items-center gap-1 px-1.5 py-0.5 rounded"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Vedi tutte</span>
            </button>

            {/* Scroll Navigation Chevrons */}
            <div className="flex items-center gap-0.5 ml-1">
              <button
                onClick={() => handleScrollSections('left')}
                className="w-7 h-7 rounded-lg bg-white border border-[#e6decb] text-[#5c4a3b] hover:bg-[#faf6ee] active:scale-95 flex items-center justify-center shadow-2xs"
                title="Scorri a sinistra"
                aria-label="Scorri sezioni a sinistra"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScrollSections('right')}
                className="w-7 h-7 rounded-lg bg-white border border-[#e6decb] text-[#5c4a3b] hover:bg-[#faf6ee] active:scale-95 flex items-center justify-center shadow-2xs"
                title="Scorri a destra"
                aria-label="Scorri sezioni a destra"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Track with touch & mouse drag support */}
        <div
          ref={sectionsScrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="scroll-touch-x custom-scrollbar-x flex items-center gap-2 pb-2.5 pt-0.5 select-none"
        >
          <button
            onClick={() => setSelectedSectionId(null)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-medium whitespace-nowrap shrink-0 border transition-all ${
              selectedSectionId === null
                ? 'bg-[#2c241d] text-white border-[#2c241d] shadow-xs'
                : 'bg-white text-[#5c4a3b] border-[#e6decb] hover:bg-[#faf6ee]'
            }`}
          >
            Tutte ({recipes.length})
          </button>

          {sections.map((sec) => {
            const isSelected = selectedSectionId === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setSelectedSectionId(isSelected ? null : sec.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs whitespace-nowrap shrink-0 border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#c25e3f] text-white border-[#c25e3f] shadow-xs font-semibold'
                    : 'bg-white text-[#5c4a3b] border-[#e6decb] hover:bg-[#faf6ee]'
                }`}
              >
                <span className="font-serif font-bold text-[11px] opacity-80">
                  {sec.id.toString().padStart(2, '0')}
                </span>
                <span>{sec.name}</span>
                <span className="text-[10px] ml-0.5 opacity-70">
                  ({sec.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal / Sheet for "Vedi tutte le 14 sezioni" */}
      {showAllSectionsModal && (
        <div className="fixed inset-0 z-50 bg-[#2c241d]/50 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="bg-[#fcfaf6] w-full max-w-xl mx-auto rounded-t-3xl sm:rounded-3xl border border-[#ebdccb] shadow-2xl p-5 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#ebdccb]">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2c241d]">
                  Tutti i 14 Capitoli del Ricettario
                </h3>
                <p className="text-xs text-[#786d5e]">
                  Seleziona una sezione per vedere tutte le sue ricette
                </p>
              </div>
              <button
                onClick={() => setShowAllSectionsModal(false)}
                className="w-8 h-8 rounded-full bg-[#f2ecdf] text-[#5c4a3b] flex items-center justify-center hover:bg-[#ebdccb]"
                aria-label="Chiudi elenco sezioni"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto divide-y divide-[#f0ebd9] py-2 flex-1">
              <button
                onClick={() => {
                  setSelectedSectionId(null);
                  setShowAllSectionsModal(false);
                }}
                className={`w-full py-3 px-2 text-left flex items-center justify-between hover:bg-[#faf6ee] rounded-xl transition-colors ${
                  selectedSectionId === null ? 'font-bold text-[#c25e3f]' : 'text-[#2c241d]'
                }`}
              >
                <span className="text-sm font-semibold">Tutte le 200 ricette</span>
                <span className="text-xs text-[#786d5e]">{recipes.length} piatti</span>
              </button>

              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => {
                    setSelectedSectionId(sec.id);
                    setShowAllSectionsModal(false);
                  }}
                  className={`w-full py-3 px-2 text-left flex items-start justify-between hover:bg-[#faf6ee] rounded-xl transition-colors ${
                    selectedSectionId === sec.id ? 'bg-[#faebe6] text-[#c25e3f]' : 'text-[#2c241d]'
                  }`}
                >
                  <div className="pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-xs text-[#c25e3f]">
                        {sec.id.toString().padStart(2, '0')}.
                      </span>
                      <span className="text-sm font-semibold">{sec.name}</span>
                    </div>
                    <p className="font-serif italic text-xs text-[#786d5e] mt-0.5 line-clamp-1">
                      «{sec.quote}»
                    </p>
                  </div>
                  <span className="text-xs font-mono font-medium text-[#8c7b6b] shrink-0 mt-0.5">
                    {sec.count} ricette
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section Quote / Context (when a section is active) */}
      {selectedSection && (
        <div className="bg-[#fcfaf6] border border-[#ebdccb] rounded-2xl p-4 shadow-xs animate-in fade-in">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-[#c25e3f] uppercase tracking-wider font-serif">
              Sezione {selectedSection.id.toString().padStart(2, '0')} · {selectedSection.name}
            </span>
            <button
              onClick={() => setSelectedSectionId(null)}
              className="text-[11px] text-[#8c7b6b] hover:underline"
            >
              Mostra tutte
            </button>
          </div>
          <p className="font-serif italic text-sm text-[#4a3d31] leading-relaxed mb-1">
            «{selectedSection.quote}»
          </p>
          <span className="text-[10px] text-[#8c7b6b]">
            {selectedSection.chapter}
          </span>
        </div>
      )}

      {/* Featured Recipe of the Day (only when no active filter/search) */}
      {!searchQuery && selectedSectionId === null && activeFiltersCount === 0 && recipeOfTheDay && (
        <div
          onClick={() => onSelectRecipe(recipeOfTheDay)}
          className="relative bg-gradient-to-br from-[#f8efe3] to-[#fae6db] rounded-3xl p-5 border border-[#edd5c6] shadow-xs cursor-pointer group hover:border-[#dfba9f] active:scale-[0.99] transition-all"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#c25e3f] text-white text-[11px] font-medium shadow-xs">
              <Sparkles className="w-3 h-3" />
              Consigliata Oggi
            </span>
            <span className="text-xs text-[#8a4a35] font-serif font-semibold">
              N. {recipeOfTheDay.id}
            </span>
          </div>

          <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#2c241d] leading-snug group-hover:text-[#c25e3f] transition-colors mb-2">
            {recipeOfTheDay.title}
          </h3>

          <p className="text-xs text-[#6e5a48] leading-relaxed line-clamp-2 mb-3">
            {recipeOfTheDay.description}
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-[#ebd1c1] text-xs text-[#705641]">
            <span>{recipeOfTheDay.origin}</span>
            <span className="font-medium flex items-center gap-1 text-[#c25e3f]">
              <ChefHat className="w-3.5 h-3.5" />
              Apri ricetta &rarr;
            </span>
          </div>
        </div>
      )}

      {/* Active Filter Summary Bar (if filters active) */}
      {(searchQuery || activeFiltersCount > 0) && (
        <div className="flex items-center justify-between text-xs text-[#786d5e] px-1">
          <span>
            Trovate <strong>{filteredRecipes.length}</strong> su 200 ricette
          </span>
          <button
            onClick={clearAllFilters}
            className="text-[#c25e3f] font-medium hover:underline"
          >
            Rimuovi filtri
          </button>
        </div>
      )}

      {/* Recipes Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isFavorite={favorites.includes(recipe.id)}
              hasNotes={!!notes[recipe.id]}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelectRecipe}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4 bg-white rounded-3xl border border-[#e6decb] space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#faebe6] text-[#c25e3f] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-lg text-[#2c241d]">
            Nessuna ricetta trovata
          </h3>
          <p className="text-xs text-[#786d5e] max-w-sm mx-auto">
            Non ci sono piatti che corrispondono ai filtri attuali. Prova a cercare un altro ingrediente o rimuovi i filtri.
          </p>
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 rounded-xl bg-[#c25e3f] text-white text-xs font-semibold shadow-xs hover:bg-[#a94f34] transition-all"
          >
            Mostra tutte le 200 ricette
          </button>
        </div>
      )}
    </div>
  );
}
