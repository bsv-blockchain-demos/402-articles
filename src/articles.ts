export interface Article {
  slug: string
  title: string
  author: string
  date: string
  excerpt: string
  content: string
  price: number
}

export const articles: Article[] = [
  {
    slug: 'future-of-money',
    title: 'The Future of Money is Programmable',
    author: 'Satoshi Nakamoto',
    date: '2025-03-01',
    excerpt: 'How Bitcoin SV is redefining what money can be in the digital age.',
    content: `
      <h1>The Future of Money is Programmable</h1>
      <p>Bitcoin was never just about digital cash. It was about creating a system where value can be programmed, transferred, and composed with the same ease as software.</p>
      <p>The implications are profound. Every financial instrument, every contract, every form of value can exist on a single, global, permissionless network.</p>
      <p>This is not the future. This is happening now.</p>
    `,
    price: 100
  },
  {
    slug: 'data-ownership',
    title: 'Why Data Ownership Matters',
    author: 'Hal Finney',
    date: '2025-03-10',
    excerpt: 'Your data should belong to you, not to corporations.',
    content: `
      <h1>Why Data Ownership Matters</h1>
      <p>In the age of AI and surveillance capitalism, personal data has become the most valuable resource on earth.</p>
      <p>But who should control it? The platforms that harvest it, or the individuals who generate it?</p>
      <p>With Bitcoin SV, we can build systems where users truly own and monetize their own data.</p>
    `,
    price: 100
  }
]

export function getArticle(slug: string): Article | undefined {
  return articles.find(a => a.slug === slug)
}

export function getAllArticles() {
  return articles.map(({ content, ...article }) => article)
}