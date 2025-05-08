const { google } = require('googleapis');
const path = require('path');
const { Readable } = require('stream');

class GoogleDriveService {
    constructor() {
        this.drive = null;
        this.initialize();
    }

    initialize() {
        try {
            const auth = new google.auth.GoogleAuth({
                keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../credential.json'),
                scopes: ['https://www.googleapis.com/auth/drive']
            });

            this.drive = google.drive({ version: 'v3', auth });
            console.log('Google Drive service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Google Drive service:', error);
            throw new Error('Google Drive service initialization failed');
        }
    }

    async uploadFile(fileObject) {
        try {
            if (!fileObject || !fileObject.buffer) {
                throw new Error('No file data provided');
            }

            if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
                throw new Error('GOOGLE_DRIVE_FOLDER_ID is not configured');
            }

            const fileMetadata = {
                name: fileObject.originalname,
                parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
            };

            const bufferStream = new Readable();
            bufferStream.push(fileObject.buffer);
            bufferStream.push(null);

            console.log(`Uploading file: ${fileObject.originalname}`);

            const response = await this.drive.files.create({
                requestBody: fileMetadata,
                media: {
                    mimeType: fileObject.mimetype,
                    body: bufferStream
                },
                fields: 'id,webViewLink'
            });

            console.log('File uploaded successfully, setting permissions...');

            await this.drive.permissions.create({
                fileId: response.data.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone'
                }
            });

            console.log('File permissions set successfully');

            return {
                fileId: response.data.id,
                webViewLink: response.data.webViewLink,
                downloadLink: `https://drive.google.com/uc?export=download&id=${response.data.id}`
            };
        } catch (error) {
            console.error('Error uploading to Google Drive:', {
                message: error.message,
                code: error.code,
                errors: error.errors
            });
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    async deleteFile(fileId) {
        try {
            if (!fileId) {
                throw new Error('No file ID provided');
            }

            console.log(`Deleting file with ID: ${fileId}`);
            await this.drive.files.delete({ fileId });
            console.log('File deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting file from Google Drive:', error);
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    async getFileInfo(fileId) {
        try {
            if (!fileId) {
                throw new Error('No file ID provided');
            }

            const response = await this.drive.files.get({
                fileId,
                fields: 'id,name,webViewLink,size,mimeType'
            });

            return {
                fileId: response.data.id,
                name: response.data.name,
                webViewLink: response.data.webViewLink,
                size: response.data.size,
                mimeType: response.data.mimeType
            };
        } catch (error) {
            console.error('Error getting file info:', error);
            throw new Error(`Failed to get file info: ${error.message}`);
        }
    }
}

// Create a singleton instance
const googleDriveService = new GoogleDriveService();

module.exports = googleDriveService; 