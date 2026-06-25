import { defineConfig } from 'vitepress'

// Minimal scaffold — title, top nav, sidebar, local search.
// Real docs get added later (synced from the code repo on release).
export default defineConfig({
  title: '16code',
  description: '16code 文档与下载',
  lang: 'zh-CN',
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: '文档', link: '/example' },
      { text: '下载', link: 'https://github.com/yinyue123/16code/releases/latest' },
    ],

    sidebar: [
      {
        text: '开始',
        items: [
          { text: '示例页', link: '/example' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yinyue123/16code' },
    ],

    search: { provider: 'local' },
  },
})
