import { Bookshelf } from '@/components/bookshelf';
import { SectionContent } from '@/components/section-content';
export const metadata = { title: '书籍 · 开发阿雷', description: '阅读书架、想读清单与主题书单。' };
export default function BooksPage() { return <SectionContent sections={['books']}><Bookshelf /></SectionContent>; }
