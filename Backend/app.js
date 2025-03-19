const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const globalErrorHandler = require('./controllers/errorController');

const productRouter = require('./routes/productRoutes');
const userRouter = require('./routes/userRoutes');
const orderRouter = require('./routes/orderRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const supplierRouter = require('./routes/supplierRoutes');

const app = express();

//Middlewares
app.use(helmet());//Set security HTTP headers

console.log(process.env.NODE_ENV);
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev')); //console.log info about requests
}

const limiter = rateLimit({
    max: 100,
    windowMS: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour'//nese e kalon nr e req
});//allow max of 100 req from same ip in one hour
app.use('/api',limiter);//apply only to /api route

app.use(express.json({
    limit: '10kb'//req.body max size
}));//built in method qe me parse request obj ne JSON Object

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());
//Data sanitization against XSS
app.use(xss());//delete html code(with js)

// //Prevent parameter pollution
// app.use(hpp({
//     whitelist: []//arr which we allow certain duplicates
// }));//clears up query string

app.use(express.static(`${__dirname}/public`));//middlw to serve static files

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString(); //we defined a property
    next();
});

//mounting routers
app.use('/api/v1/products',productRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/suppliers', supplierRouter);

app.all('*', (req,res,next)=>{
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));//saher qe next() receives an arg express recognizes it as an error. I skip krejt middleware tjera per me throw errorin
});//all http methods. It will handle routes we didn't define

app.use(globalErrorHandler);

module.exports = app;