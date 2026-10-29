import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Heart,
  Share2,
  Clock,
  Flame,
  ChefHat,
  Plus,
  Minus,
  Check,
  PlusCircle,
  FileText,
  Sparkles,
  Timer,
  PenLine,
  BookOpen
} from 'lucide-react';
import { Recipe } from '../types';
import { parseServingsCount, scaleIngredient } from '../utils/helpers';
import { CookingTimer } from './CookingTimer';

interface RecipeDetailModalProps {
  recipe: Recipe;
  isFavorite: boolean;
  notes: string;
  onSaveNotes: (recipeId: number, notes: string) => void;
  onToggleFavorite: (recipeId: number) => void;
  onAddIngredientsToGrocery: (ingredients: string[], recipeTitle: string, recipeId: number) => void;
  onOpenPdfPage: (page: number) => void;
  onStartCookingMode: (recipe: Recipe, scaledIngredients: string[]) => void;
  onClose: () => void;
}

export function RecipeDetailModal({
  recipe,
  isFavorite,
  notes,
  onSaveNotes,
  onToggleFavorite,
  onAddIngredientsToGrocery,
  onOpenPdfPage,
  onStartCookingMode,
  onClose,
}: RecipeDetailModalProps) {
  const baseServings = useMemo(() => parseServingsCount(recipe.servings), [recipe.servings]);
  const [currentServingsCount, setCurrentServingsCount] = useState<number>(baseServings.count);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [activeTimerMinutes, setActiveTimerMinutes] = useState<number | null>(null);
  const [timerLabel, setTimerLabel] = useState<string>('');
  const [noteText, setNoteText] = useState(notes || '');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [addedGroceryNotification, setAddedGroceryNotification] = useState(false);

  const scaleFactor = baseServings.count > 0 ? currentServingsCount / baseServings.count : 1;

  // Scale all ingredients
  const scaledIngredients = useMemo(() => {
    return recipe.ingredients.map((ing) => scaleIngredient(ing, scaleFactor));
  }, [recipe.ingredients, scaleFactor]);

  const handleServingChange = (delta: number) => {
    setCurrentServingsCount((prev) => Math.max(1, Math.min(24, prev + delta)));
  };

  const toggleIngredientCheck = (idx: number) => {
    setCheckedIngredients((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleStepCheck = (idx: number) => {
    setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleShare = async () => {
    const textToShare = `${recipe.title} (da "La cucina di Stare bene come una volta")\n\nPorzioni: ${currentServingsCount} ${baseServings.unit}\n\nIngredienti:\n${scaledIngredients.map(i => `• ${i}`).join('\n')}\n\nProcedimento:\n${recipe.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nConsiglio della nonna: ${recipe.nonnaTip}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: textToShare,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    
    try {
      await navigator.clipboard.writeText(textToShare);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleAddAllGrocery = () => {
    onAddIngredientsToGrocery(scaledIngredients, recipe.title, recipe.id);
    setAddedGroceryNotification(true);
    setTimeout(() => setAddedGroceryNotification(false), 2500);
  };

  // Helper to detect minutes in step text
  const extractStepTimer = (stepText: string): number | null => {
    const match = stepText.match(/(\d+)(?:-(\d+))?\s*minut[io]/i);
    if (match) {
      // If range like 10-12 minuti, return upper number or average
      return match[2] ? parseInt(match[2], 10) : parseInt(match[1], 10);
    }
    const hourMatch = stepText.match(/(\d+)\s*or[ae]/i);
    if (hourMatch) {
      return parseInt(hourMatch[1], 10) * 60;
    }
    return null;
  };

  const difficultyNames = ['Facile', 'Media', 'Impegnativa'];

  return (
    <div className="fixed inset-0 z-50 bg-[#2c241d]/60 backdrop-blur-xs overflow-y-auto overscroll-contain flex flex-col justify-end sm:justify-center sm:p-4">
      <div 
        className="w-full max-w-2xl mx-auto bg-[#fcfaf6] sm:rounded-3xl rounded-t-3xl min-h-[85vh] sm:min-h-0 sm:max-h-[92vh] flex flex-col shadow-2xl border border-[#ebdccb] animate-in slide-in-from-bottom duration-200 overflow-hidden"
      >
        {/* Mobile Grab Handle Bar */}
        <div className="w-10 h-1 bg-[#d5cbb4] rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Sticky Header with Action Bar */}
        <div className="sticky top-0 z-20 bg-[#fcfaf6]/95 backdrop-blur-md border-b border-[#e6decb] px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-medium text-[#5c4a3b] hover:text-[#2c241d] active:scale-95 transition-transform min-h-[44px] px-2 -ml-2 rounded-xl"
            aria-label="Torna indietro"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Indietro</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenPdfPage(recipe.page)}
              title="Vedi pagina originale nel PDF"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#7a583e] hover:bg-[#f2ecdf] active:scale-95 transition-all"
            >
              <BookOpen className="w-4 h-4 text-[#c25e3f]" />
              <span className="hidden xs:inline">Pag. {recipe.page}</span>
            </button>

            <button
              onClick={handleShare}
              title="Condividi o copia ricetta"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#5c4a3b] hover:bg-[#f2ecdf] active:scale-95 transition-all"
              aria-label="Condividi ricetta"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => onToggleFavorite(recipe.id)}
              title={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#5c4a3b] hover:bg-[#f2ecdf] active:scale-95 transition-all"
              aria-label="Preferito"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isFavorite ? 'fill-[#c25e3f] text-[#c25e3f]' : 'hover:stroke-[#c25e3f]'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-24">
          {/* Notifications */}
          {copiedNotification && (
            <div className="p-3 bg-[#e8f3e5] border border-[#a8cf9f] text-[#345c2c] text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Ricetta completa copiata negli appunti! Pronta da incollare su WhatsApp.</span>
            </div>
          )}

          {addedGroceryNotification && (
            <div className="p-3 bg-[#e8f3e5] border border-[#a8cf9f] text-[#345c2c] text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Ingredienti aggiunti alla tua lista della Spesa!</span>
            </div>
          )}

          {/* Section & Recipe Number Lockup */}
          <div>
            <div className="flex items-center gap-2 text-xs text-[#786d5e] mb-1.5 flex-wrap">
              <span className="font-serif font-bold text-sm text-[#c25e3f]">
                N. {recipe.id}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-medium">{recipe.sectionName}</span>
              <span aria-hidden="true">·</span>
              <span className="bg-[#ede4d3] text-[#5c4a3b] px-2 py-0.5 rounded-md text-[11px] font-medium">
                {recipe.origin}
              </span>
            </div>

            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#2c241d] leading-tight mb-2">
              {recipe.title}
            </h2>

            {recipe.bookRef && (
              <p className="text-xs text-[#8c7b6b] italic mb-3">
                {recipe.bookRef}
              </p>
            )}

            {recipe.description && (
              <p className="text-sm text-[#5c4f42] leading-relaxed bg-[#f6f1e6] p-3.5 rounded-2xl border border-[#ebdccb]">
                {recipe.description}
              </p>
            )}
          </div>

          {/* Key Metrics Banner */}
          <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-[#faf6ee] rounded-2xl border border-[#ebdccb] text-center">
            <div>
              <span className="text-[10px] text-[#8c7b6b] block">Preparazione</span>
              <span className="text-sm font-semibold text-[#2c241d] flex items-center justify-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-[#c25e3f]" /> {recipe.prepTime}
              </span>
            </div>
            <div className="border-x border-[#e6decb]">
              <span className="text-[10px] text-[#8c7b6b] block">Cottura</span>
              <span className="text-sm font-semibold text-[#2c241d] flex items-center justify-center gap-1 mt-0.5">
                <Flame className="w-3.5 h-3.5 text-[#c25e3f]" /> {recipe.cookTime}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#8c7b6b] block">Difficoltà</span>
              <div className="flex items-center justify-center gap-1 mt-1">
                {[1, 2, 3].map((dot) => (
                  <span
                    key={dot}
                    className={`w-2 h-2 rounded-full ${
                      dot <= recipe.difficulty ? 'bg-[#c25e3f]' : 'bg-[#e0d6c3]'
                    }`}
                  />
                ))}
                <span className="text-[10px] font-medium ml-1 text-[#5c4a3b]">
                  {difficultyNames[recipe.difficulty - 1]}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Servings Scaler */}
          <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-[#ebdccb] shadow-xs">
            <div>
              <span className="text-xs font-semibold text-[#2c241d] block">
                Regola le Porzioni
              </span>
              <span className="text-[11px] text-[#786d5e]">
                Le dosi degli ingredienti si aggiornano da sole
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleServingChange(-1)}
                disabled={currentServingsCount <= 1}
                className="w-8 h-8 rounded-xl bg-[#f2ecdf] hover:bg-[#ebdccb] disabled:opacity-40 text-[#2c241d] flex items-center justify-center font-bold text-sm active:scale-95 transition-all"
                aria-label="Diminuisci porzioni"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="font-serif font-bold text-base min-w-[50px] text-center text-[#2c241d]">
                {currentServingsCount} <span className="text-xs font-normal text-[#786d5e]">{baseServings.unit}</span>
              </span>

              <button
                onClick={() => handleServingChange(1)}
                disabled={currentServingsCount >= 24}
                className="w-8 h-8 rounded-xl bg-[#f2ecdf] hover:bg-[#ebdccb] disabled:opacity-40 text-[#2c241d] flex items-center justify-center font-bold text-sm active:scale-95 transition-all"
                aria-label="Aumenta porzioni"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Cooking Timer Widget (if triggered) */}
          {activeTimerMinutes !== null && (
            <CookingTimer
              initialMinutes={activeTimerMinutes}
              label={timerLabel || `Timer per ${recipe.title}`}
              onClose={() => setActiveTimerMinutes(null)}
            />
          )}

          {/* Ingredients Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#2c241d] flex items-center gap-2">
                <span>Ingredienti</span>
                <span className="text-xs font-sans font-normal text-[#8c7b6b]">
                  ({scaledIngredients.length})
                </span>
              </h3>

              <button
                onClick={handleAddAllGrocery}
                className="flex items-center gap-1.5 text-xs font-medium text-[#c25e3f] hover:text-[#9e462d] px-2.5 py-1 rounded-lg hover:bg-[#faebe6] active:scale-95 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Alla spesa</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#ebdccb] divide-y divide-[#f2ecdf] overflow-hidden">
              {scaledIngredients.map((ingredient, idx) => {
                const isChecked = !!checkedIngredients[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleIngredientCheck(idx)}
                    className={`flex items-center gap-3 p-3 cursor-pointer select-none transition-colors ${
                      isChecked ? 'bg-[#f7f5ef] text-[#9c8e7e]' : 'hover:bg-[#fbf9f5]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                        isChecked
                          ? 'bg-[#435c44] border-[#435c44] text-white'
                          : 'border-[#c4b69d] bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className={`text-sm ${isChecked ? 'line-through' : 'text-[#2c241d] font-medium'}`}>
                      {ingredient}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-[#8c7b6b] italic px-1">
              * Tocca un ingrediente per spuntarlo man mano che lo prepari o aggiungi alla pentola.
            </p>
          </div>

          {/* Procedimento / Preparation Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#2c241d]">
                Procedimento
              </h3>

              <button
                onClick={() => onStartCookingMode(recipe, scaledIngredients)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#435c44] hover:bg-[#324533] text-white text-xs font-medium shadow-xs active:scale-95 transition-all"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Modalità Cucina</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {recipe.steps.map((step, idx) => {
                const isChecked = !!checkedSteps[idx];
                const detectedTimer = extractStepTimer(step);
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isChecked
                        ? 'bg-[#f7f5ef] border-[#e6decb] text-[#8c7b6b]'
                        : 'bg-white border-[#ebdccb] shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleStepCheck(idx)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors ${
                          isChecked
                            ? 'bg-[#435c44] text-white'
                            : 'bg-[#ebdccb] text-[#5c4a3b]'
                        }`}
                        aria-label={`Passaggio ${idx + 1}`}
                      >
                        {isChecked ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                      </button>

                      <div className="flex-1">
                        <p className={`text-sm leading-relaxed ${isChecked ? 'line-through text-[#8c7b6b]' : 'text-[#2c241d]'}`}>
                          {step}
                        </p>

                        {/* Interactive step timer launcher if step has a time duration */}
                        {detectedTimer && !isChecked && (
                          <div className="mt-2.5 flex items-center gap-2">
                            <button
                              onClick={() => {
                                setActiveTimerMinutes(detectedTimer);
                                setTimerLabel(`Passaggio ${idx + 1}: ${detectedTimer} min`);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#faf0ea] hover:bg-[#f5e3d7] text-[#c25e3f] text-xs font-semibold border border-[#eed4c6] active:scale-95 transition-all"
                            >
                              <Timer className="w-3.5 h-3.5" />
                              <span>Avvia timer ({detectedTimer} min)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Il Consiglio della Nonna Callout */}
          {recipe.nonnaTip && (
            <div className="relative p-4 sm:p-5 rounded-2xl bg-[#fdf5e6] border-2 border-[#eddcb5] shadow-xs overflow-hidden">
              <div className="flex items-center gap-2 mb-2 text-[#99551e]">
                <Sparkles className="w-4 h-4" />
                <h4 className="font-serif italic font-bold text-base">
                  Il consiglio della nonna
                </h4>
              </div>
              <p className="font-serif italic text-sm text-[#5a442f] leading-relaxed">
                "{recipe.nonnaTip}"
              </p>
            </div>
          )}

          {/* Personal User Notes */}
          <div className="bg-white rounded-2xl p-4 border border-[#ebdccb] space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="notes-textarea" className="text-xs font-semibold text-[#2c241d] flex items-center gap-1.5">
                <PenLine className="w-3.5 h-3.5 text-[#c25e3f]" />
                <span>I tuoi appunti personali per questa ricetta</span>
              </label>
              <span className="text-[10px] text-[#8c7b6b]">Salvato automaticamente</span>
            </div>
            <textarea
              id="notes-textarea"
              rows={3}
              value={noteText}
              onChange={(e) => {
                setNoteText(e.target.value);
                onSaveNotes(recipe.id, e.target.value);
              }}
              placeholder="Es. 'Aggiungere più pepe nero', 'Buona anche con i fagioli cannellini'..."
              className="w-full text-xs text-[#2c241d] bg-[#faf6ee] p-2.5 rounded-xl border border-[#ebdccb] focus:outline-none focus:border-[#c25e3f] focus:ring-1 focus:ring-[#c25e3f]"
            />
          </div>

          {/* Original Book Page Link */}
          <div className="pt-2 text-center">
            <button
              onClick={() => onOpenPdfPage(recipe.page)}
              className="inline-flex items-center gap-2 text-xs font-medium text-[#7a583e] hover:text-[#2c241d] underline py-2"
            >
              <FileText className="w-4 h-4 text-[#c25e3f]" />
              <span>Consulta la pagina originale {recipe.page} nel ricettario PDF</span>
            </button>
          </div>
        </div>

        {/* Sticky Mobile Bottom Bar: Modalità Cucina Quick Action */}
        <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-[#e6decb] p-3 px-4 flex items-center justify-between gap-3">
          <button
            onClick={() => onToggleFavorite(recipe.id)}
            className={`flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl border text-xs font-medium transition-all ${
              isFavorite
                ? 'bg-[#faebe6] border-[#ecc4b7] text-[#c25e3f]'
                : 'bg-[#faf6ee] border-[#ebdccb] text-[#5c4a3b]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#c25e3f] text-[#c25e3f]' : ''}`} />
            <span>{isFavorite ? 'Nei Preferiti' : 'Salva'}</span>
          </button>

          <button
            onClick={() => onStartCookingMode(recipe, scaledIngredients)}
            className="flex-1 h-11 rounded-xl bg-[#c25e3f] hover:bg-[#a94f34] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-[#c25e3f]/20 active:scale-[0.98] transition-all"
          >
            <ChefHat className="w-4 h-4" />
            <span>Inizia a Cucinare</span>
          </button>
        </div>
      </div>
    </div>
  );
}
