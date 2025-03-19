const express = require('express');
const supplierController = require('./../controllers/supplierController');
const authController = require('./../controllers/authController'); 
const router = express.Router();

// Protect routes for admin access 
router.use(authController.protect, authController.restrictTo('admin'));

router
  .route('/')
  .get(supplierController.getAllSuppliers)   
  .post(supplierController.createSupplier);

router
  .route('/:id')
  .get(supplierController.getSupplier)        
  .patch(supplierController.updateSupplier) 
  .delete(supplierController.deleteSupplier);

module.exports = router;
