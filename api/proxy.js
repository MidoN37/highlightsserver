const axios = require('axios');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is missing' });
  }

  try {
    // If it's a video manifest or segment, use axios with proper headers
    if (url.endsWith('.m3u8') || url.endsWith('.ts')) {
      const responseType = url.endsWith('.ts') ? 'stream' : undefined;
      const response = await axios.get(url, {
        responseType: responseType,
        headers: {
          'Origin': 'https://hoofootay4.spotlightmoment.com',
          'Referer': 'https://hoofootay4.spotlightmoment.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
        }
      });
      
      // If it's an m3u8 file, rewrite its content
      if (url.endsWith('.m3u8')) {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        
        let m3u8Content = response.data;
        
        // Rewrite relative URLs in the m3u8 to go through our proxy
        m3u8Content = m3u8Content.replace(/^(?!#)(.+)$/gm, (match) => {
          const trimmedMatch = match.trim();
          if (!trimmedMatch) return match;
          
          if (trimmedMatch.startsWith('http')) {
            return `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/proxy?url=${encodeURIComponent(trimmedMatch)}`;
          } else {
            const fullUrl = new URL(trimmedMatch, url).href;
            return `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/proxy?url=${encodeURIComponent(fullUrl)}`;
          }
        });
        
        res.send(m3u8Content);
      } else {
        // For .ts files, just stream them
        response.data.pipe(res);
      }
      return;
    }

    // For HTML pages, use axios with enhanced headers to bypass CORS
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      timeout: 30000
    });
    
    res.setHeader('Content-Type', 'text/html');
    res.send(response.data);
    
  } catch (error) {
    console.error('Proxy error:', error.message);
    
    // If it's a CORS or access issue, try with different approach
    if (error.response && (error.response.status === 403 || error.response.status === 429)) {
      try {
        // Try with a different user agent and additional headers
        const retryResponse = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1'
          },
          timeout: 30000
        });
        
        res.setHeader('Content-Type', 'text/html');
        res.send(retryResponse.data);
        return;
      } catch (retryError) {
        console.error('Retry failed:', retryError.message);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch content',
      details: error.message,
      status: error.response?.status
    });
  }
}; 