export interface Article {
  slug: string
  title: string
  author: string
  date: string
  excerpt: string
  image: string
  content: string
  price: number
}

export interface ContentImage {
  name: string
  contentType: string
  body: Buffer
}

export interface ContentLogger {
  info(message: string): void
  warn(message: string): void
}
