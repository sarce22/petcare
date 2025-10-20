import mongoose from 'mongoose';

const { Schema } = mongoose;

const ownerSchema = new Schema(
  {
    name: {
      type: String,
      trim: true
    },
    contact: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const petSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    species: {
      type: String,
      required: true,
      trim: true
    },
    breed: {
      type: String,
      trim: true
    },
    age: {
      type: Number,
      min: 0
    },
    owner: ownerSchema
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export default mongoose.model('Pet', petSchema);
