import WritingArchivePage from '@/components/writing-archive-page';
import { getWritingArchive } from '@/lib/cms-server';

export default async function WritingPage() {
  return <WritingArchivePage initial={await getWritingArchive()} />;
}
