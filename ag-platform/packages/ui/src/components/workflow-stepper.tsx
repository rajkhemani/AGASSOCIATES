'use client';

import * as React from 'react';
import { cn } from '../utils/cn';
import { Check, ChevronRight, AlertCircle, Loader2, X, Circle, HelpCircle } from 'lucide-react';

export type StepStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'error'
  | 'warning'
  | 'skipped';

export interface WorkflowStep {
  id: string;
  label: string;
  description?: string;
  status: StepStatus;
  icon?: React.ReactNode;
  subSteps?: WorkflowStep[];
  metadata?: Record<string, string | number>;
  onClick?: () => void;
  disabled?: boolean;
}

interface WorkflowStepperProps {
  steps: WorkflowStep[];
  currentStep?: string;
  orientation?: 'horizontal' | 'vertical';
  showDescriptions?: boolean;
  showStepNumbers?: boolean;
  clickable?: boolean;
  className?: string;
  onStepChange?: (stepId: string) => void;
  variant?: 'default' | 'compact' | 'detailed';
}

const statusConfig = {
  pending: {
    icon: Circle,
    color: 'bg-muted border-muted text-muted-foreground',
    label: 'Pending',
  },
  active: {
    icon: Loader2,
    color: 'bg-primary border-primary text-primary-foreground animate-spin',
    label: 'Active',
  },
  completed: {
    icon: Check,
    color: 'bg-green-500 border-green-500 text-white',
    label: 'Completed',
  },
  error: {
    icon: AlertCircle,
    color: 'bg-red-500 border-red-500 text-white',
    label: 'Error',
  },
  warning: {
    icon: HelpCircle,
    color: 'bg-yellow-500 border-yellow-500 text-white',
    label: 'Warning',
  },
  skipped: {
    icon: X,
    color: 'bg-muted border-muted text-muted-foreground',
    label: 'Skipped',
  },
};

