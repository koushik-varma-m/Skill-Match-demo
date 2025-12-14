const express = require('express');
const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'profile');
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
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
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

    const profile = await prisma.profile.findUnique({
            where: { userId: userId },
            include: {
                experiences: {
                    orderBy: [
                        { fromYear: 'desc' },
                        { fromMonth: 'desc' }
                    ]
                },
                educations: {
                    orderBy: [
                        { fromYear: 'desc' },
                        { fromMonth: 'desc' }
                    ]
                }
            }
        });

        res.json({
            ...user,
            profilePicture: profile?.profilePicture || null,
            about: profile?.about || null,
            skills: profile?.skills || [],
            experience: profile?.experience || [],
            education: profile?.education || [],
            experiences: profile?.experiences || [],
            educations: profile?.educations || []
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

        if (req.file) {
            console.log('File uploaded:', req.file);
            updatedData.profilePicture = `/uploads/profile/${req.file.filename}`;
        }

    for(const field of allowedFields) {
            if (req.body[field] !== undefined) {
                console.log(`Processing field ${field}:`, req.body[field]);
                if (field === 'skills') {
                    updatedData[field] = typeof req.body[field] === 'string' 
                        ? req.body[field].split(',').map(skill => skill.trim()).filter(Boolean)
                        : req.body[field];
                } else if (field === 'experience' || field === 'education') {
                    updatedData[field] = typeof req.body[field] === 'string'
                        ? req.body[field].split('\n').map(item => item.trim()).filter(Boolean)
                        : req.body[field];
                } else {
            updatedData[field] = req.body[field];
        }
    }
        }

        console.log('Updated data:', updatedData);

        const existingProfile = await prisma.profile.findUnique({
            where: { userId: userId }
        });

        console.log('Existing profile:', existingProfile);

        let profile;
        if (!existingProfile) {
            profile = await prisma.profile.create({
                data: {
                    userId: userId,
                    ...updatedData
                }
            });
            console.log('New profile created:', profile);
        } else {
            profile = await prisma.profile.update({
                where: { userId: userId },
        data: updatedData
            });
            console.log('Profile updated:', profile);
        }

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

        const updatedProfile = await prisma.profile.findUnique({
            where: { userId: userId },
            include: {
                experiences: {
                    orderBy: [
                        { fromYear: 'desc' },
                        { fromMonth: 'desc' }
                    ]
                },
                educations: {
                    orderBy: [
                        { fromYear: 'desc' },
                        { fromMonth: 'desc' }
                    ]
                }
            }
        });

    res.json({
            ...user,
            profilePicture: updatedProfile.profilePicture,
            about: updatedProfile.about,
            skills: updatedProfile.skills,
            experience: updatedProfile.experience,
            education: updatedProfile.education,
            experiences: updatedProfile.experiences || [],
            educations: updatedProfile.educations || []
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
                        education: true,
                        experiences: {
                            orderBy: [
                                { fromYear: 'desc' },
                                { fromMonth: 'desc' }
                            ]
                        },
                        educations: {
                            orderBy: [
                                { fromYear: 'desc' },
                                { fromMonth: 'desc' }
                            ]
                        }
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
                    { id: { not: currentUserId } }
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

        const userConnections = await prisma.connection.findMany({
            where: {
                OR: [
                    { senderId: currentUserId },
                    { receiverId: currentUserId }
                ]
            },
            select: {
                id: true,
                senderId: true,
                receiverId: true,
                status: true
            }
        });

        console.log('All connections for user', currentUserId, ':', userConnections.length, userConnections);

        const excludedUserIds = userConnections.map(conn => 
            conn.senderId === currentUserId ? conn.receiverId : conn.senderId
        );

        console.log('Excluded user IDs (any connection status):', excludedUserIds);

        const allExcludedIds = [currentUserId, ...excludedUserIds];

        const users = await prisma.user.findMany({
            where: {
                id: { notIn: allExcludedIds }
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

        const suggestions = users.map(user => {
            const userSkills = user.profile?.skills || [];
            const currentUserSkills = currentUser.profile?.skills || [];
            const matchingSkills = userSkills.filter(skill => 
                currentUserSkills.includes(skill)
            );

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

const createExperience = async (req, res) => {
    try {
        const userId = req.user.id;
        const { company, description, fromMonth, fromYear, toMonth, toYear, isCurrent } = req.body;

        console.log('=== Create Experience Debug ===');
        console.log('User ID:', userId);
        console.log('Request body:', req.body);
        console.log('Company:', company);
        console.log('Description:', description);
        console.log('FromMonth:', fromMonth, typeof fromMonth);
        console.log('FromYear:', fromYear, typeof fromYear);
        console.log('ToMonth:', toMonth, typeof toMonth);
        console.log('ToYear:', toYear, typeof toYear);
        console.log('IsCurrent:', isCurrent, typeof isCurrent);

        if (!company || !description) {
            return res.status(400).json({
                message: "Company and description are required"
            });
        }

        if (!fromMonth || !fromYear) {
            return res.status(400).json({
                message: "From month and year are required"
            });
        }

        const parsedFromMonth = Number.parseInt(fromMonth, 10);
        const parsedFromYear = Number.parseInt(fromYear, 10);
        const parsedToMonth = toMonth ? Number.parseInt(toMonth, 10) : null;
        const parsedToYear = toYear ? Number.parseInt(toYear, 10) : null;

        if (Number.isNaN(parsedFromMonth) || parsedFromMonth < 1 || parsedFromMonth > 12) {
            return res.status(400).json({
                message: "From month must be between 1 and 12"
            });
        }

        if (Number.isNaN(parsedFromYear) || parsedFromYear < 1900 || parsedFromYear > 2100) {
            return res.status(400).json({
                message: "From year must be a valid year"
            });
        }

        if (parsedToMonth !== null && (Number.isNaN(parsedToMonth) || parsedToMonth < 1 || parsedToMonth > 12)) {
            return res.status(400).json({
                message: "To month must be between 1 and 12"
            });
        }

        let profile = await prisma.profile.findUnique({
            where: { userId }
        });

        if (!profile) {
            profile = await prisma.profile.create({
                data: { userId }
            });
        }

        console.log('Profile ID:', profile.id);

        const experienceData = {
            profileId: profile.id,
            company: company.trim(),
            description: description.trim(),
            fromMonth: parsedFromMonth,
            fromYear: parsedFromYear,
            toMonth: parsedToMonth,
            toYear: parsedToYear,
            isCurrent: isCurrent === true || isCurrent === 'true'
        };

        console.log('Experience data to create:', experienceData);

        const experience = await prisma.experience.create({
            data: experienceData
        });

        console.log('Experience created successfully:', experience);
        res.status(201).json(experience);
    } catch (error) {
        console.error('Error creating experience:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: "Error creating experience",
            error: error.message
        });
    }
};

const updateExperience = async (req, res) => {
    try {
        const userId = req.user.id;
        const experienceId = parseInt(req.params.id);
        const { company, description, fromMonth, fromYear, toMonth, toYear, isCurrent } = req.body;

        if (isNaN(experienceId)) {
            return res.status(400).json({
                message: "Invalid experience ID"
            });
        }

        const profile = await prisma.profile.findUnique({
            where: { userId }
        });

        if (!profile) {
            return res.status(404).json({
                message: "Profile not found"
            });
        }

        const existingExperience = await prisma.experience.findFirst({
            where: {
                id: experienceId,
                profileId: profile.id
            }
        });

        if (!existingExperience) {
            return res.status(404).json({
                message: "Experience not found"
            });
        }

        const parsedFromMonth = fromMonth !== undefined ? Number.parseInt(fromMonth, 10) : existingExperience.fromMonth;
        const parsedFromYear = fromYear !== undefined ? Number.parseInt(fromYear, 10) : existingExperience.fromYear;
        const parsedToMonth = toMonth !== undefined ? (toMonth ? Number.parseInt(toMonth, 10) : null) : existingExperience.toMonth;
        const parsedToYear = toYear !== undefined ? (toYear ? Number.parseInt(toYear, 10) : null) : existingExperience.toYear;

        if (parsedFromMonth !== undefined && (Number.isNaN(parsedFromMonth) || parsedFromMonth < 1 || parsedFromMonth > 12)) {
            return res.status(400).json({
                message: "From month must be between 1 and 12"
            });
        }

        if (parsedToMonth !== null && parsedToMonth !== undefined && (Number.isNaN(parsedToMonth) || parsedToMonth < 1 || parsedToMonth > 12)) {
            return res.status(400).json({
                message: "To month must be between 1 and 12"
            });
        }

        const updateData = {
            company: company !== undefined ? company.trim() : existingExperience.company,
            description: description !== undefined ? description.trim() : existingExperience.description,
            fromMonth: parsedFromMonth,
            fromYear: parsedFromYear,
            toMonth: parsedToMonth,
            toYear: parsedToYear,
            isCurrent: isCurrent !== undefined ? (isCurrent === true || isCurrent === 'true') : existingExperience.isCurrent
        };

        console.log('Updating experience with data:', updateData);

        const updatedExperience = await prisma.experience.update({
            where: { id: experienceId },
            data: updateData
        });

        res.json(updatedExperience);
    } catch (error) {
        console.error('Error updating experience:', error);
        res.status(500).json({
            message: "Error updating experience",
            error: error.message
        });
    }
};

const deleteExperience = async (req, res) => {
    try {
        const userId = req.user.id;
        const experienceId = parseInt(req.params.id);

        if (isNaN(experienceId)) {
            return res.status(400).json({
                message: "Invalid experience ID"
            });
        }

        const profile = await prisma.profile.findUnique({
            where: { userId }
        });

        if (!profile) {
            return res.status(404).json({
                message: "Profile not found"
            });
        }

        const experience = await prisma.experience.findFirst({
            where: {
                id: experienceId,
                profileId: profile.id
            }
        });

        if (!experience) {
            return res.status(404).json({
                message: "Experience not found"
            });
        }

        await prisma.experience.delete({
            where: { id: experienceId }
        });

        res.json({
            message: "Experience deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting experience:', error);
        res.status(500).json({
            message: "Error deleting experience",
            error: error.message
        });
    }
};

const createEducation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { institution, description, fromMonth, fromYear, toMonth, toYear, isCurrent } = req.body;

        if (!institution || !description || !fromMonth || !fromYear) {
            return res.status(400).json({
                message: "Institution, description, fromMonth, and fromYear are required"
            });
        }

        if (fromMonth < 1 || fromMonth > 12 || (toMonth && (toMonth < 1 || toMonth > 12))) {
            return res.status(400).json({
                message: "Month must be between 1 and 12"
            });
        }

        let profile = await prisma.profile.findUnique({
            where: { userId }
        });

        if (!profile) {
            profile = await prisma.profile.create({
                data: { userId }
            });
        }

        const education = await prisma.education.create({
            data: {
                profileId: profile.id,
                institution,
                description,
                fromMonth: parseInt(fromMonth),
                fromYear: parseInt(fromYear),
                toMonth: toMonth ? parseInt(toMonth) : null,
                toYear: toYear ? parseInt(toYear) : null,
                isCurrent: isCurrent === true || isCurrent === 'true'
            }
        });

        res.status(201).json(education);
    } catch (error) {
        console.error('Error creating education:', error);
        res.status(500).json({
            message: "Error creating education",
            error: error.message
        });
    }
};

const updateEducation = async (req, res) => {
    try {
        const userId = req.user.id;
        const educationId = parseInt(req.params.id);
        const { institution, description, fromMonth, fromYear, toMonth, toYear, isCurrent } = req.body;

        if (isNaN(educationId)) {
            return res.status(400).json({
                message: "Invalid education ID"
            });
        }

        const profile = await prisma.profile.findUnique({
            where: { userId }
        });

        if (!profile) {
            return res.status(404).json({
                message: "Profile not found"
            });
        }

        const existingEducation = await prisma.education.findFirst({
            where: {
                id: educationId,
                profileId: profile.id
            }
        });

        if (!existingEducation) {
            return res.status(404).json({
                message: "Education not found"
            });
        }

        if (fromMonth && (fromMonth < 1 || fromMonth > 12) || 
            (toMonth && (toMonth < 1 || toMonth > 12))) {
            return res.status(400).json({
                message: "Month must be between 1 and 12"
            });
        }

        const updatedEducation = await prisma.education.update({
            where: { id: educationId },
            data: {
                institution: institution || existingEducation.institution,
                description: description || existingEducation.description,
                fromMonth: fromMonth ? parseInt(fromMonth) : existingEducation.fromMonth,
                fromYear: fromYear ? parseInt(fromYear) : existingEducation.fromYear,
                toMonth: toMonth !== undefined ? (toMonth ? parseInt(toMonth) : null) : existingEducation.toMonth,
                toYear: toYear !== undefined ? (toYear ? parseInt(toYear) : null) : existingEducation.toYear,
                isCurrent: isCurrent !== undefined ? (isCurrent === true || isCurrent === 'true') : existingEducation.isCurrent
            }
        });

        res.json(updatedEducation);
    } catch (error) {
        console.error('Error updating education:', error);
        res.status(500).json({
            message: "Error updating education",
            error: error.message
        });
    }
};

const deleteEducation = async (req, res) => {
    try {
        const userId = req.user.id;
        const educationId = parseInt(req.params.id);

        if (isNaN(educationId)) {
            return res.status(400).json({
                message: "Invalid education ID"
            });
        }

        const profile = await prisma.profile.findUnique({
            where: { userId }
        });

        if (!profile) {
            return res.status(404).json({
                message: "Profile not found"
            });
        }

        const education = await prisma.education.findFirst({
            where: {
                id: educationId,
                profileId: profile.id
            }
        });

        if (!education) {
            return res.status(404).json({
                message: "Education not found"
            });
        }

        await prisma.education.delete({
            where: { id: educationId }
        });

        res.json({
            message: "Education deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting education:', error);
        res.status(500).json({
            message: "Error deleting education",
            error: error.message
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
    getSuggestions,
    createExperience,
    updateExperience,
    deleteExperience,
    createEducation,
    updateEducation,
    deleteEducation
}