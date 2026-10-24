import React from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
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
  children: React.ReactNode;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div className="absolute left-0 top-0 bottom-0 flex items-start pt-4 -ml-8 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 hover:bg-slate-100 rounded cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
        >
          <GripVertical size={16} />
        </button>
      </div>
      {children}
    </div>
  );
};

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
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-accent/90"
        >
          <Plus size={14} /> {addLabel}
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {items.map((item, idx) => (
              <SortableItem key={ids[idx]} id={ids[idx]}>
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{itemLabel} #{idx + 1}</h3>
                    <button
                      aria-label={`Remove ${itemLabel} ${idx + 1}`}
                      onClick={() => onRemove(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {renderItem(item, idx)}
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default SortableSection;
