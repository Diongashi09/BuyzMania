const Product = require('./../models/productModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
// const AppError = require('./../utils/appError');

exports.aliasTopProductDiscounts = (req,res,next) => {
    req.query.limit = '6';
    req.query.sort = '-priceDiscount,-ratingsAverage';
    req.query.fields = 'name,price,priceDiscount,ratingsAverage,description';
    next();
}

exports.getAllProducts = catchAsync(async (req,res,next) => {
    const features = new APIFeatures(Product.find(),req.query).filter().sort().limitFields().paginate();
    const products = await features.query;

    res.status(200).json({
        status: 'success',
        results: products.length,
        data: {
            products: products
        }
    });//me json() ktu ne express automaticilly e set contentType applicationJson
});

exports.getProduct = catchAsync(async (req,res,next) => {
    const product = await Product.findById(req.params.id);

    if(!product){
        return next(new AppError('No product found with that id',404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            product
        }
    });
});

exports.createProduct = catchAsync(async (req,res) => {
    const newProduct = await Product.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            product: newProduct
        }
    });
});

exports.updateProduct = catchAsync(async (req,res,next) => {
    const product = await Product.findByIdAndUpdate(req.params.id,req.body, {
        new: true,
        runValidators: true//validators will run again
    });//third arg are opctions.new is to return the new modified document to the client

    if(!product){
        return next(new AppError('No Product found with that id',404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            product: product
        }
    });
});

exports.deleteProduct = catchAsync(async (req,res,next) => {
    const product = await Product.findByIdAndDelete(req.params.id);//e kom store ne variable veq per error case

    if(!product){
        return next(new AppError('No tour found with that id',404));
    }

    res.status(204).json({
        //204 when we delete
        status: 'success',
        data: null
    });
});

//Aggregate functions
//1. Group products by Category and Calculate Average Price
exports.getAveragePriceByCategory = catchAsync(async (req,res,next) => {
    const stats = await Product.aggregate([
        {
            $group: {
                _id: "$category",//Group by category
                averagePrice: { $avg: "$price" },//calc avg price
                totalProducts: { $sum: 1 }//count total productss
            },
        },
        {
            $sort: { averagePrice: -1 },//sort by highest price desc
        }
    ]); 

    res.status(200).json({
        status: 'success',
        data: {
            stats: stats
        }
    });
});

exports.getTotalRevenue = catchAsync(async (req,res) => {
    const stats = await Product.aggregate([
        {
            $group: {
                _id: null,// No grouping, calculate for all products
                totalRevenue: { $sum: { $multiply: ["$price","$quantity"]}},// Calculate total revenue
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            stats: stats
        }
    });
});

exports.getProductsGroupedByRatings = catchAsync(async (req,res)=>{
    const stats = await Product.aggregate([
        {
            $group: {
                _id: "$ratingsAverage",// Group by ratingsAverage
                productCount: {$sum: 1},   
            },
        },
        {
            $sort: {_id: -1},//Sort by ratingsAvg in desc
        }
    ]);

    res.status(200).json({
        status: 'Success',
        data: {
            stats
        }
    });
});

exports.getActiveCounts = catchAsync(async (req,res) => {
    const stats = await Product.aggregate([
        {
            $group: {
                _id: { isActive: "$active"},
                count: {$sum: 1},
            },
        },
    ]);

    res.status(200).json({
        status: 'Success',
        data: {
            stats
        }
    });
});

exports.get3CategoriesWithMostProducts = catchAsync(async (req,res) => {
    const stats = Product.aggregate([
        {
            $group: {
                _id: "$category",
                totalProducts: { $sum: 1 },
            },
        },
        {
            $sort: { totalProducts: -1 },
        },
        {
            $limit: 3,
        }
    ]);

    res.status(200).json({
        status: 'Success',
        data: {
            stats
        }
    });
});