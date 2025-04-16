const {userSignin, userSignup} = require('../models/user.model');
const bcrypt = require('bcrypt');
const createToken = require("../utils/createToken")
const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('../middlewares/asyncHandler');


const prisma = new PrismaClient();

const saltRounds = 10;

const createUser = async (req,res) => {
    const { firstname, lastname, email, role, password, username } = userSignup.parse(req.body);
    try{
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })
        if(existingUser){
            res.status(302).json({
                message:"User Already exists"
            })
            return;
        }else{
            bcrypt.hash(password, saltRounds, async function(err, hash){
                const newUser = await prisma.user.create({
                    data: { firstname, lastname, email, username, role, password:hash },
                });
                await prisma.profile.create({
                    data: {
                        userId: newUser.id,
                    }
                })
                res.status(201).json(newUser);
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Error creating user'});
    }
}

const loginUser = async (req,res) => {
    const { email, password } = userSignin.parse(req.body);
    try{
        const User = await prisma.user.findUnique({
            where: { email }
        })
        if(User){
            bcrypt.compare(password, User.password, function(err, result) {
                if(result){
                    createToken(res, User.id);
                    res.status(201).json(User);
                }else{
                    res.status(302).json({
                        message:"Password is incorrect"
                    })
                }
            });
            
        }else{
            res.status(302).json({
                message:"User email address does not exist"
            })
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Error logging user'});
    }
}

const logoutUser = async (req, res) => {
    res.cookie("jwt", "", {
        httyOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: "Logged out successfully" });
}

module.exports = {
    createUser,
    loginUser,
    logoutUser
}