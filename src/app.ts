import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import routes from './routes'
import { errorMiddleware } from './middlewares/error.middleware'
import { getOptionalNumberEnv, getRequiredEnv } from './config/env'

const app = express()
const allowedOrigins = getRequiredEnv('CORS_ORIGINS')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

// Security headers
app.use(helmet())

// Rate limiter (basic)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: getOptionalNumberEnv('RATE_LIMIT_MAX', 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisicoes. Tente novamente mais tarde.' },
})
app.use(limiter)

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}))

app.use(express.json({ limit: getRequiredEnv('JSON_BODY_LIMIT') }))
app.use(routes)
app.use(errorMiddleware)

export default app
