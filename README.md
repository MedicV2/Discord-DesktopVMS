# Discord Desktop Voice Messaging

Unlock the power of voice messaging on Discord's desktop app! This project enables users to easily send voice messages through their PC, bringing the convenience of Discord's mobile voice messaging feature to your desktop experience.

## Table of Contents
- [Requirements](#requirements)
- [Setup](#setup)
- [Usage](#usage)

## Requirements

1. Install [SoX](http://sox.sourceforge.net/), a command-line utility that can convert, process, and play audio files. It is required for handling audio recording and processing.

## Setup

1. Clone this repository:
```
git clone https://github.com/MedicV2/Discord-Desktop-VMS.git
```

2. Navigate to the project folder:
```
cd discord-desktop-voice
```

3. Install the necessary dependencies:
```
npm install
```

4. Set up your authentication token:
    - Open the `auth.json` file.
    - Replace the `token` value with your Discord authentication token.

5. Configure the target channel:
    - Open the `config.json` file.
    - Replace the `channelURL` value with a message URL from the DM or server channel where you want to send the voice message.

## Usage

1. Run the application:
```
node script.js
```

2. Follow the prompts to either upload a custom audio file or record microphone audio.

3. The voice message will be sent to the specified channel.

Enjoy the convenience of sending voice messages on Discord's desktop app!

---
