'use client';
import type { Json } from '@/lib/cms-validation';
import { Field } from './admin-fields';

const visibleFields: Record<string, string[]> = {
  agents: ['name', 'logo', 'creator', 'description', 'tags', 'status', 'href', '_published'],
  skills: ['title', 'category', 'subcategory', 'description', 'href', '_published'],
  relays: ['name', 'logo', 'mark', 'description', 'href', '_published'],
};

export function AdminAiResources({ collection, value, sample, onChange }: {
  collection: string; value: Json; sample: Json; onChange: (value: Json) => void;
}) {
  const record = value as Record<string, Json>;
  const template = sample as Record<string, Json>;
  const keys = visibleFields[collection];
  return <Field path={`ai.${collection}`} label="资源信息"
    value={Object.fromEntries(keys.map((key) => [key, record[key]]))}
    sample={Object.fromEntries(keys.map((key) => [key, template[key]]))}
    options={collection === 'agents' ? { status: [
      { id: 'active', name: '可使用' }, { id: 'beta', name: '公测中' }, { id: 'coming', name: '即将推出' },
    ] } : undefined}
    onChange={(next) => onChange({ ...record, ...(next as Record<string, Json>) })} />;
}
