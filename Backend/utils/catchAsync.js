module.exports = fn => {//catch Async errors
   return (req,res,next) => {
      fn(req,res,next).catch(next);//will pass it to global error handling middleware
   }
}