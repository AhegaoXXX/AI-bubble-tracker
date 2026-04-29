module.exports = async function handler(req, res) {
  const upstreamPath = req.url.replace(/^\/api\/yahoo/, '');
  const target = `https://query1.finance.yahoo.com${upstreamPath}`;

  try {
    const upstream = await fetch(target, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const body = await upstream.text();
    const contentType = upstream.headers.get('content-type') || 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(upstream.status).send(body);
  } catch (err) {
    res.status(502).json({
      error: 'Upstream fetch failed',
      message: err && err.message ? err.message : String(err),
    });
  }
};
