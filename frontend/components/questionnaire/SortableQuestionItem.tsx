'use client';

import { Question } from '@/lib/types/questionnaire';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, Edit, GripVertical, Trash2 } from 'lucide-react';
import React from 'react';

interface SortableQuestionItemProps {
  question: Question;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  viewMode: 'grid' | 'list';
}

export const SortableQuestionItem: React.FC<SortableQuestionItemProps> = ({
  question,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  viewMode,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border transition-all',
        isSelected
          ? 'border-blue-500 shadow-lg shadow-blue-500/10'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
        isDragging && 'cursor-grabbing',
        viewMode === 'grid' && 'h-full'
      )}
    >
      <div className="flex items-start p-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="mr-3 mt-1 cursor-grab hover:text-gray-600 dark:hover:text-gray-400"
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>

        {/* Selection Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="mr-3 mt-1.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />

        {/* Question Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Question {index + 1}
                </span>
                <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">
                  {question.type.replace(/_/g, ' ')}
                </span>
                {question.required && (
                  <span className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                    Required
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                {question.text}
              </p>
              {question.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {question.description}
                </p>
              )}
            </div>
          </div>

          {/* Options Preview */}
          {question.options && question.options.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Options:
              </p>
              <div className="flex flex-wrap gap-1">
                {question.options
                  .slice(0, 3)
                  .map((option: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs bg-gray-50 dark:bg-gray-900 rounded"
                    >
                      {option.text}
                    </span>
                  ))}
                {question.options.length > 3 && (
                  <span className="px-2 py-0.5 text-xs text-gray-500">
                    +{question.options.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDuplicate}
            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
