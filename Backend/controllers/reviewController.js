const Review = require('./../models/reviewModel');
const Product = require('./../models/productModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

// Get all reviews for a specific product
exports.getAllReviewsForProduct = catchAsync(async (req, res, next) => {
    const reviews = await Review.find({ productId: req.params.productId }).populate('userId');

    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews: reviews
        }
    });
});

// Get a single review
exports.getReview = catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.id).populate('userId productId');

    if (!review) {
        return next(new AppError('No review found with that id', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            review
        }
    });
});

// Create a new review for a product
exports.createReview = catchAsync(async (req, res) => {
    const { productId, rating, comment } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
        return next(new AppError('Product not found', 404));
    }

    const newReview = await Review.create({
        userId: req.user.id,
        productId: productId,
        rating: rating,
        comment: comment
    });

    res.status(201).json({
        status: 'success',
        data: {
            review: newReview
        }
    });
});

// Update a review
exports.updateReview = catchAsync(async (req, res, next) => {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!review) {
        return next(new AppError('No review found with that id', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            review
        }
    });
});

// Delete a review
exports.deleteReview = catchAsync(async (req, res, next) => {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
        return next(new AppError('No review found with that id', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});
