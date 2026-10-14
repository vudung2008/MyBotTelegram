const defaultEndpoint = "https://www.tikwm.com/api/";

function isTikTokUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "tiktok.com" || url.hostname.endsWith(".tiktok.com"))
    );
  } catch {
    return false;
  }
}

async function downloadTikTokVideo(
  sourceUrl,
  { fetchImpl = fetch, endpoint = process.env.TIKTOK_DOWNLOADER_URL || defaultEndpoint } = {},
) {
  if (!isTikTokUrl(sourceUrl)) {
    throw new Error("Link TikTok không hợp lệ.");
  }

  const requestUrl = new URL(endpoint);
  requestUrl.searchParams.set("url", sourceUrl);
  const response = await fetchImpl(requestUrl.toString());

  if (!response.ok) {
    throw new Error(`Downloader trả về HTTP ${response.status}.`);
  }

  const payload = await response.json();
  const videoUrl = payload?.data?.play;

  if (!videoUrl) {
    throw new Error("Không tìm thấy video nowatermark từ downloader.");
  }

  return { sourceUrl, videoUrl };
}

module.exports = { downloadTikTokVideo, isTikTokUrl };
