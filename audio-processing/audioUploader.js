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
const { channelID, authToken } = require('../main.js');

//URL and headers for req
const url = `https://discord.com/api/v9/channels/${channelID}/attachments`;
const headers = { 'Authorization': authToken };

//Read audio file
const file = fs.readFileSync(audioFilePath);

//Form data for post request
const formData = {
  files: [
    {
      filename: path.basename(audioFilePath),
      file_size: file.length,
      id: generateRandomEvenNumber(1000, 9998).toString(),
    },
  ],
};

try {
  //Send a POST req to create a storage URL for the file
  const response = await axios.post(url, formData, {
    headers,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const { upload_url } = response.data.attachments[0];
  logWithColor('Created storage URL:', 35);
  logWithColor(upload_url, 36);

  //Read the audio data from file
  const audioData = fs.readFileSync(path.join(dirPath, path.basename(audioFilePath)));

  //PUT request to upload audioData to storage URL
  await axios.put(upload_url, audioData, {
    headers: {
      'Content-Length': audioData.length,
      'Accept-Encoding': 'gzip, deflate, br',
    },
  });

  logWithColor('File uploaded to URL!', 32);
  const { upload_filename } = response.data.attachments[0];
  return upload_filename;
} catch (error) {
  console.error('Error:', error);
  if (error.response) {
    console.error('Response data:', error.response.data);
  }
}
}

module.exports = sendFile;
