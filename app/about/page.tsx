import { SiteFooter, SiteHeader } from '@/components/site-chrome';

export default function AboutPage() {
  return <main className="site-shell about-page"><SiteHeader />
    <section className="about-signal"><div className="signal-stamp">PERSONAL<br />SIGNAL<br />FIELD</div><p className="eyebrow">你好，我是你的名字</p><h1>把模糊的事，<br />慢慢做得清楚。</h1><p className="signal-caption">内容、体验、工作流，以及那些值得被留下的过程。</p><div className="signal-orbit" aria-hidden="true"><i /><b>◌</b><em>01</em></div></section>
    <section className="about-board"><article className="board-note note-a"><span>正在关注</span><h2>内容如何长期生长</h2><p>让写作、项目与日常记录能够彼此连接。</p></article><article className="board-note note-b"><span>我的方法</span><h2>先把问题看清，再开始制作。</h2><div className="mini-lines"><i /><i /><i /></div></article><article className="board-note note-c"><span>工作坐标</span><div className="coordinate"><b>内容</b><b>体验</b><b>系统</b><i /></div></article><article className="board-contact"><p>保持联系</p><a href="mailto:hello@example.com">hello@example.com <span>↗</span></a><a href="tel:+8613800000000">+86 138 0000 0000 <span>↗</span></a><div><a href="https://github.com/your-name" target="_blank" rel="noreferrer">GitHub</a><a href="https://x.com/your-name" target="_blank" rel="noreferrer">X / Twitter</a><a href="https://www.zhihu.com/people/your-name" target="_blank" rel="noreferrer">知乎</a></div></article></section>
    <section className="about-essay"><span>工作方式</span><div><h2>研究、表达、设计与整理，不是四件独立的事。</h2><p>我在它们之间往返，帮助一个想法从模糊状态走向能够被阅读、讨论和持续使用的形态。这里不是作品终点，而是一张不断更新的工作地图。</p><div className="capabilities"><span>内容策略</span><span>信息架构</span><span>体验设计</span><span>原型表达</span></div></div></section><SiteFooter />
  </main>;
}
