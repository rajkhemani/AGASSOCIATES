'use client';

import * as React from 'react';
import { cn } from '../utils/cn';
import { Search, Command as CommandIcon, Loader2 } from 'lucide-react';

interface CommandPaletteItem {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  group?: string;
  disabled?: boolean;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  items: CommandPaletteItem[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  title?: string;
  description?: string;
  className?: string;
}

export function CommandPalette({
  items,
  open: controlledOpen,
  onOpenChange,
  placeholder = 'Search commands...',
  title,
  description,
  className,
}: CommandPaletteProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? onOpenChange : setUncontrolledOpen;

  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return items;

    const searchTerms = query.toLowerCase().split(' ').filter(Boolean);

    return items
      .map((item) => {
        const searchText = [
          item.label,
          item.description,
          item.shortcut,
          ...(item.keywords || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const matches = searchTerms.every((term) => searchText.includes(term));
        return matches ? item : null;
      })
      .filter((item): item is CommandPaletteItem => item !== null);
  }, [items, query]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, filteredItems.length - 1)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex] && !filteredItems[selectedIndex].disabled) {
            filteredItems[selectedIndex].action();
            setOpen(false);
            setQuery('');
            setSelectedIndex(0);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          setQuery('');
          setSelectedIndex(0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredItems, selectedIndex, setOpen]);

  // Reset selection when query changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle global shortcut (Cmd/Ctrl + K)
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isControlled) {
          setUncontrolledOpen((prev) => !prev);
        } else if (onOpenChange) {
          onOpenChange(!open);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isControlled, onOpenChange, open]);

  if (!open) return null;

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, CommandPaletteItem[]> = {};

    filteredItems.forEach((item) => {
      const group = item.group || 'Commands';
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });

    return Object.entries(groups).map(([group, items]) => ({ group, items }));
  }, [filteredItems]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-start justify-center pt-16',
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-lg border bg-background shadow-lg">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <CommandIcon className="h-5 w-5 text-muted-foreground" />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex h-10 w-full rounded-md bg-transparent py-2 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
              aria-label="Search commands"
              aria-autocomplete="list"
              aria-controls="command-palette-list"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
            )}
            <kbd className="ml-2 px-2 py-0.5 text-xs font-mono text-muted-foreground bg-muted rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        <div id="command-palette-list" className="max-h-[400px] overflow-y-auto p-2">
          {groupedItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No commands found
            </div>
          ) : (
            groupedItems.map(({ group, items: groupItems }, groupIndex) => (
              <div key={group} className="py-2">
                <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group}
                </div>
                {groupItems.map((item, itemIndex) => {
                  const index = filteredItems.indexOf(item);
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (!item.disabled) {
                          item.action();
                          setOpen(false);
                          setQuery('');
                          setSelectedIndex(0);
                        }
                      }}
                      disabled={item.disabled}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                        isSelected
                          ? 'bg-accent text-accent-foreground'
                          : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                        item.disabled && 'opacity-50 pointer-events-none'
                      )}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={item.disabled}
                    >
                      {item.icon && (
                        <span className="flex h-5 w-5 items-center justify-center flex-shrink-0" aria-hidden="true">
                          {item.icon}
                        </span>
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-medium truncate">{item.label}</div>
                        {item.description && (
                          <div className="text-xs truncate text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                      </div>
                      {item.shortcut && (
                        <kbd className="flex items-center gap-1 px-2 py-0.5 text-xs font-mono text-muted-foreground bg-muted rounded border">
                          {item.shortcut.split('+').join(' + ')}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {(title || description) && (
          <div className="border-t px-4 py-3 text-sm">
            {title && <div className="font-medium">{title}</div>}
            {description && (
              <div className="text-muted-foreground mt-1">{description}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for easy command palette integration
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

  const openPalette = React.useCallback(() => setOpen(true), []);
  const closePalette = React.useCallback(() => setOpen(false), []);
  const togglePalette = React.useCallback(() => setOpen((prev) => !prev), []);

  return { open, setOpen, openPalette, closePalette, togglePalette };
}