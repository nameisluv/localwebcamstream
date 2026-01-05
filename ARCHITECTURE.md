# Network Architecture Diagram

## Complete H.264 RTSP Streaming Setup

```
┌─────────────────────────────────────────────────────────────────────┐
│                        YOUR LOCAL COMPUTER                          │
│  ┌──────────────┐                                                   │
│  │ USB Camera   │                                                   │
│  │  (Webcam)    │                                                   │
│  └──────┬───────┘                                                   │
│         │ Video Feed                                                │
│         ▼                                                           │
│  ┌──────────────────────────────────────────────────────┐          │
│  │              FFmpeg (H.264 Encoding)                 │          │
│  │  • Captures video from camera (DirectShow)          │          │
│  │  • Encodes to H.264 Baseline Profile                │          │
│  │  • Resolution: 1280x720 @ 30fps                     │          │
│  │  • Bitrate: 2000 kbps                               │          │
│  └──────────────────┬───────────────────────────────────┘          │
│                     │ H.264 Stream                                  │
│                     ▼                                               │
│  ┌──────────────────────────────────────────────────────┐          │
│  │         MediaMTX RTSP Server (Port 89)               │          │
│  │  • Receives H.264 stream from FFmpeg                │          │
│  │  • Publishes as RTSP on port 89                     │          │
│  │  • Authentication: user1:BBE500bbe                  │          │
│  │  • TCP transport for reliability                    │          │
│  │  • WebRTC server on port 8889                       │          │
│  └──────────────────┬───────────────────────────────────┘          │
│                     │                                               │
│  Local IP: 192.168.x.x                                             │
└─────────────────────┼─────────────────────────────────────────────┘
                      │
                      │ Port 89 (TCP)
                      │
┌─────────────────────┼─────────────────────────────────────────────┐
│                     ▼                                               │
│              YOUR HOME ROUTER                                       │
│  ┌──────────────────────────────────────────────────────┐          │
│  │         Port Forwarding Configuration                │          │
│  │                                                       │          │
│  │  External Port: 89 (TCP)                            │          │
│  │  Internal IP:   192.168.x.x (your PC)              │          │
│  │  Internal Port: 89                                  │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                     │
│  Public IP: 97.76.64.150                                           │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      │ Port 89 (TCP)
                      │ Over Internet
                      │
    ┌─────────────────┴─────────────────┐
    │                                   │
    ▼                                   ▼
┌─────────────────┐           ┌─────────────────┐
│  LOCAL VIEWER   │           │ REMOTE VIEWER   │
│                 │           │  (Anywhere)     │
│  Same Network   │           │                 │
└─────────────────┘           └─────────────────┘
         │                             │
         │                             │
         ▼                             ▼

  Local URL:                    Internet URL:
  rtsp://user1:               rtsp://user1:BBE500bbe@
  BBE500bbe@                  97.76.64.150:89/
  192.168.x.x:89/             rtsp/streaming?
  rtsp/streaming              channel=03&subtype=1
```

## Access Points

### 1. Local Network Access (Same WiFi)
```
rtsp://user1:BBE500bbe@192.168.x.x:89/rtsp/streaming
```
- Use your computer's local IP
- No port forwarding needed
- Accessible only on same network

### 2. Internet Access (From Anywhere)
```
rtsp://user1:BBE500bbe@97.76.64.150:89/rtsp/streaming?channel=03&subtype=1
```
- Uses your public IP (97.76.64.150)
- Requires router port forwarding
- Accessible from anywhere in the world
- Works over mobile data, remote locations, etc.

### 3. WebRTC (Browser - Local Only)
```
http://localhost:8889/rtsp/streaming
```
- Browser-based viewing
- Local access only
- No authentication required

## Data Flow

```
Camera → FFmpeg → MediaMTX → Router → Internet → Remote Viewer
         (H.264)  (RTSP)    (Port 89)  (TCP)
```

## Required Configurations

### ✅ Windows Firewall
```powershell
New-NetFirewallRule -DisplayName "RTSP Server Port 89" `
                    -Direction Inbound `
                    -Protocol TCP `
                    -LocalPort 89 `
                    -Action Allow
```

### ✅ Router Port Forwarding
| Setting | Value |
|---------|-------|
| Service Name | RTSP Server |
| External Port | 89 |
| Internal IP | 192.168.x.x (your PC) |
| Internal Port | 89 |
| Protocol | TCP |

## Ports Used

