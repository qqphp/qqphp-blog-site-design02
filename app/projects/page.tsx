import { ProjectShowcase } from '@/components/project-showcase';
import { getPublicContent } from '@/lib/cms-server';
import { newestProjectsFirst } from '@/lib/content-order';
import { ContentProvider } from '@/components/content-provider';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { projects: showcaseProjects } = await getPublicContent(['projects']);
  const { project } = await searchParams;
  const projects = newestProjectsFirst(showcaseProjects.items);
  const initialId =
    projects.find((item) => item.id === project)?.id ?? projects[0]?.id ?? '';
  return <ContentProvider content={{ projects: showcaseProjects }}><ProjectShowcase key={initialId} initialId={initialId} /></ContentProvider>;
}
