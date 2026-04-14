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

// Gemini settings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
 * @desc    Analyze product photo using Gemini Vision and upload to Cloudinary
 * @access  Private (Manufacturer)
 */
router.post('/analyze', protect, requireRole('manufacturer'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a product photo.' });
    }

    // 1. Upload to Cloudinary
    const cloudinaryResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'product-lister' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    // 2. Prepare Gemini Prompt
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are an expert B2B product specialist. Analyze this product image and generate a professional B2B listing in JSON format.
      
      The output MUST be a valid JSON object with these fields:
      - name: A professional, catchy product name (max 60 chars)
      - shortDescription: A 2-line summary of the product.
      - description: A detailed, persuasive description (3-4 paragraphs) focusing on quality, durability, and business value.
      - category: One from [Textiles, Electronics, Machinery, FMCG, Automotive, Construction, Chemicals, Agriculture, Pharmaceuticals, Furniture, Leather Goods, Plastics, Metal Products, Paper Products].
      - specifications: A flat object with at least 5 key specs (e.g., { "Material": "Grade A Steel", "Weight": "2.5kg", ... }).
      - keyFeatures: An array of 5 bullet points highlighting USPs.
      - seoTags: An array of 8 search-friendly keywords.
      - hsCode: An estimated 4-6 digit HS Code for international shipping.
      - packagingType: Recommended packaging (e.g., "Corrugated Box", "Wooden Crate").

      Be precise. Use industry-standard terminology. Ensure the JSON is valid.
    `;

    const imagePart = fileToGenerativePart(req.file.buffer, req.file.mimetype);
    
    // 3. Call Gemini
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (Gemini sometimes wraps in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI could not generate a valid listing structure.');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);

    res.json({
      success: true,
      imageUrl: cloudinaryResponse.secure_url,
      analysis
    });

  } catch (error) {
    console.error('[PRODUCT_LISTER_ERROR]', error);
    res.status(500).json({ 
      message: 'AI processing failed. Please try again or fill manually.',
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/product-lister/regenerate-field
 * @desc    Regenerate a specific field based on custom instructions
 */
router.post('/regenerate-field', protect, requireRole('manufacturer'), async (req, res) => {
  try {
    const { field, context, instruction } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are a product specialist. I have a listing for "${context.name}".
      Specifically for the field "${field}", here is the current value: "${context.currentValue}".
      
      The user wants to change it with this instruction: "${instruction}".
      
      Return ONLY the improved text for the "${field}" field. Do not include any other text or explanation. 
      If it is a list (like specs or features), return it in a format that can be parsed as a JSON fragment.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const improvedValue = response.text().trim();

    res.json({ success: true, improvedValue });
  } catch (error) {
    res.status(500).json({ message: 'Regeneration failed.' });
  }
});

export default router;
