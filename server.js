const express = require('express'), path = require('path'), dns = require('dns').promises, net = require('net');
const app = express(), PORT = process.env.PORT || 3000; app.use(express.json({
    limit: '100kb'
})); app.use(express.static(path.join(__dirname)));
const suppliers = [{
    id: 'SP-01',
    name: 'RoboParts Direct',
    country: 'USA',
    rating: 4.8,
    shipping: 12.99
}, {
    id: 'SP-02',
    name: 'MechaSupply',
    country: 'Germany',
    rating: 4.6,
    shipping: 18.5
}, {
    id: 'SP-03',
    name: 'Bot Components',
    country: 'UK',
    rating: 4.7,
    shipping: 15
}, {
    id: 'SP-04',
    name: 'Automation Hub',
    country: 'South Africa',
    rating: 4.5,
    shipping: 9.99
}, {
    id: 'SP-05',
    name: 'Servo World',
    country: 'Japan',
    rating: 4.9,
    shipping: 22
}];
const products = [{
    id: 'P-1001',
    sku: 'MTR-42',
    name: '42mm NEMA 17 Stepper Motor',
    category: 'Motors',
    brand: 'MotionPro',
    specs: '1.8° / 1.5A / 45N·cm',
    prices: [['SP-01',
        18.9,
        42,
        '2-4 days'],
        ['SP-02',
            21.4,
            17,
            '4-7 days'],
        ['SP-03',
            19.75,
            23,
            '3-5 days'],
        ['SP-04',
            20.1,
            9,
            '2-5 days']]},
    {
        id: 'P-1002',
        sku: 'SRV-20',
        name: '20kg Digital Metal Gear Servo',
        category: 'Servos',
        brand: 'ServoMax',
        specs: '180° / 6.0V / 20kg·cm',
        prices: [['SP-01',
            29.99,
            31,
            '2-4 days'],
            ['SP-02',
                27.5,
                8,
                '4-7 days'],
            ['SP-03',
                32.2,
                14,
                '3-5 days'],
            ['SP-05',
                25.9,
                6,
                '5-9 days']]},
    {
        id: 'P-1003',
        sku: 'LID-360',
        name: '360° LiDAR Distance Sensor',
        category: 'Sensors',
        brand: 'RoboSense',
        specs: '360° / 12m / USB-C',
        prices: [['SP-01',
            119,
            11,
            '2-4 days'],
            ['SP-02',
                109.95,
                4,
                '5-8 days'],
            ['SP-04',
                125,
                13,
                '2-5 days'],
            ['SP-05',
                115.4,
                7,
                '5-9 days']]},
    {
        id: 'P-1004',
        sku: 'MCU-ESP',
        name: 'ESP32 Robotics Controller Board',
        category: 'Controllers',
        brand: 'DevBot',
        specs: 'Wi-Fi / BLE / 240MHz / 34 GPIO',
        prices: [['SP-01',
            9.8,
            86,
            '2-4 days'],
            ['SP-02',
                11.2,
                33,
                '4-7 days'],
            ['SP-03',
                8.95,
                49,
                '3-5 days'],
            ['SP-04',
                10.5,
                21,
                '2-5 days']]},
    {
        id: 'P-1005',
        sku: 'DRV-4988',
        name: 'Stepper Motor Driver Module',
        category: 'Controllers',
        brand: 'DriveTech',
        specs: '35V / 2A / 1-16 microstep',
        prices: [['SP-01',
            6.75,
            120,
            '2-4 days'],
            ['SP-02',
                7.4,
                61,
                '4-7 days'],
            ['SP-03',
                6.2,
                72,
                '3-5 days'],
            ['SP-04',
                5.99,
                45,
                '2-5 days']]},
    {
        id: 'P-1006',
        sku: 'BAT-12V',
        name: '12V 5000mAh Li-Ion Robot Battery',
        category: 'Power',
        brand: 'PowerCell',
        specs: '12V / 5Ah / 10A continuous',
        prices: [['SP-01',
            39.9,
            16,
            '2-4 days'],
            ['SP-02',
                42.8,
                12,
                '5-8 days'],
            ['SP-04',
                36.5,
                19,
                '2-5 days'],
            ['SP-05',
                44.1,
                8,
                '6-10 days']]},
    {
        id: 'P-1007',
        sku: 'CAM-AI',
        name: 'AI Vision Camera Module',
        category: 'Sensors',
        brand: 'VisionBot',
        specs: '1080p / 120° / USB / AI-ready',
        prices: [['SP-01',
            49.99,
            18,
            '2-4 days'],
            ['SP-02',
                55,
                9,
                '4-7 days'],
            ['SP-03',
                46.8,
                12,
                '3-5 days'],
            ['SP-04',
                51.9,
                6,
                '2-5 days']]},
    {
        id: 'P-1008',
        sku: 'WHL-65',
        name: '65mm Robot Wheel Pair',
        category: 'Mechanical',
        brand: 'RoboDrive',
        specs: '65mm / 12mm shaft / rubber',
        prices: [['SP-01',
            14.5,
            55,
            '2-4 days'],
            ['SP-02',
                13.2,
                30,
                '4-7 days'],
            ['SP-03',
                15.1,
                25,
                '3-5 days'],
            ['SP-04',
                11.99,
                18,
                '2-5 days']]}];
const history = {}; products.forEach(p => {
    let b = Math.min(...p.prices.map(x => x[1])); history[p.id] = Array.from({
        length: 14
    }, (_, i)=>({
            date: new Date(Date.now()-(13-i)*86400000).toISOString().slice(0, 10), price: +(b*(.94+((i*7)%11)/100)).toFixed(2)}))});
