const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true,'A product must have a name'],
        unique: true,
        trim: true,
        maxLength: [40,'A product name must have less or equal then 40 characters'],
        minLength: [3, 'A product name must have more or equal then 3 characters']
    },
    slug: String,
    price: {
        type: Number,
        required: [true,'A product must have a price'],
    },
    priceDiscount: {
        type: Number,
        default: 0,
        validate: {
            validator: function(val){
                //custom validation
                return val < this.price;//if the product value is lower than discount then error
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        }
    },
    stockQuantity: {
        type: Number,
        required: [true, 'A product must have a quantity'],
        min: [0, 'Stock quantity cannot be less than 0']
    },
    ratingsAverage: {
        type: Number,
        min: [1,'Rating must be above 1.0'],
        max: [5,'Rating must be below 5.0']
    },
    description: {
        type: String,
        required: [true,'A product must have a description'],
        maxLength: [100,'A product name must have less or equal then 40 characters'],
        minLength: [20,'A product description must have more or equal then 20 characters']
    },
    imageCover: {
        type: String,
        required: [true,'A product must have a cover photo']
    },
    images: [String],//an array of Strings
    category: {
        type: String,
        required: [true,'A product must have a category'],
        enum: ['Electronics','Fashion','Clothes','Media','Personal Care','Home','Games']
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false //nuk mujna me select ne query e kem hide
    }
});

//Document Middleware
//runs before .save() and .create()
productSchema.pre('save',function(next){
    //this osht objekti para se mu ru ne db
    this.slug = slugify(this.name, {lower: true});
    next();
});

//Query Middleware
productSchema.post(/^find/, function(docs,next){
    console.log(`Query took ${Date.now() - this.start} milliseconds!`);
    // console.log(docs);
    next();
});


const Product = mongoose.model('Product',productSchema);

module.exports = Product;