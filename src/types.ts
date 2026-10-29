export interface Recipe {
  id: number;
  title: string;
  sectionId: number;
  sectionName: string;
  page: number;
  hasPhoto: boolean;
  origin: string;
  bookRef: string;
  description: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  difficulty: number;
  ingredients: string[];
  steps: string[];
  nonnaTip: string;
}

export interface Section {
  id: number;
  page: number;
  name: string;
  quote: string;
  chapter: string;
  count: number;
}

export interface GroceryItem {
  id: string;
  text: string;
  recipeId?: number;
  recipeTitle?: string;
  completed: boolean;
  createdAt: number;
}

export type ActiveTab = 'esplora' | 'preferiti' | 'spesa' | 'libro';
