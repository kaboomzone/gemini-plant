const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = 3000;

const genAI = new GoogleGenerativeAI("AIzaSyAau65MXego_giHG7ObKeybKFKyCm_U9AU");

function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString('base64'),
      mimeType
    },
  };
}

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
  });

app.post('/process-images', upload.fields([{ name: 'image' }]), async (req, res) => {
  try {
    const imagePath = req.files['image'][0].path;

    const prompt = "What's should be the disease of plant and treatment and preventions? give the response as a json only,if there is no plant in picture give value of disease as This image does not contain a plant, and therefore does not depict any plant diseases";

    const imageParts = [
      fileToGenerativePart(imagePath, 'image/jpeg'),
    ];

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    fs.unlinkSync(imagePath);
    const cleanText = text.replace(/```json|```/g, '').trim();
    const jsonResponse = JSON.parse(cleanText);
    console.log(jsonResponse.disease);
    res.json({ jsonResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process images.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
