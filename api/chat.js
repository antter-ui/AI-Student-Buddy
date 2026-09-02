module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    console.log("API KEY EXISTS:", !!apiKey);
    console.log("API KEY LENGTH:", apiKey ? apiKey.length : 0);

    if (!apiKey) {
        return res.status(500).json({
            error: "OPENROUTER_API_KEY is missing from Vercel"
        });
    }

    try {
        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(req.body)
            }
        );

        const data = await response.json();

        console.log("OpenRouter status:", response.status);

        return res.status(response.status).json(data);

    } catch (error) {
        console.error("Chat API Error:", error);

        return res.status(500).json({
            error: {
                message: error.message
            }
        });
    }
};