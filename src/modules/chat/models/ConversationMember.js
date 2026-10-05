const mongoose = require('mongoose');

const conversationMemberSchema = new mongoose.Schema(
  {
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    is_online: {
      type: Boolean,
      default: false,
    },
    last_seen_at: {
      type: Date,
      default: null,
    },
    last_read_message_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

conversationMemberSchema.index({ conversation_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('ConversationMember', conversationMemberSchema);
