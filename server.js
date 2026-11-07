import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

import express from 'express';

const app = express();
app.use(express.json({ limit: '20mb' }));

const routes = [
  'products', 'orders', 'user',
  'admin-auth', 'admin-products', 'admin-data', 'admin-upload',
  'razorpay', 'admin-categories',
];

for (const route of routes) {
  const mod = await import(`./api/${route}.js`);
  app.all(`/api/${route}`, (req, res) => mod.default(req, res));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
