const express = require("express");

const app = express();
const asyncHandler = (fn) => (req,res,next) => {
    Promise.resolve(fn(req,res,next)).catch(next);
}

app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).json({message: err.message})
})

module.exports = asyncHandler;