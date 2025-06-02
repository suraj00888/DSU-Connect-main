const Group = require('../models/Group');
const Message = require('../models/Message');
const { validateObjectId } = require('../utils/validators');

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can create groups'
      });
    }

    const group = new Group({
      name,
      description,
      category,
      createdBy: req.user._id
    });

    await group.save();

    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create group'
    });
  }
};

// Get all groups
exports.getGroups = async (req, res) => {
  try {
    const { category, search, filter } = req.query;
    const query = { isActive: true };

    // Add category filter if provided
    if (category) {
      query.category = category;
    }

    // Add filter for "joined" or "created" groups
    if (filter === 'joined') {
      query.members = req.user._id;
    } else if (filter === 'created') {
      query.createdBy = req.user._id;
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const groups = await Group.find(query)
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort('-createdAt');

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch groups'
    });
  }
};

// Get single group
exports.getGroup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    const group = await Group.findById(id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch group'
    });
  }
};

// Update group
exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin or creator
    if (req.user.role !== 'admin' && group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this group'
      });
    }

    // Update fields
    if (name) group.name = name;
    if (description) group.description = description;
    if (category) group.category = category;

    await group.save();

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update group'
    });
  }
};

// Delete group
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin or creator
    if (req.user.role !== 'admin' && group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this group'
      });
    }

    // Soft delete by setting isActive to false
    group.isActive = false;
    await group.save();

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete group'
    });
  }
};

// Join group
exports.joinGroup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is already a member
    if (group.members.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group'
      });
    }

    // Add user to members array
    group.members.push(req.user._id);
    await group.save();

    res.json({
      success: true,
      message: 'Successfully joined the group'
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to join group'
    });
  }
};

// Leave group
exports.leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a member
    if (!group.members.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Check if user is the creator
    if (group.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Group creator cannot leave the group'
      });
    }

    // Remove user from members array
    group.members = group.members.filter(
      memberId => memberId.toString() !== req.user._id.toString()
    );
    await group.save();

    res.json({
      success: true,
      message: 'Successfully left the group'
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to leave group'
    });
  }
}; 