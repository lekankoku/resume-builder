import React from 'react';
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  label: string;
  children: (handle: React.ReactNode) => React.ReactNode;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, label, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children(
        <button
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder ${label}`}
          className="p-1.5 -ml-1.5 hover:bg-slate-100 rounded cursor-grab active:cursor-grabbing touch-none text-slate-500 hover:text-slate-700"
        >
          <GripVertical size={16} />
        </button>,
      )}
    </div>
  );
};

const iconButtonClass = 'p-2 text-slate-500 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent';

interface SortableSectionProps<T> {
  section: string;
  title: string;
  addLabel: string;
  itemLabel: string;
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
  renderItem: (item: NoInfer<T>, index: number) => React.ReactNode;
}

const SortableSection = <T,>({
  section,
  title,
  addLabel,
  itemLabel,
  items,
  onAdd,
  onRemove,
  onMove,
  renderItem,
}: SortableSectionProps<T>) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = items.map((_, idx) => `${section}-${idx}`);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-display text-slate-900">{title}</h2>
        <button
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-all"
        >
          <Plus size={14} /> {addLabel}
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {items.map((item, idx) => (
              <SortableItem key={ids[idx]} id={ids[idx]} label={`${itemLabel} ${idx + 1}`}>
                {(handle) => (
                  <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1">
                        {handle}
                        <h3 className="text-sm font-semibold text-slate-700">{itemLabel} {idx + 1}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          aria-label={`Move ${itemLabel} ${idx + 1} up`}
                          disabled={idx === 0}
                          onClick={() => onMove(idx, idx - 1)}
                          className={iconButtonClass}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          aria-label={`Move ${itemLabel} ${idx + 1} down`}
                          disabled={idx === items.length - 1}
                          onClick={() => onMove(idx, idx + 1)}
                          className={iconButtonClass}
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          aria-label={`Remove ${itemLabel} ${idx + 1}`}
                          onClick={() => onRemove(idx)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {renderItem(item, idx)}
                  </div>
                )}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default SortableSection;
