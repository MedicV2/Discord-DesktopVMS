const fs = require('fs');
const path = require('path');
const sendFile = require('./audio-processing/audioUploader');
const auth = require('./config/auth.json');
const configData = require('./config/config.json');
const recordAudio = require('./audio-processing/microphoneRecorder');
const getDuration = require('./audio-processing/getDuration');
const logWithColor = require('./utils/consoleUtils');

//Get channelID from url
const channelURL = configData.channelURL;
const url = new URL(channelURL);
const channelID = url.pathname.split('/')[3];

if (channelID) {
    console.log('Channel ID:', channelID);
} else {
    console.log('Invalid channel URL format.');
}

const authToken = auth.token;

module.exports = {channelID,authToken};

async function sendAudioFile(audioFilePath, fileDirectory) {
    //Get audio duration
    logWithColor('Step 1: Getting audio duration...', 35);
    const duration = await getDuration(audioFilePath);
    logWithColor('Audio duration: ' + duration + 's\n', 36);

    //Upload audio file
    logWithColor('Step 2: Uploading audio file...', 35);
    const uploadFilename = await sendFile(audioFilePath, fileDirectory);
    logWithColor('Uploaded filename:', 36);
    logWithColor(uploadFilename + '\n', 36);

    //Send file to Discord
    logWithColor('Step 3: Sending file to Discord...', 35);
    await sendDiscordMessage(uploadFilename, duration);
}

//Function to generate random nonce
function generateNonce() {
    const crypto = require('crypto');
    return crypto.randomBytes(8).toString('hex');
}

//Send the actual message to discord
async function sendDiscordMessage(uploadFilename, duration) {
    const axios = require('axios');
    const auth = require('./config/auth.json');

    const url = `https://discord.com/api/v9/channels/${channelID}/messages`;
    const token = auth.token;
    const nonce = generateNonce();

    const headers = {
        'Authorization': token,
        //SUPER PROPERTIES ARE NEEDED TO BE ABLE TO SEND THE VOICE MESSAGE
        //WITHOUT IT IT WILL RESPOND WITH 'Cannot send voice messages in this channel'
        'x-super-properties': 'eyJvcyI6IldpbiIsImJyb3dzZXIiOiJEaXNjb3JkIFBDIiwiZGV2aWNlIjoiRGVza3RvcCIsInN5c3RlbV9sb2NhbGUiOiJlbi1TRSIsImNsaWVudF92ZXJzaW9uIjoiIiwicmVsZWFzZV9jaGFubmVsIjoic3RhYmxlIiwiZGV2aWNlX3ZlbmRvcl9pZCI6IiIsImJyb3dzZXJfdXNlcl9hZ2VudCI6IiIsImJyb3dzZXJfdmVyc2lvbiI6IiIsIm9zX3ZlcnNpb24iOiIiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjo0MzMzOSwiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbCwiZGVzaWduX2lkIjowfQ==',
    };
    const data = {
        "content": "",
        "channel_id": channelID,
        "type": 0,
        "flags": 8192, // 8192 flag = voice message
        "attachments": [{
            "id": "0",
            "filename": uploadFilename.split('/').pop(),
            "uploaded_filename": uploadFilename,// using the uploaded_filename obtained from handleUpload.js which will be the audio file that is sent
            "duration_secs": duration,//is needed to display the right duration in vms
            "waveform": "AMW5wry7s624sra8vr7CrZKvsI6xr51dPw==" //Waveform data not yet figured out so just using a random waveform as preset
        }],
        "nonce": nonce
    };

    try {
        const response = await axios.post(url, data, {
            headers
        });
        logWithColor('Message sent successfully!', 32);
        // console.log('Response:', response.data);
    } catch (error) {
        console.error('Failed to send message:', error.response.data);
    }
}

async function handleCustomAudio(readline, fileDirectory, sendAudioFile) {
fs.readdir(fileDirectory, (err, files) => {
    if (err) {
        console.error('Error reading the custom audio directory:', err);
        process.exit(1);
    }

    console.log('List of available audio files:');
    files.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
    });

    readline.question('Enter the number of the audio file you want to send: ', async (fileIndex) => {
        const chosenFile = files[parseInt(fileIndex) - 1];
        if (!chosenFile) {
            logWithColor('Invalid input. Exiting...', 31);
            process.exit(1);
        }

        audioFilePath = path.join(fileDirectory, chosenFile);
        readline.close();
        await sendAudioFile(audioFilePath, fileDirectory, chosenFile);
    });
});
}

//Cleaned up main function
async function main() {
  logWithColor('Starting script execution...', 33);
  const readline = require('readline').createInterface({input: process.stdin,output: process.stdout,});

  //Ask for input (custom file or mic audio.)
  readline.question('Do you want to upload a custom audio file (c) or record microphone audio (r)? (c/r): ', async (answer) => {
      let audioFilePath;
      let fileDirectory;

      //custom audio
      if (answer.toLowerCase() === 'c') {
          fileDirectory = path.join(__dirname, 'vms', 'customaudio');
          await handleCustomAudio(readline, fileDirectory, sendAudioFile);

      //mic audio
      } else if (answer.toLowerCase() === 'r') {
          audioFilePath = await recordAudio();
          fileDirectory = path.join(__dirname, 'vms');
          readline.close();
          await sendAudioFile(audioFilePath, fileDirectory);

      } else {
          logWithColor('Invalid input. Exiting...', 31);
          process.exit(1);
      }
  });
}

main();
