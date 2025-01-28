const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const { auth, roleCheck } = require('../middleware/auth.middleware');
const { Group, Channel } = require('../models/group.model');

router.get('/:groupId/join-requests/pending', auth, groupController.getPendingJoinRequests);
router.put('/:groupId/join-requests/:userId', auth, (req, res) => {
    req.params.action = req.body.action;
    groupController.handleJoinRequest(req, res);
});

// Existing routes
router.get('/', auth, groupController.getGroups);
router.get('/:id', auth, groupController.getGroupById);
router.post('/', auth, roleCheck(['group_admin', 'super_admin']), groupController.createGroup);
// Change this route
router.post('/:groupId/request-join', auth, groupController.joinGroup);
router.post('/:groupId/members', auth, roleCheck(['group_admin', 'super_admin']), groupController.addMember);
router.post('/:groupId/channels', auth, groupController.addChannel);
router.delete('/:groupId/channels/:channelId', auth, groupController.removeChannel);
router.get('/check-name/:name', auth, groupController.checkGroupName);

// New promotion-related routes
router.post('/:groupId/request-promotion', auth, groupController.requestGroupAdminPromotion);
router.post('/promotion-requests/:requestId/handle', auth, roleCheck(['super_admin']), groupController.handlePromotionRequest);
router.get('/promotion-requests/pending', auth, roleCheck(['super_admin']), groupController.getPendingPromotionRequests);
router.post('/:groupId/promote-group-admin/:userId', auth, roleCheck(['super_admin']), groupController.promoteToGroupAdmin);
router.post('/promote-super-admin/:userId', auth, roleCheck(['super_admin']), groupController.promoteToSuperAdmin);
router.delete('/:groupId/members/:userId', auth, roleCheck(['super_admin']), groupController.removeUser);

// Remove this block:
router.delete('/:id', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        await Group.findByIdAndDelete(req.params.id);
        res.json({ message: 'Group deleted successfully' });
        
    } catch (error) {
        console.error('Error in delete route:', error);
        res.status(500).json({
            error: 'Failed to delete group',
            message: error.message
        });
    }
});

// Replace with:
router.delete('/:id', auth, groupController.deleteGroup);
// Create test group
router.post('/createTest', auth, async (req, res) => {
    try {
        console.log('Creating test group, user:', req.user);
        const timestamp = new Date().getTime();
        const group = await Group.create({
            name: `Test Group ${timestamp}`,
            description: 'Test Description',
            createdBy: req.user._id,
            admins: [req.user._id],
            members: [req.user._id]
        });
        
        const populatedGroup = await Group.findById(group._id)
            .populate('channels')
            .populate('members', 'username')
            .populate('admins', 'username');

        console.log('Test group created with admins:', populatedGroup.admins);
        res.json(populatedGroup);
    } catch (err) {
        console.error('Error creating test group:', err);
        res.status(400).json({ error: err.message });
    }
});

// Leave group
router.post('/:groupId/leave', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Remove user from members
        group.members = group.members.filter(
            memberId => memberId.toString() !== req.user._id.toString()
        );
        await group.save();

        const populatedGroup = await Group.findById(group._id)
            .populate('channels')
            .populate('members', 'username')
            .populate('admins', 'username');

        res.json(populatedGroup);
    } catch (err) {
        console.error('Error leaving group:', err);
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;