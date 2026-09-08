import { ProjectShowcase } from '@/components/project-showcase';
import { getPublicContent } from '@/lib/cms-server';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { projects: showcaseProjects } = await getPublicContent();
  const { project } = await searchParams;
  const initialId =
    showcaseProjects.items.find((item) => item.id === project)?.id ??
    showcaseProjects.items[0]?.id ?? '';
  return <ProjectShowcase key={initialId} initialId={initialId} />;
}
