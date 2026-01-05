const { spawn } = require('child_process');
const chalk = require('chalk');

try { require('dotenv').config(); } catch (_) {}

/**
 * Stream Manager Module - Optimized for Low Latency RTSP
 * Manages video streaming from camera to RTSP server
 */

class StreamManager {
    constructor() {
        this.ffmpegProcess = null;
        this.isStreaming = false;
    }

    /**
     * Start streaming from camera to RTSP server (optimized for low latency)
     * @param {Object} camera - Camera object with device name
     * @param {string} rtspUrl - RTSP URL to publish stream to
     * @param {Object} options - Streaming options (resolution, fps, etc.)
     */
    startStreaming(camera, rtspUrl, options = {}) {
        return new Promise((resolve, reject) => {
            const preferWidth = options.width || 1280;
            const preferHeight = options.height || 720;
            const preferFps = options.fps || 60;
            const attempts = [
                { width: preferWidth, height: preferHeight, fps: preferFps },
                { width: 1920, height: 1080, fps: 30 },
                { width: 640, height: 480, fps: 30 }
            ];
            let attemptIndex = 0;

            const tryStart = () => {
                const width = attempts[attemptIndex].width;
                const height = attempts[attemptIndex].height;
                const fps = attempts[attemptIndex].fps;

                console.log(chalk.cyan('\n📹 Starting low-latency camera stream...'));
                console.log(chalk.gray(`   Camera: ${camera.name}`));
                console.log(chalk.gray(`   Resolution: ${width}x${height}`));
                console.log(chalk.gray(`   FPS: ${fps}`));
                console.log(chalk.gray(`   Publishing to: ${rtspUrl}\n`));

            try {
                // Build FFmpeg command with low-latency optimizations
                const ffmpegArgs = [
                    // Input settings
                    '-f', 'dshow',
                    '-rtbufsize', '200M',
                    '-framerate', fps.toString(),
                    '-video_size', `${width}x${height}`,
                    '-i', `video=${camera.deviceName}`,

                    // Encoding settings optimized for low latency
                    '-vcodec', 'libx264',
                    '-profile:v', 'baseline', // Required for WebRTC compatibility
                    '-level', '3.0',
                    '-preset', 'ultrafast',  // Fastest encoding
                    '-tune', 'zerolatency',  // Zero latency tuning
                    '-b:v', '2000k',
                    '-maxrate', '2000k',
                    '-bufsize', '1000k',  // Small buffer
                    '-g', fps.toString(),  // GOP size = framerate for minimal delay
                    '-keyint_min', fps.toString(),
                    '-sc_threshold', '0',  // Disable scene change detection
                    '-pix_fmt', 'yuv420p',

                    // RTSP output settings
                    '-f', 'rtsp',
                    '-rtsp_transport', 'tcp',  // TCP for reliability
                    rtspUrl
                ];

                console.log(chalk.gray('FFmpeg command:'), 'ffmpeg', ffmpegArgs.join(' '));

                // Spawn FFmpeg process
                const ffmpegCmd = process.env.FFMPEG_PATH || 'ffmpeg';
                this.ffmpegProcess = spawn(ffmpegCmd, ffmpegArgs);

                let started = false;
                let attemptTimedOut = false;

                this.ffmpegProcess.stderr.on('data', (data) => {
                    const output = data.toString();

                    // Check for successful stream start
                    if (!started && (output.includes('Stream mapping:') || output.includes('Output #0') || output.includes('rtsp://'))) {
                        started = true;
                        console.log(chalk.green('✓ Low-latency stream started'));
                        this.isStreaming = true;
                        resolve();
                    }

                    // Only log actual errors, not the MJPEG warnings
                    if (output.includes('Error') && !output.includes('APP fields')) {
                        console.error(chalk.red('FFmpeg:'), output.trim());
                    }
                });

                this.ffmpegProcess.stdout.on('data', (data) => {
                    console.log(chalk.gray('FFmpeg:'), data.toString().trim());
                });

                this.ffmpegProcess.on('error', (error) => {
                    console.error(chalk.red('✗ Failed to start FFmpeg:'), error.message);
                    this.isStreaming = false;
                    if (!started) {
                        if (attemptIndex < attempts.length - 1) {
                            console.log(chalk.yellow('Retrying with a different resolution/FPS...'));
                            attemptIndex += 1;
                            tryStart();
                        } else {
                            reject(error);
                        }
                    }
                });

                this.ffmpegProcess.on('exit', (code, signal) => {
                    this.isStreaming = false;
                    if (code !== null && code !== 0 && code !== 255) {
                        console.log(chalk.yellow(`\n✓ Stream ended (exit code: ${code})`));
                    } else if (signal) {
                        console.log(chalk.yellow(`\n✓ Stream ended (signal: ${signal})`));
                    } else {
                        console.log(chalk.yellow('\n✓ Stream ended'));
                    }
                });

                // Timeout to reject if stream doesn't start within 10 seconds
                setTimeout(() => {
                    if (!started) {
                        attemptTimedOut = true;
                        if (this.ffmpegProcess) {
                            this.ffmpegProcess.kill('SIGINT');
                        }
                        if (attemptIndex < attempts.length - 1) {
                            console.log(chalk.yellow('Stream did not start, trying fallback settings...'));
                            attemptIndex += 1;
                            tryStart();
                        } else {
                            reject(new Error('Stream failed to start within 10 seconds'));
                        }
                    }
                }, 10000);

            } catch (error) {
                console.error(chalk.red('✗ Failed to start streaming:'), error.message);
                reject(error);
            }
            };

            tryStart();
        });
    }

    /**
     * Stop the current stream
     */
    stopStreaming() {
        if (this.ffmpegProcess && this.isStreaming) {
            console.log(chalk.yellow('\nStopping stream...'));
            this.ffmpegProcess.kill('SIGINT');
            this.ffmpegProcess = null;
            this.isStreaming = false;
        }
    }

    /**
     * Check if currently streaming
     * @returns {boolean} True if streaming is active
     */
    getStreamingStatus() {
        return this.isStreaming;
    }
}

module.exports = StreamManager;
