export const books = [
  { id: 'design', title: '设计心理学', author: '唐纳德·诺曼', category: '设计', status: '读过', color: '#e8b65b', note: '从日常物品出发，留意设计如何帮助人理解和使用工具。' },
  { id: 'thinking', title: '思考，快与慢', author: '丹尼尔·卡尼曼', category: '认知', status: '想读', color: '#d8856b', note: '带着关于直觉与判断的问题，开始一次阅读。' },
  { id: 'walden', title: '瓦尔登湖', author: '亨利·戴维·梭罗', category: '文学', status: '读过', color: '#9fb9a1', note: '给生活留出一点空白，观察自然，也重新观察日常。' },
  { id: 'little-prince', title: '小王子', author: '安托万·德·圣埃克苏佩里', category: '文学', status: '读过', color: '#8eaec7', note: '一次关于相遇、关系与珍惜的阅读。' },
  { id: 'sapiens', title: '人类简史', author: '尤瓦尔·赫拉利', category: '人文', status: '想读', color: '#c9bca2', note: '从更长的时间尺度，理解我们身处的世界。' },
  { id: 'invisible', title: '看不见的城市', author: '伊塔洛·卡尔维诺', category: '文学', status: '想读', color: '#b3a4ca', note: '在想象中的城市之间，寻找记忆与空间的关系。' },
  { id: 'refactoring', title: '重构', author: '马丁·福勒', category: '技术', status: '读过', color: '#98b8bd', note: '把代码的可读性和持续修改能力，放回日常开发中。' },
  { id: 'month', title: '人月神话', author: '弗雷德里克·布鲁克斯', category: '技术', status: '想读', color: '#c6a17f', note: '读一读软件项目中关于协作与复杂性的讨论。' },
];
export const booklists = [
  { id: 'making', title: '把东西做好，也把问题想清楚', description: '从设计的可理解性，到代码和团队的组织方式。', label: '设计 × 技术', ids: ['design', 'refactoring', 'month'] },
  { id: 'slow', title: '给忙碌生活的一点留白', description: '走进自然、星球与想象中的城市，换一种速度看世界。', label: '文学 × 日常', ids: ['walden', 'little-prince', 'invisible'] },
  { id: 'world', title: '理解自己，也理解世界', description: '从个体的判断出发，把视野慢慢拉向人类的历史。', label: '认知 × 人文', ids: ['thinking', 'sapiens'] },
];
