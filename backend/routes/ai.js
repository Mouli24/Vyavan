import express from 'express';

const router = express.Router();

router.post('/analyze-image', async (req, res) => {
  try {
    const { imageUrl, instruction } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the backend server' });
    }

    // 1. Fetch the image and convert to base64
    let base64Image, mimeType;
    if (imageUrl.startsWith('data:image')) {
      const match = imageUrl.match(/^data:(.*?);base64,(.*)$/);
      if (!match) throw new Error("Invalid base64 image data format");
      mimeType = match[1];
      base64Image = match[2];
    } else {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download the image. Server responded with: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      mimeType = response.headers.get('content-type') || 'image/jpeg';
      
      if (mimeType.includes('text/html')) {
        throw new Error('The provided URL links to a webpage (like Google Drive), not a raw image file. The AI cannot see it. Please use a direct image link like Imgur or Postimages.');
      }
      
      base64Image = Buffer.from(buffer).toString('base64');
    }

    // 2. Prepare the prompt
    const extraInstruction = instruction 
      ? `\n\n**User's Specific Goal/Instruction**: "${instruction}"\nPlease heavily prioritize this specific goal in your feedback and ensure your enhancement suggestions directly explain how to achieve it.` 
      : '';

    const promptText = `
You are a product photography expert. Analyze this product image and provide:
1. **Product Type**: What is this product? (e.g., textile, electronics, machinery)
2. **Current Quality Score**: Rate 1-10
3. **Issues Found**: List problems (bad lighting, cluttered background, blur, shadows, etc.)
4. **Enhancement Suggestions**: What improvements are needed?${extraInstruction}

Respond in JSON format:
{
  "product_type": "",
  "quality_score": 0,
  "issues": [],
  "suggestions": [],
  "background_type": "cluttered/plain/studio",
  "lighting_quality": "poor/average/good"
}`;

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const geminiBody = {
      contents: [{
        parts: [
          { text: promptText },
          { inlineData: { mimeType: mimeType, data: base64Image } }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const aiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('Gemini API Error:', errText);
      
      let errorDetail = 'Unknown error';
      try {
         const parsed = JSON.parse(errText);
         errorDetail = parsed.error.message;
      } catch (e) {
         errorDetail = errText;
      }
      
      throw new Error(`Failed to communicate with Gemini AI: ${errorDetail}`);
    }

    const aiData = await aiRes.json();
    
    if (aiData.error) {
       console.error("Gemini Returned Error JSON:", aiData);
       throw new Error(`Gemini API Error: ${aiData.error.message || 'Unknown issue'}`);
    }
    
    // Parse the JSON response
    let jsonString = aiData.candidates[0].content.parts[0].text;
    jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(jsonString);

    res.json(parsedData);
  } catch (error) {
    console.error('AI Processing Error:', error);
    // Explicitly send the exact message so the frontend can alert it!
    res.status(500).json({ message: error.message || 'Error processing AI enhancement' });
  }
});

export default router;
