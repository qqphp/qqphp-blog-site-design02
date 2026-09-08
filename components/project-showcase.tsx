'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CmsText } from '@/components/cms-text';

import { useContent } from '@/components/content-provider';

import Image from 'next/image';
import { useState } from 'react';

import { PageIntro, SiteFooter, SiteHeader } from '@/components/site-chrome';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import '@/components/project-showcase.css';


export function ProjectShowcase({ initialId }: { initialId: string }) {
  const { projects: projectDocument } = useContent();
  const projects = projectDocument.items;
  const statuses = ['全部', ...new Set(projects.map(project => project.status))];
  const [status, setStatus] = useState('全部');
  const [selected, setSelected] = useState(initialId);
  const [imageIndex, setImageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const visible = projects.filter(
    (project) => status === '全部' || project.status === status,
  );
  const active =
    visible.find((project) => project.id === selected) ?? visible[0];
  if (!active) return <main className="site-shell"><SiteHeader /><p className="page-intro"><CmsText page="项目页" name="01 暂无已发布项目。" /></p><button type="button" onClick={() => setStatus('全部')}><CmsText page="项目页" name="02 查看全部项目" /></button><SiteFooter /></main>;
  const currentImage = active.images[imageIndex] ?? active.images[0];
  const previousImage = () =>
    setImageIndex(
      (index) => (index + active.images.length - 1) % active.images.length,
    );
  const nextImage = () =>
    setImageIndex((index) => (index + 1) % active.images.length);

  return (
    <main className="site-shell">
      <SiteHeader />
      <PageIntro
        title="从一个想法，到一件作品。"
        text="收录产品原型、设计探索与个人工具，记录每个项目的构思、实现与迭代。"
      />
      <section className="folio-toolbar" aria-label="项目状态筛选">
        <span className="folio-eyebrow"><CmsText page="项目页" name="03 PROJECT INDEX /" />{String(projects.length).padStart(2, '0')}
        </span>
        <div>
          {statuses.map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={status === item}
              onClick={() => {
                setStatus(item);
                setImageIndex(0);
              }}
            >
              {item}
              <small>
                {item === '全部'
                  ? projects.length
                  : projects.filter((project) => project.status === item)
                      .length}
              </small>
            </button>
          ))}
        </div>
      </section>
      <section className="folio-workspace">
        <aside className="folio-sidebar">
          <div className="folio-section-label">
            <span><CmsText page="项目页" name="04 浏览项目" /></span>
            <span>{String(visible.length).padStart(2, '0')}<CmsText page="项目页" name="05 ENTRIES" /></span>
          </div>
          <div className="folio-project-list">
            {visible.map((project) => (
              <button
                type="button"
                className="folio-project"
                aria-pressed={active.id === project.id}
                onClick={() => {
                  setSelected(project.id);
                  setImageIndex(0);
                }}
                key={project.id}
              >
                <div className="folio-project-cover">
                  <Image
                    src={project.images[0].src}
                    width={420}
                    height={230}
                    alt=""
                  />
                  <span>
                    {project.category}
                  </span>
                </div>
                <div className="folio-project-copy">
                  <h2>
                    {project.title}
                    <span aria-hidden="true">↗</span>
                  </h2>
                  <p>{project.subtitle}</p>
                  <small>
                    <i />
                    {project.status}
                  </small>
                </div>
              </button>
            ))}
          </div>
          <div className="folio-note">
            <span className="folio-eyebrow"><CmsText page="项目页" name="06 ABOUT THIS INDEX" /></span>
            <h3><CmsText page="项目页" name="07 不只陈列结果，" /><br /><CmsText page="项目页" name="08 也留下思考。" /></h3>
            <p><CmsText page="项目页" name="09 这里的项目文案和视觉为概念示例。真实" /></p>
          </div>
        </aside>
        <article className="folio-detail">
          <header className="folio-detail-header">
            <div className="folio-section-label">
              <span>项目档案</span>
              <span><CmsText page="项目页" name="11 概念示例 ·" />{active.year}</span>
            </div>
            <div className="folio-title">
              <h2>{active.title}</h2>
              <span>{active.status}</span>
            </div>
            <p>{active.description}</p>
            <div className="folio-tags">
              {active.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </header>
          <div className="folio-gallery">
            <button
              type="button"
              className="folio-expand"
              onClick={() => setExpanded(true)}
              aria-label={`放大查看${currentImage.label}`}
            >
              <Image
                src={currentImage.src}
                width={1100}
                height={660}
                alt={currentImage.alt}
                priority
              />
              <span><CmsText page="项目页" name="12 ↗ 放大查看" /></span>
            </button>
            <div className="folio-gallery-bar">
              <span>
                {String(imageIndex + 1).padStart(2, '0')} /{' '}
                {String(active.images.length).padStart(2, '0')}
                <b>{currentImage.label}</b>
              </span>
              <div>
                <button
                  type="button"
                  onClick={previousImage}
                  aria-label="查看上一张项目图片"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="查看下一张项目图片"
                >
                  →
                </button>
              </div>
            </div>
          </div>
          <div className="folio-thumbnails">
            {active.images.map((image, index) => (
              <button
                type="button"
                key={image.src}
                aria-pressed={index === imageIndex}
                aria-label={`查看${image.label}`}
                onClick={() => setImageIndex(index)}
              >
                <Image src={image.src} width={112} height={70} alt="" />
                <span>
                  <small>0{index + 1}</small>
                  {image.label}
                </span>
              </button>
            ))}
          </div>
          <dl className="folio-facts">
            <div>
              <dt><CmsText page="项目页" name="13 项目方向" /></dt>
              <dd>{active.category}</dd>
            </div>
            <div>
              <dt><CmsText page="项目页" name="14 工作范围" /></dt>
              <dd>{active.role}</dd>
            </div>
          </dl>
          {active.body && <section className="folio-markdown"><h3>项目说明</h3><ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{active.body}</ReactMarkdown></section>}
        </article>
      </section>
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent
          className="image-dialog"
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              previousImage();
            }
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              nextImage();
            }
          }}
        >
          <DialogTitle>
            {active.title} · {currentImage.label}
          </DialogTitle>
          <div className="dialog-gallery">
            <button
              className="dialog-gallery-control previous"
              type="button"
              onClick={previousImage}
              aria-label="查看上一张项目图片"
            >
              ←
            </button>
            <Image
              src={currentImage.src}
              width={1200}
              height={900}
              alt={currentImage.alt}
            />
            <button
              className="dialog-gallery-control next"
              type="button"
              onClick={nextImage}
              aria-label="查看下一张项目图片"
            >
              →
            </button>
            <span>
              {String(imageIndex + 1).padStart(2, '0')} /{' '}
              {String(active.images.length).padStart(2, '0')}
            </span>
          </div>
        </DialogContent>
      </Dialog>
      <SiteFooter />
    </main>
  );
}
