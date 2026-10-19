// 小镇居民：职业决定房屋外形与屋内/门口道具
export const PROFESSIONS = [
  {
    id: 'bakery', name: '面包师', verb: '烤面包',
    lines: ['面团的第三次发酵还差一刻钟。', '炉子刚封好火，今晚能睡踏实了。', '明早的肉桂卷得多做两盘。'],
    wall: [0xF6E7CC, 0xF3D9BE, 0xF7EEDC], roof: [0xC75B45, 0xB4533F],
    trim: [0x5A4A42, 0x6B4A3C], door: [0x7A4B36],
  },
  {
    id: 'florist', name: '花匠', verb: '种花',
    lines: ['窗台上的薄荷该浇水了。', '今年绣球开得比去年疯。', '温室里的苗再晒两天就能移出去。'],
    wall: [0xE7EFE4, 0xDCE8E4, 0xF2EFDA], roof: [0x5C7A5A, 0x4A6E5A],
    trim: [0x4A5A50, 0x5A6B5A], door: [0x2F5D5B],
  },
  {
    id: 'postman', name: '邮差', verb: '送信',
    lines: ['第一班邮船要等日头落尽。', '今天有十七封信，两封是给钟楼的。', '包裹堆得比门槛高了。'],
    wall: [0xE0E6DF, 0xD2DCD8], roof: [0x4A6E86, 0x3D5A80],
    trim: [0x3E4A5C], door: [0x2F4A6B],
  },
  {
    id: 'clockmaker', name: '钟表匠', verb: '修钟',
    lines: ['钟慢了半拍，可没人介意。', '齿轮是这世上最诚实的东西。', '这只表停在他离开的那年。'],
    wall: [0xEFE6D6, 0xE4D9C4], roof: [0x8C5F7A, 0x7A4B6B],
    trim: [0x4A4038, 0x5A4A42], door: [0x4A3A52],
  },
  {
    id: 'lighthouse', name: '灯塔看守', verb: '守灯',
    lines: ['灯塔的灯芯换过了，能亮一整夜。', '云低的时候，光要打得更远些。', '这盏灯三十年没灭过。'],
    wall: [0xF2EDE2, 0xE8E4DA], roof: [0xA94C3C, 0xC75B45],
    trim: [0x4A4A52, 0x5A5A62], door: [0x2F4A6B],
  },
  {
    id: 'bookstore', name: '旧书店老板', verb: '守书店',
    lines: ['这本书的上一任主人折了角。', '新到的旧书还带着别人家的味道。', '书不会催你，这很好。'],
    wall: [0xE8DFC9, 0xDCD2B8], roof: [0x6B5A4A, 0x5C7A5A],
    trim: [0x3E4A5C, 0x4A3A2E], door: [0x4A3A52],
  },
  {
    id: 'umbrella', name: '修伞匠', verb: '修伞',
    lines: ['伞骨的竹子得挑有韧性的。', '一把伞修好，能再挡三年雨。', '这镇上没人比我更懂风。'],
    wall: [0xF2D9C9, 0xEBD3C2], roof: [0x4A6E86, 0x8C5F7A],
    trim: [0x5A4A42], door: [0x7A4B36],
  },
  {
    id: 'weaver', name: '织布工', verb: '织布',
    lines: ['昨天的风把晾着的布吹跑了。', '云锦的经线得再密一点。', '这块蓝靛是我自己染的。'],
    wall: [0xEFE0D8, 0xE8DDE6], roof: [0x5C7A5A, 0x4A6E86],
    trim: [0x4A4A52], door: [0x2F5D5B],
  },
  {
    id: 'cloud', name: '拾云人', verb: '收云',
    lines: ['说今晚的云会低到屋檐。', '这罐云是今早从东边收的。', '云也是有脾气的，得哄。'],
    wall: [0xE9E4EF, 0xDEDCE9], roof: [0x6B6483, 0x5C5672],
    trim: [0x4A4A5C], door: [0x4A3A52],
  },
  {
    id: 'windmill', name: '风车管理员', verb: '看风车',
    lines: ['风向转了两指，磨盘得调。', '起风的时候整座镇子都在响。', '磨好的面粉明早送到面包房。'],
    wall: [0xEFE3C8, 0xE8DCC6], roof: [0xA94C3C, 0x9A6B4F],
    trim: [0x5A4A42], door: [0x7A4B36],
  },
];

export const NAMES = ['阿岚', '老穆', '小满', '茶茶', '苇子', '安禾', '林渡', '阿穗', '沐白', '苏叶', '余弦', '南枝', '老周', '阿吉', '程屿', '谷雨'];

export function makeOwner(index, professionId) {
  const prof = PROFESSIONS.find((p) => p.id === professionId) || PROFESSIONS[index % PROFESSIONS.length];
  return {
    name: NAMES[(index * 7 + 3) % NAMES.length],
    profession: prof,
    line: prof.lines[(index * 3) % prof.lines.length],
  };
}
