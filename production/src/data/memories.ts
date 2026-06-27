// 4 memories · the four places that shaped (and are shaping) me.
// Lat/lon are WGS84. Colors drive both the dot pulse on the globe and the
// memory card accent. `photo` is the public path the site owner will replace
// with real photos later.

export type Memory = {
  id: string;
  lat: number;
  lon: number;
  color: string;
  title: string;
  icon: string;
  date: string;
  desc: string;
  tags: string[];
  photo: string;
};

export const memories: Memory[] = [
  {
    id: 'beijing',
    lat: 39.9,
    lon: 116.4,
    color: '#ff6b35',
    title: '北京 · 学习 工作 生活',
    icon: '🏠',
    date: 'home · 2006 → Now',
    desc: '我生长的地方。\n\n北林大 2006-2010 → 搜狐 → 新浪 → 易车 → 字节 → 现在。眼看他起朱楼，眼看他宴宾客，终于还是蹉跎了岁月，中年被裁。\n\n但根一直在这。家里的饭菜味，下班路上的晚高峰，三里屯的霓虹，798 的展览——这些是 root，不是 background。',
    tags: ['home', 'beijing', 'career', 'family'],
    photo: '/photos/beijing.jpg',
  },
  {
    id: 'xinjiang',
    lat: 43.8,
    lon: 87.6,
    color: '#8a6f5a',
    title: '新疆 · 滑雪 + 独库公路',
    icon: '🏔️',
    date: '想去 · 下一站',
    desc: '新疆是天花板。\n\n丝绸之路 / 阿勒泰 / 禾木 / 天山天池。雪季长（11 月到次年 3 月），雪质干粉。打算带上全套装备：单板 + 双板 + 户外炉头 + 帐篷。\n\n然后沿着独库公路一路向北，从独山子到库车，穿天山而过。561 公里，从荒漠到雪山到峡谷到草原。每天看不同的地貌，停车就是最好的休息。\n\n2026 或者 2027，看时间。',
    tags: ['ski', 'roadtrip', 'duku', 'dream'],
    photo: '/photos/xinjiang.jpg',
  },
  {
    id: 'hainan',
    lat: 18.3,
    lon: 109.5,
    color: '#10b981',
    title: '海南 · 潜水',
    icon: '🤿',
    date: '2026 · 计划',
    desc: 'PADI AOW 拿到之后，下一站是海南。\n\n三亚 / 万宁 / 分界洲岛 / 蜈支洲岛，国内最容易的潜水入门。开放水域 30 米 + 5 次深潜课程遍地。\n\n目标：再考一个深潜专长（Deep Diver 40m），然后看看夜潜和船宿。\n\n最好凑一桌人去考证，热热闹闹——潜水一个人去没意思。',
    tags: ['dive', 'PADI AOW', 'hainan', 'plan'],
    photo: '/photos/hainan.jpg',
  },
  {
    id: 'guangxi',
    lat: 24.8,
    lon: 110.5,
    color: '#f59e0b',
    title: '广西 · 攀岩',
    icon: '🧗',
    date: '想去 · 待安排',
    desc: '阳朔是国内最经典的攀岩圣地。\n\n喀斯特地貌的石灰岩，300+ 条线路，从 5.6 到 5.14 都有，老外都来朝圣。月亮山、啤酒瓶山、白山、大榕树——每个名字都像攀岩圈的朝圣符号。\n\n目标：先去桂林周边的野攀区把基础动作打磨一下 → 然后挑战经典线路。把 5.10a 的小目标往上推到 5.10b、5.10c。\n\n顺便漓江边上骑个车，吃碗桂林米粉。',
    tags: ['climb', 'yangshuo', 'limestone', 'dream'],
    photo: '/photos/guangxi.jpg',
  },
];

export const getMemory = (id: string): Memory | undefined =>
  memories.find((m) => m.id === id);