import { stories } from '../content';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';

export default function StoriesPage() {
  return <main className="site-shell"><SiteHeader />
    <section className="story-top"><div className="story-cover"><span>☼</span></div><div className="story-profile"><div className="story-avatar">A</div><div><h1>你的名字</h1><p>记录正在发生的事，也保留还没有答案的问题。</p></div></div></section>
    <section className="story-layout"><aside className="story-sidebar"><p>说说</p><strong>38</strong><span>条日常记录</span><div><b>今天</b><p>更新了文章分类结构。</p></div><a href="#topics"># 话题与标签 →</a></aside><div className="story-feed">{stories.map((story, index) => <article className="story-post" key={story.date}><div className="post-avatar">A</div><div className="post-body"><header><b>你的名字</b><time>{story.date}</time></header><p>{story.text}</p><a className="story-topic" href="#topics">#{story.topic}</a>{index === 0 && <div className="story-image"><span>PROCESS<br />NOTES</span></div>}<div className="post-actions"><span>♡ {story.reactions}</span><span>□ 评论</span><span>↗ 分享</span></div>{story.replies.length > 0 && <div className="replies">{story.replies.map((reply) => <p key={reply}><b>朋友：</b>{reply}</p>)}</div>}</div></article>)}</div></section><section className="story-topics" id="topics"><p>话题</p><a href="#work"># 工作记录 <b>12</b></a><a href="#design"># 设计碎片 <b>9</b></a><a href="#life"># 日常观察 <b>17</b></a></section><SiteFooter /></main>;
}
