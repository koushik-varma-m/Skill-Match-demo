const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authMiddleware = asyncHandler(async (req, res, next) => {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        console.log('Token found in Authorization header');
    }
    // If no token in header, check cookies
    else if (req.cookies.jwt) {
    token = req.cookies.jwt;
        console.log('Token found in cookies');
    }
    
    if (!token) {
        console.log('No token found in cookies or Authorization header');
        res.status(401).json({
            message: "Please log in to access this resource"
        });
        return;
    }

    try {
        // Verify token
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
        console.log('Token decoded:', decoded);
        
        if (!decoded || !decoded.userId) {
            console.log('Invalid token structure:', decoded);
            throw new Error('Invalid token structure');
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                role: true,
                username: true
            }
        });

        if (!user) {
            console.log('User not found for token, userId:', decoded.userId);
            res.status(401).json({
                message: "User not found"
            });
            return;
        }

        console.log('User found:', user);

        // Check if user is a recruiter for recruiter routes
        if (req.path.startsWith('/api/recruiter') && user.role !== 'RECRUITER') {
            console.log('Access denied: User is not a recruiter');
            res.status(403).json({
                message: "Access denied. Recruiter role required."
            });
            return;
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({
            message: "Please log in again"
        });
    }
});

module.exports = authMiddleware;