const mongoose = require('mongoose');

const antibioticResultSchema = new mongoose.Schema(
  {
    antibiotic: { type: String, required: true },
    prediction: { type: String, enum: ['Resistant', 'Susceptible'], required: true },
    confidence: { type: Number, min: 0, max: 1 },
    evidence: { type: String, enum: ['GENE', 'MUTATION', 'MODEL', 'UNKNOWN'], default: 'MODEL' },
    evidenceDetails: { type: String, default: '' }
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    // Linked user
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Patient information
    patient: {
      name: { type: String, required: true, trim: true },
      age: { type: Number, min: 0, max: 150 },
      dob: { type: String, default: '' },
      gender: { type: String, enum: ['Male', 'Female', 'Other', 'Unknown'], default: 'Unknown' },
      sampleId: { type: String, default: '' }
    },

    // Genomic input
    filename: { type: String, required: true },
    organism: { type: String, default: 'Unknown' },
    genomeLength: { type: Number, default: 0 },

    // Results
    results: [antibioticResultSchema],
    resistantCount: { type: Number, default: 0 },
    susceptibleCount: { type: Number, default: 0 },
    totalAntibiotics: { type: Number, default: 0 },

    // Status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    errorMessage: { type: String, default: '' },

    // Metadata
    processingTimeMs: { type: Number, default: 0 },
    modelVersion: { type: String, default: '1.0' }
  },
  { timestamps: true }
);

// Auto-compute counts before save
analysisSchema.pre('save', function (next) {
  if (this.results && this.results.length > 0) {
    this.totalAntibiotics = this.results.length;
    this.resistantCount = this.results.filter(r => r.prediction === 'Resistant').length;
    this.susceptibleCount = this.results.filter(r => r.prediction === 'Susceptible').length;
  }
  next();
});

module.exports = mongoose.model('Analysis', analysisSchema);
