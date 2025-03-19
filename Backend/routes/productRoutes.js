const express = require('express');
const {getAllProducts,createProduct,getProduct,updateProduct,deleteProduct, aliasTopProductDiscounts} = require('./../controllers/productController');
const {protect,restrictTo} = require('./../controllers/authController');

const router = express.Router();//middleware

router.route('/top-6-discounts').get(aliasTopProductDiscounts,getAllProducts);//masi qe me aliasTopProductDiscounts e kem bo qe me modify queryObj ateher duhet qe me invoke getAllProducts

router.route('/').get(protect,getAllProducts).post(createProduct);
router.route('/:id').get(getProduct).patch(updateProduct).delete(
    protect,
    restrictTo('admin'),
    deleteProduct
);

module.exports = router;