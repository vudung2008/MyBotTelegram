const test = require("node:test");
const assert = require("node:assert/strict");
const {
  downloadTikTokVideo,
  isTikTokUrl,
} = require("../src/services/tiktokDownloader");

test("recognizes TikTok URLs", () => {
  assert.equal(isTikTokUrl("https://www.tiktok.com/@demo/video/123"), true);
  assert.equal(isTikTokUrl("https://vm.tiktok.com/abc"), true);
  assert.equal(isTikTokUrl("https://example.com/video/123"), false);
});

test("downloads the no-watermark video URL from the provider response", async () => {
  let requestedUrl;
  const fetchImpl = async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      json: async () => ({ data: { play: "https://cdn.example/video.mp4" } }),
    };
  };

  const result = await downloadTikTokVideo(
    "https://www.tiktok.com/@demo/video/123",
    { fetchImpl, endpoint: "https://downloader.example/api" },
  );

  assert.equal(
    requestedUrl,
    "https://downloader.example/api?url=https%3A%2F%2Fwww.tiktok.com%2F%40demo%2Fvideo%2F123",
  );
  assert.deepEqual(result, {
    sourceUrl: "https://www.tiktok.com/@demo/video/123",
    videoUrl: "https://cdn.example/video.mp4",
  });
});

test("rejects invalid links and provider responses without a video", async () => {
  await assert.rejects(
    () => downloadTikTokVideo("https://example.com/video/123", { fetchImpl: async () => ({}) }),
    /link TikTok không hợp lệ/i,
  );

  await assert.rejects(
    () =>
      downloadTikTokVideo("https://www.tiktok.com/@demo/video/123", {
        fetchImpl: async () => ({
          ok: true,
          json: async () => ({ data: {} }),
        }),
      }),
    /không tìm thấy video/i,
  );
});
