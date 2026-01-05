const { execSync } = require('child_process');
const fs = require('fs');

console.log('Testing raw FFmpeg command...\n');

try {
    console.log('Executing FFmpeg...');
    const result = execSync('ffmpeg -list_devices true -f dshow -i dummy 2>&1', {
        encoding: 'utf8'
    });
    console.log('RESULT (stdout):', result);
} catch (error) {
    console.log('Error caught (expected):');
    console.log('  Exit code:', error.status);
    console.log('  Has stderr:', !!error.stderr);
    console.log('  Has stdout:', !!error.stdout);

    const output = error.stderr || error.stdout || error.message || '';
    console.log('\n  Output length:', output.length);
    console.log('\n  Output preview (first 500 chars):');
    console.log('---');
    console.log(output.substring(0, 500));
    console.log('---');

    // Try to write debug file
    console.log('\nTrying to write debug file...');
    try {
        fs.writeFileSync('test-ffmpeg-output.txt', output, 'utf8');
        console.log('✓ Debug file written successfully');
        console.log('  File size:', fs.statSync('test-ffmpeg-output.txt').size, 'bytes');
    } catch (writeError) {
        console.log('✗ Failed to write debug file:', writeError.message);
    }
}
