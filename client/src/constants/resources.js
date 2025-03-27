/**
 * Resource constants
 */

export const RESOURCE_CATEGORIES = [
  { id: 'document', name: 'Document', icon: 'file-text' },
  { id: 'video', name: 'Video', icon: 'video' },
  { id: 'image', name: 'Image', icon: 'image' },
  { id: 'audio', name: 'Audio', icon: 'music' },
  { id: 'presentation', name: 'Presentation', icon: 'presentation' },
  { id: 'spreadsheet', name: 'Spreadsheet', icon: 'table' },
  { id: 'archive', name: 'Archive', icon: 'archive' },
  { id: 'code', name: 'Code', icon: 'code' },
  { id: 'other', name: 'Other', icon: 'file' }
];

export const SORT_OPTIONS = [
  { id: 'newest', name: 'Newest First' },
  { id: 'oldest', name: 'Oldest First' },
  { id: 'a-z', name: 'A-Z' },
  { id: 'z-a', name: 'Z-A' },
  { id: 'most-downloaded', name: 'Most Downloaded' },
  { id: 'most-viewed', name: 'Most Viewed' }
];

export const FILE_TYPE_ICONS = {
  // Documents
  'pdf': 'file-text',
  'doc': 'file-text',
  'docx': 'file-text',
  'txt': 'file-text',
  'rtf': 'file-text',
  
  // Spreadsheets
  'xls': 'table',
  'xlsx': 'table',
  'csv': 'table',
  
  // Presentations
  'ppt': 'presentation',
  'pptx': 'presentation',
  
  // Images
  'jpg': 'image',
  'jpeg': 'image',
  'png': 'image',
  'gif': 'image',
  'svg': 'image',
  'webp': 'image',
  
  // Audio
  'mp3': 'music',
  'wav': 'music',
  'ogg': 'music',
  
  // Video
  'mp4': 'video',
  'webm': 'video',
  'avi': 'video',
  'mov': 'video',
  
  // Archives
  'zip': 'archive',
  'rar': 'archive',
  'tar': 'archive',
  'gz': 'archive',
  
  // Code
  'js': 'code',
  'jsx': 'code',
  'ts': 'code',
  'tsx': 'code',
  'html': 'code',
  'css': 'code',
  'json': 'code',
  
  // Default
  'default': 'file'
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB 