const record = require('node-mic-record');
const keypress = require('keypress');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const logWithColor = require('../utils/consoleUtils');

module.exports = function recordAudio() {
  return new Promise((resolve, reject) => {
    // Check if directory exists; otherwise, create it
    const vmsDir = './vms';
    if (!fs.existsSync(vmsDir)) {
      fs.mkdirSync(vmsDir);
    }

    // Function to generate unique filenames
    const generateUniqueFilename = (filename, index) => {
      const ext = path.extname(filename);
      const base = path.basename(filename, ext);
      return `${base}-${index}${ext}`;
    };

    const outputFile = path.join(vmsDir, 'voice-message.wav'); // Output file path for the voice message
    let fileIndex = 0;
    let finalOutputFile = outputFile;

    while (fs.existsSync(finalOutputFile)) {
      fileIndex++;
      finalOutputFile = path.join(vmsDir, generateUniqueFilename('voice-message.wav', fileIndex)); // Generate a unique output file path if a file with the same name already exists
    }

    const tempFile = path.join(vmsDir, 'temp.wav'); // Temporary file path for audio processing

    let startTime;
    const recordedData = [];

    logWithColor(`\nPress [Space bar] to stop recording`, 35);
    logWithColor('Recording started...', 35);

    // Start recording audio
    const recording = record.start({
      sampleRate: 48000,
      channels: 2,
    });

    recording.on('data', (data) => {
      recordedData.push(data); // Collect the recorded data in memory
    });

    const stopRecording = () => {
      logWithColor('\nStopping recording...', 31);
      record.stop();
      recording.on('close', () => {
        // Write the recorded data to the temporary file
        fs.writeFile(tempFile, Buffer.concat(recordedData), (error) => {
          if (error) {
            console.error(`Error writing temporary file: ${error.message}`);
            reject(error);
            return;
          }
          // Execute sox command to enhance audio and remove noise
          exec(`sox ${tempFile} ${finalOutputFile} highpass 100 lowpass 15000`, (error) => {
            if (error) {
              console.error(`Error enhancing audio: ${error.message}`);
              reject(error);
            } else {
              // Remove the temporary file
              fs.unlinkSync(tempFile);
              // Resolve the promise with the path of the saved recording
              logWithColor('Recording saved to:', 32);
              logWithColor(finalOutputFile + '\n', 33);
              resolve(finalOutputFile);
            }
          });
        });
      });
    };

    // A bunch of stuff to be able to log the elapsed time nicely -.-
    const displayElapsedTime = () => {
      const currentTime = Math.floor((Date.now() - startTime) / 1000);
      process.stdout.clearLine(); // Clear the current line in the console output
      process.stdout.cursorTo(0); // Move the cursor to the beginning of the line
      process.stdout.write(`\x1b[33mElapsed Time: ${currentTime} seconds\x1b[0m`);
    };

    keypress(process.stdin);
    process.stdin.on('keypress', (ch, key) => {
      if (key && key.name === 'space') {
        clearInterval(elapsedTimeInterval);
        stopRecording();
      }
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();

    // Get start time and update time displayed
    startTime = Date.now();
    const elapsedTimeInterval = setInterval(displayElapsedTime, 1000); // Update the displayed elapsed time every second
  });
};
