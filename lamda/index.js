const AWS = require("aws-sdk");
const axios = require("axios");

const rekognition = new AWS.Rekognition();
const s3 = new AWS.S3();

exports.handler = async (event) => {
    try {
        console.log("Event received:", JSON.stringify(event));

        const { bucketName, imageName } = JSON.parse(event.body);

        // Step 1: Extract text from image using AWS Rekognition
        const textParams = {
            Image: { S3Object: { Bucket: bucketName, Name: imageName } }
        };
        const rekognitionResponse = await rekognition.detectText(textParams).promise();
        
        const detectedText = rekognitionResponse.TextDetections.map(text => text.DetectedText);
        console.log("Detected Text:", detectedText);

        // Step 2: Search for the medicine name in OpenFDA API
        const medicineName = detectedText[0]; // Assume first detected word is medicine name
        const openFdaUrl = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${medicineName}`;

        let medicineDetails;
        try {
            const apiResponse = await axios.get(openFdaUrl);
            medicineDetails = apiResponse.data.results[0];
        } catch (error) {
            console.error("Error fetching medicine details:", error);
            medicineDetails = { message: "Medicine details not found." };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ medicineName, medicineDetails }),
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error processing image", error }),
        };
    }
};
