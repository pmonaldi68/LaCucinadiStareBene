import { Heart, Clock, Users, Flame, PenLine } from 'lucide-react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  isFavorite: boolean;
  hasNotes?: boolean;
  onToggleFavorite: (e: React.MouseEvent, id: number) => void;
  onSelect: (recipe: Recipe) => void;
}

export function RecipeCard({
  recipe,
  isFavorite,
  hasNotes,
  onToggleFavorite,
  onSelect,
}: RecipeCardProps) {
  // Category tint styles matching the book's aesthetic:
  // Crema/terracotta for hot, sage green for cold/salads, warm amber for bakery/teas
  const getCategoryColor = (sectionId: number) => {
    if ([1, 13].includes(sectionId)) return 'text-[#7a583e] bg-[#f4ebe1]'; // Infusi e tisane
    if ([2, 11].includes(sectionId)) return 'text-[#9c5936] bg-[#f9ede3]'; // Dolci e merende
    if ([3, 4, 10].includes(sectionId)) return 'text-[#476344] bg-[#edf3eb]'; // Salati freddi / verdure
    if ([8].includes(sectionId)) return 'text-[#366885] bg-[#e8f1f5]'; // Pesce
    return 'text-[#9e462d] bg-[#faebe6]'; // Primi, carni, zuppe
  };

  const difficultyLabels = ['Facile', 'Media', 'Impegnativa'];

  return (
    <article
      onClick={() => onSelect(recipe)}
      className="group relative bg-[#fcfaf6] rounded-2xl border border-[#e6decb] p-4 shadow-xs hover:shadow-md hover:border-[#d5cbb4] active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top row: Number, Origin, Favorite toggle */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#ebdccb] text-[#5c4a3b] text-xs font-serif font-bold">
              {recipe.id}
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${getCategoryColor(recipe.sectionId)}`}>
              {recipe.origin}
            </span>
            {recipe.hasPhoto && (
              <span className="text-[10px] text-[#786d5e] bg-[#f0ebd9] px-1.5 py-0.5 rounded">
                Foto
              </span>
            )}
            {hasNotes && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#85532a] bg-[#fbf0e4] px-1.5 py-0.5 rounded font-medium">
                <PenLine className="w-2.5 h-2.5" /> Note
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => onToggleFavorite(e, recipe.id)}
            aria-label={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
            className="min-w-[44px] min-h-[44px] -mr-2 -mt-2 flex items-center justify-center text-[#8c7b6b] hover:text-[#c25e3f] active:scale-125 transition-transform"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isFavorite ? 'fill-[#c25e3f] text-[#c25e3f]' : 'hover:stroke-[#c25e3f]'
              }`}
            />
          </button>
        </div>

        {/* Title */}
        <h3 className="font-serif font-semibold text-[17px] leading-snug text-[#2c241d] group-hover:text-[#c25e3f] transition-colors mb-2">
          {recipe.title}
        </h3>

        {/* Evocative description quote */}
        {recipe.description && (
          <p className="text-xs text-[#6e6355] line-clamp-2 leading-relaxed mb-3">
            {recipe.description}
          </p>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-[#f0ebd9] mt-1">
        <div className="flex items-center justify-between text-[11px] text-[#786d5e]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#9e7f62]" />
              {recipe.prepTime}
            </span>
            {recipe.cookTime !== 'nessuna' && (
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#c25e3f]" />
                {recipe.cookTime}
              </span>
            )}
            <span className="flex items-center gap-1 hidden sm:flex">
              <Users className="w-3.5 h-3.5 text-[#9e7f62]" />
              {recipe.servings}
            </span>
          </div>

          {/* Difficulty Dots */}
          <div className="flex items-center gap-1" title={`Difficoltà: ${difficultyLabels[recipe.difficulty - 1]}`}>
            <span className="text-[10px] text-[#8c7b6b] mr-0.5">Diff:</span>
            {[1, 2, 3].map((dot) => (
              <span
                key={dot}
                className={`w-2 h-2 rounded-full ${
                  dot <= recipe.difficulty ? 'bg-[#c25e3f]' : 'bg-[#e5dccb]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Nonna's wisdom teaser */}
        {recipe.nonnaTip && (
          <div className="mt-2 text-[11px] text-[#85532a] bg-[#faf3e3] rounded-lg p-2 border border-[#eddcb5]/60 flex items-start gap-1.5">
            <span className="font-serif italic font-semibold text-[12px] text-[#b36a28] shrink-0">
              Nonna:
            </span>
            <p className="italic line-clamp-1 text-[#69543e]">
              "{recipe.nonnaTip}"
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
