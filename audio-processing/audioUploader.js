const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logWithColor = require('../utils/consoleUtils');

function generateRandomEvenNumber(min, max) {
  min = Math.ceil(min / 2) * 2; 
  max = Math.floor(max / 2) * 2;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


async function sendFile(audioFilePath, dirPath) {
  const strFile = path.basename(audioFilePath);
  const channelID = require('../main.js').channelID;
  const authToken = require('../main.js').authToken;
  //Post request to ./attachments so discord creates a storage url
  //the filename_url is needed later to send the actual voice message with the right audio file.
  const url = `https://discord.com/api/v9/channels/${channelID}/attachments`;
  const headers = {
    'Authorization': authToken,
  };
  const file = fs.readFileSync(audioFilePath);

  const formData = {
    files: [
      {
        filename: strFile,
        file_size: file.length,
        id: generateRandomEvenNumber(1000, 9998).toString(), //noticed discord only uses even numbers for the id -.-
      },
    ],
  };

  try {
    const response = await axios.post(url, formData, {
      headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const upload_url = response.data.attachments[0].upload_url;
    logWithColor('Created storage URL:', 35);
    logWithColor(upload_url, 36);
    const audioData = fs.readFileSync(path.join(dirPath, strFile));
    //After creating the storage url, making a PUT request to store any file on that url.
    const putResponse = await axios.put(upload_url, audioData, {
      headers: {
        'Content-Length': audioData.length,
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    logWithColor('File uploaded to URL!', 32);
    const uploadFilename = response.data.attachments[0].upload_filename;
    return uploadFilename;
  } catch (error) {
    console.error('Error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

module.exports = sendFile;
