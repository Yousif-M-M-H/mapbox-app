import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import testRoutes from './routes/test.routes'

dotenv.config()
const app = express()

app.use(cors())
app.use(express.json())

app.use('/api', testRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`)
})
