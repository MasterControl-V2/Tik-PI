// TikTok API Worker - Copy this entire code
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // Only handle /tik/dl endpoint
    if (url.pathname !== '/tik/dl') {
      return new Response('TikTok API is running', { status: 200 });
    }
    
    const tiktokUrl = url.searchParams.get('url');
    
    if (!tiktokUrl) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing url parameter" 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      // Call tikdownloader.io API
      const formData = new URLSearchParams();
      formData.append('q', tiktokUrl);
      formData.append('lang', 'en');
      
      const response = await fetch('https://tikdownloader.io/api/ajaxSearch', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error('API returned error');
      }
      
      // Extract video URL from HTML
      const html = data.data;
      const match = html.match(/href="(https:\/\/dl\.snapcdn\.app\/get\?token=[^"]+)"/);
      
      if (!match) {
        throw new Error('No video URL found');
      }
      
      // Return your API format (matches tik.py)
      return new Response(JSON.stringify({
        success: true,
        links: [
          {
            url: match[1],
            filename: 'tiktok_video.mp4'
          }
        ]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
