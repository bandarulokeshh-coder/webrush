/**
 * Sensitivity slider + per-detector checklist.
 *
 * @module components/ConnectionControls
 */

import type React from 'react';
import {
  CONNECTION_DESCRIPTIONS,
  CONNECTION_ICONS,
  CONNECTION_LABELS,
  MAX_TEMPORAL_THRESHOLD_MS,
  MIN_TEMPORAL_THRESHOLD_MS,
} from '../constants/receipts';
import type { ConnectionType } from '../types/receipt';
import { CONNECTION_TOGGLES } from '../hooks/useFilteredConnections';
import { formatDurationLong } from '../lib/format';
import { cn } from '../lib/utils';

interface ConnectionControlsProps {
  timeDiffThreshold: number;
  onThreshold: (ms: number) => void;
  enabledDetectors: Set<ConnectionType>;
  onToggleDetector: (type: ConnectionType) => void;
}

const ConnectionControls: React.FC<ConnectionControlsProps> = ({
  timeDiffThreshold,
  onThreshold,
  enabledDetectors,
  onToggleDetector,
}) => (
  <fieldset className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <legend className="px-1 text-sm font-semibold text-gray-800 dark:text-slate-100">
      Connection detection
    </legend>

    <label
      htmlFor="temporal-sensitivity"
      className="mt-1 flex items-center justify-between text-xs font-medium text-gray-600 dark:text-slate-300"
    >
      <span>Temporal sensitivity</span>
      <span className="tabular-nums text-indigo-600 dark:text-indigo-300">
        {formatDurationLong(timeDiffThreshold)}
      </span>
    </label>
    <input
      id="temporal-sensitivity"
      type="range"
      min={MIN_TEMPORAL_THRESHOLD_MS}
      max={MAX_TEMPORAL_THRESHOLD_MS}
      step={5 * 60 * 1000}
      value={timeDiffThreshold}
      onChange={(event) => onThreshold(Number(event.target.value))}
      aria-describedby="temporal-sensitivity-hint"
      className="mt-2 w-full accent-indigo-600"
    />
    <p id="temporal-sensitivity-hint" className="mt-1 text-xs text-gray-500 dark:text-slate-400">
      Two moments within this window count as temporally connected.
    </p>

    <div className="mt-4 space-y-1.5" role="group" aria-label="Connection types">
      {CONNECTION_TOGGLES.map((type) => {
        const Icon = CONNECTION_ICONS[type];
        const checked = enabledDetectors.has(type);
        return (
          <label
            key={type}
            className={cn(
              'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
              checked
                ? 'bg-indigo-50 text-gray-800 dark:bg-indigo-500/10 dark:text-slate-100'
                : 'text-gray-500 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-800/60',
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggleDetector(type)}
              aria-describedby={`connection-desc-${type}`}
              className="h-4 w-4 rounded accent-indigo-600"
            />
            <Icon className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
            <span className="flex-1">
              <span className="block font-medium">{CONNECTION_LABELS[type]}</span>
              <span id={`connection-desc-${type}`} className="block text-xs opacity-70">
                {CONNECTION_DESCRIPTIONS[type]}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  </fieldset>
);

export default ConnectionControls;
