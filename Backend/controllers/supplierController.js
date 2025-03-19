const Supplier = require('./../models/supplierModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getAllSuppliers = catchAsync(async (req, res, next) => {
    const suppliers = await Supplier.find();

    res.status(200).json({
        status: 'success',
        results: suppliers.length,
        data: {
            suppliers: suppliers
        }
    });
});

exports.getSupplier = catchAsync(async (req, res, next) => {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
        return next(new AppError('No supplier found with that id', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            supplier
        }
    });
});

exports.createSupplier = catchAsync(async (req, res) => {
    const newSupplier = await Supplier.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            supplier: newSupplier
        }
    });
});

exports.updateSupplier = catchAsync(async (req, res, next) => {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!supplier) {
        return next(new AppError('No supplier found with that id', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            supplier
        }
    });
});

exports.deleteSupplier = catchAsync(async (req, res, next) => {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);

    if (!supplier) {
        return next(new AppError('No supplier found with that id', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});
