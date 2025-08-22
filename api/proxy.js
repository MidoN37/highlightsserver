const axios = require('axios');

module.exports = async (req, res) => {
  console.log('=== PROXY FUNCTION START ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Query:', req.query);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  const { url } = req.query;
  
  if (!url) {
    console.log('No URL provided');
    return res.status(400).json({ error: 'URL parameter is missing' });
  }

  console.log('Target URL to fetch:', url);

  // Multiple header strategies to bypass Cloudflare
  const headerStrategies = [
    {
      name: 'Chrome Desktop',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      }
    },
    {
      name: 'Firefox Desktop',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
      }
    },
    {
      name: 'Safari Mobile',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      }
    }
  ];

  let lastError;
  
  for (let i = 0; i < headerStrategies.length; i++) {
    const strategy = headerStrategies[i];
    console.log(`Trying strategy ${i + 1}: ${strategy.name}`);
    
    try {
      const response = await axios.get(url, {
        headers: strategy.headers,
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: function (status) {
          return status < 500; // Accept all status codes below 500
        }
      });
      
      console.log(`Strategy ${i + 1} succeeded! Status:`, response.status);
      console.log('Content-Type:', response.headers['content-type']);
      console.log('Content length:', response.data?.length || 'unknown');
      
      // Check if we got a Cloudflare challenge page
      if (response.data && typeof response.data === 'string' && response.data.includes('Just a moment')) {
        console.log('Got Cloudflare challenge page, trying next strategy...');
        lastError = new Error('Cloudflare challenge page received');
        continue;
      }
      
      // Set appropriate content type
      if (url.endsWith('.m3u8')) {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      } else if (url.endsWith('.ts')) {
        res.setHeader('Content-Type', 'video/mp2t');
      } else {
        res.setHeader('Content-Type', 'text/html');
      }
      
      res.send(response.data);
      return;
      
    } catch (error) {
      console.log(`Strategy ${i + 1} failed:`, error.message);
      lastError = error;
      
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response status text:', error.response.statusText);
      }
    }
  }
  
  // If all strategies failed
  console.error('=== ALL STRATEGIES FAILED ===');
  console.error('Final error:', lastError?.message);
  
  if (lastError?.response) {
    console.error('Final response status:', lastError.response.status);
    console.error('Final response data preview:', String(lastError.response.data).substring(0, 300));
  }
  
  res.status(500).json({ 
    error: 'All proxy strategies failed',
    message: lastError?.message || 'Unknown error',
    status: lastError?.response?.status,
    url: url,
    note: 'Website may be protected by Cloudflare anti-bot measures'
  });
  
  console.log('=== PROXY FUNCTION END ===');
}; 
