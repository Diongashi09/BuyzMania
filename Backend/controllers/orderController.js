const Order = require('./../models/orderModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getAllOrders = catchAsync(async (req, res, next) => {
    const orders = await Order.find({ userId: req.user.id });

    res.status(200).json({
        status: 'success',
        results: orders.length,
        data: {
            orders: orders
        }
    });
});

exports.getOrder = catchAsync(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('products.productId');

    if (!order) {
        return next(new AppError('No order found with that id', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            order
        }
    });
});

exports.createOrder = catchAsync(async (req, res) => {
    const { products } = req.body;
    let totalPrice = 0;

    // Calculate total price based on the products and their quantities
    for (const item of products) {
        const product = await Product.findById(item.productId);
        if (!product) {
            return next(new AppError('Product not found', 404));
        }
        totalPrice += product.price * item.quantity;
    }

    const newOrder = await Order.create({
        userId: req.user.id,
        products: products,
        totalPrice: totalPrice
    });

    res.status(201).json({
        status: 'success',
        data: {
            order: newOrder
        }
    });
});

exports.updateOrder = catchAsync(async (req, res, next) => {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!order) {
        return next(new AppError('No order found with that id', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            order
        }
    });
});

exports.deleteOrder = catchAsync(async (req, res, next) => {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
        return next(new AppError('No order found with that id', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});