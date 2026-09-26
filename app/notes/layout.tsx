import { SectionContent } from '@/components/section-content';

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return <SectionContent sections={['slides']}>{children}</SectionContent>;
}
