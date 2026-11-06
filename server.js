import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

import express from 'express';

const app = express();
app.use(express.json({ limit: '20mb' }));

const routes = [
  'products', 'orders', 'newsletter', 'my-orders',
  'admin-auth', 'admin-products', 'admin-orders', 'admin-newsletter', 'admin-upload',
  'razorpay-order', 'razorpay-verify', 'admin-categories',
];

for (const route of routes) {
  const mod = await import(`./api/${route}.js`);
  app.all(`/api/${route}`, (req, res) => mod.default(req, res));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
