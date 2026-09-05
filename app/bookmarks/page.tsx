import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { BookmarkDirectory } from '@/components/bookmark-directory';
import '@/components/directory.css';
export const metadata = { title: '书签 · 开发阿雷', description: '按主题整理的网站、工具与阅读资料。' };
export default function BookmarksPage() {
  return <main className="site-shell"><SiteHeader /><BookmarkDirectory /><SiteFooter /></main>;
}
