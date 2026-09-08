'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import type { Content } from '@/lib/cms-defaults';
import { categoryBranch, categoryRows } from '@/lib/article-categories';
import { AdminWritingEditor, type Article } from './admin-writing-editor';

export function AdminWritingManager({
  articles,
  categories,
  onChange,
  onWorking,
  busy,
}: {
  articles: Article[];
  categories: Content['categories'];
  onChange: (articles: Article[]) => void;
  onWorking: (working: boolean) => void;
  busy: boolean;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('');
  const index = editing !== null && articles[editing] ? editing : -1;
  const rows = categoryRows(categories);
  const paths = new Map(rows.map((row) => [row.category.id, row.path]));
  const branch = categoryBranch(categories, category);
  const filtered = articles.filter(
    (article) =>
      (status === 'all' || article._published === (status === 'published')) &&
      (!category || branch.has(article.categoryId)) &&
      `${article.title} ${article.excerpt} ${paths.get(article.categoryId) ?? ''}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  function add() {
    const article: Article = {
      slug: `article-${crypto.randomUUID().slice(0, 8)}`,
      title: '',
      excerpt: '',
      body: '',
      cover: '',
      coverMode: 'upload',
      coverGeneratedFor: '',
      categoryId: categories[0]?.id ?? '',
      category: categories[0]?.name ?? '',
      date: format(new Date(), 'yyyy.MM.dd'),
      _published: false,
      label: '',
      tag: '',
      meta: '',
    };
    onChange([...articles, article]);
    setEditing(articles.length);
  }
  if (index >= 0)
    return (
      <section className="admin-article-edit">
        <div className="admin-section-heading">
          <button type="button" onClick={() => setEditing(null)}>
            ← 返回文章表格
          </button>
          <span className="admin-help">编辑会保留，点击“保存栏目”后生效</span>
        </div>
        <AdminWritingEditor
          article={articles[index]}
          categories={categories}
          onWorking={onWorking}
          disabled={busy}
          onChange={(article) => {
            onChange(articles.map((old, i) => (i === index ? article : old)));
          }}
        />
      </section>
    );
  return (
    <section className="admin-writing-table">
      <div className="admin-table-toolbar">
        <input
          type="search"
          aria-label="搜索文章"
          placeholder="搜索标题、摘要或分类"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="按分类筛选文章"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">全部分类</option>
          {rows.map((row) => (
            <option key={row.category.id} value={row.category.id}>
              {row.path}
            </option>
          ))}
        </select>
        <select
          aria-label="按发布状态筛选文章"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
        </select>
        <button className="admin-primary" type="button" onClick={add}>
          ＋ 新增文章
        </button>
      </div>
      <div className="admin-table-scroll">
        <table>
          <caption>
            共 {articles.length} 篇文章，当前显示 {filtered.length}{' '}
            篇。发布与删除操作保存栏目后生效。
          </caption>
          <thead>
            <tr>
              <th scope="col">文章标题</th>
              <th scope="col">分类</th>
              <th scope="col">状态</th>
              <th scope="col">发布日期</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((article) => {
              const i = articles.indexOf(article);
              return (
                <tr key={article.slug}>
                  <td>
                    <button
                      className="admin-table-title"
                      type="button"
                      onClick={() => setEditing(articles.indexOf(article))}
                    >
                      {article.title || '未命名文章'}
                    </button>
                    <small>{article.slug}</small>
                  </td>
                  <td>{paths.get(article.categoryId) || '未选择分类'}</td>
                  <td>
                    <span
                      className={`admin-status-badge ${article._published ? 'published' : ''}`}
                    >
                      {article._published ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="admin-table-date">{article.date}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        onClick={() => setEditing(articles.indexOf(article))}
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onChange(
                            articles.map((old) =>
                              old === article
                                ? { ...old, _published: !old._published }
                                : old,
                            ),
                          )
                        }
                      >
                        {article._published ? '转草稿' : '发布'}
                      </button>
                      <button
                        type="button"
                        aria-label={`上移 ${article.title}`}
                        disabled={i === 0}
                        onClick={() => {
                          const next = [...articles];
                          [next[i - 1], next[i]] = [next[i], next[i - 1]];
                          onChange(next);
                        }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`下移 ${article.title}`}
                        disabled={i === articles.length - 1}
                        onClick={() => {
                          const next = [...articles];
                          [next[i + 1], next[i]] = [next[i], next[i + 1]];
                          onChange(next);
                        }}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="admin-danger"
                        onClick={() => {
                          if (
                            window.confirm(
                              `删除文章「${article.title || '未命名文章'}」？保存后生效。`,
                            )
                          )
                            onChange(articles.filter((old) => old !== article));
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="admin-empty">
            {articles.length
              ? '没有符合筛选条件的文章。'
              : '还没有文章，点击“新增文章”开始。'}
          </p>
        )}
      </div>
    </section>
  );
}
