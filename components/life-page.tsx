import { PageIntro, SiteFooter, SiteHeader } from '@/components/site-chrome';

const content = {
  music: { title: '音乐', text: '声音是日常的另一种时间线。收录正在循环的专辑、现场与片段。', mood: '夜间散步 / 03:18', items: ['当电子乐开始留白', '一张适合下雨天的专辑', '把一首歌听到第十遍之后'] },
  films: { title: '电影', text: '银幕里的光线、节奏与人物，偶尔会比语言更准确地留下一个瞬间。', mood: '本周片单 / 3 部', items: ['缓慢镜头里的城市呼吸', '一个好结尾不一定需要答案', '那些让人想暂停的画面'] },
  podcasts: { title: '播客', text: '把值得慢慢听完的对话、独白与声音实验留在这里。', mood: '最近收听 / 06:42', items: ['关于创作耐心的一次长谈', '当技术回到人的感受', '不急于被总结的职业路径'] },
  travel: { title: '旅行', text: '地图不是目的地的缩略图，它也记录抵达之前的期待和离开之后的回声。', mood: '下一站 / 未命名', items: ['沿河岸走到天色变暗', '一家只记得窗边光线的小店', '把陌生城市的声音带回来'] },
  hobbies: { title: '爱好', text: '把不为效率的练习留出来：好奇、重复、手感，以及没有截止日期的兴趣。', mood: '自由练习 / 持续中', items: ['重新开始写字的第一周', '把厨房变成一个小实验室', '每周拍一张没有目的的照片'] },
} as const;

export function LifePage({ type }: { type: keyof typeof content }) {
  const page = content[type];
  return <main className="site-shell"><SiteHeader /><PageIntro title={page.title} text={page.text} /><section className={`life-hero ${type}`}><p>{page.mood}</p><div aria-hidden="true"><i /><i /><i /></div><span>个人<br />生活索引</span></section><section className="life-stream">{page.items.map((item, index) => <article key={item}><span>0{index + 1}</span><h2>{item}</h2><p>一则持续更新的个人记录，留给未来的自己重新回看。</p><b>↗</b></article>)}</section><SiteFooter /></main>;
}
