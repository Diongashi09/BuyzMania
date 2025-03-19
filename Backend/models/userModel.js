const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { type } = require("os");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user','admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true,'Please provide a password'],
    minlength: 8,
    select: false//not visible in database
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!! not in findOneAndUpdate()
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: String,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function(next){
  //nese sosht modify exit~go next middleware
  if(!this.isModified('password')) return next();
  
  //second parameter osht per cost parameter(sa ka cpu utilization dmth the higher the longer time(better the encryption))
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;//na vyn veq per validation jo me persist ne db
  next();
});

userSchema.pre('save',function(next){
  if(!this.isModified('password') || this.isNew) return next();

  //somethimes saving to the db is slower than issue the token making it that sometimes the changedAfterTimestamp is after the JWT has been created
  this.passwordChangedAt = Date.now() - 1000;//-1 sec
  next();
});

userSchema.pre(/^find/, function(next){
  //this -> points to the current query
  this.find({active: {$ne:false}});//only query active user
  next();
});//query mdw

//instance method. will be available that is gonna be available on all documents of a certain collection
userSchema.methods.correctPassword = async function(
  candidatePassword, //is the posted password,
  userPassword  //is password stored in db
){  
  return await bcrypt.compare(candidatePassword, userPassword);//boolean
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp){//after token issued
  if(this.passwordChangedAt){
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    console.log(changedTimestamp,JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
}

userSchema.methods.createPasswordResetToken = function(){
  const resetToken = crypto.randomBytes(32).toString('hex');//32karaktere
  //kurrsbon plain text token me rujt ne db. kit rast me pas tokenin ateher mun e ndrron passin vet qaj qe hin db qata e enkriptojm

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  console.log({resetToken},this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;//10min time ro resetPass

  return resetToken;//e kom bo return plain text tokenin se ata kem me send ne email
}

const User = mongoose.model('User', userSchema);

module.exports = User;