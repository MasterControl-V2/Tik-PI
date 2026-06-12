// TikTok Worker - FULL VERSION (with metadata)
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error('API returned error');
      }
      
      const html = data.data;
      
      // Extract video URL
      const videoMatch = html.match(/href="(https:\/\/dl\.snapcdn\.app\/get\?token=[^"]+)"/);
      
      if (!videoMatch) {
        throw new Error('No video URL found');
      }
      
      // ✅ Extract AUTHOR (username)
      let author = "Unknown";
      const authorMatch = html.match(/<a[^>]*class="[^"]*username[^"]*"[^>]*>([^<]+)<\/a>/i);
      if (authorMatch) {
        author = authorMatch[1].trim();
      }
      
      // ✅ Extract CAPTION/DESCRIPTION
      let caption = "";
      const captionMatch = html.match(/<div[^>]*class="[^"]*text[^"]*"[^>]*>(.*?)<\/div>/i);
      if (captionMatch) {
        caption = captionMatch[1].replace(/<[^>]*>/g, '').trim();
        if (caption.length > 200) caption = caption.substring(0, 197) + "...";
      }
      
      // ✅ Extract STATS (views, likes, comments, shares)
      let views = "0";
      let likes = "0";
      let comments = "0";
      let shares = "0";
      
      const statsMatch = html.match(/<strong[^>]*>([\d,.KMB]+)<\/strong>\s*(views|likes|comments|shares)/gi);
      if (statsMatch) {
        for (const stat of statsMatch) {
          if (stat.toLowerCase().includes('view')) views = stat.replace(/<[^>]*>/g, '').match(/[\d,.KMB]+/)?.[0] || "0";
          if (stat.toLowerCase().includes('like')) likes = stat.replace(/<[^>]*>/g, '').match(/[\d,.KMB]+/)?.[0] || "0";
          if (stat.toLowerCase().includes('comment')) comments = stat.replace(/<[^>]*>/g, '').match(/[\d,.KMB]+/)?.[0] || "0";
          if (stat.toLowerCase().includes('share')) shares = stat.replace(/<[^>]*>/g, '').match(/[\d,.KMB]+/)?.[0] || "0";
        }
      }
      
      // ✅ Extract video duration
      let duration = "0:00";
      const durationMatch = html.match(/(\d{1,2}:\d{2})/);
      if (durationMatch) duration = durationMatch[1];
      
      // ✅ Extract thumbnail
      let thumbnail = "";
      const thumbMatch = html.match(/src="(https:\/\/[^"]+\.jpg)"/i);
      if (thumbMatch) thumbnail = thumbMatch[1];
      
      // ✅ Extract music/sound info
      let music = "";
      const musicMatch = html.match(/<div[^>]*class="[^"]*music[^"]*"[^>]*>(.*?)<\/div>/i);
      if (musicMatch) {
        music = musicMatch[1].replace(/<[^>]*>/g, '').trim();
      }
      
      return new Response(JSON.stringify({
        success: true,
        video_url: videoMatch[1],
        author: author,
        caption: caption,
        stats: {
          views: views,
          likes: likes,
          comments: comments,
          shares: shares
        },
        duration: duration,
        thumbnail: thumbnail,
        music: music,
        links: [
          {
            url: videoMatch[1],
            filename: `${author}_tiktok_video.mp4`
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
