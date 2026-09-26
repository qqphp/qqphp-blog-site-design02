import { LifePage } from '@/components/life-page';
import { SectionContent } from '@/components/section-content';
export const metadata = { title: '爱好 · 开发阿雷' };
export default function HobbiesPage() { return <SectionContent sections={['hobbies']}><LifePage type="hobbies" /></SectionContent>; }
