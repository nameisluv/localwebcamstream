const { spawn } = require('child_process');
const chalk = require('chalk');
const config = require('./config');

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
            const width = options.width || 1280;
            const height = options.height || 720;
            const fps = options.fps || 30;

            console.log(chalk.cyan('\nStarting camera stream'));
            console.log(chalk.gray(`  Camera: ${camera.name}`));
            console.log(chalk.gray(`  Target stream: ${width}x${height} @ ${fps}fps`));
            console.log(chalk.gray(`  Publish URL: ${rtspUrl}\n`));

            try {
                const candidates = [
                    { pix: 'yuyv422', size: '1920x1080' },
                    { pix: 'yuyv422', size: `${width}x${height}` },
                    { pix: 'nv12', size: '1920x1080' },
                    { pix: 'nv12', size: `${width}x${height}` },
                    { pix: 'mjpeg', size: '1920x1080' },
                    { pix: 'mjpeg', size: `${width}x${height}` }
                ];

                const ffmpegCmd = config.FFMPEG_PATH || 'ffmpeg';
                let started = false;
                let attemptIndex = 0;

                const buildArgs = (cand) => {
                    const inputArgs = [
                        '-f', 'dshow',
                        '-thread_queue_size', '512',
                        '-fflags', 'nobuffer',
                        '-rtbufsize', '200M',
                        '-video_size', cand.size,
                        '-framerate', fps.toString()
                    ];
                    if (cand.pix === 'mjpeg') {
                        inputArgs.push('-vcodec', 'mjpeg');
                    } else {
                        inputArgs.push('-pixel_format', cand.pix);
                    }
                    inputArgs.push('-i', `video=${camera.deviceName}`);

                    const filterArgs = ['-vf', `scale=${width}:${height}`];
                    const encodeArgs = [
                        '-vcodec', 'libx264',
                        '-profile:v', 'baseline',
                        '-level', '3.1',
                        '-preset', 'ultrafast',
                        '-tune', 'zerolatency',
                        '-b:v', '2000k',
                        '-maxrate', '2000k',
                        '-bufsize', '1000k',
                        '-g', fps.toString(),
                        '-keyint_min', fps.toString(),
                        '-sc_threshold', '0',
                        '-pix_fmt', 'yuv420p'
                    ];
                    const outputArgs = ['-f', 'rtsp', '-rtsp_transport', 'tcp', rtspUrl];
                    return [...inputArgs, ...filterArgs, ...encodeArgs, ...outputArgs];
                };

                const tryStart = () => {
                    if (attemptIndex >= candidates.length) {
                        return reject(new Error('Failed to open camera with supported pixel formats/resolutions'));
                    }
                    const cand = candidates[attemptIndex];
                    console.log(chalk.gray(`  Attempt ${attemptIndex + 1}: capture ${cand.size} ${cand.pix}`));
                    const ffmpegArgs = buildArgs(cand);
                    if (config.LOG_VERBOSE) {
                        console.log(chalk.gray('[FFmpeg cmd]'), 'ffmpeg', ffmpegArgs.join(' '));
                    }

                    this.ffmpegProcess = spawn(ffmpegCmd, ffmpegArgs);

                    const onStderr = (data) => {
                        const output = data.toString();
                        if (!started && (output.includes('Stream mapping:') || output.includes('Output #0') || output.includes('rtsp://'))) {
                            started = true;
                            console.log(chalk.green('Stream started'));
                            this.isStreaming = true;
                            cleanupListeners();
                            return resolve();
                        }
                        if (output.toLowerCase().includes('error opening input') || output.toLowerCase().includes('i/o error')) {
                            if (!started) {
                                cleanupProcess();
                                attemptIndex += 1;
                                return tryStart();
                            }
                        }
                        if (output.includes('Error') && !output.includes('APP fields')) {
                            console.error(chalk.red('FFmpeg:'), output.trim());
                        }
                    };

                    const onStdout = (data) => {
                        if (config.LOG_VERBOSE) {
                            console.log(chalk.gray('[FFmpeg]'), data.toString().trim());
                        }
                    };

                    const onError = (error) => {
                        console.error(chalk.red('Failed to start FFmpeg:'), error.message);
                        if (!started) {
                            cleanupProcess();
                            attemptIndex += 1;
                            tryStart();
                        }
                    };

                    const onExit = (code, signal) => {
                        if (!started) {
                            cleanupListeners();
                            attemptIndex += 1;
                            tryStart();
                        } else {
                            this.isStreaming = false;
                            if (code !== null && code !== 0 && code !== 255) {
                                console.log(chalk.yellow(`\nStream ended (exit code: ${code})`));
                            } else if (signal) {
                                console.log(chalk.yellow(`\nStream ended (signal: ${signal})`));
                            } else {
                                console.log(chalk.yellow('\nStream ended'));
                            }
                        }
                    };

                    const cleanupListeners = () => {
                        if (!this.ffmpegProcess) return;
                        this.ffmpegProcess.stderr?.off('data', onStderr);
                        this.ffmpegProcess.stdout?.off('data', onStdout);
                        this.ffmpegProcess.off('error', onError);
                        this.ffmpegProcess.off('exit', onExit);
                    };

                    const cleanupProcess = () => {
                        cleanupListeners();
                        try { this.ffmpegProcess?.kill('SIGINT'); } catch (_) {}
                        this.ffmpegProcess = null;
                    };

                    this.ffmpegProcess.stderr.on('data', onStderr);
                    this.ffmpegProcess.stdout.on('data', onStdout);
                    this.ffmpegProcess.on('error', onError);
                    this.ffmpegProcess.on('exit', onExit);
                };

                const globalTimeout = setTimeout(() => {
                    if (!started) {
                        try { this.ffmpegProcess?.kill('SIGINT'); } catch (_) {}
                        return reject(new Error('Stream failed to start within 20 seconds'));
                    }
                }, 20000);
                const origResolve = resolve;
                resolve = (...args) => {
                    clearTimeout(globalTimeout);
                    origResolve(...args);
                };

                tryStart();

            } catch (error) {
                console.error(chalk.red('Failed to start streaming:'), error.message);
                reject(error);
            }
        });
    }

    /**
     * Stop the current stream
     */
    stopStreaming() {
        if (this.ffmpegProcess && this.isStreaming) {
            console.log(chalk.yellow('\nStopping stream'));
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
