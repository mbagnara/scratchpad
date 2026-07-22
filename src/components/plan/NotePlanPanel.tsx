import { useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuid } from 'uuid';
import type { NotePlan, PlanStep, PlanStepStatus } from '../../domain/notes';
import './NotePlanPanel.css';

interface Props {
  plan: NotePlan;
  expanded: boolean;
  isFocused: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onChange: (plan: NotePlan) => void;
  onRemove: () => void;
  onRemoveFromFocus: () => void;
}

interface StepProps {
  step: PlanStep;
  onTextChange: (text: string) => void;
  onStatusChange: (status: PlanStepStatus) => void;
  onDelete: () => void;
}

function SortablePlanStep({ step, onTextChange, onStatusChange, onDelete }: StepProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  });

  const toggleDone = () => onStatusChange(step.status === 'done' ? 'todo' : 'done');
  const toggleWaiting = () => onStatusChange(step.status === 'waiting' ? 'todo' : 'waiting');

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`note-plan-step note-plan-step--${step.status} ${isDragging ? 'note-plan-step--dragging' : ''}`}
    >
      <button
        type="button"
        className="note-plan-step__check"
        aria-label={step.status === 'done' ? `Mark ${step.text} incomplete` : `Complete ${step.text}`}
        aria-pressed={step.status === 'done'}
        onClick={toggleDone}
      >
        <span aria-hidden="true">{step.status === 'done' ? '✓' : ''}</span>
      </button>
      <input
        className="note-plan-step__text"
        value={step.text}
        aria-label="Plan step"
        onChange={(event) => onTextChange(event.target.value)}
      />
      <span className="note-plan-step__actions">
        <button
          type="button"
          className={`note-plan-step__waiting ${step.status === 'waiting' ? 'note-plan-step__waiting--active' : ''}`}
          aria-label={step.status === 'waiting' ? `Stop waiting on ${step.text}` : `Mark ${step.text} as waiting`}
          aria-pressed={step.status === 'waiting'}
          title={step.status === 'waiting' ? 'Waiting' : 'Mark as waiting'}
          onClick={toggleWaiting}
        >
          <span aria-hidden="true">◷</span>
        </button>
        <button
          type="button"
          className="note-plan-step__delete"
          aria-label={`Delete ${step.text}`}
          title="Delete step"
          onClick={onDelete}
        >
          <span aria-hidden="true">×</span>
        </button>
        <button
          type="button"
          className="note-plan-step__drag"
          aria-label={`Reorder ${step.text}`}
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <span aria-hidden="true">⠿</span>
        </button>
      </span>
    </li>
  );
}

export function NotePlanPanel({
  plan,
  expanded,
  isFocused,
  onExpandedChange,
  onChange,
  onRemove,
  onRemoveFromFocus,
}: Props) {
  const [newStep, setNewStep] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const completed = plan.steps.filter((step) => step.status === 'done').length;
  const total = plan.steps.length;
  const allDone = total > 0 && completed === total;

  const updateStep = (id: string, patch: Partial<PlanStep>) => {
    const current = plan.steps.find((step) => step.id === id);
    if (!current) return;
    const updated = { ...current, ...patch };
    let steps = plan.steps.filter((step) => step.id !== id);

    if (patch.status === 'done') {
      steps = [...steps, updated];
    } else if (current.status === 'done' && patch.status) {
      const firstDone = steps.findIndex((step) => step.status === 'done');
      const insertAt = firstDone === -1 ? steps.length : firstDone;
      steps.splice(insertAt, 0, updated);
    } else {
      const index = plan.steps.findIndex((step) => step.id === id);
      steps.splice(Math.min(index, steps.length), 0, updated);
    }

    onChange({ ...plan, steps });
  };

  const addStep = () => {
    const text = newStep.trim();
    if (!text) return;
    const step: PlanStep = { id: uuid(), text, status: 'todo' };
    const firstDone = plan.steps.findIndex((item) => item.status === 'done');
    const steps = [...plan.steps];
    steps.splice(firstDone === -1 ? steps.length : firstDone, 0, step);
    onChange({ ...plan, steps });
    setNewStep('');
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = plan.steps.findIndex((step) => step.id === active.id);
    const to = plan.steps.findIndex((step) => step.id === over.id);
    if (from < 0 || to < 0) return;
    onChange({ ...plan, steps: arrayMove(plan.steps, from, to) });
  };

  const removePlan = () => {
    onRemove();
  };

  return (
    <section className={`note-plan ${expanded ? 'note-plan--expanded' : ''}`}>
      <button
        type="button"
        className="note-plan__header"
        aria-expanded={expanded}
        onClick={() => onExpandedChange(!expanded)}
      >
        <span className="note-plan__heading">
          <span className="note-plan__icon" aria-hidden="true">✓</span>
          <span>Plan</span>
        </span>
        <span className="note-plan__summary">
          {total > 0 && <span>{completed}/{total}</span>}
          <span className="note-plan__chevron" aria-hidden="true">›</span>
        </span>
      </button>

      {expanded && (
        <div className="note-plan__body">
          <label className="note-plan__objective">
            <span>Outcome</span>
            <input
              value={plan.objective}
              placeholder="What does done look like?"
              onChange={(event) => onChange({ ...plan, objective: event.target.value })}
            />
          </label>

          {total > 0 && (
            <div className="note-plan__progress" aria-label={`${completed} of ${total} steps complete`}>
              <span style={{ width: `${(completed / total) * 100}%` }} />
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={plan.steps.map((step) => step.id)} strategy={verticalListSortingStrategy}>
              <ul className="note-plan__steps">
                {plan.steps.map((step) => (
                  <SortablePlanStep
                    key={step.id}
                    step={step}
                    onTextChange={(text) => updateStep(step.id, { text })}
                    onStatusChange={(status) => updateStep(step.id, { status })}
                    onDelete={() => onChange({
                      ...plan,
                      steps: plan.steps.filter((item) => item.id !== step.id),
                    })}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          <form
            className="note-plan__add"
            onSubmit={(event) => {
              event.preventDefault();
              addStep();
            }}
          >
            <span aria-hidden="true">＋</span>
            <input
              value={newStep}
              placeholder="Add a step"
              aria-label="Add a plan step"
              onChange={(event) => setNewStep(event.target.value)}
            />
          </form>

          {allDone && isFocused && (
            <div className="note-plan__complete">
              <span><strong>Plan complete.</strong> Your note is still in Focus.</span>
              <button type="button" onClick={onRemoveFromFocus}>Remove from Focus</button>
            </div>
          )}

          <div className="note-plan__footer">
            <span>{plan.steps.some((step) => step.status === 'waiting') ? '◷ Some steps are waiting' : 'Drag steps to set their order'}</span>
            <button type="button" onClick={removePlan}>Remove plan</button>
          </div>
        </div>
      )}
    </section>
  );
}
