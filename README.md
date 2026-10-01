# Robot Parts Price Comparison System

HTML5 + CSS3 + Bootstrap 5 + JavaScript + Node.js + Express.js project.

## Features
- Robot parts catalog with 8 sample products
- Multi-supplier price comparison
- Search, category filtering and sorting
- Stock and delivery comparison
- Shipping-inclusive total cost
- Watchlist
- 14-day price history chart
- Target-price alerts
- Public supplier-page HTML scraper with basic SSRF protection
- Responsive Bootstrap dashboard
- REST API

## Run
Node.js 18+ required.

```bash
npm install
npm start
```

Open http://localhost:3000

Development: `npm run dev`

## Production roadmap
Use PostgreSQL/MongoDB for persistence, supplier-specific API/scraper adapters, scheduled jobs, price history storage, authentication, rate limiting, robots.txt/terms compliance, and WebSockets for price alerts.
