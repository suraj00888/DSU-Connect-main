const { uploadFileToDrive, deleteFileFromDrive } = require('../utils/googleDrive');
const fs = require('fs');
const path = require('path');

// This is a simple test to verify Google Drive integration
// You would normally use a testing framework like Jest for this

async function testDriveIntegration() {
    try {
        console.log('Starting Google Drive test...');
        
        // Create a test file
        const testFilePath = path.join(__dirname, 'test-file.txt');
        fs.writeFileSync(testFilePath, 'This is a test file for Google Drive integration');
        
        // Mock file object to match multer's format
        const fileObject = {
            originalname: 'test-file.txt',
            mimetype: 'text/plain',
            buffer: fs.readFileSync(testFilePath)
        };
        
        // Test upload
        console.log('Uploading test file...');
        const uploadResult = await uploadFileToDrive(fileObject);
        console.log('Upload result:', uploadResult);
        
        // Test delete
        console.log('Deleting test file...');
        const deleteResult = await deleteFileFromDrive(uploadResult.fileId);
        console.log('Delete result:', deleteResult);
        
        // Clean up local test file
        fs.unlinkSync(testFilePath);
        
        console.log('Test completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testDriveIntegration();
}

module.exports = { testDriveIntegration }; 