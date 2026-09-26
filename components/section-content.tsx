import { ContentProvider } from './content-provider';
import { getPublicContent } from '@/lib/cms-server';
import type { PublicContent, Section } from '@/lib/cms-defaults';

export async function SectionContent({ sections, children }: {
  sections: Section[];
  children: React.ReactNode;
}) {
  const content = await getPublicContent(sections);
  const selected = Object.fromEntries(sections.map((key) => [key, content[key as keyof PublicContent]]));
  return <ContentProvider content={selected}>{children}</ContentProvider>;
}
