import fetch from 'node-fetch';

async function test() {
  const rapidApiKey = '6c2ae2610fmsh4076791fdb9808dp11da08jsna4a470d9b3d5';
  const username = 'charlidamelio';
  
  const urls = [
    `https://tiktok-api23.p.rapidapi.com/api/user/info?uniqueId=${username}`,
    `https://tiktok-api23.p.rapidapi.com/api/user/info?unique_id=${username}`,
    `https://tiktok-api23.p.rapidapi.com/api/user/info?username=${username}`,
  ];
  
  for (const url of urls) {
      console.log('Testing', url);
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
        }
      });
      
      console.log('Status:', res.status);
      if (res.status === 200) {
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
      } else {
        const text = await res.text();
        console.log('Body:', text.substring(0, 300));
      }
      break; // Only run the first working one
  }
}

test();
