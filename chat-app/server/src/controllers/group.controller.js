const { Group, Channel, PromotionRequest } = require('../models/group.model');
const User = require('../models/user.model');

const groupController = {
    getGroups: async (req, res) => {
        try {
            const groups = await Group.find({})
                .populate({
                    path: 'channels',
                    select: 'name description messages'
                })
                .populate('members', 'username')
                .populate('admins', 'username')
                .populate('createdBy', 'username')
                .populate('joinRequests.userId', 'username');
    
            const groupsWithMembership = groups.map(group => {
                // Check if user is a member
                const isMember = group.members.some(member => 
                    member._id.toString() === req.user._id.toString()
                );
                
                // Check if user is an admin
                const isAdmin = group.admins.some(admin => 
                    admin._id.toString() === req.user._id.toString()
                );
    
                // Find the user's join request
                const joinRequest = group.joinRequests.find(
                    request => request.userId._id.toString() === req.user._id.toString()
                );
    
                const isSuperAdmin = req.user.roles && req.user.roles.includes('super_admin');
    
                console.log(`Group ${group.name} - User ${req.user._id}:`, {
                    isMember,
                    joinRequestStatus: joinRequest?.status,
                    isAdmin,
                    isSuperAdmin
                });
    
                return {
                    ...group.toObject(),
                    isMember: isSuperAdmin || isMember,
                    isAdmin: isSuperAdmin || isAdmin,
                    joinRequestStatus: joinRequest?.status || null,
                    channels: (isSuperAdmin || isMember) ? group.channels : []
                };
            });
    
            res.json(groupsWithMembership);
        } catch (err) {
            console.error('Error fetching groups:', err);
            res.status(500).json({ error: err.message });
        }
    }
,
    joinGroup: async (req, res) => {
        try {
            const group = await Group.findById(req.params.groupId);
            console.log('Group found:', group);
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }
    
            console.log('Current user:', req.user._id);
            // Check for existing request
            const existingRequest = group.joinRequests.find(
                request => request.userId.toString() === req.user._id.toString()
            );
            console.log('Existing request:', existingRequest);
    
            if (existingRequest) {
                if (existingRequest.status === 'pending') {
                    return res.status(400).json({ error: 'Join request already pending' });
                }
            }
    
            // Add join request
            group.joinRequests.push({
                userId: req.user._id,
                status: 'pending'
            });
            console.log('Join request added:', group.joinRequests);
    
            await group.save();
            console.log('Group saved with new request');
    
            res.json({ message: 'Join request sent successfully' });
        } catch (err) {
            console.error('Error requesting to join group:', err);
            res.status(400).json({ error: err.message });
        }
    },
    handleJoinRequest: async (req, res) => {
        try {
            const { groupId, userId, action } = req.params;  // Changed from req.body
            console.log(`Processing ${action} request for user ${userId} in group ${groupId}`);
    
            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }
    
            const requestIndex = group.joinRequests.findIndex(
                request => request.userId.toString() === userId
            );
    
            if (requestIndex === -1) {
                return res.status(404).json({ error: 'Join request not found' });
            }
    
           // Update the request status
        group.joinRequests[requestIndex].status = action === 'approve' ? 'approved' : 'rejected';
    
            // If approved, add to members
            if (action === 'approve') {
                const memberExists = group.members.some(
                    memberId => memberId.toString() === userId
                );
                if (!memberExists) {
                    group.members.push(userId);
                }
            }
    
            await group.save();
    
            // Return updated group data
            const updatedGroup = await Group.findById(groupId)
                .populate({
                    path: 'channels',
                    select: 'name description messages'
                })
                .populate('members', 'username')
                .populate('admins', 'username')
                .populate('joinRequests.userId', 'username');
    
            const isMember = updatedGroup.members.some(
                member => member._id.toString() === userId
            );
    
            res.json({
                message: `Join request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
                group: {
                    ...updatedGroup.toObject(),
                    isMember,
                    joinRequestStatus: action === 'approve' ? 'approved' : 'rejected'
                }
            });
        } catch (err) {
            console.error('Error handling join request:', err);
            res.status(500).json({ error: err.message });
        }
    },
    getPendingJoinRequests: async (req, res) => {
        try {
            console.log('Getting pending requests for group:', req.params.groupId);
            const group = await Group.findById(req.params.groupId)
                .populate('joinRequests.userId', 'username');
            console.log('Found group:', group);
            console.log('Join requests:', group.joinRequests);
    
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }
    
            console.log('Checking admin status for user:', req.user._id);
            console.log('Group admins:', group.admins);
    
            const pendingRequests = group.joinRequests.filter(
                request => request.status === 'pending'
            );
            console.log('Pending requests:', pendingRequests);
    
            res.json(pendingRequests);
        } catch (err) {
            console.error('Error getting pending requests:', err);
            res.status(500).json({ error: err.message });
        }
    },

    getGroupById: async (req, res) => {
        try {
            const group = await Group.findById(req.params.id)
                .populate({
                    path: 'channels',
                    select: 'name description messages'
                })
                .populate('members', 'username')
                .populate('admins', 'username')
                .populate('createdBy', 'username');

            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            const isMember = group.members.some(member => member._id.toString() === req.user._id.toString());
            const isAdmin = group.admins.some(admin => admin._id.toString() === req.user._id.toString());

            const groupWithMembership = {
                ...group.toObject(),
                isMember,
                isAdmin
            };

            res.json(groupWithMembership);
        } catch (err) {
            console.error('Error getting group:', err);
            res.status(500).json({ error: err.message });
        }
    },

    createGroup: async (req, res) => {
        try {
            const { name, description } = req.body;
            
            const existingGroup = await Group.findOne({ name });
            if (existingGroup) {
                return res.status(400).json({ 
                    error: 'A group with this name already exists' 
                });
            }
    
            const group = await Group.create({
                name,
                description,
                createdBy: req.user._id,
                admins: [req.user._id],
                members: [req.user._id]
            });
    
            const populatedGroup = await Group.findById(group._id)
                .populate({
                    path: 'channels',
                    select: 'name description messages'
                })
                .populate('members', 'username')
                .populate('admins', 'username')
                .populate('createdBy', 'username');
    
            res.status(201).json(populatedGroup);
        } catch (err) {
            console.error('Error creating group:', err);
            res.status(400).json({ error: err.message });
        }
    },

    requestGroupAdminPromotion: async (req, res) => {
        try {
            const { groupId } = req.params;
            const userId = req.user._id;

            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            if (group.admins.includes(userId)) {
                return res.status(400).json({ error: 'User is already an admin of this group' });
            }

            const existingRequest = await PromotionRequest.findOne({
                userId,
                groupId,
                status: 'pending'
            });

            if (existingRequest) {
                return res.status(400).json({ error: 'A promotion request is already pending' });
            }

            const promotionRequest = await PromotionRequest.create({
                userId,
                groupId
            });

            res.status(201).json({ 
                message: 'Promotion request submitted successfully',
                request: promotionRequest
            });
        } catch (err) {
            console.error('Error requesting promotion:', err);
            res.status(500).json({ error: err.message });
        }
    },

    handlePromotionRequest: async (req, res) => {
        try {
            const { requestId } = req.params;
            const { action } = req.body;

            if (!req.user.roles.includes('super_admin')) {
                return res.status(403).json({ error: 'Only super admins can handle promotion requests' });
            }

            const promotionRequest = await PromotionRequest.findById(requestId);
            if (!promotionRequest) {
                return res.status(404).json({ error: 'Promotion request not found' });
            }

            if (promotionRequest.status !== 'pending') {
                return res.status(400).json({ error: 'This request has already been handled' });
            }

            if (action === 'approve') {
                const group = await Group.findById(promotionRequest.groupId);
                if (!group) {
                    return res.status(404).json({ error: 'Group not found' });
                }

                group.admins.push(promotionRequest.userId);
                await group.save();
            }

            promotionRequest.status = action === 'approve' ? 'approved' : 'rejected';
            await promotionRequest.save();

            res.json({
                message: `Promotion request ${action}ed successfully`,
                request: promotionRequest
            });
        } catch (err) {
            console.error('Error handling promotion request:', err);
            res.status(500).json({ error: err.message });
        }
    },

    getPendingPromotionRequests: async (req, res) => {
        try {
            if (!req.user.roles.includes('super_admin')) {
                return res.status(403).json({ error: 'Only super admins can view promotion requests' });
            }

            const requests = await PromotionRequest.find({ status: 'pending' })
                .populate('userId', 'username')
                .populate('groupId', 'name');

            res.json(requests);
        } catch (err) {
            console.error('Error fetching promotion requests:', err);
            res.status(500).json({ error: err.message });
        }
    },

    addMember: async (req, res) => {
        try {
            const { userId } = req.body;
            const group = await Group.findById(req.params.groupId);
            
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            if (group.members.includes(userId)) {
                return res.status(400).json({ error: 'User is already a member' });
            }

            group.members.push(userId);
            await group.save();

            const populatedGroup = await Group.findById(group._id)
                .populate('channels')
                .populate('members', 'username')
                .populate('admins', 'username');

            res.json(populatedGroup);
        } catch (err) {
            console.error('Error adding member:', err);
            res.status(400).json({ error: err.message });
        }
    },

    addChannel: async (req, res) => {
        try {
            const { name, description } = req.body;
            const group = await Group.findById(req.params.groupId);
            
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }
    
            const channel = new Channel({
                name,
                description,
                group: group._id
            });
            await channel.save();
    
            group.channels.push(channel);
            await group.save();
    
            const populatedGroup = await Group.findById(group._id)
                .populate('channels')
                .populate('members', 'username')
                .populate('admins', 'username');
    
            res.json(populatedGroup);
        } catch (err) {
            console.error('Error adding channel:', err);
            res.status(400).json({ error: err.message });
        }
    },

    removeChannel: async (req, res) => {
        try {
            const group = await Group.findById(req.params.groupId);
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            group.channels = group.channels.filter(
                channel => channel._id.toString() !== req.params.channelId
            );
            await group.save();

            const populatedGroup = await Group.findById(group._id)
                .populate('channels')
                .populate('members', 'username')
                .populate('admins', 'username');

            res.json(populatedGroup);
        } catch (err) {
            console.error('Error removing channel:', err);
            res.status(400).json({ error: err.message });
        }
    },

    deleteGroup: async (req, res) => {
        try {
            console.log('Delete request received for group:', req.params.id);
            const group = await Group.findById(req.params.id);
            
            if (!group) {
                console.log('Group not found');
                return res.status(404).json({ error: 'Group not found' });
            }
    
            console.log('Group found:', group);
            await Group.findByIdAndDelete(req.params.id);
            console.log('Group deleted');
            res.json({ message: 'Group deleted successfully' });
        } catch (err) {
            console.error('Error deleting group:', err);
            res.status(500).json({ error: err.message });
        }
    },

    checkGroupName: async (req, res) => {
        try {
            const name = req.params.name;
            const existingGroup = await Group.findOne({ name: name });
            
            if (existingGroup) {
                return res.status(400).json({ 
                    error: 'A group with this name already exists' 
                });
            }
            
            res.json({ available: true });
        } catch (err) {
            console.error('Error checking group name:', err);
            res.status(500).json({ error: err.message });
        }
    },
    promoteToGroupAdmin: async (req, res) => {
        try {
            const { groupId, userId } = req.params;
            const group = await Group.findById(groupId);
            
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }
    
            if (!req.user.roles.includes('super_admin')) {
                return res.status(403).json({ error: 'Only super admins can promote group admins' });
            }
    
            if (!group.admins.includes(userId)) {
                group.admins.push(userId);
                await group.save();
            }
    
            const updatedGroup = await Group.findById(groupId)
                .populate('members', 'username')
                .populate('admins', 'username');
    
            res.json({ 
                message: 'User promoted to group admin successfully',
                group: updatedGroup 
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    promoteToSuperAdmin: async (req, res) => {
        try {
            const { userId } = req.params;
            
            if (!req.user.roles.includes('super_admin')) {
                return res.status(403).json({ error: 'Only super admins can promote to super admin' });
            }
    
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
    
            if (!user.roles.includes('super_admin')) {
                user.roles.push('super_admin');
                await user.save();
            }
    
            res.json({ 
                message: 'User promoted to super admin successfully',
                user: user
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    removeUser: async (req, res) => {
        try {
            const { groupId, userId } = req.params;
    
            // Check if requester is super admin
            if (!req.user.roles.includes('super_admin')) {
                return res.status(403).json({ error: 'Only super admins can remove users' });
            }
    
            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }
    
            // Check if user exists in group
            if (!group.members.includes(userId)) {
                return res.status(404).json({ error: 'User not found in group' });
            }
    
            // Remove user from members and admins
            group.members = group.members.filter(id => id.toString() !== userId);
            group.admins = group.admins.filter(id => id.toString() !== userId);
    
            // Clear any join requests for this user
            group.joinRequests = group.joinRequests.filter(request => 
                request.userId.toString() !== userId
            );
    
            await group.save();
    
            // Fetch updated group with populated data
            const updatedGroup = await Group.findById(groupId)
                .populate('members', 'username')
                .populate('admins', 'username')
                .populate('joinRequests.userId', 'username');
    
            // Include membership status in response
            const groupData = {
                ...updatedGroup.toObject(),
                isMember: false,
                joinRequestStatus: null
            };
    
            res.json({ 
                message: 'User removed successfully',
                group: groupData
            });
        } catch (err) {
            console.error('Error removing user:', err);
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = groupController;