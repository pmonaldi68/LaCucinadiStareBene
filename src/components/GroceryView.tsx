import { useState, useMemo } from 'react';
import { ShoppingBag, Plus, Trash2, Check, Share2, Sparkles, CheckCheck } from 'lucide-react';
import { GroceryItem } from '../types';
import { categorizeIngredient } from '../utils/helpers';

interface GroceryViewProps {
  items: GroceryItem[];
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: (text: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
}

export function GroceryView({
  items,
  onToggleItem,
  onDeleteItem,
  onAddItem,
  onClearCompleted,
  onClearAll,
}: GroceryViewProps) {
  const [newItemText, setNewItemText] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);

  const pendingItems = items.filter((i) => !i.completed);
  const completedItems = items.filter((i) => i.completed);

  // Group pending items by category
  const groupedPending = useMemo(() => {
    const groups: Record<string, GroceryItem[]> = {};
    pendingItems.forEach((item) => {
      const cat = categorizeIngredient(item.text);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [pendingItems]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemText.trim()) {
      onAddItem(newItemText.trim());
      setNewItemText('');
    }
  };

  const handleShareList = async () => {
    if (items.length === 0) return;
    
    let shareText = `Lista della Spesa (La cucina di Stare bene):\n\n`;
    if (pendingItems.length > 0) {
      shareText += `DA COMPRARE:\n${pendingItems.map((i) => `☐ ${i.text}`).join('\n')}\n\n`;
    }
    if (completedItems.length > 0) {
      shareText += `GIÀ PRESI:\n${completedItems.map((i) => `☑ ${i.text}`).join('\n')}`;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lista della Spesa',
          text: shareText,
        });
        return;
      } catch {
        // fallback
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-2xl mx-auto px-4 pt-3">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#2c241d] flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#c25e3f]" />
            <span>Lista della Spesa</span>
          </h2>
          <p className="text-xs text-[#786d5e]">
            {pendingItems.length} da acquistare {completedItems.length > 0 ? `· ${completedItems.length} già presi` : ''}
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShareList}
              className="p-2 rounded-xl bg-white border border-[#ebdccb] text-[#5c4a3b] hover:bg-[#faf6ee] active:scale-95 transition-all"
              title="Condividi lista"
              aria-label="Condividi lista della spesa"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {completedItems.length > 0 && (
              <button
                onClick={onClearCompleted}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-[#ebdccb] text-[#8c7b6b] hover:text-[#b33a1e] text-xs font-medium"
                title="Rimuovi spuntati"
              >
                Pulisci presi
              </button>
            )}
          </div>
        )}
      </div>

      {copiedNotification && (
        <div className="p-3 bg-[#e8f3e5] border border-[#a8cf9f] text-[#345c2c] text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>Lista copiata! Incollala su WhatsApp o Note.</span>
        </div>
      )}

      {/* Add New Item Input */}
      <form onSubmit={handleAddSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Aggiungi ingrediente o prodotto..."
          className="flex-1 h-11 px-4 bg-white rounded-2xl border border-[#e6decb] text-sm text-[#2c241d] placeholder-[#9c8e7e] shadow-xs focus:outline-none focus:border-[#c25e3f]"
        />
        <button
          type="submit"
          disabled={!newItemText.trim()}
          className="min-w-[44px] h-11 px-4 rounded-2xl bg-[#c25e3f] disabled:opacity-40 text-white font-medium text-xs flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">Aggiungi</span>
        </button>
      </form>

      {/* Items List */}
      {items.length > 0 ? (
        <div className="space-y-4">
          {/* Pending Groups */}
          {Object.entries(groupedPending).map(([category, catItems]) => (
            <div key={category} className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#8c7b6b] uppercase tracking-wider px-1">
                {category}
              </span>
              <div className="bg-white rounded-2xl border border-[#ebdccb] divide-y divide-[#f2ecdf] overflow-hidden shadow-xs">
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 hover:bg-[#faf8f4] transition-colors"
                  >
                    <div
                      onClick={() => onToggleItem(item.id)}
                      className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                    >
                      <div className="w-5 h-5 rounded-md border border-[#c4b69d] bg-white flex items-center justify-center" />
                      <div>
                        <span className="text-sm font-medium text-[#2c241d] block">
                          {item.text}
                        </span>
                        {item.recipeTitle && (
                          <span className="text-[10px] text-[#8c7b6b] block">
                            Per: {item.recipeTitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 text-[#a89c8e] hover:text-[#b33a1e] rounded-lg active:scale-95"
                      aria-label="Elimina elemento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Completed Items */}
          {completedItems.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold text-[#8c7b6b] uppercase tracking-wider px-1">
                Già Acquistati ({completedItems.length})
              </span>
              <div className="bg-[#f5f1e8] rounded-2xl border border-[#e0d6c3] divide-y divide-[#e8e0ce] overflow-hidden">
                {completedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <div
                      onClick={() => onToggleItem(item.id)}
                      className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                    >
                      <div className="w-5 h-5 rounded-md bg-[#435c44] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-sm text-[#5c4a3b] line-through">
                        {item.text}
                      </span>
                    </div>

                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 text-[#8c7b6b] hover:text-[#b33a1e]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action */}
          <div className="text-center pt-2">
            <button
              onClick={onClearAll}
              className="text-xs text-[#a89c8e] hover:text-[#b33a1e] underline"
            >
              Svuota l'intera lista della spesa
            </button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 px-6 bg-white rounded-3xl border border-[#e6decb] shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#f4ebe1] text-[#c25e3f] flex items-center justify-center mx-auto">
            <CheckCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-[#2c241d] mb-1">
              Lista della spesa vuota
            </h3>
            <p className="text-xs text-[#786d5e] max-w-sm mx-auto leading-relaxed">
              Quando apri una ricetta, tocca il pulsante <strong>"Alla spesa"</strong> per aggiungere automaticamente tutti gli ingredienti necessari.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
