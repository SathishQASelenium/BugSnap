import { Router, Request, Response } from 'express';
import axios from 'axios';
import { loadSettings } from '../utils/settings-store';

const router = Router();

// POST /api/create-ticket — Create a Jira bug ticket
router.post('/', async (req: Request, res: Response) => {
    try {
        const settings = loadSettings();
        const { baseUrl, email, apiKey, projectKey, issueType } = settings.jira;

        if (!baseUrl || !email || !apiKey || !projectKey) {
            res.status(400).json({
                success: false,
                error: 'Jira settings are incomplete. Please configure in Settings.',
            });
            return;
        }

        const { summary, description } = req.body;

        if (!summary || !description) {
            res.status(400).json({
                success: false,
                error: 'Summary and description are required.',
            });
            return;
        }

        const cleanUrl = baseUrl.replace(/\/+$/, '');
        const authHeader = `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`;

        // Create the Jira issue
        const issueData = {
            fields: {
                project: { key: projectKey },
                summary,
                description: {
                    type: 'doc',
                    version: 1,
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: description,
                                },
                            ],
                        },
                    ],
                },
                issuetype: { name: issueType || 'Bug' },
            },
        };

        const response = await axios.post(
            `${cleanUrl}/rest/api/3/issue`,
            issueData,
            {
                headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                timeout: 15000,
            }
        );

        const issueKey = response.data.key;
        const issueUrl = `${cleanUrl}/browse/${issueKey}`;

        res.json({
            success: true,
            message: `Jira ticket created successfully!`,
            issueKey,
            issueUrl,
        });
    } catch (err: any) {
        console.error('Jira ticket creation error:', err.response?.data || err.message);
        const errorDetails = err.response?.data?.errors
            ? Object.values(err.response.data.errors).join(', ')
            : err.message || 'Unknown error';
        res.status(500).json({
            success: false,
            error: `Failed to create Jira ticket: ${errorDetails}`,
        });
    }
});

export default router;
