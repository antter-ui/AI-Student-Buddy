const http = require('http'), fs = require('fs'), path = require('path');
const PORT = 4173;
const MIME = { html: 'text/html', css: 'text/css', js: 'application/javascript', json: 'application/json', svg: 'image/svg+xml', ico: 'image/x-icon', pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg' };

http.createServer((req, res) => {
    const file = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(err.code === 'ENOENT' ? 404 : 500).end(); return; }
        const ext = path.extname(file).slice(1).toLowerCase();
        res.writeHead(200, { 'Content-Type': (MIME[ext] || 'application/octet-stream') + '; charset=utf-8' }).end(data);
    });
}).listen(PORT, () => console.log(`StudyMate AI Server: http://localhost:${PORT}`));
