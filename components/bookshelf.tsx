'use client';
import { CmsText } from '@/components/cms-text';

import { useContent } from '@/components/content-provider';

import { useState, type CSSProperties } from 'react';
import { Search, ArrowUpRight, BookOpen, X } from 'lucide-react';
import { LifeNavigation, SiteHeader, SiteFooter } from '@/components/site-chrome';
import { LifePageHeader } from '@/components/life-page-header';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { books } from '@/lib/books';
import './bookshelf.css';

type Book = typeof books[number];
function Cover({ book, mini = false }: { book: Book; mini?: boolean }) {
  return <div className={`reading-cover${mini ? ' mini' : ''}`} style={{ '--cover': book.color } as CSSProperties}><span>{book.category}<CmsText page="书籍页" name="01 / READING" /></span><strong>{book.title}</strong><i aria-hidden="true" /><small>{book.author}</small></div>;
}

export function Bookshelf() {
  const { books, booklists } = useContent();
  const [tab, setTab] = useState('全部书籍');
  const [category, setCategory] = useState('全部');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(12);
  const [listId, setListId] = useState<string | null>(null);
  const [opened, setOpened] = useState<Book | null>(null);
  const selectedList = booklists.find(list => list.id === listId);
  const filtered = books.filter(book => (tab === '全部书籍' || tab === '主题书单' || book.status === tab) && (category === '全部' || book.category === category) && (!selectedList || selectedList.ids.includes(book.id)) && `${book.title} ${book.author}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const changeTab = (value: string) => { setTab(value); setCategory('全部'); setQuery(''); setListId(null); setLimit(12); };
  return <main className="site-shell"><SiteHeader /><div className="reading-room">
    <LifePageHeader kind="books" title="书籍" intro={<><CmsText page="书籍页" name="05 读过的留在书架，想读的记在清单。" /> <CmsText page="书籍页" name="06 把相近的思考，整理成下一次阅读的起点" /></>} />
    <LifeNavigation />
    <p className="reading-demo"><CmsText page="书籍页" name="10 书架预览：以下阅读状态、笔记和书单均" /></p>
    <nav className="reading-tabs" aria-label="书架视图">{['全部书籍', '读过', '想读', '主题书单'].map(value => <button type="button" aria-pressed={tab === value} onClick={() => changeTab(value)} key={value}>{value}<span>{value === '主题书单' ? booklists.length : value === '全部书籍' ? books.length : books.filter(book => book.status === value).length}</span></button>)}</nav>
    {tab === '主题书单' && <section className="reading-lists" aria-label="主题书单">{booklists.map((list, index) => <button type="button" className="reading-list" aria-pressed={listId === list.id} key={list.id} onClick={() => { setListId(list.id); setCategory('全部'); setQuery(''); setLimit(12); }}><div className="reading-list-meta"><span><CmsText page="书籍页" name="11 书单 / 0" />{index + 1}</span><ArrowUpRight size={20} /></div><div className="reading-list-covers">{list.ids.filter(id => books.some(book => book.id === id)).map(id => <Cover book={books.find(book => book.id === id)!} mini key={id} />)}</div><span className="reading-kicker">{list.label} · {list.ids.length} 本</span><h2>{list.title}</h2><p>{list.description}</p><span className="reading-list-action">{listId === list.id ? '正在浏览' : '展开书单'} →</span></button>)}</section>}
    {(tab !== '主题书单' || selectedList) && <section className="reading-library" aria-label={selectedList?.title ?? '书籍列表'}>
      {selectedList && <div className="reading-selected"><div><span className="reading-kicker"><CmsText page="书籍页" name="12 当前书单" /></span><h2>{selectedList.title}</h2></div><button type="button" onClick={() => setListId(null)} aria-label="收起书单"><X size={20} /></button></div>}
      <div className="reading-tools"><div className="reading-categories" aria-label="书籍分类">{['全部', ...new Set(books.map(book => book.category))].map(value => <button type="button" aria-pressed={category === value} key={value} onClick={() => { setCategory(value); setLimit(12); }}>{value}</button>)}</div><label className="reading-search"><Search size={17} /><input aria-label="搜索书名或作者" placeholder="搜索书名、作者" value={query} onChange={event => { setQuery(event.target.value); setLimit(12); }} />{query && <button type="button" aria-label="清空搜索" onClick={() => setQuery('')}><X size={15} /></button>}</label></div>
      <div className="reading-result" aria-live="polite"><span>{selectedList ? '书单中的书' : tab === '想读' ? '下一本，读什么？' : tab === '读过' ? '读完之后，留下些什么。' : '每本书，都是一个入口。'}</span><span>{filtered.length} 本</span></div>
      <div className="reading-grid">{filtered.slice(0, limit).map(book => <button type="button" className="reading-book" onClick={() => setOpened(book)} key={book.id} aria-label={`查看《${book.title}》的阅读卡片`}><div className="reading-book-stage"><Cover book={book} /></div><div className="reading-book-meta"><span>{book.category}</span><span>{book.status}</span></div><h2>{book.title}</h2><p>{book.author}</p><span className="reading-book-link">{book.status === '读过' ? '阅读笔记' : '想读的理由'} <ArrowUpRight size={15} /></span></button>)}</div>
      {filtered.length === 0 && <div className="reading-empty"><BookOpen size={30} /><h2><CmsText page="书籍页" name="13 这次没有找到匹配的书" /></h2><p><CmsText page="书籍页" name="14 试试其他书名、作者或分类。" /></p><button type="button" onClick={() => { setQuery(''); setCategory('全部'); }}><CmsText page="书籍页" name="15 清除筛选" /></button></div>}
      {filtered.length > limit && <button type="button" className="reading-more" onClick={() => setLimit(value => value + 12)}><CmsText page="书籍页" name="16 再看 12 本 · 还有" />{filtered.length - limit} 本</button>}
    </section>}
    <footer className="reading-end"><span><CmsText page="书籍页" name="17 READ · THINK · REV" /></span><p><CmsText page="书籍页" name="18 合上书以后，阅读还在继续。" /></p></footer>
  </div><SiteFooter />
  <Dialog open={!!opened} onOpenChange={value => { if (!value) setOpened(null); }}><DialogContent className="reading-dialog">{opened && <><Cover book={opened} /><div><span className="reading-kicker">{opened.status}<CmsText page="书籍页" name="19 · 示例记录" /></span><DialogTitle className="reading-dialog-title">{opened.title}</DialogTitle><p className="reading-dialog-author">{opened.author} / {opened.category}</p><h3>{opened.status === '读过' ? '阅读笔记' : '想读的理由'}</h3><p>{opened.note}</p><small><CmsText page="书籍页" name="20 以上为示例文案，真实阅读感受待补充。" /></small></div></>}</DialogContent></Dialog>
  </main>;
}
