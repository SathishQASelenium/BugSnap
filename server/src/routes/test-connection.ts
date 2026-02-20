import { Router, Request, Response } from 'express';
import axios from 'axios';
import Groq from 'groq-sdk';
import { loadSettings } from '../utils/settings-store';

const router = Router();

// POST /api/test-jira — Test Jira connection
router.post('/jira', async (req: Request, res: Response) => {
    try {
        const settings = loadSettings();
        const { baseUrl, email, apiKey } = settings.jira;

        if (!baseUrl || !email || !apiKey) {
            res.status(400).json({
                success: false,
                error: 'Jira connection details are incomplete. Please fill in URL, Email, and API Key in Settings.',
            });
            return;
        }

        // Clean up URL
        const cleanUrl = baseUrl.replace(/\/+$/, '');

        const response = await axios.get(`${cleanUrl}/rest/api/3/myself`, {
            headers: {
                Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`,
                Accept: 'application/json',
            },
            timeout: 10000,
        });

        res.json({
            success: true,
            message: `Connected successfully! Logged in as: ${response.data.displayName} (${response.data.emailAddress})`,
        });
    } catch (err: any) {
        const status = err.response?.status;
        let errorMsg = 'Failed to connect to Jira.';
        if (status === 401) {
            errorMsg = 'Authentication failed. Check your email and API key.';
        } else if (status === 403) {
            errorMsg = 'Access forbidden. Check your permissions.';
        } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
            errorMsg = 'Cannot reach Jira server. Check your URL.';
        }
        res.status(400).json({ success: false, error: errorMsg });
    }
});

// POST /api/test-groq — Test Groq connection
router.post('/groq', async (_req: Request, res: Response) => {
    try {
        const settings = loadSettings();
        const { apiKey } = settings.groq;

        if (!apiKey) {
            res.status(400).json({
                success: false,
                error: 'Groq API key is not set. Please add it in Settings.',
            });
            return;
        }

        const groq = new Groq({ apiKey });

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Say "connected" in one word.' }],
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            max_tokens: 10,
        });

        const reply = completion.choices[0]?.message?.content || '';
        res.json({
            success: true,
            message: `Groq connection successful! Model responded: "${reply.trim()}"`,
        });
    } catch (err: any) {
        let errorMsg = 'Failed to connect to Groq.';
        if (err.status === 401 || err.message?.includes('auth')) {
            errorMsg = 'Invalid Groq API key. Please check and try again.';
        }
        res.status(400).json({ success: false, error: errorMsg });
    }
});

export default router;
