const apiKey = process.env.RAPIDAPI_KEY || '6c2ae2610fmsh4076791fdb9808dp11da08jsna4a470d9b3d5';

async function fetchInfo() {
  console.log("Fetching...");
  try {
    const response = await fetch(`https://tiktok-api23.p.rapidapi.com/api/user/info?uniqueId=charlidamelio`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
      }
    });
    const data = await response.json();
    const secUid = data.userInfo?.user?.secUid;

    if (secUid) {
      const postsRes = await fetch(`https://tiktok-api23.p.rapidapi.com/api/user/posts?secUid=${secUid}&count=5`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
        }
      });
      const postsData = await postsRes.json();
      const list = postsData.itemList || postsData.data?.itemList;
      if (list && list.length > 0) {
         console.log("Video Object:");
         console.log(list[0].video);
         console.log("Stats:");
         console.log(list[0].statsV2 || list[0].stats);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
fetchInfo();
