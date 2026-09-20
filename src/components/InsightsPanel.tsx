/**
 * Stat tiles + auto-generated insights beside the feed.
 *
 * @module components/InsightsPanel
 */

import type React from 'react';
import { Sparkles } from 'lucide-react';
import type { Insight } from '../types/receipt';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { formatCompactNumber } from '../lib/format';

export interface StatsStripProps {
  total: number;
  shown: number;
  connections: number;
  filtered: number;
}

export const StatsStrip: React.FC<StatsStripProps> = ({ total, shown, connections, filtered }) => (
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="status" aria-live="polite">
    <StatTile label="Receipts" value={formatCompactNumber(total)} />
    <StatTile label="Shown" value={`${formatCompactNumber(shown)} / ${formatCompactNumber(filtered)}`} />
    <StatTile label="Connections" value={formatCompactNumber(connections)} />
    <StatTile
      label="Density"
      value={filtered > 0 ? `${(connections / filtered).toFixed(1)} / receipt` : '—'}
    />
  </div>
);

const StatTile: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
    <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-slate-400">
      {label}
    </p>
    <p className="mt-1 text-lg font-semibold text-gray-900 tabular-nums dark:text-white">
      {value}
    </p>
  </div>
);

interface InsightListProps {
  insights: Insight[];
}

export const InsightList: React.FC<InsightListProps> = ({ insights }) => {
  if (insights.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-300" aria-hidden="true" />
          Insights
        </CardTitle>
        <CardDescription>What the feed means, not just what happened.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="flex items-baseline justify-between gap-3 rounded-lg bg-purple-50/60 px-3 py-2 dark:bg-purple-500/10"
          >
            <div>
              <p className="text-xs font-medium text-purple-700 uppercase dark:text-purple-300">
                {insight.label}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{insight.value}</p>
              {insight.detail && (
                <p className="text-xs text-gray-500 dark:text-slate-400">{insight.detail}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

/** Builds insights for the currently filtered receipts. */
