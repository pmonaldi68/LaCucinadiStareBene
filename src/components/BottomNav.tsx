import { Compass, Heart, ShoppingBag, BookOpen } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  favoritesCount: number;
  groceryPendingCount: number;
}

export function BottomNav({
  activeTab,
  setActiveTab,
  favoritesCount,
  groceryPendingCount,
}: BottomNavProps) {
  const tabs = [
    {
      id: 'esplora' as ActiveTab,
      label: 'Esplora',
      icon: Compass,
    },
    {
      id: 'preferiti' as ActiveTab,
      label: 'Preferiti',
      icon: Heart,
      badge: favoritesCount > 0 ? favoritesCount : null,
    },
    {
      id: 'spesa' as ActiveTab,
      label: 'Spesa',
      icon: ShoppingBag,
      badge: groceryPendingCount > 0 ? groceryPendingCount : null,
    },
    {
      id: 'libro' as ActiveTab,
      label: 'Libro PDF',
      icon: BookOpen,
    },
  ];

  return (
    <nav 
      aria-label="Navigazione principale"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#fcfaf6]/95 backdrop-blur-md border-t border-[#e6decb] shadow-[0_-4px_20px_rgba(44,36,29,0.06)] pb-safe"
    >
      <div className="max-w-xl mx-auto grid grid-cols-4 h-16 items-center px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-[#c25e3f] font-semibold'
                  : 'text-[#706456] hover:text-[#2c241d]'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.4px]' : 'stroke-[1.8px]'
                  }`}
                  fill={isActive && tab.id === 'preferiti' ? 'currentColor' : 'none'}
                />
                {typeof tab.badge === 'number' && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#c25e3f] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 tracking-tight transition-all ${
                isActive ? 'font-semibold text-[#c25e3f]' : 'font-normal'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-6 h-[2px] bg-[#c25e3f] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
