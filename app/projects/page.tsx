'use client';

import Image from 'next/image';
import { useState } from 'react';
import { projects } from '../content';
import { PageIntro, SiteFooter, SiteHeader } from '@/components/site-chrome';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const statuses = ['全部', '持续迭代', '概念研究', '内部使用'];

export default function ProjectsPage() {
  const [status, setStatus] = useState('全部');
  const [selected, setSelected] = useState(projects[0].number);
  const [imageIndex, setImageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const visible = projects.filter((project) => status === '全部' || project.status === status);
  const active = projects.find((project) => project.number === selected) ?? visible[0] ?? projects[0];
  const previousImage = () => setImageIndex((imageIndex + active.images.length - 1) % active.images.length);
  const nextImage = () => setImageIndex((imageIndex + 1) % active.images.length);
  return <main className="site-shell"><SiteHeader /><PageIntro title="做过的事，以及它们留下的方法。" text="项目页记录问题、角色、过程与下一步；选择一个项目，查看它的工作档案。" />
    <section className="project-filters"><span>项目状态</span>{statuses.map((item) => <button className={status === item ? 'active' : ''} type="button" onClick={() => setStatus(item)} key={item}>{item}</button>)}</section>
    <section className="project-workspace"><aside className="project-menu"><p>项目列表 / {visible.length}</p>{visible.map((project) => <button type="button" className={active.number === project.number ? 'selected' : ''} onClick={() => { setSelected(project.number); setImageIndex(0); }} key={project.number}><span>{project.number}</span><div><b>{project.title}</b><small>{project.status}</small></div><i>↗</i></button>)}</aside><article className="project-detail"><div className="project-gallery"><button className="gallery-control previous" type="button" onClick={previousImage} aria-label="查看上一张项目图片">←</button><button className="gallery-expand" type="button" onClick={() => setExpanded(true)} aria-label="放大查看项目图片"><Image src={active.images[imageIndex]} width={920} height={620} alt={`${active.title} 项目示例`} priority /></button><button className="gallery-control next" type="button" onClick={nextImage} aria-label="查看下一张项目图片">→</button><span>{String(imageIndex + 1).padStart(2, '0')} / {String(active.images.length).padStart(2, '0')}</span></div><div className="gallery-thumbs">{active.images.map((image, index) => <button type="button" className={index === imageIndex ? 'active' : ''} onClick={() => setImageIndex(index)} key={image}><Image src={image} width={90} height={90} alt="切换项目示例图" /></button>)}</div><div className="detail-meta"><span>{active.year}</span><span>{active.status}</span></div><h2>{active.title}</h2><p className="detail-description">{active.detail}</p><dl><div><dt>方向</dt><dd>{active.category}</dd></div><div><dt>我的工作</dt><dd>{active.role}</dd></div><div><dt>GitHub</dt><dd><a href={`https://${active.github}`} target="_blank" rel="noreferrer">{active.github} ↗</a></dd></div></dl></article></section><Dialog open={expanded} onOpenChange={setExpanded}><DialogContent className="image-dialog"><DialogTitle>{active.title} · 项目示例</DialogTitle><Image src={active.images[imageIndex]} width={1200} height={900} alt={`${active.title} 放大项目示例`} /></DialogContent></Dialog><SiteFooter /></main>;
}
