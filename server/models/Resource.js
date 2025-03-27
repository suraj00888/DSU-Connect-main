const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const resourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['lecture_notes', 'project_files', 'assignments', 'textbooks', 'presentations', 'other']
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    driveFileId: {
        type: String,
        required: true
    },
    uploader: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: {
            type: String,
            required: true
        }
    },
    downloads: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Add indexes for efficient searching
resourceSchema.index({ title: 'text', description: 'text', tags: 'text' });
resourceSchema.index({ category: 1 });
resourceSchema.index({ 'uploader.id': 1 });

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource; 