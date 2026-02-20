import { Router, Request, Response } from 'express';
import { loadSettings, saveSettings, Settings } from '../utils/settings-store';

const router = Router();

// GET /api/settings — Load saved settings
router.get('/', (_req: Request, res: Response) => {
    try {
        const settings = loadSettings();
        // Mask the API keys for security (only send last 4 chars)
        const masked: Settings = {
            ...settings,
            jira: {
                ...settings.jira,
                apiKey: settings.jira.apiKey
                    ? '••••' + settings.jira.apiKey.slice(-4)
                    : '',
            },
            groq: {
                apiKey: settings.groq.apiKey
                    ? '••••' + settings.groq.apiKey.slice(-4)
                    : '',
            },
        };
        res.json({ success: true, settings: masked });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to load settings' });
    }
});

// POST /api/settings — Save settings
router.post('/', (req: Request, res: Response) => {
    try {
        const { jira, groq } = req.body;
        const current = loadSettings();

        // Only update fields that are provided and not masked
        const updatedSettings: Settings = {
            jira: {
                projectKey: jira?.projectKey ?? current.jira.projectKey,
                apiKey: jira?.apiKey && !jira.apiKey.startsWith('••••')
                    ? jira.apiKey
                    : current.jira.apiKey,
                email: jira?.email ?? current.jira.email,
                baseUrl: jira?.baseUrl ?? current.jira.baseUrl,
                issueType: jira?.issueType ?? current.jira.issueType,
            },
            groq: {
                apiKey: groq?.apiKey && !groq.apiKey.startsWith('••••')
                    ? groq.apiKey
                    : current.groq.apiKey,
            },
        };

        saveSettings(updatedSettings);
        res.json({ success: true, message: 'Settings saved successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to save settings' });
    }
});

export default router;
