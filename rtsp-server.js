const { spawn, execSync } = require('child_process');
const chalk = require('chalk');
const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('./config');

/**
 * RTSP Server Module using MediaMTX
 * Provides low-latency RTSP streaming
 */

class RTSPServer {
    constructor(opts = {}) {
        this.pathName = 'rtsp/streaming';
        this.port = Number(opts.port || config.RTSP_PORT);
        this.username = opts.username || config.RTSP_USERNAME;
        this.password = opts.password || config.RTSP_PASSWORD;
        this.webrtcPort = Number(opts.webrtcPort || config.WEBRTC_PORT);
        this.rtpPort = Number(opts.rtpPort || config.RTP_PORT);
        this.rtcpPort = Number(opts.rtcpPort || config.RTCP_PORT);
        this.publicIp = opts.publicIp || config.PUBLIC_IP || null;
        this.serverProcess = null;
        this.mediamtxPath = null;
    }

    /**
     * Download MediaMTX if not present
     */
    async downloadMediaMTX() {
        const mediamtxDir = path.join(__dirname, 'mediamtx');
        const mediamtxExe = path.join(mediamtxDir, 'mediamtx.exe');

        if (fs.existsSync(mediamtxExe)) {
            console.log(chalk.gray('MediaMTX already installed'));
            this.mediamtxPath = mediamtxExe;
            return;
        }

        console.log(chalk.cyan('Downloading MediaMTX RTSP server...'));

        if (!fs.existsSync(mediamtxDir)) {
            fs.mkdirSync(mediamtxDir);
        }

        // Download URL for Windows
        const downloadUrl = 'https://github.com/bluenviron/mediamtx/releases/download/v1.9.3/mediamtx_v1.9.3_windows_amd64.zip';
        const zipPath = path.join(mediamtxDir, 'mediamtx.zip');

        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(zipPath);

            https.get(downloadUrl, (response) => {
                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    console.log(chalk.green('✓ MediaMTX downloaded'));

                    // Extract using PowerShell
                    try {
                        const extractCmd = `Expand-Archive -Path "${zipPath}" -DestinationPath "${mediamtxDir}" -Force`;
                        execSync(extractCmd, { stdio: 'ignore', shell: 'powershell.exe' });
                        console.log(chalk.green('✓ MediaMTX extracted'));

                        this.mediamtxPath = mediamtxExe;
                        fs.unlinkSync(zipPath); // Clean up zip file
                        resolve();
                    } catch (error) {
                        console.error(chalk.red('✗ Failed to extract MediaMTX'));
                        reject(error);
                    }
                });
            }).on('error', (err) => {
                fs.unlinkSync(zipPath);
                reject(err);
            });
        });
    }

    /**
     * Generate MediaMTX configuration file
     */
    generateConfig() {
        const configPath = path.join(path.dirname(this.mediamtxPath), 'mediamtx.yml');
        const configContent = `
###############################################
# General
###############################################

# RTSP Server Port
rtspAddress: :${this.port}
rtpAddress: :${this.rtpPort}
rtcpAddress: :${this.rtcpPort}

# Authentication Method
authMethod: internal

# Log Level
logLevel: info

# Disable other protocols to avoid port conflicts
rtmp: no
hls: no
srt: no
api: no

# Enable WebRTC on a non-conflicting port
webrtc: yes
webrtcAddress: :${this.webrtcPort}

###############################################
# Paths
###############################################

paths:
  "${this.pathName}":
    # Authentication
    publishUser: ${this.username}
    publishPass: ${this.password}
    readUser: ${this.username}
    readPass: ${this.password}
`;
        try {
            fs.writeFileSync(configPath, configContent, 'utf8');
            console.log(chalk.green(`✓ MediaMTX configuration generated (Port ${this.port}, Auth enabled, others disabled)`));
        } catch (error) {
            console.error(chalk.red('✗ Failed to generate config:'), error.message);
        }
    }

    /**
     * Start the RTSP server
     */
    async start() {
        try {
            await this.downloadMediaMTX();
            this.generateConfig(); // Generate config before starting

            return new Promise((resolve, reject) => {
                console.log(chalk.cyan('Starting RTSP server'));

                // Start MediaMTX
                this.serverProcess = spawn(this.mediamtxPath, [], {
                    cwd: path.dirname(this.mediamtxPath)
                });

                let started = false;

                this.serverProcess.stdout.on('data', (data) => {
                    const output = data.toString();
                    console.log(chalk.gray('[MediaMTX]'), output.trim());

                    if (!started && output.includes('listener opened')) {
                        started = true;
                        console.log(chalk.green(`RTSP server started on port ${this.port}`));
                        resolve();
                    }
                });

                this.serverProcess.stderr.on('data', (data) => {
                    const output = data.toString();
                    if (!output.includes('INF')) {
                        console.error(chalk.red('[MediaMTX Error]'), output.trim());
                    }
                });

                this.serverProcess.on('error', (error) => {
                    console.error(chalk.red('Failed to start RTSP server:'), error.message);
                    reject(error);
                });

                this.serverProcess.on('exit', (code) => {
                    if (code !== 0 && code !== null) {
                        console.log(chalk.yellow(`RTSP server exited with code ${code}`));
                    }
                });

                // Timeout fallback
                setTimeout(() => {
                    if (!started) {
                        console.log(chalk.green('RTSP server started (timeout fallback)'));
                        resolve();
                    }
                }, 5000); // Increased to 5 seconds
            });
        } catch (error) {
            console.error(chalk.red('Failed to start RTSP server:'), error.message);
            throw error;
        }
    }

    /**
     * Stop the RTSP server
     */
    stop() {
        if (this.serverProcess) {
            this.serverProcess.kill();
            console.log(chalk.yellow('\nRTSP server stopped'));
        }
    }

    /**
     * Get the RTSP URL for publishing (local)
     */
    getPublishUrl() {
        // Include credentials for publishing
        return `rtsp://${this.username}:${this.password}@127.0.0.1:${this.port}/${this.pathName}`;
    }

    /**
     * Get the RTSP URL for viewing (local)
     */
    getViewUrl() {
        return `rtsp://${this.username}:${this.password}@127.0.0.1:${this.port}/${this.pathName}`;
    }

    /**
     * Get the RTSP URL for internet access
     * @param {string} publicIp - Your public IP address or domain
     */
    getPublicUrl(publicIp) {
        const ip = publicIp || this.publicIp || config.PUBLIC_IP || 'your_public_ip';
        return `rtsp://${this.username}:${this.password}@${ip}:${this.port}/${this.pathName}?channel=03&subtype=1`;
    }
}

module.exports = RTSPServer;
