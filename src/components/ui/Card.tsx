import React from 'react';
import { cn } from '../../lib/utils';

/**
 * shadcn/ui-style Card primitives.
 * Surfaces are theme-aware (light + dark) and share one border/radius language.
 */
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div
    className={cn(
      'rounded-xl border border-gray-200 bg-white shadow-lg shadow-gray-200/50',
      'dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-black/20',
      className
    )}
    {...props}
  />
);

const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('px-6 py-4', className)} {...props} />
);

const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h2
    className={cn('text-xl font-semibold tracking-tight text-gray-800 dark:text-slate-100', className)}
    {...props}
  />
);

const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('text-sm text-gray-600 dark:text-slate-400', className)} {...props} />
);

const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('px-6 pb-4', className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
