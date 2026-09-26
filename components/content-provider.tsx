'use client';
import { createContext, useContext } from 'react';
import type { PublicContent as Content } from '@/lib/cms-defaults';

const ContentContext = createContext<Content | null>(null);
export function ContentProvider({
  content,
  children,
}: {
  content: Partial<Content>;
  children: React.ReactNode;
}) {
  const parent = useContext(ContentContext);
  return (
    <ContentContext.Provider value={{ ...parent, ...content } as Content}>
      {children}
    </ContentContext.Provider>
  );
}
export function useContent() {
  const content = useContext(ContentContext);
  if (!content) throw new Error('ContentProvider is required');
  return content;
}
