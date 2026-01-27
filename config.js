const dotenv = require('dotenv');
try { dotenv.config(); } catch (_) {}

const parseNumber = (v, def) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

module.exports = {
  RTSP_PORT: parseNumber(process.env.RTSP_PORT, 89),
  RTP_PORT: parseNumber(process.env.RTP_PORT, 8002),
  RTCP_PORT: parseNumber(process.env.RTCP_PORT, 8003),
  WEBRTC_PORT: parseNumber(process.env.WEBRTC_PORT, 8889),
  RTSP_USERNAME: process.env.RTSP_USERNAME || 'user1',
  RTSP_PASSWORD: process.env.RTSP_PASSWORD || 'BBE500bbe',
  PUBLIC_IP: process.env.PUBLIC_IP || null,
  FFMPEG_PATH: process.env.FFMPEG_PATH || '',
  LOG_VERBOSE: String(process.env.LOG_VERBOSE || '').toLowerCase() === 'true' || process.env.LOG_VERBOSE === '1'
};
