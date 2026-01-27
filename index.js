const CameraDetector = require('./camera-detector');
const CameraSelector = require('./camera-selector');
const RTSPServer = require('./rtsp-server');
const StreamManager = require('./stream-manager');
const chalk = require('chalk');
const config = require('./config');

/**
 * USB Camera RTSP Streaming System - Main entry
 */

async function main() {
    try {
        // Initialize modules
        const detector = new CameraDetector();
        const selector = new CameraSelector();
        const server = new RTSPServer();
        const streamManager = new StreamManager();

        // Step 1: Detect cameras
        const cameras = detector.detectCameras();

        // Step 2: Select camera
        const selectedCamera = await selector.selectCamera(cameras);
        console.log(chalk.green(`\nSelected: ${selectedCamera.name}\n`));

        // Step 3: Start RTSP server
        await server.start();

        // Wait a moment for server to fully initialize
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 4: Start streaming with low-latency settings
        const rtspUrl = server.getPublishUrl();
        await streamManager.startStreaming(selectedCamera, rtspUrl, {
            width: 1280,
            height: 720,
            fps: 30
        });

        // Display connection information
        console.log(chalk.green('\nCamera stream is live'));
        
        const localUrl = server.getViewUrl();
        const publicUrl = server.getPublicUrl();
        
        console.log(chalk.cyan('\nLocal Access:'));
        console.log(chalk.white('  URL: ') + chalk.yellow(localUrl));
        
        console.log(chalk.cyan('\nInternet Access:'));
        console.log(chalk.white('  URL: ') + chalk.yellow(publicUrl));
        console.log(chalk.gray('  Requires router port forwarding'));

        console.log(chalk.cyan('\nViewer tip:'));
        console.log(chalk.gray('  Use VLC → Open Network Stream and paste URL\n'));

        console.log(chalk.cyan('Stream specs:'));
        console.log(chalk.gray('  Capture 1920x1080 → Stream 1280x720 @ 30fps (H.264, TCP)\n'));

        console.log(chalk.cyan('Router setup:'));
        console.log(chalk.yellow('  Configure port forwarding:'));
        console.log(chalk.white('  1. Port Forward: ') + chalk.cyan(`Port ${config.RTSP_PORT} (TCP) → This computer`));
        console.log(chalk.white('  2. Optional: ') + chalk.gray(`Port ${config.RTP_PORT} (UDP) for RTP`));
        console.log(chalk.white('  3. Optional: ') + chalk.gray(`Port ${config.RTCP_PORT} (UDP) for RTCP`));
        console.log(chalk.gray('\n  Run "npm run check-network" for detailed setup help\n'));

        console.log(chalk.cyan('WebRTC (local):'));
        console.log(chalk.white('  URL: ') + chalk.yellow(`http://localhost:${config.WEBRTC_PORT}/rtsp/streaming`));

        console.log(chalk.yellow('\nPress Ctrl+C to stop\n'));

        // Handle graceful shutdown
        const cleanup = () => {
            console.log(chalk.yellow('\n\nShutting down...'));
            streamManager.stopStreaming();
            server.stop();
            console.log(chalk.green('Cleanup complete\n'));
            process.exit(0);
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

    } catch (error) {
        console.error(chalk.red('\nApplication error:'), error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the application
main();
