const { execSync } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');

try { require('dotenv').config(); } catch (_) {}

/**
 * Camera Detector Module
 * Detects available USB cameras on Windows using FFmpeg DirectShow
 */

class CameraDetector {
  constructor() {
    this.cameras = [];
  }

  /**
   * Check if FFmpeg is installed on the system
   * @returns {boolean} True if FFmpeg is available
   */
  checkFFmpegInstalled() {
    try {
      const ffmpeg = process.env.FFMPEG_PATH ? `"${process.env.FFMPEG_PATH}"` : 'ffmpeg';
      execSync(`${ffmpeg} -version`, { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect available cameras using FFmpeg DirectShow
   * @returns {Array} List of camera objects with name and index
   */
  detectCameras() {
    if (!this.checkFFmpegInstalled()) {
      console.error(chalk.red('✗ FFmpeg is not installed!'));
      console.log(chalk.yellow('\nPlease install FFmpeg:'));
      console.log('1. Download from: https://www.ffmpeg.org/download.html');
      console.log('2. Or use Chocolatey: choco install ffmpeg');
      console.log('3. Or use Scoop: scoop install ffmpeg\n');
      process.exit(1);
    }

    console.log(chalk.cyan('🔍 Detecting cameras...'));

    let output = '';

    try {
      // List DirectShow video devices on Windows
      // Use 2>&1 to redirect stderr to stdout since FFmpeg outputs to stderr
      const ffmpeg = process.env.FFMPEG_PATH ? `"${process.env.FFMPEG_PATH}"` : 'ffmpeg';
      output = execSync(`${ffmpeg} -list_devices true -f dshow -i dummy 2>&1`, {
        encoding: 'utf8'
      });
    } catch (error) {
      // FFmpeg command will fail, but output goes to stdout when using 2>&1
      output = error.stdout || error.stderr || '';
    }

    // Parse the output to find video devices
    const lines = output.split('\n');
    const cameras = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for lines with (video) label - these are video devices
      // Format: [dshow @ address] "Device Name" (video)
      if (line.includes('(video)')) {
        const deviceMatch = line.match(/\[dshow[^\]]*\]\s+"([^"]+)"/);
        if (deviceMatch && deviceMatch[1]) {
          const deviceName = deviceMatch[1].trim();

          // Skip if this is an alternative name line (contains @device_)
          if (deviceName.includes('@device_')) {
            continue;
          }

          // Check if we already have this device (avoid duplicates)
          if (!cameras.find(cam => cam.deviceName === deviceName)) {
            cameras.push({
              index: cameras.length,
              name: deviceName,
              deviceName: deviceName
            });
            console.log(chalk.green(`  ✓ Found: ${deviceName}`));
          }
        }
      }
    }

    // If no cameras found, provide helpful diagnostic information
    if (cameras.length === 0) {
      // Debug: save output to file for inspection
      try {
        fs.writeFileSync('ffmpeg-debug-output.txt', output, 'utf8');
        console.log(chalk.yellow('\n⚠ No cameras detected'));
        console.log(chalk.gray('  Debug output saved to ffmpeg-debug-output.txt'));
      } catch (writeError) {
        console.log(chalk.yellow('\n⚠ No cameras detected'));
      }
    }

    this.cameras = cameras;
    return cameras;
  }

  /**
   * Get list of detected cameras
   * @returns {Array} List of cameras
   */
  getCameras() {
    if (this.cameras.length === 0) {
      this.detectCameras();
    }
    return this.cameras;
  }
}

module.exports = CameraDetector;
