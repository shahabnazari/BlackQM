/**
 * Phase 10 Day 27: Annotation Panel
 *
 * Collaborative annotation interface for insights
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../apple-ui/Card';
import { Button } from '../apple-ui/Button';
import { Badge } from '../apple-ui/Badge';
import {
  ChatBubbleBottomCenterTextIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { Annotation, repositoryApi } from '@/lib/api/services/repository-api.service';

interface AnnotationPanelProps {
  insightId: string;
}

const ANNOTATION_TYPES: Array<{ value: Annotation['type']; label: string; icon: any; color: string }> = [
  { value: 'note', label: 'Note', icon: ChatBubbleBottomCenterTextIcon, color: 'text-blue-600' },
  { value: 'question', label: 'Question', icon: QuestionMarkCircleIcon, color: 'text-yellow-600' },
  { value: 'critique', label: 'Critique', icon: ExclamationTriangleIcon, color: 'text-red-600' },
  { value: 'extension', label: 'Extension', icon: SparklesIcon, color: 'text-green-600' },
];

export function AnnotationPanel({ insightId }: AnnotationPanelProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [selectedType, setSelectedType] = useState<Annotation['type']>('note');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadAnnotations();
  }, [insightId]);

  const loadAnnotations = async () => {
    try {
      setLoading(true);
      const data = await repositoryApi.getAnnotations(insightId);
      setAnnotations(data);
    } catch (error) {
      console.error('Failed to load annotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newAnnotation.trim()) return;

    try {
      await repositoryApi.createAnnotation(insightId, newAnnotation, selectedType);
      setNewAnnotation('');
      await loadAnnotations();
    } catch (error) {
      console.error('Failed to create annotation:', error);
    }
  };

  const handleUpdate = async (annotationId: string) => {
    if (!editContent.trim()) return;

    try {
      await repositoryApi.updateAnnotation(annotationId, editContent);
      setEditingId(null);
      setEditContent('');
      await loadAnnotations();
    } catch (error) {
      console.error('Failed to update annotation:', error);
    }
  };

  const handleDelete = async (annotationId: string) => {
    if (!confirm('Are you sure you want to delete this annotation?')) return;

    try {
      await repositoryApi.deleteAnnotation(annotationId);
      await loadAnnotations();
    } catch (error) {
      console.error('Failed to delete annotation:', error);
    }
  };

  const getAnnotationType = (type: Annotation['type']): { value: Annotation['type']; label: string; icon: any; color: string } => {
    return (ANNOTATION_TYPES.find(t => t.value === type) || ANNOTATION_TYPES[0]) as { value: Annotation['type']; label: string; icon: any; color: string };
  };

  if (loading) {
    return (
      <Card>
        <div className="p-4 text-center text-gray-500">Loading annotations...</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Annotations ({annotations.length})
        </h3>

        {/* New Annotation Form */}
        <div className="mb-6 space-y-3">
          <div className="flex gap-2">
            {ANNOTATION_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${
                    selectedType === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{type.label}</span>
                </button>
              );
            })}
          </div>

          <textarea
            value={newAnnotation}
            onChange={(e) => setNewAnnotation(e.target.value)}
            placeholder={`Add a ${getAnnotationType(selectedType).label.toLowerCase()}...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />

          <Button
            variant="primary"
            size="sm"
            onClick={handleCreate}
            disabled={!newAnnotation.trim()}
          >
            <ChatBubbleBottomCenterTextIcon className="w-4 h-4 mr-1" />
            Add Annotation
          </Button>
        </div>

        {/* Annotations List */}
        <div className="space-y-3">
          {annotations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No annotations yet. Be the first to add one!
            </div>
          ) : (
            annotations.map((annotation) => {
              const typeInfo = getAnnotationType(annotation.type);
              const Icon = typeInfo.icon;
              const isEditing = editingId === annotation.id;

              return (
                <div key={annotation.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${typeInfo.color}`} />
                      <Badge variant="secondary" className="text-xs">
                        {typeInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingId(annotation.id);
                          setEditContent(annotation.content);
                        }}
                        className="p-1 text-gray-500 hover:text-blue-600"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(annotation.id)}
                        className="p-1 text-gray-500 hover:text-red-600"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdate(annotation.id)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingId(null);
                            setEditContent('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700 mb-2">{annotation.content}</p>
                      <div className="text-xs text-gray-500">
                        {new Date(annotation.createdAt).toLocaleString()}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}
