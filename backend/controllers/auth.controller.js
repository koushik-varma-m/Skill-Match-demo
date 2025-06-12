const {userSignin, userSignup} = require('../models/user.model');
const bcrypt = require('bcrypt');
const createToken = require("../utils/createToken")
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const saltRounds = 10;

const createUser = async (req,res) => {
    try {
        const { firstname, lastname, email, role, password, username } = userSignup.parse(req.body);
        
        // Check for existing email
        const existingEmail = await prisma.user.findUnique({
            where: { email }
        });
        if(existingEmail){
            res.status(409).json({
                message: "Email already exists"
            });
            return;
        }

        // Check for existing username
        const existingUsername = await prisma.user.findUnique({
            where: { username }
        });
        if(existingUsername){
            res.status(409).json({
                message: "Username already exists"
            });
            return;
        }
        
        bcrypt.hash(password, saltRounds, async function(err, hash){
            if (err) {
                res.status(500).json({ error: 'Error hashing password' });
                return;
            }
            
            try {
                const newUser = await prisma.user.create({
                    data: { firstname, lastname, email, username, role, password: hash },
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        email: true,
                        role: true,
                        username: true
                    }
                });
                
                await prisma.profile.create({
                    data: {
                        userId: newUser.id,
                    }
                });
                
                const token = createToken(res, newUser.id);
                res.status(201).json({ 
                    user: newUser,
                    token 
                });
            } catch (error) {
                console.error('Error creating user:', error);
                res.status(500).json({ error: 'Error creating user' });
            }
        });
    } catch (error) {
        console.error('Validation error:', error);
        res.status(400).json({ error: 'Invalid input data' });
    }
}

const loginUser = async (req,res) => {
    const { email, password } = userSignin.parse(req.body);
    try{
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                role: true,
                username: true,
                password: true
            }
        });

        if (!user) {
            res.status(401).json({
                message: "Invalid email or password"
            });
            return;
        }

        bcrypt.compare(password, user.password, function(err, result) {
            if (err) {
                console.error('Password comparison error:', err);
                res.status(500).json({ error: 'Error during login' });
                return;
            }

            if (result) {
                // Remove password from user object
                const { password, ...userWithoutPassword } = user;
                const token = createToken(res, user.id);
                res.status(200).json({
                    user: userWithoutPassword,
                    token
                });
            } else {
                res.status(401).json({
                    message: "Invalid email or password"
                });
        }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error during login' });
    }
}

const logoutUser = async (req, res) => {
    res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict"
    });
    res.status(200).json({ message: "Logged out successfully" });
}

module.exports = {
    createUser,
    loginUser,
    logoutUser
}