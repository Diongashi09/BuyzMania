const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
  
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = (err) => new AppError('Invalid token. Please log in again',401);

const handleJWTExpiredError = (err) => new AppError('Your token has expired! Please log in again.',401);

const sendErrorDev = (err,res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err,res)=>{
    // Operational, error that we predicted to be happen trusted to send to client
    if(err.isOperational){
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        })
    } else {
        //Programming or unknown error: don't leak to client
        console.error('Error',err);

        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }
}

module.exports = (err,req,res,next) => {
    //error handling
    // console.log(err.stack);//where err is located
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(err,res);
    } else if(process.env.NODE_ENV === 'production'){
        let error = {...err};

        if (error.name === 'CastError') {
            error = handleCastErrorDB(error);
        }
        if (error.name === 'ValidationError') {
            error = handleValidationErrorDB(error);
        }
        if (error.name === 'JsonWebTokenError') {
            error = handleJWTError();
        }
        if (error.name === 'TokenExpiredError') {
            error = handleJWTExpiredError();
        }
        sendErrorProd(error,res);
    }
};