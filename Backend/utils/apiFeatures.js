class APIFeatures {
    constructor(query,queryString){
        this.query = query;
        this.queryString = queryString;
    }
    filter(){
        const queryObj = { ...this.queryString };//copys the obj
        const excludedFields = ['page','sort','limit','fields'];//not query with them, exclude from queryObj
        excludedFields.forEach(el => delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);//me ja shtu $ qe me bo si mongoQueryObject

        this.query = this.query.find(JSON.parse(queryStr));
        return this;//returns the obj
    }
    sort(){
        if(this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy); //p.sh sort=price,ratingsAverage -> niher ka me sort ne baz price masnej per price te njejt ka me sort baz ratingsAvg
        } else {
            //by default sort ne newest createdAt date
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }
    limitFields(){
        if(this.queryString.fields){
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            //default selecting. excluding with '-'
            this.query = this.query.select('-__v');
        }
        return this;
    }
    paginate(){
        const page = this.queryString.page * 1 || 1;//convert str to number. by default page nr.1
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;//p.sh page nr 3 ku limit osht 10 ateher i bjen skip me kan 20 qe me dal results 21-30
        this.query = this.query.skip(skip).limit(limit);//skip-the amount of results to be skipped. limit-the amount of results in a query
        return this;
    }
}

module.exports = APIFeatures;