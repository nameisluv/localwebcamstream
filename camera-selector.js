const inquirer = require('inquirer');
const chalk = require('chalk');

/**
 * Camera Selector Module
 * Provides interactive CLI for camera selection
 */

class CameraSelector {
    /**
     * Display camera selection interface
     * @param {Array} cameras - List of available cameras
     * @returns {Promise<Object>} Selected camera object
     */
    async selectCamera(cameras) {
        if (!cameras || cameras.length === 0) {
            console.error(chalk.red('✗ No cameras detected!'));
            console.log(chalk.yellow('\nPlease ensure:'));
            console.log('1. A USB camera is connected');
            console.log('2. Camera drivers are installed');
            console.log('3. Camera is not being used by another application\n');
            process.exit(1);
        }

        console.log(chalk.green(`\n✓ Found ${cameras.length} camera(s)\n`));

        // If only one camera, auto-select it
        if (cameras.length === 1) {
            console.log(chalk.cyan(`Auto-selecting: ${cameras[0].name}`));
            return cameras[0];
        }

        // Create choices for inquirer
        const choices = cameras.map(camera => ({
            name: `${camera.index + 1}. ${camera.name}`,
            value: camera
        }));

        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'camera',
                message: 'Select a camera to stream:',
                choices: choices,
                pageSize: 10
            }
        ]);

        return answers.camera;
    }
}

module.exports = CameraSelector;
