const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    contactEmail: {
        type: String,
        required: true
    },
    contactPhone: {
        type: String
    },
    address: {
        type: String
    }
});

const Supplier = mongoose.model('Supplier',supplierSchema);

module.exports = Supplier;