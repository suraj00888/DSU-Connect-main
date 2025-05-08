const Resource = require('../models/Resource');
const googleDriveService = require('../utils/googleDrive');
const multer = require('multer');
const { promisify } = require('util');

// Set up multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).single('file');

// Promisify multer middleware
const uploadMiddleware = promisify(upload);

/**
 * Upload a new resource
 */
exports.uploadResource = async (req, res) => {
    try {
        // Handle file upload using multer
        await uploadMiddleware(req, res);
        
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: 'Please upload a file' 
            });
        }
        
        // Validate request body
        const { title, description, category, tags } = req.body;
        
        if (!title || !description || !category) {
            return res.status(400).json({ 
                success: false,
                message: 'Title, description, and category are required' 
            });
        }
        
        // Upload file to Google Drive
        const driveData = await googleDriveService.uploadFile(req.file);
        
        // Create new resource document
        const resource = new Resource({
            title,
            description,
            category,
            fileUrl: driveData.downloadLink,
            fileType: req.file.mimetype,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            driveFileId: driveData.fileId,
            uploader: {
                id: req.user._id,
                name: req.user.name
            },
            tags: tags ? JSON.parse(tags) : []
        });
        
        // Save resource to database
        await resource.save();
        
        res.status(201).json({
            success: true,
            message: 'Resource uploaded successfully',
            data: resource
        });
        
    } catch (error) {
        console.error('Error uploading resource:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Server error'
        });
    }
};

/**
 * Get all resources with filtering and pagination
 */
exports.getResources = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            category, 
            search,
            uploader
        } = req.query;
        
        // Build query
        const query = {};
        
        // Add filters if provided
        if (category) query.category = category;
        if (uploader) query['uploader.id'] = uploader;
        
        // Add search functionality
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get resources
        const resources = await Resource.find(query)
            .sort({ createdAt: -1 })  // Most recent first
            .skip(skip)
            .limit(parseInt(limit));
            
        // Count total resources that match the query
        const total = await Resource.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                resources,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching resources'
        });
    }
};

/**
 * Get a single resource by ID
 */
exports.getResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        
        if (!resource) {
            return res.status(404).json({ 
                success: false,
                message: 'Resource not found' 
            });
        }
        
        // Increment view count
        resource.views += 1;
        await resource.save();
        
        res.json({
            success: true,
            data: resource
        });
        
    } catch (error) {
        console.error('Error fetching resource:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching resource'
        });
    }
};

/**
 * Delete a resource
 */
exports.deleteResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        
        if (!resource) {
            return res.status(404).json({ 
                success: false,
                message: 'Resource not found' 
            });
        }
        
        // Check if user is authorized to delete (admin or uploader)
        const isAdmin = req.user.role === 'admin';
        const isUploader = resource.uploader.id.toString() === req.user._id.toString();
        
        if (!isAdmin && !isUploader) {
            return res.status(403).json({ 
                success: false,
                message: 'You are not authorized to delete this resource' 
            });
        }
        
        // Delete file from Google Drive
        await googleDriveService.deleteFile(resource.driveFileId);
        
        // Delete resource from database
        await Resource.findByIdAndDelete(req.params.id);
        
        res.json({ 
            success: true,
            message: 'Resource deleted successfully' 
        });
        
    } catch (error) {
        console.error('Error deleting resource:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Error deleting resource'
        });
    }
};

/**
 * Track resource download
 */
exports.trackDownload = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        
        if (!resource) {
            return res.status(404).json({ 
                success: false,
                message: 'Resource not found' 
            });
        }
        
        // Increment download count
        resource.downloads += 1;
        await resource.save();
        
        // Get updated file info from Google Drive
        const fileInfo = await googleDriveService.getFileInfo(resource.driveFileId);
        
        res.json({ 
            success: true,
            data: {
                downloadUrl: resource.fileUrl,
                webViewLink: fileInfo.webViewLink,
                message: 'Download count updated'
            }
        });
        
    } catch (error) {
        console.error('Error tracking download:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Error tracking download'
        });
    }
}; 