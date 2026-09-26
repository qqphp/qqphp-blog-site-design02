import { LifePage } from '@/components/life-page';
import { SectionContent } from '@/components/section-content';
export const metadata = { title: '播客 · 开发阿雷' };
export default function PodcastsPage() { return <SectionContent sections={['podcasts']}><LifePage type="podcasts" /></SectionContent>; }
