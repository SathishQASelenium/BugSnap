import { Router, Request, Response } from 'express';
import multer from 'multer';
import Groq from 'groq-sdk';
import { loadSettings } from '../utils/settings-store';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/analyze — Analyze screenshot with Groq vision
router.post('/', upload.single('screenshot'), async (req: Request, res: Response) => {
    try {
        const settings = loadSettings();
        const { apiKey } = settings.groq;

        if (!apiKey) {
            res.status(400).json({ success: false, error: 'Groq API key not configured. Go to Settings.' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ success: false, error: 'No screenshot uploaded.' });
            return;
        }

        const additionalNotes = req.body.notes || '';

        // Convert image to base64
        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype || 'image/png';

        const groq = new Groq({ apiKey });

        const prompt = `You are an expert QA engineer analyzing a screenshot of a software application for bugs. 
Analyze this screenshot carefully and generate a structured bug report.

${additionalNotes ? `Additional context from the tester: "${additionalNotes}"` : ''}

Please provide the following in your response:
1. **Summary**: A concise one-line bug title
2. **Description**: Detailed description of the issue visible in the screenshot
3. **Steps to Reproduce**: Numbered steps to reproduce the issue (inferred from the screenshot)
4. **Expected Result**: What should happen
5. **Actual Result**: What is actually happening (as seen in the screenshot)
6. **Severity**: Critical / Major / Minor / Trivial
7. **Environment**: Any environment details visible in the screenshot

Format your response as a clean, professional bug report.`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            max_tokens: 2048,
            temperature: 0.3,
        });

        const analysis = completion.choices[0]?.message?.content || 'No analysis generated.';

        // Extract summary line for Jira title
        const summaryMatch = analysis.match(/\*\*Summary\*\*[:\s]*(.+)/i);
        const summary = summaryMatch
            ? summaryMatch[1].trim()
            : `Bug Report - ${new Date().toISOString().split('T')[0]}`;

        res.json({
            success: true,
            analysis,
            summary,
        });
    } catch (err: any) {
        console.error('Analysis error:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to analyze screenshot.',
        });
    }
});

export default router;
