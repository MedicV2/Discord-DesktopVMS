const ffmpeg = require('fluent-ffmpeg');

function getDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (error, metadata) => {
      if (error) {
        console.error(`Error reading metadata: ${error.message}`);
        reject(error);
      }

      const duration = metadata.format.duration.toFixed(2);
      console.log(duration);
      resolve(duration);
    });
  });
}

module.exports = getDuration;
