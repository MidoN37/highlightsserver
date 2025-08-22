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

  try {
    // Simple fetch with basic headers
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      },
      timeout: 30000
    });
    
    console.log('Success! Status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);
    console.log('Content length:', response.data?.length || 'unknown');
    
    // Set appropriate content type
    if (url.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (url.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/mp2t');
    } else {
      res.setHeader('Content-Type', 'text/html');
    }
    
    res.send(response.data);
    
  } catch (error) {
    console.error('=== ERROR DETAILS ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response status text:', error.response.statusText);
      console.error('Response headers:', error.response.headers);
      console.error('Response data preview:', String(error.response.data).substring(0, 200));
    } else if (error.request) {
      console.error('Request was made but no response received');
      console.error('Request details:', error.request);
    }
    
    res.status(500).json({ 
      error: 'Proxy failed',
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: url
    });
  }
  
  console.log('=== PROXY FUNCTION END ===');
}; 
