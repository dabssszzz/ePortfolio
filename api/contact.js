import { checkRateLimit, validateContactPayload, sendContactEmail } from '../server/contactHandler.js'

export default async function handler(req, res) {
    // Enable CORS for Vercel/Serverless deployment
    const allowedOrigin = process.env.ALLOWED_ORIGIN || '*'
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' })
    }

    try {
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1'

        // 1. Rate Limiting
        const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '5', 10)
        const windowMinutes = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15', 10)

        const isAllowed = checkRateLimit(clientIp, maxRequests, windowMinutes)
        if (!isAllowed) {
            return res.status(429).json({
                success: false,
                message: 'Too many attempts. Please wait a moment before trying again.'
            })
        }

        // 2. Server-side Validation
        const validation = validateContactPayload(req.body || {})

        if (validation.isSpam) {
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

        // 3. Send Email
        await sendContactEmail(validation.sanitizedData)

        return res.status(200).json({
            success: true,
            message: 'Message sent successfully! Thank you for reaching out.'
        })

    } catch (error) {
        if (error.message === 'EMAIL_NOT_CONFIGURED') {
            return res.status(503).json({
                success: false,
                message: "We couldn't send your message right now. Email provider is not configured. Please contact directly at engelbert17dm@gmail.com."
            })
        }

        return res.status(500).json({
            success: false,
            message: "We couldn't send your message right now. Please try again later or contact directly at engelbert17dm@gmail.com."
        })
    }
}
