const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    rating: {
        type: Number,
        required: true
    },
    comment: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add a unique index to prevent multiple reviews for the same product by the same user
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });


const Review = mongoose.model('Review',reviewSchema);

module.exports = Review;