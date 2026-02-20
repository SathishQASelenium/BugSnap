import express from 'express';
import cors from 'cors';
import path from 'path';

import settingsRouter from './routes/settings';
import testConnectionRouter from './routes/test-connection';
import analyzeRouter from './routes/analyze';
import createTicketRouter from './routes/create-ticket';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Routes
app.use('/api/settings', settingsRouter);
app.use('/api/test', testConnectionRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/create-ticket', createTicketRouter);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Bug Report Enhancer Server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
