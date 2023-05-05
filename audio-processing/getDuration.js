const { getAudioDurationInSeconds } = require('get-audio-duration');

async function getDuration(filePath) {
  const duration = await getAudioDurationInSeconds(filePath);
  return duration;
}

module.exports = getDuration;