import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getPublicContent } from '@/lib/cms-server';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { writing, site } = await getPublicContent();
  const article = writing.find((item) => item.slug === slug);
  if (!article) notFound();
  const headings = article.body
    .split('\n')
    .flatMap((line, index) =>
      line.startsWith('## ')
        ? [{ text: line.slice(3), id: `heading-${index + 1}` }]
        : [],
    );
  return (
    <main className="site-shell">
      <SiteHeader />
      <article className="article-layout">
        <section>
          <Link className="article-category" href="/writing">
            <span>← 返回写作</span>
            <b>{article.category}</b>
            <em>{article.label}</em>
          </Link>
          <h1>{article.title}</h1>
          <p className="article-lead">{article.excerpt}</p>
          <div className="article-meta">
            {site.name} · {article.date} · {article.meta}
          </div>
          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ node, children }) => (
                  <h2 id={`heading-${node?.position?.start.line}`}>
                    {children}
                  </h2>
                ),
              }}
            >
              {article.body}
            </ReactMarkdown>
          </div>
        </section>
        <aside className="article-toc">
          <p>文章目录</p>
          <span>CONTENTS / {String(headings.length).padStart(2, '0')}</span>
          {headings.map((heading, i) => (
            <a key={heading.id} href={`#${heading.id}`}>
              <b>{String(i + 1).padStart(2, '0')}</b>
              {heading.text}
            </a>
          ))}
        </aside>
      </article>
      <SiteFooter />
    </main>
  );
}
