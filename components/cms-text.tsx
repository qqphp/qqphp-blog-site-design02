'use client';
import { useContent } from './content-provider';

/** A text node preserves the existing layout without inserting wrapper elements. */
export function CmsText({ page, name }: { page: string; name: string }) {
  const copy: Record<string, Record<string, string>> = useContent().copy;
  return copy[page]?.[name] ?? '';
}
