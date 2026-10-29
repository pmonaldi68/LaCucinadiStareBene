import { GroceryItem } from '../types';

const STORAGE_KEYS = {
  FAVORITES: 'starebene_favorites',
  NOTES: 'starebene_notes',
  GROCERY: 'starebene_grocery',
  RECENTS: 'starebene_recents',
};

// --- Storage Utilities ---

export function getStoredFavorites(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return raw ? JSON.parse(raw) : [51, 77, 98, 124, 160, 184]; // Initial curated favorites from nonna!
  } catch {
    return [51, 77, 98, 124, 160, 184];
  }
}

export function saveStoredFavorites(favs: number[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
  } catch (e) {
    console.error('Failed to save favorites', e);
  }
}

export function getStoredNotes(): Record<number, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredNotes(notes: Record<number, string>) {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save notes', e);
  }
}

export function getStoredGrocery(): GroceryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GROCERY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredGrocery(items: GroceryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.GROCERY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save grocery items', e);
  }
}

// --- Ingredient Scaling Utility ---

/**
 * Parses numeric servings count from string like "4 persone", "2 tazze", "12 pagnottine"
 */
export function parseServingsCount(servingsStr: string): { count: number; unit: string } {
  const match = servingsStr.match(/^(\d+)\s*(.*)/);
  if (match) {
    return { count: parseInt(match[1], 10), unit: match[2] || 'porzioni' };
  }
  return { count: 4, unit: 'porzioni' };
}

/**
 * Scales an ingredient string by multiplier factor
 * Example: "300 g farina" at 1.5x -> "450 g farina"
 * "1 uovo" at 2x -> "2 uova"
 * "1/2 limone" at 2x -> "1 limone"
 */
export function scaleIngredient(ingredient: string, factor: number): string {
  if (factor === 1 || !ingredient) return ingredient;

  // Handle fractions
  let text = ingredient;
  text = text.replace(/¼/g, '0.25')
             .replace(/½/g, '0.5')
             .replace(/¾/g, '0.75')
             .replace(/1\/2/g, '0.5')
             .replace(/1\/4/g, '0.25')
             .replace(/3\/4/g, '0.75');

  // Match leading quantity: number, decimal, or range
  const numMatch = text.match(/^([\d.,]+)\s*(.*)/);
  if (numMatch) {
    const rawNum = parseFloat(numMatch[1].replace(',', '.'));
    if (!isNaN(rawNum)) {
      const scaled = rawNum * factor;
      // Format number nicely
      let formatted: string;
      if (Number.isInteger(scaled)) {
        formatted = scaled.toString();
      } else if (scaled % 0.5 === 0) {
        formatted = scaled.toFixed(1).replace('.0', '');
      } else {
        formatted = scaled.toFixed(1);
      }
      return `${formatted} ${numMatch[2]}`;
    }
  }

  return ingredient;
}

// --- Web Audio Timer Chime ---

export function playTimerChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play warm melodic nonna chime: 3 harmonious bell tones
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + idx * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 1.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + idx * 0.15);
      osc.stop(ctx.currentTime + idx * 0.15 + 1.3);
    });
  } catch (err) {
    console.warn('Audio playback not permitted or not supported', err);
  }
}

// --- Smart Grocery Categorization ---

export function categorizeIngredient(text: string): string {
  const lower = text.toLowerCase();
  if (/(farina|lievito|zucchero|semola|pangrattato|pane|fiocchi|bicarbonato|avena|riso|pasta|spaghetti|tagliolini|busiate|fregola|orzo|farro|polenta)/.test(lower)) {
    return 'Cereali, Farine & Pane';
  }
  if (/(ricotta|latte|uov|uovo|burro|parmigiano|pecorino|grana|casera|caciocavallo|squacquerone|caprino|yogurt)/.test(lower)) {
    return 'Latticini & Uova';
  }
  if (/(limon|aranc|mela|mele|pera|pere|fico|fichi|prugn|uva|mirtill|cotogn)/.test(lower)) {
    return 'Frutta';
  }
  if (/(pomodor|zucchin|cipoll|carot|sedano|aglio|cavolo|verza|spinac|bietol|scarola|finocchi|patat|asparag|carciof|ment|basilico|rosmarino|salvia|timo)/.test(lower)) {
    return 'Verdure & Aromi';
  }
  if (/(ceci|fagiol|lenticchi|fave|cicerchie|piselli)/.test(lower)) {
    return 'Legumi';
  }
  if (/(pesce|alici|sarde|merluzzo|baccalà|polpo|seppie|cozze|totani|branzino|trota|spada|arselle)/.test(lower)) {
    return 'Pesce & Mare';
  }
  if (/(carne|pollo|gallina|vitello|tacchino|coniglio|manzo|agnello|salsiccia|cotiche|speck|faraona)/.test(lower)) {
    return 'Carne';
  }
  if (/(olio|aceto|sale|pepe|miele|cannella|peperoncino|zafferano|noci|mandorle|pinoli|nocciole|chiodi)/.test(lower)) {
    return 'Condimenti & Dispensa';
  }
  return 'Altri Ingredienti';
}
