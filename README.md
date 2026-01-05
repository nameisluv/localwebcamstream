# USB Camera RTSP Streaming System

A professional CLI-based Node.js application that streams USB cameras via RTSP over the internet using H.264 encoding.

## Features

✨ **Key Features:**
- 🎥 Automatic USB camera detection on Windows
- 📋 Interactive camera selection with arrow key navigation
- 📡 RTSP streaming with MediaMTX server
- 🌐 Internet-accessible streaming with authentication
- 🔒 Secure credential-based access
- ⚡ H.264 encoding with low-latency optimizations
- 💻 Clean, colorful CLI interface
- 🛡️ Graceful shutdown handling (Ctrl+C)
- 🔧 Network configuration checker
- 📊 Port forwarding setup assistance

## Stream Specifications

| Setting | Value |
|---------|-------|
| Video Codec | H.264 (Baseline Profile) |
| Resolution | 1280x720 |
| Framerate | 30 fps |
| Bitrate | 2000 kbps |
| Transport | TCP |
| Port | 89 |
| URL Format | `rtsp://user1:BBE500bbe@<IP>:89/rtsp/streaming?channel=03&subtype=1` |

## Prerequisites

Before running this application, ensure you have the following installed:

### 1. Node.js
- **Version:** 14.x or higher
- **Download:** [https://nodejs.org/](https://nodejs.org/)
- **Verify installation:**
  ```bash
  node --version
  npm --version
  ```

### 2. FFmpeg
FFmpeg is required for camera capture and video processing.

**Installation Options:**

**Option A: Chocolatey (Recommended for Windows)**
```bash
choco install ffmpeg
```

**Option B: Scoop**
```bash
scoop install ffmpeg
```

**Option C: Manual Installation**
1. Download from [https://www.ffmpeg.org/download.html](https://www.ffmpeg.org/download.html)
2. Extract the archive
3. Add the `bin` folder to your system PATH
4. Verify installation:
   ```bash
   ffmpeg -version
   ```

### 3. USB Camera
- Connect a USB webcam to your computer
- Ensure camera drivers are installed
- Make sure no other application is using the camera

## Installation

1. **Navigate to the project directory:**
   ```bash
   cd "d:\Work\Bay Buisness Edge\localwebcamstream"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Usage

### Quick Start

**1. Start the stream:**
```bash
npm start
```

**2. Check network configuration:**
```bash
npm run check-network
```

**3. Add Windows Firewall rule (if needed):**
```bash
npm run add-firewall-rule
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start the RTSP streaming server |
| `npm run check-network` | Check network configuration and get setup instructions |
| `npm run add-firewall-rule` | Add Windows Firewall rule for port 89 |

### Application Workflow

1. **Camera Detection**
   - The application automatically detects all connected USB cameras
   - Displays a list of available cameras

2. **Camera Selection**
   - Use arrow keys to navigate the camera list
   - Press Enter to select a camera
   - If only one camera is detected, it's auto-selected

3. **Streaming Starts**
   - MediaMTX RTSP server starts on port 89
   - Camera feed is captured with H.264 encoding
   - Connection URLs are displayed (local and public)

### Accessing Your Stream

**Local Network:**
```
rtsp://user1:BBE500bbe@<LOCAL_IP>:89/rtsp/streaming
```

**Internet (Public):**
```
rtsp://user1:BBE500bbe@97.76.64.150:89/rtsp/streaming?channel=03&subtype=1
```

**WebRTC (Browser):**
```
http://localhost:8889/rtsp/streaming
```


### Viewing the Stream

#### VLC Media Player (Recommended)
1. Open VLC Media Player
2. Go to **Media** → **Open Network Stream**
3. Enter the RTSP URL shown when you start the stream
4. Click **Play**

**For lower latency in VLC:**
- Tools → Preferences → Show All → Input/Codecs
- Set Network caching to 300ms (default is 1000ms)

#### FFplay (Command Line)
```bash
ffplay "rtsp://user1:BBE500bbe@97.76.64.150:89/rtsp/streaming?channel=03&subtype=1"
```

#### Web Browser (WebRTC)
Open in your browser:
```
http://localhost:8889/rtsp/streaming
```

### Stopping the Application

Press `Ctrl+C` to gracefully shut down:
- Stops the camera stream
- Closes the RTSP server
- Cleans up resources

## Internet Access Setup

To access your stream from anywhere over the internet, you need to:

1. **Configure Windows Firewall**
   ```bash
   npm run add-firewall-rule
   ```

2. **Configure Router Port Forwarding**
   - Forward port 89 (TCP) to your computer's local IP
   - See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions

3. **Verify Configuration**
   ```bash
   npm run check-network
   ```

📖 **For complete setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)**

## Configuration

### Stream Settings

Edit `index.js` to modify default settings:

```javascript
await streamManager.startStreaming(selectedCamera, rtspUrl, {
  width: 1280,    // Video width (default: 1280)
  height: 720,    // Video height (default: 720)
  fps: 30         // Frames per second (default: 30)
});
```

### Change Credentials

Edit `mediamtx/mediamtx.yml` to change username/password:

```yaml
paths:
  "rtsp/streaming":
    publishUser: your_username
    publishPass: your_password
    readUser: your_username
    readPass: your_password
```

### Server Port

The RTSP server uses port 89 by default. To change it, edit `mediamtx/mediamtx.yml`:

```yaml
rtspAddress: :89  # Change to desired port
```

Remember to update port forwarding rules if you change the port.

## Architecture

### Project Structure

```
localwebcamstream/
├── index.js              # Main application entry point
├── camera-detector.js    # USB camera detection module
├── camera-selector.js    # Interactive CLI selection
├── rtsp-server.js        # MediaMTX RTSP server management
├── stream-manager.js     # FFmpeg streaming bridge
├── network-checker.js    # Network diagnostics tool
├── package.json          # Node.js dependencies
├── SETUP_GUIDE.md       # Complete internet setup guide
├── README.md            # This file
└── mediamtx/            # RTSP server directory
    ├── mediamtx.exe     # MediaMTX executable
    └── mediamtx.yml     # Server configuration
```

### System Flow

```
┌─────────────────────┐
│  Camera Detection   │  ← Uses FFmpeg DirectShow
│  (camera-detector)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Camera Selection   │  ← Interactive CLI (Inquirer)
│  (camera-selector)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   RTSP Server       │  ← MediaMTX Server
│   (rtsp-server)     │    Port: 89 (RTSP)
└──────────┬──────────┘    Port: 8889 (WebRTC)
           │
           ▼
┌─────────────────────┐
│  Stream Manager     │  ← FFmpeg H.264 encoding
│  (stream-manager)   │    Camera → RTSP publish
└─────────────────────┘
           │
           ▼
      📡 RTSP Stream Available
      (H.264 over TCP)
```

### Technology Stack

- **Node.js**: Runtime environment
- **FFmpeg**: Video capture and H.264 encoding
- **MediaMTX**: RTSP/WebRTC server
- **fluent-ffmpeg**: Node.js FFmpeg wrapper
- **inquirer**: Interactive CLI prompts
- **chalk**: Terminal colors and styling

## Troubleshooting

### Camera Not Detected

**Problem:** No cameras found

**Solutions:**
- Ensure USB camera is properly connected
- Check if camera drivers are installed
- Close other applications using the camera (Skype, Teams, etc.)
- Try a different USB port
- Restart your computer
- Run: `ffmpeg -list_devices true -f dshow -i dummy` to see available devices

### FFmpeg Not Found

**Problem:** "FFmpeg is not installed" error

**Solutions:**
- Install FFmpeg using one of the methods above
- Ensure FFmpeg is in your system PATH
- Restart your terminal/command prompt
- Verify with: `ffmpeg -version`

### Stream Not Accessible Over Internet

**Problem:** Can connect locally but not from outside network

**Solutions:**
- Run: `npm run check-network` for diagnostics
- Verify router port forwarding is configured correctly
- Check Windows Firewall: `npm run add-firewall-rule`
- Test with online port checker (port 89)
- Verify your public IP hasn't changed
- Check if ISP blocks port 89 (try different port like 89)
- See [SETUP_GUIDE.md](SETUP_GUIDE.md) for complete instructions

### Stream Won't Start

**Problem:** Stream fails to start or immediately stops

**Solutions:**
- Check if port 89 is already in use
- Ensure camera permissions are granted
- Try a lower resolution (640x480)
- Check FFmpeg output for errors
- Reduce FPS to 15 or 24
- Make sure MediaMTX downloaded correctly

### Can't Connect to Stream Locally

**Problem:** VLC or other players can't connect on local network

**Solutions:**
- Wait 2-3 seconds after stream starts
- Use the exact URL shown in console
- Try: `rtsp://user1:BBE500bbe@127.0.0.1:89/rtsp/streaming`
- Check Windows Firewall settings
- Verify server is running (check console output)

### Poor Video Quality / Lag

**Problem:** Blurry, laggy, or delayed video

**Solutions:**
- In VLC: Set network caching to 300ms (Tools → Preferences → Input/Codecs)
- Increase bitrate in `stream-manager.js` (change `2000k` to `3000k`)
- Ensure good lighting for the camera
- Close bandwidth-heavy applications
- Check upload speed: https://fast.com
- Reduce resolution if CPU is struggling

### High CPU Usage

**Problem:** Application uses too much CPU

**Solutions:**
- Reduce resolution (e.g., 640x480)
- Lower FPS (e.g., 15)
- Use faster preset: `ultrafast` (already default)
- Ensure no other applications are using the camera
- Update FFmpeg to latest version

## Advanced Usage

### Change Public IP Address

If your public IP changes or you want to use a domain:

Edit `rtsp-server.js`:
```javascript
getPublicUrl(publicIp = 'your-new-ip-or-domain.com') {
    return `rtsp://user1:BBE500bbe@${publicIp}:89/rtsp/streaming?channel=03&subtype=1`;
}
```

### Dynamic DNS Setup

For automatic domain updates when IP changes:
1. Register at a DDNS provider (No-IP, DuckDNS, etc.)
2. Create a hostname (e.g., mystream.ddns.net)
3. Install their update client
4. Use hostname in RTSP URL instead of IP

### Recording Stream

Save the stream to a file using FFmpeg:

```bash
ffmpeg -i "rtsp://user1:BBE500bbe@127.0.0.1:89/rtsp/streaming" -c copy output.mp4
```

### Multiple Cameras

To stream multiple cameras:
1. Edit `mediamtx/mediamtx.yml` to add paths (camera1, camera2, etc.)
2. Run multiple instances or modify code to handle multiple streams
3. Each camera gets its own RTSP path

## Security Recommendations

⚠️ **Important Security Notes:**

1. **Change Default Credentials** - Update username/password in `mediamtx.yml`
2. **Use Strong Passwords** - The current password is visible in URLs
3. **Consider VPN** - For sensitive applications, use VPN instead of exposing port
4. **Non-Standard Port** - Using port 89 instead of 89 may avoid some attacks
5. **Monitor Access** - Check MediaMTX logs for unauthorized access attempts

## License

MIT License - Feel free to use and modify as needed.

## Support

For issues or questions:
1. Run diagnostics: `npm run check-network`
2. Check the Troubleshooting section above
3. Review [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed setup help
2. Ensure all prerequisites are installed
3. Verify camera and FFmpeg are working independently
4. Check console output for specific error messages

---

**Happy Streaming! 🎥📡**
