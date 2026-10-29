import { useState, useMemo } from 'react';
import { Heart, Search, Sparkles, BookOpen } from 'lucide-react';
import { Recipe } from '../types';
import { RecipeCard } from './RecipeCard';

interface FavoritesViewProps {
  recipes: Recipe[];
  favorites: number[];
  notes: Record<number, string>;
  onToggleFavorite: (e: React.MouseEvent, id: number) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onExploreClick: () => void;
}

export function FavoritesView({
  recipes,
  favorites,
  notes,
  onToggleFavorite,
  onSelectRecipe,
  onExploreClick,
}: FavoritesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const favoriteRecipes = useMemo(() => {
    return recipes.filter((r) => favorites.includes(r.id));
  }, [recipes, favorites]);

  // Unique sections in favorites
  const sectionsInFavorites = useMemo(() => {
    const map = new Map<string, number>();
    favoriteRecipes.forEach((r) => {
      map.set(r.sectionName, (map.get(r.sectionName) || 0) + 1);
    });
    return Array.from(map.entries());
  }, [favoriteRecipes]);

  const filteredFavorites = useMemo(() => {
    return favoriteRecipes.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchOrigin = r.origin.toLowerCase().includes(q);
        const matchIng = r.ingredients.some((i) => i.toLowerCase().includes(q));
        const matchNote = (notes[r.id] || '').toLowerCase().includes(q);
        if (!matchTitle && !matchOrigin && !matchIng && !matchNote) return false;
      }
      if (selectedSection && r.sectionName !== selectedSection) return false;
      return true;
    });
  }, [favoriteRecipes, searchQuery, selectedSection, notes]);

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto px-4 pt-3">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#2c241d] flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#c25e3f] fill-[#c25e3f]" />
            <span>I tuoi Preferiti</span>
          </h2>
          <p className="text-xs text-[#786d5e]">
            {favoriteRecipes.length} ricette salvate nella tua collezione
          </p>
        </div>
      </div>

      {favoriteRecipes.length > 0 ? (
        <>
          {/* Search inside favorites */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#8c7b6b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca tra i tuoi piatti preferiti..."
              className="w-full h-10 pl-10 pr-4 bg-white rounded-2xl border border-[#e6decb] text-xs text-[#2c241d] placeholder-[#9c8e7e] shadow-xs focus:outline-none focus:border-[#c25e3f]"
            />
          </div>

          {/* Section filter pills if there are multiple sections */}
          {sectionsInFavorites.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
              <button
                onClick={() => setSelectedSection(null)}
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap border transition-all ${
                  selectedSection === null
                    ? 'bg-[#2c241d] text-white border-[#2c241d]'
                    : 'bg-white text-[#5c4a3b] border-[#e6decb]'
                }`}
              >
                Tutti ({favoriteRecipes.length})
              </button>
              {sectionsInFavorites.map(([secName, count]) => (
                <button
                  key={secName}
                  onClick={() => setSelectedSection(selectedSection === secName ? null : secName)}
                  className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap border transition-all ${
                    selectedSection === secName
                      ? 'bg-[#c25e3f] text-white border-[#c25e3f]'
                      : 'bg-white text-[#5c4a3b] border-[#e6decb]'
                  }`}
                >
                  {secName} ({count})
                </button>
              ))}
            </div>
          )}

          {/* Recipe Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredFavorites.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isFavorite={true}
                hasNotes={!!notes[recipe.id]}
                onToggleFavorite={onToggleFavorite}
                onSelect={onSelectRecipe}
              />
            ))}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="text-center py-12 px-6 bg-white rounded-3xl border border-[#e6decb] shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#faebe6] text-[#c25e3f] flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-[#2c241d] mb-1">
              Nessun preferito salvato
            </h3>
            <p className="text-xs text-[#786d5e] max-w-sm mx-auto leading-relaxed">
              Tocca l'icona del cuore <Heart className="w-3.5 h-3.5 inline text-[#c25e3f]" /> su qualunque ricetta per raccogliere i piatti di casa che vuoi cucinare più spesso.
            </p>
          </div>
          <button
            onClick={onExploreClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#c25e3f] hover:bg-[#a94f34] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Esplora il Ricettario</span>
          </button>
        </div>
      )}
    </div>
  );
}
