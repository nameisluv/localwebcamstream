# Quick Reference Card - RTSP Internet Streaming

## 🚀 Quick Start (3 Steps)

1. **Start Stream**
   ```bash
   npm start
   ```

2. **Check Network Setup**
   ```bash
   npm run check-network
   ```

3. **Add Firewall Rule**
   ```bash
   npm run add-firewall-rule
   ```

## 📺 Your Stream URLs

**Local Network:**
```
rtsp://user1:BBE500bbe@<LOCAL_IP>:89/rtsp/streaming
```

**Internet (Public):**
```
rtsp://user1:BBE500bbe@97.76.64.150:89/rtsp/streaming?channel=03&subtype=1
```

**WebRTC Browser:**
```
http://localhost:8889/rtsp/streaming
```

## 🔧 Router Setup (Required for Internet)

### Port Forwarding Configuration:
| Setting | Value |
|---------|-------|
| External Port | 89 |
| Internal IP | Your PC's local IP |
| Internal Port | 89 |
| Protocol | TCP |

### Find Router Settings:
- **Netgear:** Advanced → Port Forwarding/Port Triggering
- **TP-Link:** Advanced → NAT Forwarding → Virtual Servers
- **Linksys:** Connectivity → Port Range Forwarding
- **ASUS:** WAN → Virtual Server/Port Forwarding
- **D-Link:** Advanced → Port Forwarding

## 🎬 Watch the Stream

### VLC Media Player
1. Media → Open Network Stream
2. Paste RTSP URL
3. Play

**Lower latency:**
- Tools → Preferences → Input/Codecs
- Network caching: 300ms

### Command Line
```bash
ffplay "rtsp://user1:BBE500bbe@97.76.64.150:89/rtsp/streaming?channel=03&subtype=1"
```

## 🔍 Troubleshooting

### Check Everything:
```bash
npm run check-network
```

### Common Issues:

**Can't connect from internet?**
- Verify port forwarding in router
- Check firewall rule exists
- Test on mobile data (not same WiFi)
- Verify public IP: https://api.ipify.org

**High latency?**
- Reduce VLC network caching to 300ms
- Check upload speed: https://fast.com
- Lower resolution in index.js

**Port 89 blocked by ISP?**
- Change to port 89 in mediamtx.yml
- Update port forwarding
- Restart stream

## 📊 Stream Specs

| Setting | Value |
|---------|-------|
| Codec | H.264 Baseline |
| Resolution | 1280x720 |
| FPS | 30 |
| Bitrate | 2000 kbps |
| Transport | TCP |
| Port | 89 |

## 🔐 Change Credentials

Edit `mediamtx/mediamtx.yml`:
```yaml
paths:
  "rtsp/streaming":
    publishUser: new_username
    publishPass: new_password
    readUser: new_username
    readPass: new_password
```

Then update URLs with new credentials.

## 📝 Useful Commands

```bash
# Start streaming
npm start

# Network diagnostics
npm run check-network

# Add firewall rule
npm run add-firewall-rule

# Check FFmpeg
ffmpeg -version

# List cameras
ffmpeg -list_devices true -f dshow -i dummy

# Record stream
ffmpeg -i "rtsp://user1:BBE500bbe@127.0.0.1:89/rtsp/streaming" -c copy recording.mp4

# Check if port is open
Test-NetConnection -ComputerName localhost -Port 89
```

## 🌐 Dynamic IP Solution

If your IP changes frequently:
1. Register at DDNS provider (No-IP, DuckDNS)
2. Get a hostname: `mystream.ddns.net`
3. Use hostname in URL instead of IP

## 🆘 Need Help?

1. Run: `npm run check-network`
2. Read: `SETUP_GUIDE.md`
3. Check: `README.md`

## ⚠️ Security Tips

- Change default credentials
- Use strong passwords
- Consider VPN for sensitive streams
- Monitor MediaMTX logs
- Don't expose to internet if not needed

---

**Ready to stream?** Just run `npm start` and follow the on-screen instructions! 🎥
