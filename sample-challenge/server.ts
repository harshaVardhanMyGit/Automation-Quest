import * as http from 'http';
import { URL } from 'url';

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
}

let nextId = 3;
const items: InventoryItem[] = [
  { id: 1, name: 'Keyboard', category: 'Hardware', quantity: 12 },
  { id: 2, name: 'Notebook', category: 'Stationery', quantity: 25 },
];

function sendJson(response: http.ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}

function readBody(request: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON')); }
    });
    request.on('error', reject);
  });
}

function validateItem(body: Record<string, unknown>): string | null {
  if (typeof body.name !== 'string' || body.name.trim() === '') return 'name is required';
  if (typeof body.category !== 'string' || body.category.trim() === '') return 'category is required';
  if (typeof body.quantity !== 'number' || body.quantity <= 0) return 'quantity must be positive';
  return null;
}

function renderPage(): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Inventory Control</title>
<style>body{font-family:Arial,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem}form{display:grid;gap:.5rem;max-width:360px}input,button{font:inherit;padding:.5rem}li{margin:.4rem 0}.error{color:#a00}.success{color:#064}</style></head>
<body><main><h1>Inventory Control</h1><label for="search">Search inventory</label><input id="search" type="search" placeholder="Search by name"><ul id="inventory" aria-live="polite"></ul>
<h2>Add inventory item</h2><form id="item-form"><label>Name <input name="name" required></label><label>Category <input name="category" required></label><label>Quantity <input name="quantity" type="number" min="1" required></label><button type="submit">Add item</button><p id="message" role="status"></p></form></main>
<script>const list=document.querySelector('#inventory');const search=document.querySelector('#search');const message=document.querySelector('#message');
async function load(){const q=encodeURIComponent(search.value);const r=await fetch('/api/items?q='+q);const data=await r.json();list.innerHTML=data.map(i=>'<li data-item="'+i.id+'">'+i.name+' - '+i.category+' - '+i.quantity+'</li>').join('')||'<li>No items found</li>';}
search.addEventListener('input',load);document.querySelector('#item-form').addEventListener('submit',async(e)=>{e.preventDefault();const form=new FormData(e.target);const r=await fetch('/api/items',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:form.get('name'),category:form.get('category'),quantity:Number(form.get('quantity'))})});const data=await r.json();message.textContent=r.ok?'Item added':data.error;message.className=r.ok?'success':'error';if(r.ok){e.target.reset();load();}});load();</script></body></html>`;
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url || '/', 'http://localhost');
  if (requestUrl.pathname === '/' && request.method === 'GET') { response.writeHead(200, { 'Content-Type': 'text/html' }); response.end(renderPage()); return; }
  if (requestUrl.pathname === '/api/items' && request.method === 'GET') {
    const query = (requestUrl.searchParams.get('q') || '').toLowerCase();
    sendJson(response, 200, items.filter((item) => item.name.toLowerCase().includes(query)));
    return;
  }
  const match = requestUrl.pathname.match(/^\/api\/items\/(\d+)$/);
  try {
    if (requestUrl.pathname === '/api/items' && request.method === 'POST') {
      const body = await readBody(request); const error = validateItem(body);
      if (error) { sendJson(response, 400, { error }); return; }
      const item = { id: nextId++, name: body.name as string, category: body.category as string, quantity: body.quantity as number };
      items.push(item); sendJson(response, 201, item); return;
    }
    if (match && request.method === 'PUT') {
      const item = items.find((entry) => entry.id === Number(match[1])); if (!item) { sendJson(response, 404, { error: 'item not found' }); return; }
      const body = await readBody(request); const error = validateItem(body);
      if (error) { sendJson(response, 400, { error }); return; }
      Object.assign(item, { name: body.name, category: body.category, quantity: body.quantity }); sendJson(response, 200, item); return;
    }
    if (match && request.method === 'DELETE') {
      const index = items.findIndex((entry) => entry.id === Number(match[1])); if (index < 0) { sendJson(response, 404, { error: 'item not found' }); return; }
      const [deleted] = items.splice(index, 1); sendJson(response, 200, deleted); return;
    }
  } catch (error) { sendJson(response, 400, { error: error instanceof Error ? error.message : 'bad request' }); return; }
  sendJson(response, 404, { error: 'not found' });
});

server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () => console.log(`Sample challenge running on http://127.0.0.1:${process.env.PORT || 4173}`));