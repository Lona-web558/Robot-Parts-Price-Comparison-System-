const $ = s=>document.querySelector(s); let selected = null, chart = null; async function api(u, o = {}) {
    let r = await fetch(u, {
        headers: {
            'Content-Type': 'application/json'
        }, ...o
    }),
    b = await r.json().catch(()=>({})); if (!r.ok)throw Error(b.error || 'Request failed'); return b
}function money(n) {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency', currency: 'USD'
    }).format(n)}function esc(v) {
    return String(v??'').replace(/[&<>"']/g,c=>({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'}[c]))}function toast(m,t='primary'){let e = document.createElement('div'); e.className = `toast text-bg-${t}`; e.innerHTML = `<div class="d-flex"><div class="toast-body">${esc(m)}</div><button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`; $('#toast').append(e); new bootstrap.Toast(e, {
        delay: 3000
    }).show(); e.addEventListener('hidden.bs.toast', ()=>e.remove())}
        async function init(){let[s, c] = await Promise.all([api('/api/summary'), api('/api/categories')]); $('#sProducts').textContent = s.products; $('#sSuppliers').textContent = s.suppliers; $('#sCategories').textContent = s.categories; $('#sWatchlist').textContent = s.watchlist; $('#category').innerHTML = c.map(x => `<option>${esc(x)}</option>`).join(''); await loadProducts(); await loadWatchlist(); await loadAlerts()}async function loadProducts(){let q = encodeURIComponent($('#search').value), c = encodeURIComponent($('#category').value), sort = $('#sort').value, d = await api(`/api/products?q=${q}&category=${c}&sort=${sort}`); $('#productTable').innerHTML = d.map(p => `<tr class="${selected?.id === p.id?'compare-selected': ''}"><td><button class="btn btn-sm btn-outline-warning" onclick="toggleWatch('${p.id}')"><i class="bi bi-star"></i></button></td><td><div class="d-flex align-items-center gap-2"><div class="part-icon"><i class="bi bi-cpu"></i></div><div><strong>${esc(p.name)}</strong><br><small class="text-muted">${esc(p.sku)} · ${esc(p.brand)}</small></div></div></td><td><span class="badge text-bg-light">${esc(p.category)}</span></td><td class="price">${money(p.cheapest)}<br><small class="text-muted fw-normal">${esc(p.cheapestSupplier)}</small></td><td>${money(p.average)}</td><td>${p.supplierCount}</td><td><button class="btn btn-sm btn-primary" onclick="selectProduct('${p.id}')">Compare</button></td></tr>`).join('') || '<tr><td colspan="7" class="text-center py-4 text-muted">No parts found.</td></tr>'}async function selectProduct(id){selected = await api('/api/products/'+id); $('#selectedName').textContent = selected.name; $('#comparison').innerHTML = selected.prices.sort((a, b)=>a.price-b.price).map((p, i)=>`<tr class="${i === 0?'best': ''}"><td><strong>${esc(p.supplier.name)}</strong><br><small>${esc(p.supplier.country)}</small></td><td>⭐ ${p.supplier.rating}</td><td class="price">${money(p.price)} ${i === 0?'<span class="badge text-bg-success">BEST PRICE</span>': ''}</td><td class="${p.stock < 10?'stock-low': 'stock-good'}">${p.stock}</td><td>${esc(p.delivery)}</td><td class="fw-bold">${money(p.price+p.supplier.shipping)}</td></tr>`).join(''); let h = await api('/api/history/'+id); if (chart)chart.destroy(); chart = new Chart($('#priceChart'), {
            type: 'line', data: {
                labels: h.map(x => x.date.slice(5)), datasets: [{
                    label: 'Lowest price', data: h.map(x => x.price), tension: .35, fill: true
                }]}, options: {
                responsive: true, plugins: {
                    legend: {
                        display: false
                    }}, scales: {
                    y: {
                        beginAtZero: false
                    }}}})}async function toggleWatch(id){await api('/api/watchlist/'+id, {
            method: 'POST'
        }); await loadWatchlist(); await loadProducts()}async function loadWatchlist(){let d = await api('/api/watchlist'); $('#watchCount').textContent = d.length; $('#sWatchlist').textContent = d.length; $('#watchlist').innerHTML = d.map(p => `<div class="watch-item d-flex justify-content-between"><div><strong>${esc(p.name)}</strong><br><small>${esc(p.sku)}</small></div><div class="text-end"><div class="watch-price">${money(p.cheapest)}</div><button class="btn btn-sm btn-link p-0" onclick="selectProduct('${p.id}')">Compare</button></div></div>`).join('') || '<div class="text-muted text-center py-5">No watched parts yet.</div>'}async function loadAlerts(){let d = await api('/api/alerts'); $('#alerts').innerHTML = d.map(a => `<div class="alert-row d-flex justify-content-between align-items-center border-bottom py-2"><div><strong>${esc(a.message)}</strong><br><small class="text-muted">Target: ${money(a.target)}</small></div><button class="btn btn-sm btn-outline-danger" onclick="deleteAlert('${a.id}')"><i class="bi bi-trash"></i></button></div>`).join('') || '<div class="text-muted">No alerts.</div>'}async function deleteAlert(id){await api('/api/alerts/'+id, {
            method: 'DELETE'
        }); await loadAlerts(); toast('Alert removed', 'success')}$('#search').addEventListener('input',loadProducts);$('#category').addEventListener('change',loadProducts);$('#sort').addEventListener('change',loadProducts);$('#compareBtn').addEventListener('click',()=>selected?selectProduct(selected.id):toast('Select a part first','warning'));$('#addAlert').addEventListener('click',async()=>{if (!selected)return toast('Select a part first', 'warning'); let target = Number($('#targetPrice').value); if (!(target > 0))return toast('Enter a valid target price', 'warning'); await api('/api/alerts', {
            method: 'POST', body: JSON.stringify({
                productId: selected.id, target
            })}); $('#targetPrice').value = ''; await loadAlerts(); toast('Price alert created', 'success')});$('#scrapeForm').addEventListener('submit',async e=>{e.preventDefault(); let b = $('#scrapeResult'); b.className = 'scrape-box mt-3'; b.innerHTML = 'Analyzing page...'; try {
            let d = await api('/api/scrape', {
                method: 'POST', body: JSON.stringify({
                    url: $('#scrapeUrl').value
                })}); b.innerHTML = `<h6>${esc(d.title || 'Untitled')}</h6><p>${esc(d.description)}</p><strong>Headings</strong><ul>${d.headings.map(x => `<li>${esc(x)}</li>`).join('') || '<li>None</li>'}</ul><strong>Potential products</strong><ul>${d.detectedProducts.map(x => `<li>${esc(x)}</li>`).join('') || '<li>None detected</li>'}</ul>`
        }catch(x) {
            b.innerHTML = `<div class="alert alert-danger">${esc(x.message)}</div>`
        }});init().catch(e=>toast(e.message,'danger'));window.selectProduct=selectProduct;window.toggleWatch=toggleWatch;window.deleteAlert=deleteAlert;