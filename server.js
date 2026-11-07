import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

import express from 'express';
const app = express();
app.use(express.json({ limit: '20mb' }));

const { default: handler } = await import('./api/index.js');
app.all('/api/:route', (req, res) => handler(req, res));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
