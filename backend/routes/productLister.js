import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ── Configuration ────────────────────────────────────────────────────────────

// Multer settings (Memory storage)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Cloudinary settings
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Gemini settings (Initialized inside routes to ensure fresh env variables)
const getGenAI = () => {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  return new GoogleGenerativeAI(key, { apiVersion: 'v1' });
};


// ── Helpers ──────────────────────────────────────────────────────────────────

function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/product-lister/analyze
 * @desc    Analyze dual product photos (front & back) using Gemini Vision and upload to Cloudinary
 * @access  Private (Manufacturer)
 */
router.post('/analyze', protect, requireRole('manufacturer'), upload.fields([
  { name: 'front', maxCount: 1 },
  { name: 'back', maxCount: 1 }
]), async (req, res) => {
  try {
    // Check for required env variables
    const missingKeys = [];
    if (!process.env.CLOUDINARY_CLOUD_NAME) missingKeys.push('CLOUDINARY_CLOUD_NAME');
    if (!process.env.CLOUDINARY_API_KEY) missingKeys.push('CLOUDINARY_API_KEY');
    if (!process.env.CLOUDINARY_API_SECRET) missingKeys.push('CLOUDINARY_API_SECRET');
    if (!process.env.GEMINI_API_KEY) missingKeys.push('GEMINI_API_KEY');

    if (missingKeys.length > 0) {
      console.error('[CONFIG_ERROR] Missing environment variables:', missingKeys.join(', '));
      return res.status(500).json({ 
        message: 'Server configuration error. Missing: ' + missingKeys.join(', '),
        error: 'MISSING_ENV_VARS'
      });
    }

    const key = (process.env.GEMINI_API_KEY || '').trim();
    console.log(`🤖 Using Gemini Key: ${key.substring(0, 4)}...${key.substring(key.length - 4)} (Length: ${key.length})`);

    const frontFile = req.files?.front?.[0];
    const backFile = req.files?.back?.[0];

    if (!frontFile && !backFile) {
      return res.status(400).json({ message: 'Please upload at least one product photo (Front or Back).' });
    }

    console.log('📸 Processing images:', 
      frontFile ? `Front: ${frontFile.originalname}` : 'No Front',
      '|',
      backFile ? `Back: ${backFile.originalname}` : 'No Back'
    );

    // 1. Upload to Cloudinary
    let cloudinaryUrls = {};
    const uploadToCloudinary = async (file, folderName) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'product-lister' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        uploadStream.end(file.buffer);
      });
    };

    try {
      if (frontFile) cloudinaryUrls.front = await uploadToCloudinary(frontFile);
      if (backFile) cloudinaryUrls.back = await uploadToCloudinary(backFile);
      console.log('✅ Images uploaded to Cloudinary:', cloudinaryUrls);
    } catch (uploadError) {
      console.error('[CLOUDINARY_UPLOAD_ERROR]', uploadError);
      throw new Error('Failed to upload images to Cloudinary: ' + uploadError.message);
    }

    // 2. Prepare Gemini Prompt
    const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are an expert B2B product specialist. Analyze these product images (Front and/or Back) and generate a professional B2B listing in JSON format.
      
      - THE FRONT IMAGE contains the branding, product name, and visual appeal.
      - THE BACK IMAGE contains the technical specifications, materials, certifications, HS codes, and company details.
      
      Combine information from BOTH images to fill this JSON structure:
      {
        "name": "Professional product name",
        "category": "One from [Textiles, Electronics, Machinery, FMCG, Automotive, Construction, Chemicals, Agriculture, Pharmaceuticals, Furniture, Leather Goods, Plastics, Metal Products, Paper Products]",
        "shortDescription": "2-line summary",
        "description": "3-4 paragraphs focusing on business value",
        "specs": { "Key": "Value", ... },
        "keyFeatures": ["bullet 1", "bullet 2", ...],
        "seoTags": ["tag1", "tag2", ...],
        "hsCode": "estimated HS Code",
        "packagingType": "Recommended packaging type",
        "suggestedPrice": 0,
        "suggestedMoq": 0
      }

      Be precise and professional.
    `;

    const imageParts = [];
    if (frontFile) imageParts.push(fileToGenerativePart(frontFile.buffer, frontFile.mimetype));
    if (backFile) imageParts.push(fileToGenerativePart(backFile.buffer, backFile.mimetype));
    
    // 3. Call Gemini
    console.log('🤖 Sending to Gemini for analysis...');
    let result;
    try {
      result = await model.generateContent([prompt, ...imageParts]);
    } catch (aiError) {
      console.error('[GEMINI_AI_ERROR]', aiError);
      let errMsg = aiError.message;
      
      // Attempt to extract more specific error info if available
      if (aiError.response?.status === 400 || aiError.status === 400) {
        errMsg = "Bad Request: Check if your API key or model name is correct.";
      } else if (aiError.response?.status === 404 || aiError.status === 404) {
        errMsg = "Model Not Found: The model name 'gemini-2.0-flash-exp' might not be available in your region.";
      } else if (aiError.response?.status === 429 || aiError.status === 429) {
        errMsg = "Quota Exceeded: You have reached your Gemini API limit.";
      }
      
      throw new Error('Gemini AI failed: ' + errMsg);
    }

    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (Gemini sometimes wraps in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[PARSE_ERROR] No JSON found in Gemini response:', text);
      throw new Error('AI could not generate a valid listing structure.');
    }
    
    let analysis;
    try {
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[JSON_PARSE_ERROR] Failed to parse Gemini response:', jsonMatch[0]);
      throw new Error('Failed to parse AI response.');
    }

    console.log('🎉 Analysis complete for:', analysis.name);

    res.json({
      success: true,
      cloudinaryUrls,
      analysis
    });

  } catch (error) {
    console.error('[PRODUCT_LISTER_ERROR]', error.message);
    res.status(500).json({ 
      message: error.message || 'AI processing failed. Please try again or fill manually.',
      error: error.name
    });
  }
});

router.post('/extract-multi', protect, upload.array('images', 2), async (req, res) => {
  try {
    const key = (process.env.GEMINI_API_KEY || '').trim();
    if (!key) {
      return res.status(500).json({ message: 'GEMINI_API_KEY not configured' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one product photo.' });
    }

    // 1. Upload all images to Cloudinary
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'product-lister' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
    });

    const cloudinaryResults = await Promise.all(uploadPromises);
    const imageUrls = cloudinaryResults.map(r => r.secure_url);

    // 2. Prepare Gemini Prompt for multi-image analysis
    const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are an expert B2B product specialist. I am providing you with ${req.files.length} images of a product (likely front and back).
      Analyze these images and generate a professional B2B listing in JSON format.
      
      The output MUST be a valid JSON object with these fields:
      - name: A professional, catchy product name (max 60 chars)
      - category: One from [Textiles, Electronics, Machinery, FMCG, Automotive, Construction, Chemicals, Agriculture, Pharmaceuticals, Furniture, Leather Goods, Plastics, Metal Products, Paper Products].
      - description: A detailed, persuasive description (3-4 paragraphs) focusing on quality, durability, and business value.
      - specs: A flat object with at least 5 key specs (e.g., { "Material": "Grade A Steel", "Weight": "2.5kg", ... }).
      - pricing_guess: A reasonable base price in INR (number only).
      - moq_guess: A reasonable minimum order quantity (number only).
      - payment_terms_guess: An array of 2-3 common payment terms like ["Advance Payment", "Net 30"].

      Be precise. Use information from both images to fill details. If some info is missing, use your expert knowledge to provide a realistic industry-standard value.
    `;

    const imageParts = req.files.map((file, i) => fileToGenerativePart(file.buffer, file.mimetype));
    
    // 3. Call Gemini
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI could not generate a valid listing structure.');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);

    res.json({
      success: true,
      imageUrls,
      analysis
    });

  } catch (error) {
    console.error('[EXTRACT_MULTI_ERROR]', error);
    res.status(500).json({ 
      message: error.message || 'AI extraction failed. Please try again or fill manually.' 
    });
  }
});

/**
 * @route   POST /api/product-lister/regenerate-field
 * @desc    Regenerate a specific field based on user instruction and context
 */
router.post('/regenerate-field', protect, async (req, res) => {
  try {
    const { field, instruction, context } = req.body;
    if (!field || !instruction) {
      return res.status(400).json({ message: 'Missing field or instruction' });
    }

    const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are an expert B2B product specialist. The user wants to regenerate the "${field}" of a product listing.
      
      USER INSTRUCTION: "${instruction}"
      CURRENT CONTEXT/VALUE: "${context || 'None'}"

      Respond ONLY with the requested field's new content. No JSON, no explanations. Just the raw text.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    res.json({ success: true, value: text });

  } catch (error) {
    console.error('[REGENERATE_FIELD_ERROR]', error);
    res.status(500).json({ message: 'Failed to regenerate field' });
  }
});

export default router;


