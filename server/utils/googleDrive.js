const { google } = require('googleapis');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Initialize the Google Drive API
function initializeDrive() {
    try {
        // Using API key authentication for simplicity in this example
        // In production, you should use OAuth2 or service account
        // For more info: https://developers.google.com/drive/api/v3/quickstart/nodejs
        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../credentials.json'),
            scopes: ['https://www.googleapis.com/auth/drive']
        });

        return google.drive({ version: 'v3', auth });
    } catch (error) {
        console.error('Error initializing Google Drive:', error);
        throw error;
    }
}

// Upload a file to Google Drive
async function uploadFileToDrive(fileObject) {
    try {
        const drive = initializeDrive();
        
        const fileMetadata = {
            name: fileObject.originalname,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] // Folder ID in your Google Drive
        };

        const media = {
            mimeType: fileObject.mimetype,
            body: fileObject.buffer
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id,webViewLink'
        });

        // Make the file publicly accessible (or set specific access)
        await drive.permissions.create({
            fileId: response.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        return {
            fileId: response.data.id,
            webViewLink: response.data.webViewLink,
            downloadLink: `https://drive.google.com/uc?export=download&id=${response.data.id}`
        };
    } catch (error) {
        console.error('Error uploading to Google Drive:', error);
        throw error;
    }
}

// Delete a file from Google Drive
async function deleteFileFromDrive(fileId) {
    try {
        const drive = initializeDrive();
        await drive.files.delete({ fileId });
        return true;
    } catch (error) {
        console.error('Error deleting file from Google Drive:', error);
        throw error;
    }
}

module.exports = {
    uploadFileToDrive,
    deleteFileFromDrive
}; 