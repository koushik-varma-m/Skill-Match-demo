const express = require('express');
const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

const testMe = async (req, res) => {
    res.json({
        message: req.user.id
    })
}

const getProfile = async(req, res) => {
    const userId = req.user.id;
    const profile = await prisma.profile.findUnique({
        where: {userId: userId}
    })
    res.json(profile);
}

const updateProfile = async(req, res) => {
    const allowedFields = [ "profilePicture", "about", "skills", "experience", "education"]
    const updatedData = {}

    for(const field of allowedFields) {
        if (req.body[field]){
            updatedData[field] = req.body[field];
        }
    }

    const user = await prisma.profile.update({
        where: {userId: req.user.id},
        data: updatedData
    })

    res.json({
        user
    })
}

const deleteUser = async(req,res) => {
    await prisma.user.delete({
        where:{
            id: req.user.id
        }
    })
    res.json({
        message: "User deleted successfully"
    })
}

module.exports = {
    testMe,
    getProfile,
    updateProfile,
    deleteUser
}