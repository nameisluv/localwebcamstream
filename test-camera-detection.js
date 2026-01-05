const CameraDetector = require('./camera-detector');

console.log('Direct test of camera detector\n');

const detector = new CameraDetector();
console.log('Detector created');

console.log('\nCalling detectCameras()...\n');
const cameras = detector.detectCameras();

console.log(`\nResult: Found ${cameras.length} cameras`);
cameras.forEach((cam, idx) => {
    console.log(`  ${idx + 1}. ${cam.name}`);
});

console.log('\nCheck if ffmpeg-debug-output.txt exists...');
const fs = require('fs');
if (fs.existsSync('ffmpeg-debug-output.txt')) {
    console.log('Debug file exists! Contents:');
    console.log('---');
    const content = fs.readFileSync('ffmpeg-debug-output.txt', 'utf8');
    console.log(content.substring(0, 2000)); // First 2000 chars
    console.log('---');
} else {
    console.log('Debug file not found!');
}
