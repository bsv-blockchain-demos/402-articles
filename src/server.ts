import express from 'express'
import { createBsvPaymentMiddleware } from './middleware/payment.js'
import { getAllArticles, getArticle } from './articles.js'

const app = express()
const PORT = 3000

app.use(express.json())

const paymentMiddleware = createBsvPaymentMiddleware()

app.get('/', (req, res) => {
  res.json({ message: 'BSV Article Platform', articles: getAllArticles() })
})

app.get('/articles/:slug', paymentMiddleware, (req, res) => {
  const article = getArticle(req.params.slug)
  if (!article) {
    return res.status(404).send('Not found')
  }
  
  res.send(`<h1>${article.title}</h1><p>${article.content}</p><p>✅ Paid with BSV</p>`)
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})