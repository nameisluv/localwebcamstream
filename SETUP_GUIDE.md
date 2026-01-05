# Internet RTSP Streaming Setup Guide

## Overview
This guide will help you set up your local webcam to stream via RTSP over the internet, accessible from anywhere in the world.

## Your Stream Details

**Format:** H.264 (Maximum compatibility)  
**Resolution:** 1280x720 @ 30fps  
**Protocol:** RTSP over TCP  
**Port:** 89

### Stream URLs

**Local Network Access:**
```
rtsp://user1:BBE500bbe@<YOUR_LOCAL_IP>:89/rtsp/streaming
```

**Internet Access:**
```
rtsp://user1:BBE500bbe@97.76.64.150:89/rtsp/streaming?channel=03&subtype=1
```

---

## 🚀 Quick Start

### 1. Start the Stream
```bash
npm start
```

### 2. Check Your Network Configuration
```bash
npm run check-network
```
This will show you:
- Your local and public IP addresses
- Port status
- Firewall configuration
- Detailed setup instructions

---

## 🔧 Complete Setup for Internet Access

### Step 1: Configure Windows Firewall

**Option A: Automatic (Recommended)**
```bash
npm run add-firewall-rule
```

**Option B: Manual**
1. Open PowerShell as Administrator
2. Run this command:
```powershell
New-NetFirewallRule -DisplayName "RTSP Server Port 89" -Direction Inbound -Protocol TCP -LocalPort 89 -Action Allow
```

### Step 2: Configure Router Port Forwarding

#### Find Your Router's IP
Usually one of these: `192.168.1.1`, `192.168.0.1`, or `10.0.0.1`

#### Access Router Admin Panel
1. Open a web browser
2. Enter your router's IP address
3. Login with admin credentials

#### Add Port Forwarding Rule

**Settings to configure:**
- **Service Name:** RTSP Server
- **External Port:** 89
- **Internal IP:** Your computer's local IP (shown by `npm run check-network`)
- **Internal Port:** 89
- **Protocol:** TCP (or TCP/UDP)
- **Status:** Enabled

**Additional Ports (Optional but recommended):**
- Port 8002 (UDP) - RTP data
- Port 8003 (UDP) - RTCP control

#### Common Router Interfaces

**Netgear:**
`Advanced` → `Port Forwarding/Port Triggering`

**TP-Link:**
`Advanced` → `NAT Forwarding` → `Virtual Servers`

**Linksys:**
`Connectivity` → `Port Range Forwarding`

**ASUS:**
`WAN` → `Virtual Server/Port Forwarding`

**D-Link:**
`Advanced` → `Port Forwarding`

### Step 3: Verify Your Public IP

The stream will be accessible at your public IP address. Check it:
```bash
npm run check-network
```

Or visit: https://api.ipify.org

⚠️ **Important:** If you have a dynamic IP (changes periodically), consider using a Dynamic DNS (DDNS) service.

---

## 📱 Testing Your Stream

### Test Locally First

1. Start the stream: `npm start`
2. Open VLC Media Player
3. Go to `Media` → `Open Network Stream`
4. Enter the LOCAL URL (shown when stream starts)
5. Click Play

### Test Over Internet

**From outside your network (use mobile data or a different network):**

1. Open VLC Media Player
2. Go to `Media` → `Open Network Stream`
3. Enter:
   ```
   rtsp://user1:BBE500bbe@97.76.64.150:89/rtsp/streaming?channel=03&subtype=1
   ```
4. Click Play

### VLC Optimization Settings (Optional)

For lower latency in VLC:
1. Go to `Tools` → `Preferences` → `Show All` (bottom left)
2. Navigate to `Input / Codecs`
3. Set `Network caching` to `300ms` (default is 1000ms)
4. Click `Save` and restart VLC

---

## 🌐 Dynamic DNS Setup (Optional)

If your ISP assigns you a dynamic IP address, set up DDNS to access your stream using a hostname instead of an IP.

### Recommended Free DDNS Services:
- **No-IP** (noip.com)
- **DuckDNS** (duckdns.org)
- **Dynu** (dynu.com)

### Setup Steps:
1. Register for a free DDNS account
2. Create a hostname (e.g., `mystream.ddns.net`)
3. Install the DDNS client on your computer or configure it in your router
4. Use the hostname instead of IP in your RTSP URL:
   ```
   rtsp://user1:BBE500bbe@mystream.ddns.net:89/rtsp/streaming?channel=03&subtype=1
   ```

---

## 🔒 Security Considerations

### Current Setup
- Username: `user1`
- Password: `BBE500bbe`
- These credentials are visible in the URL

