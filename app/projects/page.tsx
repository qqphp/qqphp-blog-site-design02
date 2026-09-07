import { ProjectShowcase } from '@/components/project-showcase';
import { showcaseProjects } from '@/lib/project-showcase';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;
  const initialId =
    showcaseProjects.find((item) => item.id === project)?.id ??
    showcaseProjects[0].id;
  return <ProjectShowcase key={initialId} initialId={initialId} />;
}
