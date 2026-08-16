// Things I run for myself. Not products. Not featured.
// Add a row here when you want a one-click home for another private tool.

export type PersonalTool = {
  name: string;
  title: string;
  summary: string;
  url: string;
};

export const personalTools: PersonalTool[] = [
  {
    name: 'token-relay',
    title: 'Token 中转',
    summary: '自己在用的 New API 面板，统一走各家模型。',
    url: 'https://token.weichao.site/',
  },
];
