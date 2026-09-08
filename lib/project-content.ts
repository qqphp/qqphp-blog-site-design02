import { categoryId } from './article-categories';

export type ProjectOption = { id: string; name: string };
export type ProjectImage = {
  src: string;
  label: string;
  alt: string;
  mode: string;
  generatedFor: string;
};
export function projectImageInput(
  project: Pick<Project, 'title' | 'subtitle' | 'description'>,
) {
  return JSON.stringify([
    project.title.trim(),
    project.subtitle.trim(),
    project.description.trim(),
  ]);
}
export type Project = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  statusId: string;
  category: string;
  categoryId: string;
  year: string;
  role: string;
  description: string;
  body: string;
  images: ProjectImage[];
  tags: string[];
  _published: boolean;
};
export type ProjectDocument = {
  items: Project[];
  statuses: ProjectOption[];
  categories: ProjectOption[];
};
type LegacyProject = Omit<
  Project,
  'statusId' | 'categoryId' | 'body' | '_published' | 'images'
> &
  Partial<Pick<Project, 'body' | '_published'>> & {
    images: { src: string; label: string; alt: string }[];
  };
export function migrateProjects(items: LegacyProject[]): ProjectDocument {
  const options = (key: 'status' | 'category') =>
    [...new Set(items.map((item) => item[key]).filter(Boolean))].map(
      (name) => ({ id: categoryId(name), name }),
    );
  return {
    statuses: options('status'),
    categories: options('category'),
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      status: item.status,
      statusId: categoryId(item.status),
      category: item.category,
      categoryId: categoryId(item.category),
      year: item.year,
      role: item.role,
      description: item.description,
      body: item.body ?? '',
      images: item.images.map((image) => ({
        ...image,
        mode: 'upload',
        generatedFor: '',
      })),
      tags: item.tags,
      _published: item._published ?? true,
    })),
  };
}
export function resolveProjects(document: ProjectDocument): ProjectDocument {
  return {
    ...document,
    items: document.items.map((item) => ({
      ...item,
      images: item.images.map((image) => ({
        ...image,
        mode: image.mode ?? 'upload',
        generatedFor: image.generatedFor ?? '',
      })),
      status:
        document.statuses.find((option) => option.id === item.statusId)?.name ??
        item.status,
      category:
        document.categories.find((option) => option.id === item.categoryId)
          ?.name ?? item.category,
    })),
  };
}
