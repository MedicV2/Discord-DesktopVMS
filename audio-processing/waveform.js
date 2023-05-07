const fs = require('fs').promises;
const wav = require('node-wav');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const tmp = require('tmp-promise');

ffmpeg.setFfmpegPath(ffmpegPath);

// Just for logging purposes
const discordsAmplitudes = [
  0, 146, 0, 21, 34, 0, 0, 0, 0, 0, 0, 0, 0, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 187, 183, 179, 118, 103, 139, 41, 23, 20, 5, 26, 0, 195, 174, 197, 126, 194, 146, 171, 190, 182, 193, 186, 179, 169, 169, 160, 148, 90, 137, 143, 181, 166, 115, 103, 181, 181, 180, 160, 162, 152, 160, 164, 66, 59, 95, 69, 36, 18, 13, 16, 3, 17, 0, 0, 0, 9, 14, 21, 4, 0
];

//Encodes an array of amplitudes to a Base64 string.
function encodeAmplitudesToBase64(deciArr) {
  return Buffer.from(deciArr.map(c => String.fromCharCode(c)).join(''), 'binary').toString('base64');
}

async function convertToWav(inputBuffer) {
  const { path: inputPath, cleanup: cleanupInput } = await tmp.file();
  const { path: outputPath, cleanup: cleanupOutput } = await tmp.file({ postfix: '.wav' });

  await fs.writeFile(inputPath, inputBuffer);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .on('end', async () => {
        const outputBuffer = await fs.readFile(outputPath);
        cleanupInput();
        cleanupOutput();
        resolve(outputBuffer);
      })
      .on('error', err => {
        cleanupInput();
        cleanupOutput();
        reject(err);
      })
      .run();
  });
}

async function getNormalizedAmplitudes(filepath, numSegments) {
  // Load the audio file
  const audioBuffer = await fs.readFile(filepath);
  const wavBuffer = await convertToWav(audioBuffer);
  const audioData = wav.decode(wavBuffer);

  // Compute the number of samples and sample length
  const numSamples = audioData.channelData[0].length;
  const segmentLength = Math.floor(numSamples / numSegments);

  // Initialize the array to store the normalized amplitudes
  const amplitudes = new Array(numSegments);

  // Compute the average amplitude for each segment
  for (let i = 0; i < numSegments; i++) {
    const segmentStart = i * segmentLength;
    const segmentEnd = (i + 1) * segmentLength;
    const segment = audioData.channelData[0].slice(segmentStart, segmentEnd);
    const amplitude = segment.reduce((sum, value) => sum + Math.abs(value), 0) / segment.length;
    amplitudes[i] = amplitude;
  }

  // Normalize the amplitudes to fit within the range of 0 to 255 (Discords limit on voice messages is 200 prob because of noise canceling/suppression.)
  const maxAmplitude = Math.max(...amplitudes);
  const normalizedAmplitudes = amplitudes.map(a => Math.round(a / maxAmplitude * 255));

  return normalizedAmplitudes;
}

getNormalizedAmplitudes('../vms/customaudio/voice-message.ogg', 89)
  .then(amplitudes => {
    console.log('\nNormalized Amplitudes:', amplitudes);
    console.log('\nDiscord\'s Amplitudes:', discordsAmplitudes);
    console.log('Custom: \n', encodeAmplitudesToBase64(amplitudes));
    console.log('Discord: \n', encodeAmplitudesToBase64(discordsAmplitudes));
  })
  .catch(err => console.error(err));

  //Scuffed version of calculating the waveform data, trying to make it more accurate.