| Port | Protocol | Purpose | Forwarding Required |
|------|----------|---------|-------------------|
| 89 | TCP | RTSP Stream | YES (for internet) |
| 8002 | UDP | RTP Data | Optional |
| 8003 | UDP | RTCP Control | Optional |
| 8889 | TCP | WebRTC | NO (local only) |

## Security Layers

```
┌──────────────────────────────────────┐
│  1. Router Firewall                  │  ← Filters incoming traffic
├──────────────────────────────────────┤
│  2. Windows Firewall                 │  ← Allows port 89
├──────────────────────────────────────┤
│  3. RTSP Authentication              │  ← user1:BBE500bbe
├──────────────────────────────────────┤
│  4. MediaMTX Access Control          │  ← Path-based permissions
└──────────────────────────────────────┘
```

## Testing Workflow

### Phase 1: Local Testing
```
1. Start stream: npm start
2. Get local URL from console
3. Test in VLC on same computer
4. Test from another device on same WiFi
✅ If working, proceed to Phase 2
```

### Phase 2: Internet Testing
```
1. Configure router port forwarding
2. Add Windows Firewall rule
3. Get public URL from console
4. Test from mobile data (not WiFi)
5. Test from a friend's network
✅ If working, you're done!
```

## Troubleshooting Flow

```
Can't connect?
    │
    ├─ Locally?
    │   ├─ Is stream running? → npm start
    │   ├─ Firewall blocking? → npm run add-firewall-rule
    │   └─ Wrong URL? → Check console output
    │
    └─ From Internet?
        ├─ Port forwarded? → Check router settings
        ├─ Correct public IP? → npm run check-network
        ├─ ISP blocking? → Try port 89 instead
        └─ Testing correctly? → Use mobile data, not WiFi
```

## Network Address Translation (NAT)

```
Internet Packet Journey:

Client Request:
┌─────────────────────────────────────────────────┐
│ To: 97.76.64.150:89                            │
│ From: [Client IP]:[Random Port]                │
└─────────────────────────────────────────────────┘
                ▼
          Your Router
                ▼
┌─────────────────────────────────────────────────┐
│ To: 192.168.x.x:89 (your PC)                   │
│ From: [Client IP]:[Random Port]                │
└─────────────────────────────────────────────────┘
                ▼
        Your Computer
                ▼
        MediaMTX Server
                ▼
         Sends Video
```

## Bandwidth Requirements

```
Stream Settings:
├─ Resolution: 1280x720
├─ FPS: 30
├─ Bitrate: 2000 kbps
└─ Format: H.264

Upload Speed Needed:
├─ 1 viewer:  ~2.5 Mbps
├─ 2 viewers: ~5 Mbps
├─ 3 viewers: ~7.5 Mbps
└─ etc.

Check your upload speed: https://fast.com
```

## File Structure & Responsibilities

```
localwebcamstream/
├── index.js                 → Main entry, orchestrates everything
├── camera-detector.js       → Detects USB cameras via FFmpeg
├── camera-selector.js       → Interactive camera selection
├── rtsp-server.js          → Manages MediaMTX server
├── stream-manager.js        → FFmpeg streaming to RTSP
├── network-checker.js       → Network diagnostics tool
├── mediamtx/
│   ├── mediamtx.exe        → RTSP/WebRTC server
│   └── mediamtx.yml        → Server configuration
└── Documentation/
    ├── README.md           → Full documentation
    ├── SETUP_GUIDE.md      → Internet setup guide
    ├── QUICK_REFERENCE.md  → Quick commands
    └── IMPLEMENTATION_SUMMARY.md → What was changed
```

## Quick Commands Reference

```bash
# Start streaming
npm start

# Check network setup
npm run check-network

# Add firewall rule
npm run add-firewall-rule

# Test stream (local)
ffplay "rtsp://user1:BBE500bbe@127.0.0.1:89/rtsp/streaming"

# Test stream (internet)
ffplay "rtsp://user1:BBE500bbe@97.76.64.150:89/rtsp/streaming?channel=03&subtype=1"

# Record stream
ffmpeg -i "rtsp://user1:BBE500bbe@127.0.0.1:89/rtsp/streaming" -c copy output.mp4

# Check port status
Test-NetConnection -ComputerName localhost -Port 89
```

---

**Ready to stream?** Follow these 3 steps:
1. `npm start` - Start the stream
2. `npm run check-network` - Check setup
3. Configure router port forwarding (details shown by check-network command)

Then access from anywhere: `rtsp://user1:BBE500bbe@97.76.64.150:89/rtsp/streaming?channel=03&subtype=1` 🚀
