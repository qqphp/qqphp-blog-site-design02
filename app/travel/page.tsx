import { LifePage } from '@/components/life-page';
import { SectionContent } from '@/components/section-content';
export const metadata = { title: '旅行 · 开发阿雷' };
export default function TravelPage() { return <SectionContent sections={['travel']}><LifePage type="travel" /></SectionContent>; }
