// functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stringSimilarity = require('string-similarity');

admin.initializeApp();
const db = admin.firestore();

// Predefined existing titles (can be moved to Firestore for scalability)
const existingTitles = [
    "A Study on AI",
    "Innovations in Software",
    "Exploring Hardware Systems",
    "Advanced Machine Learning Techniques",
    "Software Development Life Cycle",
];

// Cloud Function to check title similarity
exports.checkTitle = functions.https.onRequest(async (req, res) => {
    // Enable CORS (optional, adjust as needed)
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).send({ error: 'Method Not Allowed' });
        return;
    }

    try {
        const { name, stream, date, topic, title, email } = req.body;

        // Validate input
        if (!name || !stream || !date || !topic || !title || !email) {
            res.status(400).send({ error: 'Missing required fields.' });
            return;
        }

        // Check similarity
        const matches = stringSimilarity.findBestMatch(title.toLowerCase(), existingTitles.map(t => t.toLowerCase()));
        const bestMatch = matches.bestMatch;

        const similarityThreshold = 0.8; // Adjust threshold as needed

        if (bestMatch.rating >= similarityThreshold) {
            res.json({
                isSimilar: true,
                existingTitle: existingTitles[matches.bestMatchIndex],
                similarity: bestMatch.rating
            });
        } else {
            // Optionally, save the unique title to Firestore
            await db.collection('titles').add({
                name,
                stream,
                date,
                topic,
                title,
                email,
                comments: req.body.comments || '',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            res.json({ isSimilar: false });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});