let watchlist = ['P-1001', 'P-1003'], alerts = [{
    id: 1,
    product: 'P-1002',
    target: 26,
    message: '20kg Digital Metal Gear Servo target price'
}, {
    id: 2,
    product: 'P-1006',
    target: 35,
    message: '12V 5000mAh battery target price'
}];
const enrich = p=> {
    let rows = p.prices.map(x => ({
        supplier: suppliers.find(s => s.id === x[0]), price: x[1], stock: x[2], delivery: x[3]})),
    min = Math.min(...rows.map(x => x.price)); return {
        ...p,
        prices: undefined,
        cheapest: min,
        cheapestSupplier: rows.find(x => x.price === min).supplier.name,
        supplierCount: rows.length,
        average: +(rows.reduce((a, x)=>a+x.price, 0)/rows.length).toFixed(2)}};
app.get('/api/products', (q, r)=> {
    let term = (q.query.q || '').toLowerCase(), cat = q.query.category || 'All', sort = q.query.sort || 'price', a = products.filter(p => (!term || `${p.name} ${p.sku} ${p.brand} ${p.specs}`.toLowerCase().includes(term)) && (cat === 'All' || p.category === cat)).map(enrich); a.sort((x, y)=>sort === 'name'?x.name.localeCompare(y.name): sort === 'suppliers'?y.supplierCount-x.supplierCount: x.cheapest-y.cheapest); r.json(a)});
app.get('/api/products/:id', (q, r)=> {
    let p = products.find(x => x.id === q.params.id); if (!p)return r.status(404).json({
        error: 'Product not found'
    }); r.json({
        ...p, prices: p.prices.map(x => ({
            supplier: suppliers.find(s => s.id === x[0]), price: x[1], stock: x[2], delivery: x[3]})), ...enrich(p)})});
app.get('/api/categories', (q, r)=>r.json(['All', ...new Set(products.map(p => p.category))])); app.get('/api/suppliers', (q, r)=>r.json(suppliers));
app.get('/api/watchlist', (q, r)=>r.json(watchlist.map(id => enrich(products.find(p => p.id === id))).filter(Boolean)));
app.post('/api/watchlist/:id', (q, r)=> {
    if (!products.some(p => p.id === q.params.id))return r.status(404).json({
        error: 'Product not found'
    }); watchlist = watchlist.includes(q.params.id)?watchlist.filter(x => x !== q.params.id): [...watchlist,
        q.params.id]; r.json({
            watchlist
        })});
app.get('/api/history/:id', (q, r)=>history[q.params.id]?r.json(history[q.params.id]): r.status(404).json({
    error: 'Product not found'
})); app.get('/api/alerts', (q, r)=>r.json(alerts));
app.post('/api/alerts', (q, r)=> {
    let {
        productId,
        target
    } = q.body; if (!products.some(p => p.id === productId)||!Number.isFinite(Number(target)))return r.status(400).json({
            error: 'Valid product and target price required'
        }); let p = products.find(x => x.id === productId),
    a = {
        id: Date.now(),
        product: productId,
        target: Number(target),
        message: `${p.name} price target`
    }; alerts.push(a); r.status(201).json(a)}); app.delete('/api/alerts/:id', (q, r)=> {
    alerts = alerts.filter(a => String(a.id) !== q.params.id); r.status(204).end()});
app.get('/api/summary', (q, r)=> {
    let e = products.map(enrich); r.json({
        products: products.length, suppliers: suppliers.length, categories: new Set(products.map(p => p.category)).size, watchlist: watchlist.length, lowestPrice: Math.min(...e.map(p => p.cheapest)), alerts: alerts.length
    })});
function privateIp(ip) {
    if (net.isIPv4(ip)) {
        let p = ip.split('.').map(Number); return p[0] === 10 || p[0] === 127 || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) || (p[0] === 169 && p[1] === 254)}return ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')}
async function safeUrl(raw) {
    let u = new URL(raw); if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password)throw Error('Only public HTTP(S) URLs are allowed'); let ips = await dns.lookup(u.hostname, {
        all: true
    }); if (!ips.length || ips.some(x => privateIp(x.address)))throw Error('Private/local network targets are blocked'); return u
}
app.post('/api/scrape', async(q, r)=> {
    try {
        let u = await safeUrl(q.body.url), c = new AbortController(), t = setTimeout(()=>c.abort(), 8000), x = await fetch(u, {
            signal: c.signal, headers: {
                'User-Agent': 'RobotPartsPriceComparator/1.0'
            }}); clearTimeout(t); if (!x.ok)throw Error(`Remote server returned ${x.status}`); if (!(x.headers.get('content-type') || '').includes('text/html'))throw Error('Target is not HTML'); let h = await x.text(); if (h.length > 2000000)throw Error('Page exceeds 2 MB limit'); let $ = require('cheerio').load(h),
        items = []; $('article,.product,.product-card,[class*=product]').each((_, el)=> {
            if (items.length < 20) {
                let s = $(el).text().replace(/\s+/g, ' ').trim(); if (s)items.push(s.slice(0, 250))}}); r.json({
            url: u.href,
            title: $('title').text().trim(),
            description: $('meta[name=description]').attr('content') || '',
            headings: $('h1,h2,h3').map((_, e)=>$(e).text().trim()).get().filter(Boolean).slice(0, 20),
            detectedProducts: items
        })}catch(e) {
        r.status(400).json({
            error: e.name === 'AbortError'?'Scrape timed out': e.message
        })}});
app.get('*', (q, r)=>r.sendFile(path.join(__dirname, 'index.html'))); app.listen(PORT, ()=>console.log(`RoboCompare: http://localhost:${PORT}`));