const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const prisma = new PrismaClient();
const { createNotification } = require('./notification.controller');

const getAllPosts = async(req, res) => {
    try{
        // First get all connections for the current user
        const connections = await prisma.connection.findMany({
            where: {
                OR: [
                    { senderId: req.user.id },
                    { receiverId: req.user.id }
                ],
                status: 'ACCEPTED'
            },
            select: {
                senderId: true,
                receiverId: true
            }
        });

        // Extract connected user IDs
        const connectedUserIds = connections.map(conn => 
            conn.senderId === req.user.id ? conn.receiverId : conn.senderId
        );
        
        // Add current user's ID to see their own posts
        connectedUserIds.push(req.user.id);

        // Get posts from connected users
        const posts = await prisma.post.findMany({
            where: {
                userId: {
                    in: connectedUserIds
                }
            },
            include: {
                comments: {
                    include: {
                    user: {
                      select: {
                        id: true,
                        firstname: true,
                                lastname: true,
                                profile: {
                                    select: {
                                        profilePicture: true
                                    }
                                }
                      }
                    }
                  },
                    orderBy: { id: 'asc' }
                },
                like: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true
                    }
                },
                user: {
                  select: {
                    id: true,
                        firstname: true,
                        lastname: true,
                        profile: {
                            select: {
                                profilePicture: true
                            }
                        }
                  }
                }
            },
            orderBy: {
                createdAt: 'desc'
              }
        });
        res.status(200).json({message: "All posts retrieved", posts});
    }catch(error) {
        console.log(error);
        res.status(500).json("Server Error");
    }
}

const getUserPosts = async(req, res) => {
    try{
        const userPosts = await prisma.post.findMany({
            where: {
                userId: req.user.id
            },
            include: {
                comments: {
                    include: {
                    user: {
                      select: {
                        id: true,
                        firstname: true,
                                lastname: true,
                                profile: {
                                    select: {
                                        profilePicture: true
                                    }
                                }
                      }
                    }
                  },
                    orderBy: { id: 'asc' }
                },
                like: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true
                    }
                },
                user: {
                  select: {
                    id: true,
                        firstname: true,
                        lastname: true,
                        profile: {
                            select: {
                                profilePicture: true
                            }
                  }
                }
                }
            },
            orderBy: {
                createdAt: 'desc'
              }
        });
        res.status(200).json({message: "User posts retrieved", userPosts});
    }catch(error){
        console.log(error);
        res.status(500).json("Server Error");
    }
}

const createPost = async(req, res) => {
    try {
        console.log('=== Debug Info ===');
        console.log('Headers:', req.headers);
        console.log('Content-Type:', req.headers['content-type']);
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        console.log('=================');

        const { content } = req.body;
        if (!content) {
            return res.status(400).json({
                message: "Content is required"
            });
        }

        let imagePath = '';
        if (req.file) {
            console.log('File uploaded:', req.file);
            imagePath = `/uploads/posts/${req.file.filename}`;
        }

        const createdPost = await prisma.post.create({
            data: {
                userId: req.user.id,
                content: content,
                image: imagePath
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        profile: {
                            select: {
                                profilePicture: true
                            }
                        }
                    }
                }
            }
        });

        // Get all connections of the user
        const connections = await prisma.connection.findMany({
            where: {
                OR: [
                    { senderId: req.user.id, status: 'ACCEPTED' },
                    { receiverId: req.user.id, status: 'ACCEPTED' },
                ],
            },
        });

        // Create notifications for all connections
        const notificationPromises = connections.map(connection => {
            const connectionUserId = connection.senderId === req.user.id ? connection.receiverId : connection.senderId;
            return createNotification(
                connectionUserId,
                'NEW_POST',
                `${req.user.firstname} ${req.user.lastname} created a new post`
            );
        });

        await Promise.all(notificationPromises);

        res.status(200).json({message: "Post created", createdPost});
    }catch(error){
        console.error('Error in createPost:', error);
        res.status(500).json({
            message: "Error creating post",
            error: error.message
        });
    }
}

