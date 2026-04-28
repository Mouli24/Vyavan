import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  price:        { type: Number, required: true, min: 0 },
  unit:         { type: String, required: true, default: 'Piece' },
  moq:          { type: Number, required: true, min: 1 },
  material:     { type: String },
  sizes:        [{ type: String }],
  rating:       { type: Number, default: 0, min: 0, max: 5 },
  image:        { type: String },
  category:     { type: String },
  stock:        { type: Number, default: 0 },
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  floorPrice:   { type: Number, default: 0 }, // secret minimum price for negotiations
  isActive:     { type: Boolean, default: true },
  
  // Extended fields for Manufacturer AddProductModal
  shortDescription: { type: String },
  sku:              { type: String },
  sector:           { type: String },
  unitsPerPack:     { type: String }, // e.g. "1 box = 24 packets"
  seoTags:          [{ type: String }],
  hsCode:           { type: String },
  packagingType:    { type: String },
  bulkSlabs: [{
    from:  { type: Number },
    to:    { type: Number }, // null means infinity
    price: { type: Number },
  }],
  sampleEnabled:  { type: Boolean, default: false },
  samplePrice:    { type: Number },
  sampleMaxUnits: { type: Number },
  lowStockAlert:  { type: Number },
  paymentTerms:   [{ type: String }],
  defaultTerm:    { type: String },
  paymentNotes:   { type: String },
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
