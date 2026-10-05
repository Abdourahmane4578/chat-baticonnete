const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: String,
      required: true,
      index: true,
    },
    recipient: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    message_type: {
      type: String,
      enum: ['text', 'system'],
      default: 'text',
    },
    reply_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
      index: true,
    },
    delivered_to: {
      type: [String],
      default: [],
    },
    read_by: {
      type: [String],
      default: [],
    },
    edited: {
      type: Boolean,
      default: false,
    },
    edited_at: {
      type: Date,
      default: null,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

messageSchema.index({ conversation: 1, created_at: -1 });
messageSchema.index({ sender: 1, created_at: -1 });

module.exports = mongoose.model('Message', messageSchema);
