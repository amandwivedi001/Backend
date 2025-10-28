import mongoose from "mongoose"

(async() => {
    try {
       mongoose.connect(`${process.env.MONGODB_URI}`) 
    } catch (error) {
        console.error("Error :", error)
        throw err
    }
})(); //here we use iff type of function to excute directly in js 