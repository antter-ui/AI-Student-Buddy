module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: "OPENROUTER_API_KEY is not configured on Vercel"
        });
    }

    try {
        const response = await fetch(
            "https://openrouter.ai/api/v1/embeddings",
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

        return res.status(response.status).json(data);

    } catch (error) {
        console.error("Embedding API Error:", error);

        return res.status(500).json({
            error: {
                message: error.message || "Internal server error"
            }
        });
    }
};