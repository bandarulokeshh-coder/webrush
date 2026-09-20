/**
 * Connection groups rendered as typed cards (no `any` probing).
 *
 * @module components/ConnectionsPanel
 */

import type React from 'react';
import { Link2 } from 'lucide-react';
import type { ActivityChain, ArtistConnection, ConnectionGroup, LocationConnection, LocationNameConnection, Receipt, SocialConnection, TemporalConnection } from '../types/receipt';
import { CONNECTION_ICONS, CONNECTION_LABELS } from '../constants/receipts';
import { Badge } from './ui/Badge';
import { formatTimeGap } from '../lib/format';
import { receiptDisplayText } from '../lib/receiptText';

interface ConnectionsPanelProps {
  connections: ConnectionGroup[];
}

const ConnectionsPanel: React.FC<ConnectionsPanelProps> = ({ connections }) => {
  if (connections.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
        <Link2 className="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-gray-700 dark:text-slate-200">
          No connections found
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          Try widening the temporal sensitivity or enabling more detectors.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-live="polite">
      {connections.map((group) => (
        <ConnectionGroupCard key={group.type} group={group} />
      ))}
    </div>
  );
};

const ConnectionGroupCard: React.FC<{ group: ConnectionGroup }> = ({ group }) => {
  const Icon = CONNECTION_ICONS[group.type];
  const rows = toRows(group);

  return (
    <section
      aria-label={`${CONNECTION_LABELS[group.type]} connections`}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-slate-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          {CONNECTION_LABELS[group.type]}
        </h3>
        <Badge variant="secondary">{rows.length}</Badge>
      </header>

      <ul className="space-y-2">
        {rows.slice(0, 5).map((row) => (
          <li
            key={row.key}
            className="rounded-lg bg-indigo-50/70 px-3 py-2 text-sm dark:bg-indigo-500/10"
          >
            <p className="font-medium text-gray-800 dark:text-slate-100">{row.title}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">{row.detail}</p>
          </li>
        ))}
      </ul>
      {rows.length > 5 && (
        <p className="mt-2 text-center text-xs text-gray-500 dark:text-slate-400">
          and {rows.length - 5} more…
        </p>
      )}
    </section>
  );
};

interface Row {
  key: string;
  title: string;
  detail: string;
}

/** Flattens the discriminated union into display rows with full typing. */
const toRows = (group: ConnectionGroup): Row[] => {
  switch (group.type) {
    case 'temporal':
      return group.data.map((conn: TemporalConnection, index: number) => ({
        key: `${conn.receipt1.id}-${conn.receipt2.id}-${index}`,
        title: `${shortLabel(conn.receipt1)} → ${shortLabel(conn.receipt2)}`,
        detail: `${formatTimeGap(conn.timeDiffMs)} apart`,
      }));
    case 'location':
      return group.data.map((conn: LocationConnection, index: number) => ({
        key: `${conn.place.id}-${conn.photo.id}-${index}`,
        title: `${conn.place.name} · photo`,
        detail: receiptDisplayText(conn.photo),
      }));
    case 'location-name':
      return group.data.map((conn: LocationNameConnection, index: number) => ({
        key: `${conn.place.id}-${conn.connectedTo.id}-${index}`,
        title: `${conn.place.name} mentioned`,
        detail: `${conn.connectionType}: ${receiptDisplayText(conn.connectedTo)}`,
      }));
    case 'artist':
      return group.data.map((conn: ArtistConnection, index: number) => ({
        key: `${conn.music.id}-${conn.note.id}-${index}`,
        title: conn.artist,
        detail: `${conn.music.track} · note`,
      }));
    case 'social':
      return group.data.map((conn: SocialConnection, index: number) => ({
        key: `${conn.source.id}-${conn.target.id}-${index}`,
        title: conn.sharedPeople.join(', '),
        detail: `${conn.connectionType}: ${shortLabel(conn.source)} → ${shortLabel(conn.target)}`,
      }));
    case 'chain':
      return group.data.map((conn: ActivityChain, index: number) => ({
        key: `chain-${index}-${conn.startTime}`,
        title: conn.description,
        detail: `${conn.receipts.length} moments · ${formatTimeGap(conn.durationMs)}`,
      }));
  }
};

const shortLabel = (receipt: Receipt): string => {
  const text = receiptDisplayText(receipt);
  return text.length > 42 ? `${text.slice(0, 41).trimEnd()}…` : text;
};

export default ConnectionsPanel;
