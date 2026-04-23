import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema({
  key:     { type: String, required: true, unique: true }, // e.g., 'WELCOME_EMAIL'
  subject: { type: String, required: true },
  body:    { type: String, required: true }, // HTML with variables {user_name}
  variables: [String], // Hint for the UI
  lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('EmailTemplate', emailTemplateSchema);
