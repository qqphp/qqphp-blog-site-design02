import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { FriendDirectory } from '@/components/friend-directory';
import { SectionContent } from '@/components/section-content';
import '@/components/directory.css';
export const metadata = { title: '友链 · 开发阿雷', description: '独立网站与个人创作者的邻里目录。' };
export default function FriendsPage() {
  return <SectionContent sections={['friends']}><main className="site-shell"><SiteHeader /><FriendDirectory /><SiteFooter /></main></SectionContent>;
}
