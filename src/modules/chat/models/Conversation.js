const mongoose = require('mongoose');
const buildParticipantsKey = require('../../../common/utils/participantKey');

const conversationSchema = new mongoose.Schema(
  {
    participant_one: {
      type: String,
      required: true,
      index: true,
    },
    participant_two: {
      type: String,
      required: true,
      index: true,
    },
    participants_key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    last_message_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    last_message_at: {
      type: Date,
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

conversationSchema.pre('validate', function validateParticipants(next) {
  if (!this.participant_one || !this.participant_two) {
    return next(new Error('A conversation requires exactly two participants'));
  }

  if (this.participant_one === this.participant_two) {
    return next(new Error('A private conversation cannot be created between the same user'));
  }

  this.participants_key = buildParticipantsKey(this.participant_one, this.participant_two);
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);
