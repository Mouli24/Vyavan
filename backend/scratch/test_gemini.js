import 'dotenv/config';
// Node.js 18+ has global fetch

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key found in .env");
        return;
    }

    const versions = ['v1', 'v1beta'];
    
    for (const v of versions) {
        console.log(`--- Testing API version: ${v} ---`);
        const listModelsUrl = `https://generativelanguage.googleapis.com/${v}/models?key=${apiKey}`;
        
        try {
            const res = await fetch(listModelsUrl);
            const data = await res.json();
            
            if (res.ok) {
                console.log(`Successfully listed models for ${v}:`);
                const geminiModels = data.models
                    .filter(m => m.name.includes('gemini'))
                    .map(m => m.name);
                console.log(geminiModels);
                
                if (geminiModels.length > 0) {
                   // Test the first one
                   const modelName = geminiModels[0].split('/').pop();
                   console.log(`Testing first available model: ${modelName}`);
                   const testUrl = `https://generativelanguage.googleapis.com/${v}/models/${modelName}:generateContent?key=${apiKey}`;
                   const testRes = await fetch(testUrl, {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] })
                   });
                   const testData = await testRes.json();
                   if (testRes.ok) {
                       console.log(`  [OK] Model ${modelName} responded.`);
                   } else {
                       console.log(`  [FAIL] Model ${modelName} error: ${testData.error?.message || JSON.stringify(testData)}`);
                   }
                }
            } else {
                console.error(`Failed to list models for ${v}:`, data.error?.message || data);
            }
        } catch (err) {
            console.error(`Fetch error for ${v}:`, err.message);
        }
    }
}

testGemini();
