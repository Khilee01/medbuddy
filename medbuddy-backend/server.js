const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { ImageAnnotatorClient } = require("@google-cloud/vision");

const app = express();
const port = 5000;
app.use(cors());

// Google Vision API Client
const client = new ImageAnnotatorClient({
    keyFilename: "your-google-vision-key.json", // Add your API key file
});

// Configure image upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Known medicines array
const knownMedicines = [
    { name: "paracetamol", description: "Used to treat pain and fever." },
    { name: "ibuprofen", description: "Used to reduce fever and relieve pain." },
    { name: "amoxicillin", description: "An antibiotic used to treat bacterial infections." },
    // Add more medicines as needed
];

// Function to extract text using Google Vision API
const extractMedicineName = async (imageBuffer) => {
    try {
        const [result] = await client.textDetection(imageBuffer);
        const detections = result.textAnnotations;
        return detections.length > 0 ? detections[0].description.trim() : null;
    } catch (error) {
        console.error("OCR error:", error);
        return null;
    }
};

// API to process image and get medicine name
app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        const medicineText = await extractMedicineName(req.file.buffer);
        console.log("Extracted Medicine Name:", medicineText);

        if (!medicineText) {
            return res.json({ medicine: null, description: null });
        }

        // Check if the medicine is known
        const medicineEntry = knownMedicines.find(m => m.name.toLowerCase() === medicineText.toLowerCase());
        if (medicineEntry) {
            return res.json({ medicine: medicineEntry.name, description: medicineEntry.description });
        } else {
            return res.json({ medicine: null, description: null });
        }
    } catch (error) {
        console.error("Error processing image:", error);
        res.status(500).json({ error: "Failed to process image" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});