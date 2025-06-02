const express = require('express');
const resourceController = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');
const { googleDriveService } = require('../utils/googleDrive');

const router = express.Router();

// POST /api/resources/upload - Upload a resource
router.post('/upload', protect, resourceController.uploadResource);

// GET /api/resources - Get all resources with filtering
router.get('/', resourceController.getResources);

// GET /api/resources/:id - Get a specific resource
router.get('/:id', resourceController.getResource);

// DELETE /api/resources/:id - Delete a resource
router.delete('/:id', protect, resourceController.deleteResource);

// POST /api/resources/:id/download - Track resource download
router.post('/:id/download', resourceController.trackDownload);

// GET /api/resources/test/env - Test environment variables
router.get('/test/env', (req, res) => {
    try {
        console.log('=== ENVIRONMENT VARIABLES TEST ===');
        
        const envVars = {
            // Database
            MONGO_URI: process.env.MONGO_URI ? '✓ Set' : '✗ Missing',
            
            // JWT
            JWT_SECRET: process.env.JWT_SECRET ? '✓ Set' : '✗ Missing',
            
            // Server
            PORT: process.env.PORT || 'Using default (5000)',
            CLIENT_URL: process.env.CLIENT_URL || 'Using default (http://localhost:5173)',
            
            // Google Drive
            GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ? '✓ Set' : '✗ Missing',
            GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID ? '✓ Set' : '✗ Missing',
            
            // Email (if used)
            EMAIL_USER: process.env.EMAIL_USER ? '✓ Set' : '✗ Missing',
            EMAIL_PASS: process.env.EMAIL_PASS ? '✓ Set' : '✗ Missing'
        };
        
        console.log('Environment Variables Status:', envVars);
        
        // Check if Google Drive credentials file exists
        const fs = require('fs');
        const path = require('path');
        const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../credential.json');
        const credentialExists = fs.existsSync(credentialPath);
        
        console.log('Credential file check:', {
            path: credentialPath,
            exists: credentialExists ? '✓ Found' : '✗ Not Found'
        });
        
        res.json({
            success: true,
            message: 'Environment variables test',
            data: {
                environmentVariables: envVars,
                credentialFile: {
                    path: credentialPath,
                    exists: credentialExists
                },
                nodeEnv: process.env.NODE_ENV || 'development',
                currentWorkingDirectory: process.cwd()
            }
        });
        
    } catch (error) {
        console.error('Environment test error:', error);
        res.status(500).json({
            success: false,
            message: 'Environment test failed',
            error: error.message
        });
    }
});

// GET /api/resources/test/drive - Test Google Drive connection
router.get('/test/drive', async (req, res) => {
    try {
        console.log('=== GOOGLE DRIVE CONNECTION TEST ===');
        
        // Test basic authentication
        const drive = googleDriveService.drive;
        
        // Test 1: Simple API call to list files
        console.log('Test 1: Basic authentication test...');
        const listResponse = await drive.files.list({ pageSize: 1 });
        console.log('Test 1: ✓ Authentication successful');
        
        // Test 2: Check if folder exists and is accessible
        console.log('Test 2: Folder access test...');
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        if (folderId) {
            try {
                const folderResponse = await drive.files.get({ fileId: folderId });
                console.log('Test 2: ✓ Folder accessible:', folderResponse.data.name);
            } catch (folderError) {
                console.log('Test 2: ✗ Folder access failed:', folderError.message);
                return res.json({
                    success: false,
                    message: 'Folder access failed',
                    error: folderError.message,
                    suggestions: [
                        'Check if folder ID is correct',
                        'Verify service account has access to the folder',
                        'Ensure folder exists and is not deleted'
                    ]
                });
            }
        }
        
        // Test 3: Check service account permissions
        console.log('Test 3: Permission test...');
        const aboutResponse = await drive.about.get({ fields: 'user' });
        console.log('Test 3: ✓ Service account info:', aboutResponse.data.user);
        
        console.log('=== ALL TESTS PASSED ===');
        
        res.json({
            success: true,
            message: 'Google Drive connection successful',
            tests: {
                authentication: '✓ Passed',
                folderAccess: '✓ Passed',
                permissions: '✓ Passed'
            },
            serviceAccount: aboutResponse.data.user
        });
        
    } catch (error) {
        console.error('=== GOOGLE DRIVE TEST FAILED ===');
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            status: error.status,
            errors: error.errors
        });
        
        let errorAnalysis = 'Unknown error';
        if (error.message.includes('invalid_grant')) {
            if (error.message.includes('Invalid JWT Signature')) {
                errorAnalysis = 'JWT Signature Error - Possible causes: Invalid private key, expired credentials, or wrong service account configuration';
            } else {
                errorAnalysis = 'Invalid Grant Error - Possible causes: Service account disabled, project issues, or API access revoked';
            }
        } else if (error.code === 403) {
            errorAnalysis = 'Permission Denied - Service account lacks necessary permissions';
        } else if (error.code === 404) {
            errorAnalysis = 'Not Found - Check if APIs are enabled or resources exist';
        }
        
        res.status(500).json({
            success: false,
            message: 'Google Drive connection failed',
            error: error.message,
            errorCode: error.code,
            analysis: errorAnalysis,
            troubleshooting: [
                'Regenerate service account key',
                'Check Google Cloud Console for project status',
                'Verify Google Drive API is enabled',
                'Ensure service account is not disabled'
            ]
        });
    }
});

module.exports = router; 