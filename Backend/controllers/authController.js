const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const setCookie = (token,res) => {
    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),//convert to miliseconds
        httpOnly:true
    }
    if(process.env.NODE_ENV === 'production'){
        options.secure = true;//per https
    }

    res.cookie('jwt',token,options);
}

exports.signup = catchAsync(async (req,res,next) => {
    // const newUser = await User.create({
    //     name: req.body.name,
    //     email: req.body.email,
    //     password: req.body.password,
    //     passwordConfirm: req.body.passwordConfirm
    // });//se kom bo veq req.body se ashtu mujna me leju qe me caktu rolin si admin
    
    const newUser = await User.create(req.body);

    const token = signToken(newUser._id);
    
    setCookie(token,res);

    res.status(201).json({
        status: 'Success',
        token,
        data: {
            user: newUser
        }
    });
});

exports.login = catchAsync(async (req,res,next) => {
    const email = req.body.email;
    const password = req.body.password;

    // 1) Check if email and password exist
    if(!email || !password){
        return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({email}).select('+password');//masi qe select: false e kem per password duhmi me explicitly select passwordin
    
    // console.log(user);
    
    //ka me enkriptu passwordin qe e bojm post edhe me krahasu me passin qe osht already encrypted stored ne db
    

    if(!user || !(await user.correctPassword(password, user.password))){
        return next(new AppError('Incorrect email or password',401));
    }

    // 3) If everything ok, send token to client
    const token = signToken(user._id);

    setCookie(token,res);

    res.status(200).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
});

//if authenticated
exports.protect = catchAsync(async (req,res,next) => {//tokenin na e qojna si req.header
    let token;
    //1) Getting token and check if it's there
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];//Na e rujm si "Bearer ...tokeni"

    }
    // console.log(token);

    if(!token){
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    //2) Verificate token(if signature is valid f.ex if it's expired)
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);//decoded payload of JWT
    console.log(decoded);

    //3) Check if user still exists(check if he has been removed)
    const currentUser = await User.findById(decoded.id);
    if(!currentUser){
        return next(new AppError('The user belonging to this token does no longer exists.',401));
    }

    //4) Check if user changed password after the JWT was issued
    if(currentUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('User recently changed password! Please log in again.', 401));
    }

    req.user = currentUser;
    next();
});

//para restrictTo e kom bo protect middleware e masi te kryhet ajo veq e vendos userin req kshtu qe e kem per restrictTo fn
exports.restrictTo = (role) => {
    return (req,res,next) => {
        if(req.user.role !== role){
            return next(new AppError('You do not have permission to perform this action', 403));
        }

        next();
    }
}

//user sends posts request with email. reset token(not jwt) will be created  and sent to the email address that was provided
exports.forgotPassword = catchAsync(async (req,res,next) => {
    //1) Get user based on POSTed email
    const user = await User.findOne({email: req.body.email});
    if(!user){
        return next(new AppError('There is no user with email address.',404));
    }
    //2) Generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});//passResetExpireTime e kem modify po sosht saved
    
    //3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message
        });
    
        res.status(200).json({
            status: 'success',
            message: 'Token send to email!'
        });
    } catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        return next(new AppError('There was an error sending the email. Try again later!',500));
    }
});

//user sends that token from his email along with new password to update his password
exports.resetPassword = catchAsync(async (req,res,next) => {
    //1) Get user based on the token (e bojm encrypt original token prej emailes edhe e krahasojm me encrypted token qe osht saved ne db)
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}});

    //2) If token has not expired, and there is user, set the new password
    if(!user){
        return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();//tash na vyn validation

    //3) Update changedPasswordAt property for the user

    //4) Log the user in,send JWT
    const token = signToken(user._id);

    setCookie(token,res);

    res.status(200).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
});

//updating password without reset process
exports.updatePassword = async (req,res,next) => {
    //1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');
    //2) Check if POSTed password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError('Your current password is wrong.', 401));
    }
    //3) If so,update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    //4) Log user in, send JWT
    const token = signToken(user._id);

    setCookie(token,res);

    res.status(200).json({
        status: 'success',
        token,
        data: {
            user
        }       
    });
}