function StepComponent({
  step,
  index,
  total,
  orientation = 'horizontal',
  showDescriptions = true,
  showStepNumbers = true,
  clickable = false,
  currentStepId,
  onStepClick,
  variant = 'default',
}: {
  step: WorkflowStep;
  index: number;
  total: number;
  orientation: 'horizontal' | 'vertical';
  showDescriptions: boolean;
  showStepNumbers: boolean;
  clickable: boolean;
  currentStepId?: string;
  onStepClick?: (stepId: string) => void;
  variant: 'default' | 'compact' | 'detailed';
}) {
  const config = statusConfig[step.status];
  const StatusIcon = config.icon;
  const isCurrent = currentStepId === step.id;
  const isCompleted = step.status === 'completed';
  const isLast = index === total - 1;

  const handleClick = () => {
    if (clickable && !step.disabled && onStepClick) {
      onStepClick(step.id);
    }
  };

  const stepNumber = showStepNumbers ? index + 1 : null;

  if (orientation === 'horizontal') {
    return (
      <div className="flex flex-1 min-w-0" role="listitem">
        {/* Step indicator */}
        <div
          className={cn(
            'relative flex flex-col items-center',
            clickable && !step.disabled && 'cursor-pointer'
          )}
          onClick={handleClick}
        >
          {/* Connecting line */}
          {!isLast && (
            <div
              className={cn(
                'absolute top-5 left-1/2 -translate-x-1/2 w-full h-0.5',
                step.status === 'completed' ? 'bg-green-500' : 'bg-muted'
              )}
            />
          )}

          {/* Step circle */}
          <div
            className={cn(
              'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
              isCurrent && 'ring-2 ring-primary ring-offset-2',
              config.color
            )}
          >
            {step.icon ? (
              step.icon
            ) : stepNumber ? (
              <span className="text-sm font-medium">{stepNumber}</span>
            ) : (
              <StatusIcon className="h-5 w-5" />
            )}
          </div>

          {/* Step label */}
          <div className="mt-2 text-center">
            <span
              className={cn(
                'text-sm font-medium',
                isCurrent ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
          </div>
        </div>

        {/* Description tooltip on hover for compact variant */}
        {variant === 'compact' && step.description && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 text-xs text-muted-foreground bg-popover border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            {step.description}
          </div>
        )}
      </div>
    );
  }

  // Vertical orientation
  return (
    <div className="relative flex gap-4" role="listitem">
      {/* Vertical line and indicator */}
      <div className="relative flex-shrink-0 w-6">
        {/* Vertical line */}
        <div
          className={cn(
            'absolute left-2.5 top-10 bottom-0 w-0.5',
            step.status === 'completed' ? 'bg-green-500' : 'bg-muted'
          )}
        />

        {/* Step circle */}
        <div
          className={cn(
            'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
            clickable && !step.disabled && 'cursor-pointer',
            isCurrent && 'ring-2 ring-primary ring-offset-2',
            config.color
          )}
          onClick={handleClick}
        >
          {step.icon ? (
            step.icon
          ) : stepNumber ? (
            <span className="text-sm font-medium">{stepNumber}</span>
          ) : (
            <StatusIcon className="h-5 w-5" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4
                className={cn(
                  'text-sm font-medium',
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </h4>
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  config.color.replace('bg-', 'bg-').replace('text-', 'text-')
                )}
              >
                {config.label}
              </span>
            </div>

            {showDescriptions && step.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {step.description}
              </p>
            )}

            {step.metadata && Object.keys(step.metadata).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(step.metadata).map(([key, value]) => (
                  <span
                    key={key}
                    className="px-2 py-0.5 text-xs text-muted-foreground bg-muted rounded"
                  >
                    {key}: {value}
                  </span>
                ))}
              </div>
            )}

            {/* Sub-steps */}
            {step.subSteps && step.subSteps.length > 0 && (
              <div className="mt-3 ml-6 space-y-2 border-l-2 border-muted/50 pl-3">
                {step.subSteps.map((subStep, subIndex) => (
                  <div
                    key={subStep.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full border',
                        statusConfig[subStep.status].color
                      )}
                    >
                      <statusConfig[subStep.status].icon className="h-3 w-3" />
                    </div>
                    <span className="text-muted-foreground">{subStep.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkflowStepper({
  steps,
  currentStep,
  orientation = 'horizontal',
  showDescriptions = true,
  showStepNumbers = true,
  clickable = false,
  className,
  onStepChange,
  variant = 'default',
}: WorkflowStepperProps) {
  const currentStepId = currentStep || steps.find((s) => s.status === 'active')?.id;

  if (orientation === 'horizontal') {
    return (
      <div
        className={cn('flex gap-4 overflow-x-auto pb-4', className)}
        role="list"
        aria-label="Workflow steps"
      >
        {steps.map((step, index) => (
          <StepComponent
            key={step.id}
            step={step}
            index={index}
            total={steps.length}
            orientation="horizontal"
            showDescriptions={showDescriptions}
            showStepNumbers={showStepNumbers}
            clickable={clickable}
            currentStepId={currentStepId}
            onStepClick={onStepChange}
            variant={variant}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('space-y-4', className)}
      role="list"
      aria-label="Workflow steps"
    >
      {steps.map((step, index) => (
        <StepComponent
          key={step.id}
          step={step}
          index={index}
          total={steps.length}
          orientation="vertical"
          showDescriptions={showDescriptions}
          showStepNumbers={showStepNumbers}
          clickable={clickable}
          currentStepId={currentStepId}
          onStepClick={onStepChange}
          variant={variant}
        />
      ))}
    </div>
  );
}

// Compact horizontal stepper for headers
export function CompactStepper({
  steps,
  currentStep,
  className,
}: {
  steps: Pick<WorkflowStep, 'id' | 'label' | 'status'>[];
  currentStep?: string;
  className?: string;
}) {
  const currentStepId = currentStep || steps.find((s) => s.status === 'active')?.id;

  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto', className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-1">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors',
              step.status === 'completed'
                ? 'bg-green-500 border-green-500 text-white'
                : step.status === 'active'
                  ? 'bg-primary border-primary text-primary-foreground'
                  : step.id === currentStepId
                    ? 'bg-accent border-accent text-accent-foreground'
                    : 'bg-muted border-muted text-muted-foreground'
            )}
          >
            {index + 1}
          </div>
          {!index && index < steps.length - 1 && (
            <div
              className={cn(
                'w-8 h-0.5',
                step.status === 'completed' ? 'bg-green-500' : 'bg-muted'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}