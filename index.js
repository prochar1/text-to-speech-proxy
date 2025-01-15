require('dotenv').config();
const express = require('express');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const NodeCache = require('node-cache');

const app = express();
const port = process.env.PORT || 3001;

console.log(123);

// Serve static files from public directory
app.use(express.static('test'));

// Initialize Google Cloud client
const client = new TextToSpeechClient({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

// Initialize cache
const cache = new NodeCache();

// Add JSON parsing middleware
app.use(express.json());

app.post('/text-to-speech', async (req, res) => {
  const { text, voice, speed } = req.body;

  // Check cache first
  const cachedResult = cache.get(text);
  if (cachedResult) {
    return res.contentType('audio/mpeg').send(cachedResult);
  }

  try {
    const request = {
      input: { text },
      voice: { languageCode: 'en-US', name: voice },
      audioConfig: { audioEncoding: 'MP3', speakingRate: speed },
    };

    const [response] = await client.synthesizeSpeech(request);
    const audioBuffer = response.audioContent;

    // Save to cache
    cache.set(text, audioBuffer);

    // Send response
    res.contentType('audio/mpeg').send(audioBuffer);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Error processing request');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server běží na portu ${port}`);
});
