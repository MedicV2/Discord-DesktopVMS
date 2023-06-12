const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const wavDecoder = require('wav-decoder');

module.exports = async function calculateWaveform(audioFilePath,duration) {
  const outputFolder = path.join(__dirname, '../vms/customaudio/');
  const tempWavFile = path.join(outputFolder, 'temp.wav');

  try {
    await new Promise((resolve, reject) => {
      ffmpeg(audioFilePath)
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(48000)
        .format('wav')
        .on('error', (err) => {
          console.error(`Error converting audio to WAV: ${err.message}`);
          reject(err);
        })
        .on('end', () => {
          console.log('Audio converted to WAV successfully.');
          resolve();
        })
        .save(tempWavFile);
    });

    // Read the WAV data
    const buffer = fs.readFileSync(tempWavFile);
    const decodedData = await wavDecoder.decode(buffer);
    //decodedData.channelData[0].length gives the total number of samples in the audio
    const audioDuration = decodedData.channelData[0].length / decodedData.sampleRate;
    console.log("AUDIO DURATION: "+audioDuration)

    // Calculate the number of chunks
    const numChunks = Math.min(Math.max(Math.ceil(audioDuration * audioDuration), 5), 256);

    const waveform = [];
    const samplesPerChunk = Math.ceil(decodedData.channelData[0].length / numChunks);

    for (let i = 0; i < numChunks; i++) {
      let max = 0;
      for (let j = 0; j < samplesPerChunk; j++) {
        if (i * samplesPerChunk + j < decodedData.channelData[0].length) {
          max = Math.max(max, Math.abs(decodedData.channelData[0][i * samplesPerChunk + j]));
        }
      }
      waveform.push(max); // Store the maximum amplitude value without scaling
    }

    // Normalize the waveform values
    const maxAmplitude = Math.max(...waveform);
    const normalizedWaveform = waveform.map(value => value / maxAmplitude);

    const scaledWaveform = normalizedWaveform.map(value => Math.round(value * 200));

    const myWaveform = btoa(scaledWaveform.map(c => String.fromCharCode(c)).join(''));
    console.log(scaledWaveform);
    console.log(scaledWaveform.length);
    console.log(myWaveform);

    // Remove the temporary WAV file
    fs.unlinkSync(tempWavFile);

    return myWaveform;
  } catch (error) {
    console.error('Error calculating waveform:', error);
    throw error;
  }
};

//SCUFFED TERRIBLE WAVEFORM CALCULATION SINCE I GAVE UP ON TRYING TO DO IT CORRECTLY.