### Recommendations:
1. **Change Default Credentials:** Modify username/password in `mediamtx.yml`
2. **Use Non-Standard Port:** Consider using a port other than 89 (e.g., 89)
3. **Enable SSL/TLS:** For encrypted connections (requires additional setup)
4. **VPN Alternative:** Set up a VPN server and stream only over VPN
5. **IP Whitelist:** Configure router to only allow connections from specific IPs

### To Change Credentials:
1. Edit `mediamtx/mediamtx.yml`
2. Update the `publishUser`, `publishPass`, `readUser`, `readPass` values
3. Restart the stream

---

## 🛠️ Troubleshooting

### Stream Not Accessible Locally

**Check if MediaMTX is running:**
```bash
npm run check-network
```
Port 89 should show as OPEN.

**Restart the stream:**
```bash
# Stop current stream (Ctrl+C)
npm start
```

### Stream Not Accessible Over Internet

**Verify port forwarding:**
1. Check router configuration
2. Use an online port checker: https://www.yougetsignal.com/tools/open-ports/
3. Enter port 89 and your public IP

**Check firewall:**
```bash
npm run check-network
```
Windows Firewall should show port 89 as ALLOWED.

**ISP Blocking:**
Some ISPs block certain ports. If port 89 doesn't work, try:
1. Change MediaMTX port to 89 (edit `mediamtx/mediamtx.yml`)
2. Update port forwarding rule
3. Restart the stream

### High Latency / Lag

**Reduce buffering in VLC:**
- Set network caching to 300ms (see VLC Optimization above)

**Check network bandwidth:**
- Stream uses ~2 Mbps
- Ensure adequate upload speed: https://fast.com

**Optimize stream settings:**
Edit `index.js` and modify these values:
```javascript
await streamManager.startStreaming(selectedCamera, rtspUrl, {
    width: 640,     // Lower resolution
    height: 480,    // Lower resolution
    fps: 15         // Lower framerate
});
```

### Connection Drops

**Use TCP transport (already configured):**
The stream uses TCP which is more reliable than UDP.

**Check router stability:**
Some routers drop connections after inactivity. Enable "keep-alive" if available.

---

## 📊 Stream Specifications

| Setting | Value |
|---------|-------|
| Video Codec | H.264 (libx264) |
| Profile | Baseline |
| Level | 3.0 |
| Resolution | 1280x720 |
| Framerate | 30 fps |
| Bitrate | 2000 kbps |
| Transport | TCP |
| Port | 89 |

---

## 🎯 Use Cases

### Viewing Options:
1. **VLC Media Player** (Desktop/Mobile)
2. **ffplay** (Command line): `ffplay "rtsp://user1:BBE500bbe@97.76.64.150:89/rtsp/streaming?channel=03&subtype=1"`
3. **Web Browser** (via WebRTC): `http://localhost:8889/rtsp/streaming`
4. **Security Camera Apps** that support RTSP
5. **Custom Applications** using RTSP client libraries

---

## 📞 Support

If you encounter issues:
1. Run diagnostic tool: `npm run check-network`
2. Check logs in the terminal where the stream is running
3. Review firewall and router settings
4. Test on local network first before testing over internet

---

## 🔄 Keeping Stream Running 24/7

### Windows Options:

**Option 1: Task Scheduler**
1. Open Task Scheduler
2. Create Basic Task → Trigger: At startup
3. Action: Start a program
4. Program: `node`
5. Arguments: `d:\Work\Bay Buisness Edge\localwebcamstream\index.js`

**Option 2: PM2 (Process Manager)**
```bash
npm install -g pm2
pm2 start index.js --name "rtsp-stream"
pm2 startup
pm2 save
```

**Option 3: NSSM (Non-Sucking Service Manager)**
Download from: https://nssm.cc/
```bash
nssm install RTSPStream "C:\Program Files\nodejs\node.exe" "d:\Work\Bay Buisness Edge\localwebcamstream\index.js"
nssm start RTSPStream
```

---

## 📝 Quick Reference Commands

```bash
# Start streaming
npm start

# Check network configuration
npm run check-network

# Add Windows Firewall rule
npm run add-firewall-rule

# Test FFmpeg installation
ffmpeg -version

# List available cameras
ffmpeg -list_devices true -f dshow -i dummy
```

---

## 🌟 Advanced: Multiple Cameras

To stream multiple cameras simultaneously:

1. Modify `mediamtx.yml` to add more paths:
```yaml
paths:
  "camera1":
    publishUser: user1
    publishPass: BBE500bbe
  "camera2":
    publishUser: user1
    publishPass: BBE500bbe
```

2. Run multiple instances with different stream names
3. Access via:
   - `rtsp://user1:BBE500bbe@97.76.64.150:89/camera1`
   - `rtsp://user1:BBE500bbe@97.76.64.150:89/camera2`

---

## 📄 License

MIT License - Feel free to modify and distribute.
