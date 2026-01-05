const CameraDetector = require('./camera-detector');
const CameraSelector = require('./camera-selector');
const RTSPServer = require('./rtsp-server');
const StreamManager = require('./stream-manager');
const chalk = require('chalk');

try { require('dotenv').config(); } catch (_) {}

/**
 * USB Camera RTSP Streaming System
 * Main application entry point
 */

// ASCII Art Banner
const banner = `
╔═══════════════════════════════════════════════════════╗
║   USB Camera RTSP Streaming System                    ║
║   Stream your USB camera via RTSP                     ║
╚═══════════════════════════════════════════════════════╝
`;

async function main() {
    try {
        // Display banner
        console.log(chalk.cyan(banner));

        // Initialize modules
        const detector = new CameraDetector();
        const selector = new CameraSelector();
        const server = new RTSPServer();
        const streamManager = new StreamManager();

        // Step 1: Detect cameras
        const cameras = detector.detectCameras();

        // Step 2: Select camera
        const selectedCamera = await selector.selectCamera(cameras);
        console.log(chalk.green(`\n✓ Selected: ${selectedCamera.name}\n`));

        // Step 3: Start RTSP server
        await server.start();

        // Wait a moment for server to fully initialize
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 4: Start streaming with low-latency settings
        const rtspUrl = server.getPublishUrl();
        await streamManager.startStreaming(selectedCamera, rtspUrl, {
            width: 1280,
            height: 720,
            fps: 60
        });

        // Display connection information
        console.log(chalk.green('\n' + '='.repeat(70)));
        console.log(chalk.green.bold('  🎥 CAMERA STREAM IS LIVE! 🎥'));
        console.log(chalk.green('='.repeat(70)));
        
        const localUrl = server.getViewUrl();
        const publicUrl = server.getPublicUrl();
        
        console.log(chalk.cyan('\n📺 LOCAL NETWORK ACCESS (Same network as this computer):\n'));
        console.log(chalk.white('  Local URL: ') + chalk.yellow(localUrl));
        
        console.log(chalk.cyan('\n🌍 INTERNET ACCESS (From anywhere in the world):\n'));
        console.log(chalk.white('  Public URL: ') + chalk.yellow(publicUrl));
        console.log(chalk.gray('  ⚠️  Requires router port forwarding (see setup guide below)'));

        console.log(chalk.cyan('\n📖 VLC Player Instructions:'));
        console.log(chalk.gray('  1. Open VLC Media Player'));
        console.log(chalk.gray('  2. Go to Media → Open Network Stream'));
        console.log(chalk.gray('  3. Enter one of the URLs above'));
        console.log(chalk.gray('  4. Click Play\n'));

        console.log(chalk.cyan('⚡ Stream Specifications:'));
        console.log(chalk.gray('  ✓ H.264 Baseline Profile (Maximum compatibility)'));
        console.log(chalk.gray('  ✓ 1280x720 @ 30fps'));
        console.log(chalk.gray('  ✓ TCP transport for reliability'));
        console.log(chalk.gray('  ✓ Low-latency tuning\n'));

        console.log(chalk.cyan('🔧 ROUTER SETUP REQUIRED FOR INTERNET ACCESS:'));
        console.log(chalk.yellow('  To access from the internet, configure your router:\n'));
        console.log(chalk.white('  1. Port Forward: ') + chalk.cyan(`Port ${process.env.RTSP_PORT || 89} (TCP) → This computer`));
        console.log(chalk.white('  2. Optional: ') + chalk.gray(`Port ${process.env.RTP_PORT || 8002} (UDP) for RTP`));
        console.log(chalk.white('  3. Optional: ') + chalk.gray(`Port ${process.env.RTCP_PORT || 8003} (UDP) for RTCP`));
        console.log(chalk.gray('\n  💡 Run "npm run check-network" for detailed setup help\n'));

        console.log(chalk.cyan('🌐 WebRTC Direct Access (Optional):'));
        console.log(chalk.gray('  If you want to view directly via WebRTC:'));
        console.log(chalk.white('  URL: ') + chalk.yellow(`http://localhost:${process.env.WEBRTC_PORT || 8889}/rtsp/streaming`));

        console.log(chalk.yellow('\nPress Ctrl+C to stop streaming\n'));

        // Handle graceful shutdown
        const cleanup = () => {
            console.log(chalk.yellow('\n\n🛑 Shutting down...'));
            streamManager.stopStreaming();
            server.stop();
            console.log(chalk.green('✓ Cleanup complete. Goodbye!\n'));
            process.exit(0);
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

    } catch (error) {
        console.error(chalk.red('\n✗ Application error:'), error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the application
main();
