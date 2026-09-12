'use client';
import { useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import {
  bookSample,
  type Book,
  type BookList,
  type BookDocument,
} from '@/lib/book-content';
import { AdminCollectionCategories } from './admin-collection-categories';
import { AdminCollectionCover } from './admin-collection-cover';
import './admin-collections.css';
export function AdminBookManager({
  value,
  onChange,
  onWorking,
}: {
  value: BookDocument;
  onChange: (value: BookDocument) => void;
  onWorking: (busy: boolean) => void;
}) {
  const [book, setBook] = useState<Book | null>(null);
  const [list, setList] = useState<BookList | null>(null);
  const [tab, setTab] = useState('items');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const changeBook = (patch: Partial<Book>) =>
    setBook((current) => (current ? { ...current, ...patch } : null));
  const filteredBooks = value.items.filter(
    (item) =>
      (!category || item.categoryId === category) &&
      `${item.title} ${item.author}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const filteredLists = value.lists.filter((item) =>
    `${item.title} ${item.description}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const rows = tab === 'lists' ? filteredLists : filteredBooks;
  const pages = Math.max(1, Math.ceil(rows.length / 20));
  const current = Math.min(page, pages);
  return (
    <Tabs.Root
      className="admin-project-manager collection-manager"
      value={tab}
      onValueChange={(next) => {
        if (!busy) {
          setTab(String(next));
          setQuery('');
          setPage(1);
        }
      }}
    >
      <Tabs.List className="admin-settings-tabs" aria-label="书籍与书单管理">
        <Tabs.Tab value="items">书籍列表</Tabs.Tab>
        <Tabs.Tab value="categories">书籍分类</Tabs.Tab>
        <Tabs.Tab value="lists">主题书单</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="items">
        {book ? (
          <fieldset className="collection-editor" disabled={busy}>
            <div className="admin-section-heading">
              <button type="button" onClick={() => setBook(null)}>
                返回书籍列表
              </button>
              <small>确认后保存栏目；直接返回放弃本次编辑。</small>
            </div>
            <div className="admin-fields">
              {(
                [
                  ['title', '书名'],
                  ['author', '作者'],
                ] as const
              ).map(([key, label]) => (
                <div className="admin-field" key={key}>
                  <label htmlFor={`book-${key}`}>{label}</label>
                  <input
                    id={`book-${key}`}
                    value={book[key]}
                    onChange={(event) =>
                      changeBook({ [key]: event.target.value })
                    }
                  />
                </div>
              ))}
              <div className="admin-field">
                <label htmlFor="book-category">书籍分类</label>
                <select
                  id="book-category"
                  value={book.categoryId}
                  onChange={(event) =>
                    changeBook({ categoryId: event.target.value })
                  }
                >
                  <option value="" disabled>
                    请选择分类
                  </option>
                  {value.categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-field admin-wide">
                <label htmlFor="book-note">阅读笔记</label>
                <textarea
                  id="book-note"
                  rows={10}
                  value={book.note}
                  onChange={(event) => changeBook({ note: event.target.value })}
                />
              </div>
              <AdminCollectionCover
                portrait
                kind="book"
                title={book.title}
                author={book.author}
                value={book.cover}
                onChange={(cover) => changeBook({ cover })}
                onWorking={(busy) => {
                  setBusy(busy);
                  onWorking(busy);
                }}
              />
              <label className="admin-choice">
                <input
                  type="checkbox"
                  checked={book._published}
                  onChange={(event) =>
                    changeBook({ _published: event.target.checked })
                  }
                />
                发布到前台
              </label>
            </div>
            <div className="admin-music-actions">
              <button
                type="button"
                className="admin-primary"
                disabled={
                  !book.title.trim() ||
                  !value.categories.some((item) => item.id === book.categoryId)
                }
                onClick={() => {
                  onChange({
                    ...value,
                    items: value.items.some((item) => item.id === book.id)
                      ? value.items.map((item) =>
                          item.id === book.id ? book : item,
                        )
                      : [...value.items, book],
                  });
                  setBook(null);
                }}
              >
                确认
                {value.items.some((item) => item.id === book.id)
                  ? '修改'
                  : '添加'}
              </button>
            </div>
          </fieldset>
        ) : (
          <>
            <div className="admin-table-toolbar">
              <input
                type="search"
                aria-label="搜索书籍"
                placeholder="搜索书名、作者"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
              <select
                aria-label="筛选书籍分类"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">全部分类</option>
                {value.categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="admin-primary"
                onClick={() =>
                  setBook({
                    ...bookSample.items[0],
                    id: crypto.randomUUID(),
                    title: '',
                    categoryId: value.categories[0]?.id ?? '',
                  })
                }
              >
                新增书籍
              </button>
            </div>
            <div className="admin-table-scroll">
              <table className="admin-project-table">
                <caption>{filteredBooks.length} 本书籍，保存栏目后生效</caption>
                <thead>
                  <tr>
                    {['书名', '作者', '分类', '发布状态', '操作'].map(
                      (label) => (
                        <th key={label} scope="col">
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks
                    .slice((current - 1) * 20, current * 20)
                    .map((item) => (
                      <tr key={item.id}>
                        <td>
                          <button
                            type="button"
                            className="admin-table-title"
                            onClick={() => setBook({ ...item })}
                          >
                            {item.title}
                          </button>
                        </td>
                        <td>{item.author || '—'}</td>
                        <td>
                          {
                            value.categories.find(
                              (category) => category.id === item.categoryId,
                            )?.name
                          }
                        </td>
                        <td>{item._published ? '已发布' : '草稿'}</td>
                        <td aria-label={`${item.title}操作`}>
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              onClick={() => setBook({ ...item })}
                            >
                              编辑
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onChange({
                                  ...value,
                                  items: value.items.map((book) =>
                                    book.id === item.id
                                      ? {
                                          ...book,
                                          _published: !book._published,
                                        }
                                      : book,
                                  ),
                                })
                              }
                            >
                              {item._published ? '转草稿' : '发布'}
                            </button>
                            <button
                              type="button"
                              className="admin-danger"
                              onClick={() => {
                                if (window.confirm(`删除「${item.title}」？`))
                                  onChange({
                                    ...value,
                                    items: value.items.filter(
                                      (book) => book.id !== item.id,
                                    ),
                                  });
                              }}
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!filteredBooks.length && (
                <p className="admin-empty">暂无匹配书籍。</p>
              )}
            </div>
          </>
        )}
      </Tabs.Panel>
      <Tabs.Panel value="categories">
        <AdminCollectionCategories
          label="书籍"
          categories={value.categories}
          items={value.items}
          onChange={(categories) => {
            onChange({ ...value, categories });
            setCategory('');
          }}
        />
      </Tabs.Panel>
      <Tabs.Panel value="lists">
        {list ? (
          <fieldset className="collection-editor" disabled={busy}>
            <div className="admin-section-heading">
              <button type="button" onClick={() => setList(null)}>
                返回主题书单
              </button>
              <small>确认后保存栏目，书单与书籍一起保存。</small>
            </div>
            <div className="admin-fields">
              <div className="admin-field admin-wide">
                <label htmlFor="booklist-title">书单名称</label>
                <input
                  id="booklist-title"
                  value={list.title}
                  onChange={(event) =>
                    setList({ ...list, title: event.target.value })
                  }
                />
              </div>
              <div className="admin-field admin-wide">
                <label htmlFor="booklist-description">书单简介</label>
                <textarea
                  id="booklist-description"
                  rows={4}
                  value={list.description}
                  onChange={(event) =>
                    setList({ ...list, description: event.target.value })
                  }
                />
              </div>
              <section
                className="admin-wide booklist-entries"
                aria-label="书单所属书籍"
              >
                <h3>所属书籍 · {list.entries.length} 本</h3>
                <p className="admin-help">
                  逐行填写书名和作者，书目独立保存在本书单中。
                </p>
                {list.entries.map((entry, index) => (
                  <div className="booklist-entry-row" key={index}>
                    <span>{index + 1}</span>
                    <label>
                      书名
                      <input
                        aria-label={`书名 ${index + 1}`}
                        value={entry.title}
                        onChange={(event) =>
                          setList({
                            ...list,
                            entries: list.entries.map((row, i) =>
                              i === index
                                ? { ...row, title: event.target.value }
                                : row,
                            ),
                          })
                        }
                      />
                    </label>
                    <label>
                      作者
                      <input
                        aria-label={`作者 ${index + 1}`}
                        value={entry.author}
                        onChange={(event) =>
                          setList({
                            ...list,
                            entries: list.entries.map((row, i) =>
                              i === index
                                ? { ...row, author: event.target.value }
                                : row,
                            ),
                          })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      aria-label={`移除书目 ${index + 1}`}
                      onClick={() =>
                        setList({
                          ...list,
                          entries: list.entries.filter((_, i) => i !== index),
                        })
                      }
                    >
                      移除
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={list.entries.length >= 500}
                  onClick={() =>
                    setList({
                      ...list,
                      entries: [...list.entries, { title: '', author: '' }],
                    })
                  }
                >
                  添加一行书籍
                </button>
              </section>
              <AdminCollectionCover
                kind="booklist"
                title={list.title}
                description={list.description}
                value={list.cover}
                onChange={(cover) =>
                  setList((current) => (current ? { ...current, cover } : null))
                }
                onWorking={(next) => {
                  setBusy(next);
                  onWorking(next);
                }}
              />
              <label className="admin-choice">
                <input
                  type="checkbox"
                  checked={list._published}
                  onChange={(event) =>
                    setList({ ...list, _published: event.target.checked })
                  }
                />
                发布到前台
              </label>
            </div>
            <div className="admin-music-actions">
              <button
                type="button"
                className="admin-primary"
                disabled={
                  !list.title.trim() ||
                  list.entries.some((entry) => !entry.title.trim())
                }
                onClick={() => {
                  onChange({
                    ...value,
                    lists: value.lists.some((item) => item.id === list.id)
                      ? value.lists.map((item) =>
                          item.id === list.id ? list : item,
                        )
                      : [...value.lists, list],
                  });
                  setList(null);
                }}
              >
                确认书单
              </button>
            </div>
          </fieldset>
        ) : (
          <>
            <div className="admin-table-toolbar">
              <input
                type="search"
                aria-label="搜索书单"
                placeholder="搜索书单名称或简介"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
              <button
                type="button"
                className="admin-primary"
                onClick={() => {
                  setList({
                    ...bookSample.lists[0],
                    id: crypto.randomUUID(),
                    title: '',
                    entries: [],
                  });
                }}
              >
                新增主题书单
              </button>
            </div>
            <div className="admin-table-scroll">
              <table className="admin-project-table">
                <caption>{filteredLists.length} 个主题书单</caption>
                <thead>
                  <tr>
                    {['书单名称', '简介', '书籍数量', '状态', '操作'].map(
                      (label) => (
                        <th key={label} scope="col">
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredLists
                    .slice((current - 1) * 20, current * 20)
                    .map((item) => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>
                          <span className="collection-table-summary">
                            {item.description || '—'}
                          </span>
                        </td>
                        <td>{item.entries.length}</td>
                        <td>{item._published ? '已发布' : '草稿'}</td>
                        <td aria-label={`${item.title}操作`}>
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              onClick={() => {
                                setList({
                                  ...item,
                                  entries: item.entries.map((entry) => ({
                                    ...entry,
                                  })),
                                });
                              }}
                            >
                              编辑
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onChange({
                                  ...value,
                                  lists: value.lists.map((list) =>
                                    list.id === item.id
                                      ? {
                                          ...list,
                                          _published: !list._published,
                                        }
                                      : list,
                                  ),
                                })
                              }
                            >
                              {item._published ? '转草稿' : '发布'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(`删除书单「${item.title}」？`)
                                )
                                  onChange({
                                    ...value,
                                    lists: value.lists.filter(
                                      (list) => list.id !== item.id,
                                    ),
                                  });
                              }}
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!filteredLists.length && (
                <p className="admin-empty">暂无主题书单。</p>
              )}
            </div>
          </>
        )}
      </Tabs.Panel>
      {tab !== 'categories' && !(tab === 'items' ? book : list) && (
        <div className="admin-music-pagination">
          <span>
            第 {current} / {pages} 页
          </span>
          <button
            type="button"
            disabled={current <= 1}
            onClick={() => setPage(current - 1)}
          >
            上一页
          </button>
          <button
            type="button"
            disabled={current >= pages}
            onClick={() => setPage(current + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </Tabs.Root>
  );
}
