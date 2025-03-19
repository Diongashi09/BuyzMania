const express = require('express');
const orderController = require('./../controllers/orderController');
const authController = require('./../controllers/authController'); 
const router = express.Router();

// Protect all routes from here onwards
router.use(authController.protect);

// Routes for Orders
router
  .route('/')
  .get(orderController.getAllOrders)    // Get all orders for the current user
  .post(orderController.createOrder);   // Create a new order

router
  .route('/:id')
  .get(orderController.getOrder)        // Get a specific order by ID
  .patch(orderController.updateOrder)   // Update an order
  .delete(orderController.deleteOrder); // Delete an order

module.exports = router;
