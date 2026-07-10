import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  app.use(express.json());

  const STV_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Referer': 'https://sangtacviet.com/',
    'Accept': 'application/json, text/plain, */*'
  };

  // API Proxy: Fetch Chapter List
  app.get('/api/stv/chapters', async (req, res): Promise<any> => {
    const { bookId } = req.query;
    if (!bookId) {
      return res.status(400).json({ success: false, error: 'Missing bookId parameter' });
    }

    const apiUrl = `https://sangtacviet.com/index.php?ngmar=chapterlist&h=fanqie&bookid=${bookId}&sajax=getchapterlist`;
    console.log(`[Proxy] Fetching chapter list for bookId: ${bookId}`);

    try {
      const response = await fetch(apiUrl, { headers: STV_HEADERS });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return res.json({ success: true, data });
    } catch (error: any) {
      console.error('[Proxy Error] Chapter list fetch failed:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch chapter list' });
    }
  });

  // API Proxy: Fetch Chapter Content
  app.get('/api/stv/content', async (req, res): Promise<any> => {
    const { bookId, chapterId } = req.query;
    if (!bookId || !chapterId) {
      return res.status(400).json({ success: false, error: 'Missing bookId or chapterId parameter' });
    }

    const apiUrl = `https://sangtacviet.com/index.php?bookid=${bookId}&h=fanqie&c=${chapterId}&ngmar=readc&sajax=readchapter&sty=1&exts=`;
    console.log(`[Proxy] Fetching content for bookId: ${bookId}, chapterId: ${chapterId}`);

    try {
      const response = await fetch(apiUrl, { headers: STV_HEADERS });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return res.json({ success: true, data });
    } catch (error: any) {
      console.error('[Proxy Error] Chapter content fetch failed:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch chapter content' });
    }
  });

  const isProd = process.env.NODE_ENV === 'production' || fs.existsSync(path.resolve(__dirname, 'dist'));

  if (!isProd) {
    // In development: use Vite Dev Server as middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // In production: serve built files from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

createServer();
