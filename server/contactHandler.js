import nodemailer from 'nodemailer'

/**
 * HTML sanitization helper
 */
export function escapeHtml(str) {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

// In-memory sliding window rate limiter
const ipRequestLogs = new Map()

export function checkRateLimit(ip, maxRequests = 5, windowMinutes = 15) {
    const now = Date.now()
    const windowMs = windowMinutes * 60 * 1000

    // Retrieve existing logs for this IP
    const timestamps = ipRequestLogs.get(ip) || []
    const recentTimestamps = timestamps.filter(t => now - t < windowMs)

    if (recentTimestamps.length >= maxRequests) {
        return false // Rate limit exceeded
    }

    recentTimestamps.push(now)
    ipRequestLogs.set(ip, recentTimestamps)

    // Cleanup stale IPs periodically
    if (ipRequestLogs.size > 1000) {
        for (const [key, times] of ipRequestLogs.entries()) {
            if (times.every(t => now - t >= windowMs)) {
                ipRequestLogs.delete(key)
            }
        }
    }

    return true
}

/**
 * Server-side validation logic
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

export function validateContactPayload(payload) {
    const errors = {}

    // Honeypot spam trap
    if (payload._gotcha) {
        return { isValid: false, isSpam: true, errors: { spam: 'Spam detected' } }
    }

    // Name
    const name = typeof payload.name === 'string' ? payload.name.trim() : ''
    if (!name) {
        errors.name = 'Please enter your name.'
    } else if (name.length < 2) {
        errors.name = 'Name must be at least 2 characters.'
    } else if (name.length > 100) {
        errors.name = 'Name cannot exceed 100 characters.'
    }

    // Email
    const email = typeof payload.email === 'string' ? payload.email.trim() : ''
    if (!email) {
        errors.email = 'Please enter your email address.'
    } else if (!EMAIL_REGEX.test(email) || email.length > 150) {
        errors.email = 'Please enter a valid email address.'
    }

    // Subject
    const subject = typeof payload.subject === 'string' ? payload.subject.trim() : ''
    if (!subject) {
        errors.subject = 'Please enter a subject.'
    } else if (subject.length < 2) {
        errors.subject = 'Subject must be at least 2 characters.'
    } else if (subject.length > 150) {
        errors.subject = 'Subject cannot exceed 150 characters.'
    }

    // Message
    const message = typeof payload.message === 'string' ? payload.message.trim() : ''
    if (!message) {
        errors.message = 'Please enter your message.'
    } else if (message.length < 5) {
        errors.message = 'Message must be at least 5 characters.'
    } else if (message.length > 5000) {
        errors.message = 'Message cannot exceed 5000 characters.'
    }

    return {
        isValid: Object.keys(errors).length === 0,
        isSpam: false,
        errors,
        sanitizedData: {
            name: escapeHtml(name),
            email: email.toLowerCase(),
            subject: escapeHtml(subject),
            message: escapeHtml(message),
            rawMessage: message
        }
    }
}

/**
 * Send email using configured provider (Resend API or SMTP)
 */
export async function sendContactEmail({ name, email, subject, message, rawMessage }) {
    const destinationEmail = process.env.CONTACT_EMAIL || 'engelbert17dm@gmail.com'
    const fromEmail = process.env.EMAIL_FROM || 'Engelbert Portfolio <onboarding@resend.dev>'
    const emailSubject = `Portfolio Contact: ${subject}`

    const plainTextBody = `New message from your e-portfolio\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${rawMessage}\n\n---\nSent securely through the Engelbert Morales e-Portfolio Contact Form.`

    const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
            <div style="border-bottom: 2px solid #0055ff; padding-bottom: 16px; margin-bottom: 20px;">
                <h2 style="color: #0b1120; margin: 0 0 4px 0; font-size: 20px;">New Portfolio Message</h2>
                <p style="color: #64748b; margin: 0; font-size: 13px;">Received from your personal e-portfolio contact form</p>
            </div>
            
            <div style="margin-bottom: 16px;">
                <strong style="display: block; font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">From</strong>
                <p style="margin: 0; font-size: 15px; color: #0b1120;"><strong>${name}</strong> &lt;<a href="mailto:${email}" style="color: #0055ff; text-decoration: none;">${email}</a>&gt;</p>
            </div>

            <div style="margin-bottom: 16px;">
                <strong style="display: block; font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Subject</strong>
                <p style="margin: 0; font-size: 15px; color: #0b1120;">${subject}</p>
            </div>

            <div style="margin-bottom: 24px; background: #f8fafc; border-left: 3px solid #0055ff; padding: 14px 16px; border-radius: 4px;">
                <strong style="display: block; font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Message</strong>
                <div style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${message}</div>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; font-size: 12px; color: #94a3b8; text-align: center;">
                Sent securely via Engelbert Morales e-Portfolio • Reply to this email to respond directly to ${name}.
            </div>
        </div>
    `

    // Strategy A: Resend API (Preferred when RESEND_API_KEY is present)
    if (process.env.RESEND_API_KEY) {
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [destinationEmail],
                reply_to: email,
                subject: emailSubject,
                text: plainTextBody,
                html: htmlBody
            })
        })

        if (!resendResponse.ok) {
            const errorDetails = await resendResponse.text()
            console.error('[Resend Error]:', resendResponse.status, errorDetails)
            throw new Error('Email provider rejected the request.')
        }

        return { success: true, provider: 'resend' }
    }

    // Strategy B: SMTP Transport (when SMTP credentials are configured)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })

        await transporter.sendMail({
            from: fromEmail,
            to: destinationEmail,
            replyTo: `${name} <${email}>`,
            subject: emailSubject,
            text: plainTextBody,
            html: htmlBody
        })

        return { success: true, provider: 'smtp' }
    }

    // If no provider is configured
    console.warn('[Email Warning]: Neither RESEND_API_KEY nor SMTP credentials are set in environment variables.')
    throw new Error('EMAIL_NOT_CONFIGURED')
}
