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
            const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../credential.json');
            
            // Check if credential file exists and is readable
            const fs = require('fs');
            
            // Use absolute path to ensure correct file access
            const absoluteCredentialPath = path.isAbsolute(credentialPath) 
                ? credentialPath 
                : path.resolve(__dirname, '../credential.json');
            
            if (!fs.existsSync(absoluteCredentialPath)) {
                throw new Error(`Credential file not found at: ${absoluteCredentialPath}`);
            }
            
            // Read and validate credential file
            const credentialData = JSON.parse(fs.readFileSync(absoluteCredentialPath, 'utf8'));
            
            // Validate private key format
            if (!credentialData.private_key || !credentialData.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
                throw new Error('Invalid private key format in credential file');
            }

            const auth = new google.auth.GoogleAuth({
                keyFile: absoluteCredentialPath,
                scopes: [
                    'https://www.googleapis.com/auth/drive',
                    'https://www.googleapis.com/auth/drive.file'
                ]
            });

            this.drive = google.drive({ version: 'v3', auth });
            console.log('Google Drive service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Google Drive service:', error.message);
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

            // Test authentication first
            try {
                await this.drive.files.list({ pageSize: 1 });
            } catch (authError) {
                console.error('Google Drive authentication failed:', authError.message);
                throw new Error(`Authentication failed: ${authError.message}`);
            }

            const response = await this.drive.files.create({
                requestBody: fileMetadata,
                media: {
                    mimeType: fileObject.mimetype,
                    body: bufferStream
                },
                fields: 'id,webViewLink'
            });

            await this.drive.permissions.create({
                fileId: response.data.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone'
                }
            });

            return {
                fileId: response.data.id,
                webViewLink: response.data.webViewLink,
                downloadLink: `https://drive.google.com/thumbnail?id=${response.data.id}&sz=w400-h400`
            };
        } catch (error) {
            console.error('Error uploading to Google Drive:', error.message);
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    async deleteFile(fileId) {
        try {
            if (!fileId) {
                throw new Error('No file ID provided');
            }

            await this.drive.files.delete({ fileId });
            return true;
        } catch (error) {
            console.error('Error deleting file from Google Drive:', error.message);
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
            console.error('Error getting file info:', error.message);
            throw new Error(`Failed to get file info: ${error.message}`);
        }
    }
}

// Create a singleton instance
const googleDriveService = new GoogleDriveService();

// Wrapper functions for backward compatibility
const uploadToGoogleDrive = async (fileObject, fileName = null) => {
    try {
        // If fileName is provided, use it instead of original name
        if (fileName) {
            fileObject.originalname = fileName;
        }
        
        const result = await googleDriveService.uploadFile(fileObject);
        return {
            fileId: result.fileId,
            fileUrl: result.downloadLink,
            webViewLink: result.webViewLink
        };
    } catch (error) {
        throw error;
    }
};

const deleteFromGoogleDrive = async (fileId) => {
    try {
        return await googleDriveService.deleteFile(fileId);
    } catch (error) {
        throw error;
    }
};

module.exports = {
    googleDriveService,
    uploadToGoogleDrive,
    deleteFromGoogleDrive
}; 