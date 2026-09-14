import { ProjectShowcase } from '@/components/project-showcase';
import { getPublicContent } from '@/lib/cms-server';
import { newestProjectsFirst } from '@/lib/content-order';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { projects: showcaseProjects } = await getPublicContent();
  const { project } = await searchParams;
  const projects = newestProjectsFirst(showcaseProjects.items);
  const initialId =
    projects.find((item) => item.id === project)?.id ?? projects[0]?.id ?? '';
  return <ProjectShowcase key={initialId} initialId={initialId} />;
}
