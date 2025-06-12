const express = require('express');
const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'profile');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

const testMe = async (req, res) => {
    res.json({
        message: req.user.id
    })
}

const getProfile = async(req, res) => {
    try {
    const userId = req.user.id;
        
        // Get user data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                username: true,
                role: true
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Get profile data
    const profile = await prisma.profile.findUnique({
            where: { userId: userId }
        });

        // Combine user and profile data, with default values for profile fields
        res.json({
            ...user,
            profilePicture: profile?.profilePicture || null,
            about: profile?.about || null,
            skills: profile?.skills || [],
            experience: profile?.experience || [],
            education: profile?.education || []
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            message: "Error fetching profile"
        });
    }
}

const updateProfile = async(req, res) => {
    try {
        // Add these debug logs
        console.log('=== Debug Info ===');
        console.log('Headers:', req.headers);
        console.log('Content-Type:', req.headers['content-type']);
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        console.log('=================');
        
        const userId = req.user.id;
        console.log('Updating profile for user:', userId);
        
        const allowedFields = ["about", "skills", "experience", "education"];
        const updatedData = {};

        // Handle file upload
        if (req.file) {
            console.log('File uploaded:', req.file);
            updatedData.profilePicture = `/uploads/profile/${req.file.filename}`;
        }

        // Handle other fields
    for(const field of allowedFields) {
            if (req.body[field] !== undefined) {
                console.log(`Processing field ${field}:`, req.body[field]);
                if (field === 'skills') {
                    // Handle skills as comma-separated string
                    updatedData[field] = typeof req.body[field] === 'string' 
                        ? req.body[field].split(',').map(skill => skill.trim()).filter(Boolean)
                        : req.body[field];
                } else if (field === 'experience' || field === 'education') {
                    // Handle experience and education as newline-separated strings
                    updatedData[field] = typeof req.body[field] === 'string'
                        ? req.body[field].split('\n').map(item => item.trim()).filter(Boolean)
                        : req.body[field];
                } else {
                    // Handle about as plain string
            updatedData[field] = req.body[field];
        }
    }
        }

        console.log('Updated data:', updatedData);

        // Get existing profile
        const existingProfile = await prisma.profile.findUnique({
            where: { userId: userId }
        });

        console.log('Existing profile:', existingProfile);

        let profile;
        if (!existingProfile) {
            // Create new profile if it doesn't exist
            profile = await prisma.profile.create({
                data: {
                    userId: userId,
                    ...updatedData
                }
            });
            console.log('New profile created:', profile);
        } else {
            // Update existing profile
            profile = await prisma.profile.update({
                where: { userId: userId },
        data: updatedData
            });
            console.log('Profile updated:', profile);
        }

        // Get updated user data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                username: true,
                role: true
            }
        });

        console.log('User data retrieved:', user);

        // Combine user and profile data in response
    res.json({
            ...user,
            profilePicture: profile.profilePicture,
            about: profile.about,
            skills: profile.skills,
            experience: profile.experience,
            education: profile.education
        });
    } catch (error) {
        console.error('Detailed error in updateProfile:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            meta: error.meta
        });
        res.status(500).json({
            message: "Error updating profile",
            error: error.message,
            code: error.code
        });
    }
};

const deleteUser = async(req, res) => {
    try {
    await prisma.user.delete({
            where: {
            id: req.user.id
        }
        });
        
    res.json({
        message: "User deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            message: "Error deleting user"
        });
    }
}

const getUserById = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        if (isNaN(userId)) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                profile: {
                    select: {
                        profilePicture: true,
                        about: true,
                        skills: true,
                        experience: true,
                        education: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "User profile retrieved",
            user
        });
    } catch (error) {
        console.log(error);
        res.status(500).json("Server Error");
    }
};

const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const currentUserId = req.user.id;

        if (!q) {
            return res.status(400).json({ message: "Search query is required" });
        }

        // Search users by name or email
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { firstname: { contains: q, mode: 'insensitive' } },
                            { lastname: { contains: q, mode: 'insensitive' } },
                            { email: { contains: q, mode: 'insensitive' } }
                        ]
                    },
                    { id: { not: currentUserId } } // Exclude current user
                ]
            },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                role: true,
                profile: {
                    select: {
                        profilePicture: true
                    }
                }
            }
        });

        // Get connection status for each user
        const usersWithConnectionStatus = await Promise.all(users.map(async (user) => {
            const connection = await prisma.connection.findFirst({
                where: {
                    OR: [
                        { senderId: currentUserId, receiverId: user.id },
                        { senderId: user.id, receiverId: currentUserId }
                    ]
                }
            });

            return {
                ...user,
                connectionStatus: connection ? connection.status : null
            };
        }));

        res.json(usersWithConnectionStatus);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: "Error searching users" });
    }
};

const getSuggestions = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            console.error('No user found in request');
            return res.status(401).json({ message: "User not authenticated" });
        }

        const currentUserId = parseInt(req.user.id);
        if (isNaN(currentUserId)) {
            console.error('Invalid user ID:', req.user.id);
            return res.status(400).json({ message: "Invalid user ID" });
        }

        console.log('Getting suggestions for user:', currentUserId);

        // Get current user's profile with skills
        const currentUser = await prisma.user.findUnique({
            where: { id: currentUserId },
            include: {
                profile: {
                    select: {
                        skills: true
                    }
                }
            }
        });

        if (!currentUser) {
            console.log('Current user not found');
            return res.status(404).json({ message: "User not found" });
        }

        console.log('Current user skills:', currentUser.profile?.skills);

        // Get current user's connections
        const userConnections = await prisma.connection.findMany({
            where: {
                OR: [
                    { senderId: currentUserId },
                    { receiverId: currentUserId }
                ],
                status: 'ACCEPTED'
            }
        });

        const connectedUserIds = userConnections.map(conn => 
            conn.senderId === currentUserId ? conn.receiverId : conn.senderId
        );

        console.log('Connected user IDs:', connectedUserIds);

        // Get all users except current user and connected users
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: currentUserId } },
                    { id: { notIn: connectedUserIds } }
                ]
            },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                role: true,
                profile: {
                    select: {
                        profilePicture: true,
                        skills: true
                    }
                }
            },
            take: 10
        });

        console.log('Found potential users:', users.length);

        // Add matching skills and connection status
        const suggestions = users.map(user => {
            const userSkills = user.profile?.skills || [];
            const currentUserSkills = currentUser.profile?.skills || [];
            const matchingSkills = userSkills.filter(skill => 
                currentUserSkills.includes(skill)
            );

            // Calculate a score based on matching skills and role
            const skillScore = matchingSkills.length;
            const roleScore = user.role === currentUser.role ? 1 : 0;
            const totalScore = skillScore + roleScore;

            return {
                ...user,
                matchingSkills,
                connectionStatus: null,
                score: totalScore
            };
        });

        // Sort by score
        suggestions.sort((a, b) => b.score - a.score);

        console.log('Returning suggestions:', suggestions.length);
        res.json(suggestions);
    } catch (error) {
        console.error('Detailed error in getSuggestions:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            user: req.user
        });
        res.status(500).json({ 
            message: "Error getting suggestions",
            error: error.message,
            code: error.code
        });
    }
};

module.exports = {
    testMe,
    getProfile,
    updateProfile,
    deleteUser,
    getUserById,
    searchUsers,
    getSuggestions
}