import { notFound } from 'next/navigation';
import { writing } from '../../content';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = writing.find((item) => item.slug === slug);
  if (!article) notFound();
  return <main className="site-shell"><SiteHeader /><article className="article-layout"><section><p className="eyebrow">{article.category} / {article.label}</p><h1>{article.title}</h1><p className="article-lead">{article.excerpt}</p><div className="article-meta">开发阿雷 · {article.date} · {article.meta}</div><div className="markdown-body"><h2>从问题开始，而不是从界面开始</h2><p>这里预留给后台管理系统输出的 Markdown 内容。后续只需将文章正文写入内容字段，即可按统一的标题、段落、引用和列表样式渲染。</p><blockquote>当信息变得复杂，真正需要被设计的，往往是理解它的路径。</blockquote><h2>让结构参与表达</h2><p>一篇文章不只是文字的容器。目录、段落节奏、关联内容和阅读进度都会影响读者是否能够停留，并在之后重新找到它。</p></div></section><aside><p>文章目录</p><a href="#">从问题开始，而不是从界面开始</a><a href="#">让结构参与表达</a><a href="#">继续阅读</a></aside></article><SiteFooter /></main>;
}
