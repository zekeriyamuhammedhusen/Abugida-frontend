import ApiVideoClient from '@api.video/nodejs-client';
import { config } from 'dotenv';
import fs from 'fs';

config();

let client;

export function getApiVideoClient() {
  if (!client) {
    const apiKey = process.env.APIVIDEO_API_KEY || process.env.API_VIDEO_API_KEY;
    if (!apiKey) {
      throw new Error('api.video API key is not set. Please define APIVIDEO_API_KEY in your .env');
    }
    client = new ApiVideoClient({ apiKey });
  }
  return client;
}

export async function createAndUploadVideo({ filePath, title, isPublic = true }) {
  const api = getApiVideoClient();
  const created = await api.videos.create({ title: title || 'Lesson video', public: isPublic });
  // The SDK expects a local file path (string). Validate the file exists first.
  try {
    await fs.promises.access(filePath);
  } catch (err) {
    throw new Error(`Video file not found at path: ${filePath}`);
  }

  // Call the SDK with the (videoId, filePath) signature. The SDK will handle
  // creating its own read streams and chunking. Wrap to provide clearer errors
  // and optional progress wiring in the future.
  let uploaded;
  try {
    uploaded = await api.videos.upload(created.videoId, filePath);
  } catch (uErr) {
    // Normalize error for upstream logging
    const msg = uErr && uErr.message ? uErr.message : String(uErr);
    throw new Error(msg || 'api.video upload failed');
  }

  const assets = uploaded.assets || {};

  const extractUrl = (obj) => {
    if (!obj) return null;
    if (Array.isArray(obj) && obj.length > 0) {
      if (obj[0].url) return obj[0].url;
      if (obj[0].playbackUrl) return obj[0].playbackUrl;
    }
    if (typeof obj === 'object') {
      if (obj.url) return obj.url;
      if (obj.playbackUrl) return obj.playbackUrl;
    }
    if (typeof obj === 'string') return obj;
    return null;
  };

  const hlsUrl = extractUrl(assets.hls) || extractUrl(assets.hls?.manifest) || null;
  const mp4Url = extractUrl(assets.mp4) || null;

  try {
    console.log('api.video upload result', { videoId: uploaded.videoId, assets });
  } catch (e) {}

  return {
    videoId: uploaded.videoId,
    assets,
    hlsUrl,
    mp4Url,
    playbackUrl: hlsUrl || mp4Url || uploaded.playbackUrl || null,
    raw: uploaded,
  };
}

export async function getVideoStatus(videoId) {
  const api = getApiVideoClient();
  // Returns video object including ingest & encoding status
  const video = await api.videos.get(videoId);
  return video;
}

export async function deleteVideo(videoId) {
  const api = getApiVideoClient();
  await api.videos.delete(videoId);
}
