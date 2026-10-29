import { useState, useEffect } from 'react';
import recipesData from './data/recipes.json';
import sectionsData from './data/sections.json';
import { Recipe, Section, GroceryItem, ActiveTab } from './types';
import {
  getStoredFavorites,
  saveStoredFavorites,
  getStoredNotes,
  saveStoredNotes,
  getStoredGrocery,
  saveStoredGrocery,
} from './utils/helpers';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ExploreView } from './components/ExploreView';
import { FavoritesView } from './components/FavoritesView';
import { GroceryView } from './components/GroceryView';
import { PdfReaderView } from './components/PdfReaderView';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { CookingModeModal } from './components/CookingModeModal';

const recipes: Recipe[] = recipesData as Recipe[];
const sections: Section[] = sectionsData as Section[];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('esplora');
  const [favorites, setFavorites] = useState<number[]>(getStoredFavorites);
  const [notes, setNotes] = useState<Record<number, string>>(getStoredNotes);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(getStoredGrocery);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [scaledCookingIngredients, setScaledCookingIngredients] = useState<string[]>([]);
  const [pdfTargetPage, setPdfTargetPage] = useState<number>(1);

  // Sync state changes with localStorage
  useEffect(() => {
    saveStoredFavorites(favorites);
  }, [favorites]);

  useEffect(() => {
    saveStoredNotes(notes);
  }, [notes]);

  useEffect(() => {
    saveStoredGrocery(groceryItems);
  }, [groceryItems]);

  // Favorite toggle handler
  const handleToggleFavorite = (recipeId: number) => {
    setFavorites((prev) => {
      if (prev.includes(recipeId)) {
        return prev.filter((id) => id !== recipeId);
      } else {
        return [...prev, recipeId];
      }
    });
  };

  const handleToggleFavoriteEvent = (e: React.MouseEvent, recipeId: number) => {
    e.stopPropagation();
    handleToggleFavorite(recipeId);
  };

  // Notes save handler
  const handleSaveNotes = (recipeId: number, noteContent: string) => {
    setNotes((prev) => ({
      ...prev,
      [recipeId]: noteContent,
    }));
  };

  // Grocery handlers
  const handleAddIngredientsToGrocery = (
    ingredientsList: string[],
    recipeTitle: string,
    recipeId: number
  ) => {
    const newItems: GroceryItem[] = ingredientsList.map((text, idx) => ({
      id: `${recipeId}-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      text,
      recipeId,
      recipeTitle,
      completed: false,
      createdAt: Date.now(),
    }));

    setGroceryItems((prev) => [...prev, ...newItems]);
  };

  const handleAddCustomGroceryItem = (text: string) => {
    const newItem: GroceryItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text,
      completed: false,
      createdAt: Date.now(),
    };
    setGroceryItems((prev) => [newItem, ...prev]);
  };

  const handleToggleGroceryItem = (id: string) => {
    setGroceryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleDeleteGroceryItem = (id: string) => {
    setGroceryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCompletedGrocery = () => {
    setGroceryItems((prev) => prev.filter((item) => !item.completed));
  };

  const handleClearAllGrocery = () => {
    if (window.confirm('Vuoi svuotare tutta la lista della spesa?')) {
      setGroceryItems([]);
    }
  };

  // Inspire Me: Pick random recipe
  const handleInspireMe = () => {
    const randomIdx = Math.floor(Math.random() * recipes.length);
    setSelectedRecipe(recipes[randomIdx]);
  };

  // Jump to PDF page
  const handleOpenPdfPage = (pageNumber: number) => {
    setPdfTargetPage(pageNumber);
    setSelectedRecipe(null);
    setActiveTab('libro');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start Cooking Mode
  const handleStartCookingMode = (recipe: Recipe, scaledIngredients: string[]) => {
    setSelectedRecipe(null);
    setCookingRecipe(recipe);
    setScaledCookingIngredients(scaledIngredients);
  };

  const pendingGroceryCount = groceryItems.filter((i) => !i.completed).length;

  return (
    <div className="min-h-screen bg-[#f7f4ed] text-[#2c241d] flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onInspireMe={handleInspireMe}
        favoritesCount={favorites.length}
      />

      {/* Main Tab Screen Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto">
        {activeTab === 'esplora' && (
          <ExploreView
            recipes={recipes}
            sections={sections}
            favorites={favorites}
            notes={notes}
            onToggleFavorite={handleToggleFavoriteEvent}
            onSelectRecipe={(r) => setSelectedRecipe(r)}
          />
        )}

        {activeTab === 'preferiti' && (
          <FavoritesView
            recipes={recipes}
            favorites={favorites}
            notes={notes}
            onToggleFavorite={handleToggleFavoriteEvent}
            onSelectRecipe={(r) => setSelectedRecipe(r)}
            onExploreClick={() => setActiveTab('esplora')}
          />
        )}

        {activeTab === 'spesa' && (
          <GroceryView
            items={groceryItems}
            onToggleItem={handleToggleGroceryItem}
            onDeleteItem={handleDeleteGroceryItem}
            onAddItem={handleAddCustomGroceryItem}
            onClearCompleted={handleClearCompletedGrocery}
            onClearAll={handleClearAllGrocery}
          />
        )}

        {activeTab === 'libro' && (
          <PdfReaderView
            sections={sections}
            recipes={recipes}
            initialPage={pdfTargetPage}
            onOpenRecipe={(r) => setSelectedRecipe(r)}
          />
        )}
      </main>

      {/* Detail Modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          isFavorite={favorites.includes(selectedRecipe.id)}
          notes={notes[selectedRecipe.id] || ''}
          onSaveNotes={handleSaveNotes}
          onToggleFavorite={handleToggleFavorite}
          onAddIngredientsToGrocery={handleAddIngredientsToGrocery}
          onOpenPdfPage={handleOpenPdfPage}
          onStartCookingMode={handleStartCookingMode}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {/* Step-by-Step Cooking Mode Modal */}
      {cookingRecipe && (
        <CookingModeModal
          recipe={cookingRecipe}
          scaledIngredients={scaledCookingIngredients}
          onClose={() => setCookingRecipe(null)}
        />
      )}

      {/* Fixed Bottom Navigation (Thumb Zone) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        favoritesCount={favorites.length}
        groceryPendingCount={pendingGroceryCount}
      />
    </div>
  );
}
