const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authMiddleware = asyncHandler(async (req, res, next) => {
    let token;
    token = req.cookies.jwt;
    if(token) {
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            const userId = decoded.userId;
            req.user = await prisma.user.findUnique({
                where: {id: userId}
            })
            next();
        }catch(error) {
            res.status(401);
            throw new Error("Not authorized, token failed");
        }
    }else{
        res.status(301).json({
            message:"You are not looged in."
        });
    }
});

module.exports = authMiddleware;