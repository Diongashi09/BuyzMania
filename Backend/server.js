const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({path: './config.env'});//e read .env file

const app = require('./app');

const DB = process.env.DATABASE.replace(
    '<db_password>',
    process.env.DATABASE_PASSWORD
);
mongoose.connect(DB,{
    useNewUrlParser: true,
    useUnifiedTopology:  true,
}).then(con => console.log('DB connection successfull!'));

//Start server
const port = process.env.PORT || 3003;
const server = app.listen(port, ()=>{
    console.log(`App running on port ${port}...`);
})

process.on('unhandledRejection', err => {//this event listener is triggered when promises has been rejected and whose rejections has not yet been handled
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(()=>{
        process.exit(1);
    });//0 for success, 1 for uncaught exception
});