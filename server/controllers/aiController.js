const getGeminiApiKey = () => process.env.GEMINI_API_KEY;

// @desc    Handle AI Chat queries restricted to food/calories
// @route   POST /api/ai/chat
const handleChat = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const apiKey = getGeminiApiKey();
        if (!apiKey) {
            return res.status(503).json({
                message: 'AI Service Unavailable: GEMINI_API_KEY is not configured',
                reply: "Chef Akxi is currently off duty (API key not configured). Please consult our menu directly."
            });
        }

        const systemInstruction = `You are Chef Akxi, the AI culinary assistant for the AKXTON smart restaurant. 
        Your ONLY purpose is to provide information about food items, ingredients, calories, nutritional details, and flavor profiles. 
        If a user asks about anything NOT related to food, cooking, or nutrition (e.g., booking, life advice, coding, weather, politics), you MUST politely decline and tell them you can only assist with food-related inquiries.
        Keep your answers concise, appetizing, and informative in plain text (limit markdown). Limit answers to 3-5 sentences maximum.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [
                                { text: systemInstruction + "\\n\\nUser Question: " + message }
                            ]
                        }
                    ]
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        let aiResponse = "I'm sorry, I couldn't process that request right now.";

        if (data.candidates && data.candidates.length > 0) {
            aiResponse = data.candidates[0].content.parts[0].text;
        }

        res.json({ reply: aiResponse });

    } catch (error) {
        console.error("AI Chat Error:", error.message);
        res.status(500).json({ message: 'Failed to communicate with AI endpoint', reply: "My culinary circuits are overloaded at the moment, please try again soon." });
    }
};

module.exports = { handleChat };
