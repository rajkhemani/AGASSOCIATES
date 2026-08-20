'use client';

import * as React from 'react';
import { cn } from '../utils/cn';
import { GripVertical, GripHorizontal, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';

type SplitDirection = 'horizontal' | 'vertical';
type SplitSize = number | string;

interface SplitViewProps {
  children: React.ReactNode;
  direction?: SplitDirection;
  sizes?: SplitSize[];
  minSizes?: (number | string)[];
  maxSizes?: (number | string)[];
  onChange?: (sizes: number[]) => void;
  className?: string;
  collapsed?: boolean[];
  onCollapseChange?: (index: number, collapsed: boolean) => void;
  showCollapseButtons?: boolean;
  gutterSize?: number;
  gutterColor?: string;
}

interface SplitViewPaneProps {
  children: React.ReactNode;
  size?: SplitSize;
  minSize?: number | string;
  maxSize?: number | string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

function SplitViewPane({
  children,
  className,
}: SplitViewPaneProps) {
  return (
    <div className={cn('flex-1 overflow-auto', className)}>
      {children}
    </div>
  );
}

function SplitViewGutter({
  direction = 'horizontal',
  onDragStart,
  collapsed,
  onCollapse,
  showCollapseButton = true,
  gutterSize = 8,
  gutterColor,
}: {
  direction: SplitDirection;
  onDragStart: (e: React.MouseEvent) => void;
  collapsed?: boolean;
  onCollapse?: () => void;
  showCollapseButton?: boolean;
  gutterSize?: number;
  gutterColor?: string;
}) {
  const isHorizontal = direction === 'horizontal';

  return (
    <div
      className={cn(
        'relative flex items-center justify-center select-none transition-colors',
        isHorizontal
          ? 'w-[8px] h-full cursor-col-resize hover:bg-muted'
          : 'h-[8px] w-full cursor-row-resize hover:bg-muted',
        gutterColor && `bg-[${gutterColor}]`,
        collapsed && 'bg-muted/50'
      )}
      style={{
        width: isHorizontal ? gutterSize : undefined,
        height: isHorizontal ? undefined : gutterSize,
        backgroundColor: gutterColor,
      }}
      onMouseDown={onDragStart}
      onTouchStart={onDragStart as any}
      role="separator"
      aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
      aria-label={isHorizontal ? 'Resize horizontally' : 'Resize vertically'}
      tabIndex={0}
    >
      {showCollapseButton && onCollapse && !collapsed && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCollapse?.();
          }}
          className={cn(
            'absolute p-1 rounded hover:bg-accent transition-colors',
            isHorizontal ? 'top-2' : 'left-2'
          )}
          aria-label="Collapse pane"
        >
          {isHorizontal ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>
      )}
      {showCollapseButton && onCollapse && collapsed && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCollapse?.();
          }}
          className={cn(
            'absolute p-1 rounded hover:bg-accent transition-colors',
            isHorizontal ? 'top-2' : 'left-2'
          )}
          aria-label="Expand pane"
        >
          {isHorizontal ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      )}
      <div
        className={cn(
          'bg-muted-foreground/30 rounded-full',
          isHorizontal ? 'w-1 h-6' : 'w-6 h-1'
        )}
        aria-hidden="true"
      />
    </div>
  );
}

