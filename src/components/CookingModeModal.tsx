import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Check, List, Sparkles } from 'lucide-react';
import { Recipe } from '../types';
import { CookingTimer } from './CookingTimer';

interface CookingModeModalProps {
  recipe: Recipe;
  scaledIngredients: string[];
  onClose: () => void;
}

export function CookingModeModal({
  recipe,
  scaledIngredients,
  onClose,
}: CookingModeModalProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const totalSteps = recipe.steps.length;
  const currentStep = recipe.steps[currentStepIdx] || '';

  const nextStep = () => {
    if (currentStepIdx < totalSteps - 1) {
      setCompletedSteps(prev => ({ ...prev, [currentStepIdx]: true }));
      setCurrentStepIdx(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  // Detect time in current step
  const detectTime = (text: string): number | null => {
    const match = text.match(/(\d+)(?:-(\d+))?\s*minut[io]/i);
    if (match) return match[2] ? parseInt(match[2], 10) : parseInt(match[1], 10);
    const hMatch = text.match(/(\d+)\s*or[ae]/i);
    if (hMatch) return parseInt(hMatch[1], 10) * 60;
    return null;
  };

  const detectedMinutes = detectTime(currentStep);

  return (
    <div className="fixed inset-0 z-50 bg-[#f7f4ed] flex flex-col justify-between overflow-hidden">
      {/* Top Header */}
      <div className="bg-[#fcfaf6] border-b border-[#ebdccb] px-4 py-3 flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#5c4a3b] hover:text-[#2c241d] px-2 py-1.5 rounded-lg active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Chiudi Cucina</span>
        </button>

        <div className="text-center">
          <span className="text-[11px] font-bold text-[#c25e3f] uppercase tracking-wider block">
            Modalità Cucina
          </span>
          <h4 className="font-serif font-bold text-xs text-[#2c241d] truncate max-w-[200px]">
            {recipe.title}
          </h4>
        </div>

        <button
          onClick={() => setShowIngredients(!showIngredients)}
          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl border transition-all ${
            showIngredients
              ? 'bg-[#c25e3f] text-white border-[#c25e3f]'
              : 'bg-[#faf6ee] text-[#5c4a3b] border-[#ebdccb]'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Ingredienti</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#ebdccb] h-1.5">
        <div
          className="bg-[#c25e3f] h-1.5 transition-all duration-300"
          style={{ width: `${((currentStepIdx + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Central Screen Body */}
      <div className="flex-1 overflow-y-auto p-5 max-w-xl mx-auto w-full flex flex-col justify-center">
        {showIngredients ? (
          <div className="bg-white rounded-3xl p-5 border border-[#ebdccb] shadow-md space-y-3 animate-in fade-in max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#f0ebd9]">
              <h3 className="font-serif font-bold text-lg text-[#2c241d]">
                Ingredienti dosati
              </h3>
              <button
                onClick={() => setShowIngredients(false)}
                className="text-xs text-[#c25e3f] font-semibold"
              >
                Torna al passaggio
              </button>
            </div>
            <ul className="space-y-2">
              {scaledIngredients.map((ing, i) => (
                <li key={i} className="text-sm text-[#2c241d] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#c25e3f]" />
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step Counter */}
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-sm text-[#c25e3f] uppercase tracking-wider">
                Passaggio {currentStepIdx + 1} di {totalSteps}
              </span>
              <button
                onClick={() => {
                  setCompletedSteps(prev => ({ ...prev, [currentStepIdx]: !prev[currentStepIdx] }));
                }}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
                  completedSteps[currentStepIdx]
                    ? 'bg-[#435c44] text-white border-[#435c44]'
                    : 'bg-white text-[#706456] border-[#ebdccb]'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{completedSteps[currentStepIdx] ? 'Completato' : 'Segna fatto'}</span>
              </button>
            </div>

            {/* Giant Step Instruction Text */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#ebdccb] shadow-md">
              <p className="font-serif text-xl sm:text-2xl text-[#2c241d] leading-relaxed">
                {currentStep}
              </p>
            </div>

            {/* Optional Step Timer Widget */}
            {detectedMinutes && (
              <CookingTimer
                initialMinutes={detectedMinutes}
                label={`Timer passaggio ${currentStepIdx + 1} (${detectedMinutes} min)`}
              />
            )}

            {/* Nonna advice at the last step */}
            {currentStepIdx === totalSteps - 1 && recipe.nonnaTip && (
              <div className="bg-[#fdf5e6] border border-[#eddcb5] p-4 rounded-2xl flex items-start gap-2 text-xs text-[#5a442f]">
                <Sparkles className="w-4 h-4 text-[#c25e3f] shrink-0 mt-0.5" />
                <p className="italic">
                  <strong>Consiglio della nonna:</strong> "{recipe.nonnaTip}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Big Thumb Zone Navigation Controls */}
      <div className="bg-[#fcfaf6] border-t border-[#ebdccb] p-4 pb-safe flex items-center justify-between gap-3 max-w-xl mx-auto w-full">
        <button
          onClick={prevStep}
          disabled={currentStepIdx === 0}
          className="min-w-[48px] h-12 px-4 rounded-2xl bg-white border border-[#ebdccb] text-[#2c241d] disabled:opacity-30 font-medium flex items-center justify-center gap-1 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden xs:inline">Precedente</span>
        </button>

        <span className="text-xs font-bold text-[#8c7b6b] font-mono">
          {currentStepIdx + 1} / {totalSteps}
        </span>

        {currentStepIdx < totalSteps - 1 ? (
          <button
            onClick={nextStep}
            className="flex-1 h-12 rounded-2xl bg-[#c25e3f] hover:bg-[#a94f34] text-white font-medium text-sm flex items-center justify-center gap-1 shadow-md shadow-[#c25e3f]/20 active:scale-95 transition-all"
          >
            <span>Prossimo passaggio</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl bg-[#435c44] hover:bg-[#344835] text-white font-medium text-sm flex items-center justify-center gap-1 shadow-md shadow-[#435c44]/20 active:scale-95 transition-all"
          >
            <Check className="w-5 h-5" />
            <span>Piatto pronto! Buon appetito</span>
          </button>
        )}
      </div>
    </div>
  );
}
