import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { checkRateLimit, validateContactPayload, sendContactEmail } from './contactHandler.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(express.json({ limit: '10kb' })) // Body size limit to prevent payload flooding

// Configure CORS
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173')
    .split(',')
    .map(o => o.trim())

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps or curl) or if origin is in whitelist
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true)
        } else {
            callback(new Error('Blocked by CORS policy'))
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept']
}))

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'portfolio-contact-api', time: new Date().toISOString() })
})

// Contact Form Endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1'

        // 1. Rate Limiting (5 requests per 15 minutes by default)
        const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '5', 10)
        const windowMinutes = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15', 10)

        const isAllowed = checkRateLimit(clientIp, maxRequests, windowMinutes)
        if (!isAllowed) {
            return res.status(429).json({
                success: false,
                message: 'Too many attempts. Please wait a moment before trying again.'
            })
        }

        // 2. Server-side Validation & Honeypot Check
        const validation = validateContactPayload(req.body || {})

        // Honeypot caught spam bot: silently acknowledge without sending
        if (validation.isSpam) {
            console.warn(`[Spam Blocked]: Honeypot triggered by IP ${clientIp}`)
            return res.status(200).json({
                success: true,
                message: 'Message sent successfully.'
            })
        }

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed. Please check the entered fields.',
                errors: validation.errors
            })
        }

        // 3. Dispatch Email
        await sendContactEmail(validation.sanitizedData)

        console.log(`[Contact Success]: Message delivered from ${validation.sanitizedData.email} via IP ${clientIp}`)

        return res.status(200).json({
            success: true,
            message: 'Message sent successfully! Thank you for reaching out.'
        })

    } catch (error) {
        if (error.message === 'EMAIL_NOT_CONFIGURED') {
            console.error('[Configuration Error]: Email provider credentials missing in .env')
            return res.status(503).json({
                success: false,
                message: "We couldn't send your message right now. Email provider is not configured. Please contact directly at engelbert17dm@gmail.com."
            })
        }

        console.error('[Contact Error]:', error.message || error)
        return res.status(500).json({
            success: false,
            message: "We couldn't send your message right now. Please try again later or contact directly at engelbert17dm@gmail.com."
        })
    }
})

// Start Server
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`🚀 Portfolio Contact API running at http://localhost:${PORT}`)
    })
}

export default app