export function SplitView({
  children,
  direction = 'horizontal',
  sizes = [50, 50],
  minSizes,
  maxSizes,
  onChange,
  className,
  collapsed = [],
  onCollapseChange,
  showCollapseButtons = true,
  gutterSize = 8,
  gutterColor,
}: SplitViewProps) {
  const panes = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<SplitViewPaneProps> =>
      React.isValidElement(child) && child.type === SplitViewPane
  );

  if (panes.length < 2) {
    console.warn('SplitView requires at least 2 SplitViewPane children');
    return <div className={className}>{children}</div>;
  }

  const [currentSizes, setCurrentSizes] = React.useState<number[]>(
    sizes.map((s) => (typeof s === 'string' ? parseFloat(s) : s))
  );
  const [collapsedState, setCollapsedState] = React.useState<boolean[]>(
    collapsed.length === panes.length ? collapsed : Array(panes.length).fill(false)
  );
  const [draggingIndex, setDraggingIndex] = React.useState<number | null>(null);
  const [startPositions, setStartPositions] = React.useState<number[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Normalize sizes to percentages
  const normalizeSizes = (sizes: number[]) => {
    const total = sizes.reduce((sum, s) => sum + s, 0);
    return sizes.map((s) => (s / total) * 100);
  };

  // Apply constraints
  const applyConstraints = (sizes: number[], index: number) => {
    const newSizes = [...sizes];
    const minSize = minSizes?.[index];
    const maxSize = maxSizes?.[index];

    if (minSize !== undefined) {
      const min = typeof minSize === 'string' ? parseFloat(minSize) : minSize;
      if (newSizes[index] < min) {
        const diff = min - newSizes[index];
        newSizes[index] = min;
        // Distribute diff to other panes
        const otherIndices = newSizes.map((_, i) => i).filter((i) => i !== index);
        otherIndices.forEach((i) => {
          const max = maxSizes?.[i];
          const maxVal = max !== undefined
            ? (typeof max === 'string' ? parseFloat(max) : max)
            : 100;
          const available = maxVal - newSizes[i];
          const take = Math.min(diff / otherIndices.length, available);
          newSizes[i] += take;
        });
      }
    }

    if (maxSize !== undefined) {
      const max = typeof maxSize === 'string' ? parseFloat(maxSize) : maxSize;
      if (newSizes[index] > max) {
        const diff = newSizes[index] - max;
        newSizes[index] = max;
        const otherIndices = newSizes.map((_, i) => i).filter((i) => i !== index);
        otherIndices.forEach((i) => {
          const min = minSizes?.[i];
          const minVal = min !== undefined
            ? (typeof min === 'string' ? parseFloat(min) : min)
            : 0;
          const available = newSizes[i] - minVal;
          const give = Math.min(diff / otherIndices.length, available);
          newSizes[i] -= give;
        });
      }
    }

    return normalizeSizes(newSizes);
  };

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingIndex(index);

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startPos = direction === 'horizontal' ? e.clientX : e.clientY;
    const containerStart = direction === 'horizontal' ? rect.left : rect.top;
    const containerSize = direction === 'horizontal' ? rect.width : rect.height;

    const positions = currentSizes.map((_, i) => {
      const sum = currentSizes.slice(0, i).reduce((a, b) => a + b, 0);
      return (sum / 100) * containerSize;
    });

    setStartPositions(positions);

    const handleMove = (moveEvent: MouseEvent) => {
      if (draggingIndex === null) return;

      const currentPos = direction === 'horizontal' ? moveEvent.clientX : moveEvent.clientY;
      const delta = currentPos - startPos;
      const deltaPercent = (delta / containerSize) * 100;

      const newSizes = [...currentSizes];
      newSizes[draggingIndex] += deltaPercent;
      newSizes[draggingIndex + 1] -= deltaPercent;

      const constrainedSizes = applyConstraints(newSizes, draggingIndex);
      setCurrentSizes(constrainedSizes);
    };

    const handleUp = () => {
      setDraggingIndex(null);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      onChange?.(currentSizes);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const handleCollapse = (index: number) => {
    const newCollapsed = [...collapsedState];
    newCollapsed[index] = !newCollapsed[index];
    setCollapsedState(newCollapsed);
    onCollapseChange?.(index, newCollapsed[index]);
  };

  // Render panes with gutters
  const renderedPanes = panes.map((pane, index) => {
    const paneProps = pane.props as SplitViewPaneProps;
    const isCollapsed = collapsedState[index];
    const size = isCollapsed ? 0 : currentSizes[index];

    return (
      <React.Fragment key={index}>
        <div
          className={cn(
            'flex flex-col overflow-hidden transition-all duration-200',
            direction === 'horizontal' ? 'w-[var(--pane-width)]' : 'h-[var(--pane-height)]',
            isCollapsed && 'hidden'
          )}
          style={{
            flex: isCollapsed ? '0 0 0' : '1 1 auto',
            width: direction === 'horizontal' && !isCollapsed ? `${size}%` : undefined,
            height: direction === 'vertical' && !isCollapsed ? `${size}%` : undefined,
            minWidth: direction === 'horizontal' && paneProps.minSize
              ? typeof paneProps.minSize === 'string'
                ? paneProps.minSize
                : `${paneProps.minSize}px`
              : undefined,
            maxWidth: direction === 'horizontal' && paneProps.maxSize
              ? typeof paneProps.maxSize === 'string'
                ? paneProps.maxSize
                : `${paneProps.maxSize}px`
              : undefined,
            minHeight: direction === 'vertical' && paneProps.minSize
              ? typeof paneProps.minSize === 'string'
                ? paneProps.minSize
                : `${paneProps.minSize}px`
              : undefined,
            maxHeight: direction === 'vertical' && paneProps.maxSize
              ? typeof paneProps.maxSize === 'string'
                ? paneProps.maxSize
                : `${paneProps.maxSize}px`
              : undefined,
          }}
        >
          {paneProps.children}
        </div>

        {index < panes.length - 1 && (
          <SplitViewGutter
            direction={direction}
            onDragStart={handleMouseDown(index)}
            collapsed={isCollapsed}
            onCollapse={paneProps.collapsible ? () => handleCollapse(index) : undefined}
            showCollapseButton={showCollapseButtons && paneProps.collapsible}
            gutterSize={gutterSize}
            gutterColor={gutterColor}
          />
        )}
      </React.Fragment>
    );
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex overflow-hidden',
        direction === 'horizontal' ? 'flex-row' : 'flex-col',
        className
      )}
      style={{
        '--pane-width': 'auto',
        '--pane-height': 'auto',
      }}
    >
      {renderedPanes}
    </div>
  );
}

SplitView.Pane = SplitViewPane;

export { SplitViewPane };