const updatePost = async(req, res) => {
    try {
        const {id} = req.params;

        const userPosted = await prisma.post.findFirst({
            where:{ id: Number(id)},
            select:{
                userId: true,
                image: true
            }
        });

        if(userPosted.userId !== req.user.id){
            return res.status(400).json({message: "You are not authorized to update"});
        }

        const updatedData = {
            content: req.body.content
        };

        if (req.files && req.files.image) {
            // Delete old image if exists
            if (userPosted.image) {
                const oldImagePath = path.join(__dirname, '..', userPosted.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            const image = req.files.image;
            const uploadDir = path.join(__dirname, '..', 'uploads', 'posts');
            const fileName = `post-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(image.name)}`;
            const filePath = path.join(uploadDir, fileName);
            
            await image.mv(filePath);
            updatedData.image = `/uploads/posts/${fileName}`;
        }

        const updatedPost = await prisma.post.update({
            where:{ id: Number(id)},
            data: updatedData,
            include: {
                user: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        profile: {
                            select: {
                                profilePicture: true
                            }
                        }
                    }
                }
            }
        });
        res.status(200).json({message: "Post updated", updatedPost});
    }catch(error){
        console.log(error);
        res.status(500).json("Server Error");
    }
}

const deletePost = async(req, res) => {
    try {
        const {id} = req.params;

        const userPosted = await prisma.post.findFirst({
            where:{ id: Number(id)},
            select:{
                userId: true,
                image: true
            }
        });

        if (!userPosted) {
            return res.status(404).json({message: "Post not found"});
        }

        if(userPosted.userId !== req.user.id){
            return res.status(400).json({message: "You are not authorized to delete"});
        }

        // Delete image if exists
        if (userPosted.image) {
            const imagePath = path.join(__dirname, '..', userPosted.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await prisma.post.delete({
            where:{ id: Number(id)}
        });
        res.status(200).json({message: "Post deleted"});
    }catch(error){
        console.log(error);
        res.status(500).json("Server Error");
    }
}

const createComment = async(req, res) => {
    try {
        const {id} = req.params;
        const {comment} = req.body;

        if(!comment){
            return res.status(400).json({message: "Comment is required"});
        }

        const createdComment = await prisma.comment.create({
            data: {
                postId: Number(id),
                userId: req.user.id,
                comment: comment
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        profile: {
                            select: {
                                profilePicture: true
                            }
                        }
                    }
                }
            }
        });
        res.status(200).json({message: "Comment created", createdComment});
    }catch(error){
        console.log(error);
        res.status(500).json("Server Error");
    }
}

const deleteComment = async(req, res) => {
    try {
        const {id, commentId} = req.params;

        const userCommented = await prisma.comment.findFirst({
            where:{ id: Number(commentId)},
            select:{
                userId: true
            }
        });

        if(userCommented.userId !== req.user.id){
            return res.status(400).json({message: "You are not authorized to delete"});
        }

        await prisma.comment.delete({
            where:{ id: Number(commentId)}
        });
        res.status(200).json({message: "Comment deleted"});
    }catch(error){
        console.log(error);
        res.status(500).json("Server Error");
    }
}

const likePost = async(req, res) => {
    try {
        const {id} = req.params;

        // Check if post exists
        const post = await prisma.post.findUnique({
            where: { id: Number(id) }
        });

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if user has already liked the post
        const existingLike = await prisma.post.findFirst({
            where: {
                id: Number(id),
                like: {
                    some: {
                        id: req.user.id
                    }
                }
            }
        });

        if (existingLike) {
            // Unlike the post
            await prisma.post.update({
                where: { id: Number(id) },
                data: {
                  like: {
                        disconnect: {
                            id: req.user.id
                        }
                  }
                }
              });
        } else {
            // Like the post
            await prisma.post.update({
                where: { id: Number(id) },
                data: {
                  like: {
                        connect: {
                            id: req.user.id
                        }
                  }
                }
            });
        }

        // Get updated post with likes
        const updatedPost = await prisma.post.findUnique({
            where: { id: Number(id) },
            include: {
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstname: true,
                                lastname: true,
                                profile: {
                                    select: {
                                        profilePicture: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { id: 'asc' }
                },
                like: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        profile: {
                            select: {
                                profilePicture: true
                            }
                        }
                    }
                }
            }
        });

        res.status(200).json({
            message: existingLike ? "Post unliked" : "Post liked",
            post: updatedPost
        });
    }catch(error){
        console.log(error);
        res.status(500).json("Server Error");
    }
}

module.exports = {
    getAllPosts,
    getUserPosts, 
    createPost, 
    updatePost, 
    deletePost, 
    createComment, 
    deleteComment,
    likePost
};