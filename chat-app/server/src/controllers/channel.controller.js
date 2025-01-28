const { Channel, Group } = require('../models/group.model');

const channelController = {
  getChannels: async (req, res) => {
    try {
      console.log('Getting channels for group:', req.params.groupId);
      const channels = await Channel.find({ group: req.params.groupId })
        .populate('admins', 'username')
        .populate({
          path: 'messages.sender',
          select: 'username'
        });
      console.log('Found channels:', channels);
      res.json(channels);
    } catch (err) {
      console.error('Error getting channels:', err);
      res.status(500).json({ error: err.message });
    }
  },

  getMessages: async (req, res) => {
    try {
      console.log('Getting messages for channel:', req.params.channelId);
      if (!req.params.channelId) {
        throw new Error('Channel ID is required');
      }

      const channel = await Channel.findById(req.params.channelId);
      
      if (!channel) {
        console.log('Channel not found');
        return res.status(404).json({ error: 'Channel not found' });
      }

      await channel.populate('messages.sender', 'username');
      const messages = channel.messages.slice(-50); // Get last 50 messages
      console.log('Sending messages:', messages);
      res.json(messages);
    } catch (err) {
      console.error('Error getting messages:', err);
      res.status(500).json({ error: err.message });
    }
  },

  addMessage: async (req, res) => {
    try {
      console.log('Adding message to channel:', req.params.channelId);
      const { content, messageType = 'text' } = req.body;
      
      if (!content) {
        throw new Error('Message content is required');
      }

      const channel = await Channel.findById(req.params.channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      const message = {
        sender: req.user._id,
        content,
        messageType,
        timestamp: new Date()
      };

      channel.messages.push(message);
      await channel.save();

      const populatedMessage = await Channel.populate(message, {
        path: 'sender',
        select: 'username'
      });

      console.log('Message added:', populatedMessage);
      res.status(201).json(populatedMessage);
    } catch (err) {
      console.error('Error adding message:', err);
      res.status(400).json({ error: err.message });
    }
  },

  addChannel: async (req, res) => {
    try {
      const { groupId } = req.params;
      const { name, description } = req.body;
  
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
  
      // Check if channel name already exists in the group
      const existingChannel = await Channel.findOne({
        group: groupId,
        name: name
      });
  
      if (existingChannel) {
        return res.status(400).json({ 
          error: 'A channel with this name already exists in this group' 
        });
      }
  
      const channel = new Channel({
        name,
        description,
        group: groupId
      });
      await channel.save();
  
      group.channels.push(channel);
      await group.save();
  
      const updatedGroup = await Group.findById(groupId)
        .populate('channels')
        .populate('members', 'username')
        .populate('admins', 'username');
  
      res.status(201).json(updatedGroup);
    } catch (err) {
      console.error('Error adding channel:', err);
      res.status(500).json({ error: err.message });
    }
  },


  deleteChannel: async (req, res) => {
    try {
      console.log('Deleting channel:', req.params.channelId);
      const channel = await Channel.findByIdAndDelete(req.params.channelId);
      
      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      // Remove channel reference from group
      await Group.updateOne(
        { _id: channel.group },
        { $pull: { channels: channel._id } }
      );

      res.json({ message: 'Channel deleted successfully' });
    } catch (err) {
      console.error('Error deleting channel:', err);
      res.status(500).json({ error: err.message });
    }
  },


  checkChannelName: async (req, res) => {
    try {
      const { groupId, name } = req.params;
      const group = await Group.findById(groupId);
      
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
  
      // Find if channel name exists in the group
      const existingChannel = await Channel.findOne({
        group: groupId,
        name: name
      });
  
      if (existingChannel) {
        return res.status(400).json({ 
          error: 'A channel with this name already exists in this group' 
        });
      }
      
      res.json({ available: true });
    } catch (err) {
      console.error('Error checking channel name:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // Add this method to your existing channel controller

uploadImage: async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

    // Add image message to channel
    const channel = await Channel.findById(req.params.channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const message = {
      sender: req.user._id,
      content: imageUrl,
      messageType: 'image',
      timestamp: new Date()
    };

    channel.messages.push(message);
    await channel.save();

    // Populate sender information
    const populatedMessage = await Channel.populate(message, {
      path: 'sender',
      select: 'username'
    });

    res.json({
      message: populatedMessage,
      imageUrl: imageUrl
    });
  } catch (err) {
    console.error('Error uploading image:', err);
    res.status(500).json({ error: err.message });
  }
}

};

module.exports = channelController;