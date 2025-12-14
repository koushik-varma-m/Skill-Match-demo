const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createNotification } = require('./notification.controller');

const sendConnectionRequest = async(req,res) => {
    try{
        const receiverId = parseInt(req.params.userId);
        const senderId = req.user.id;

        console.log('=== Sending Connection Request ===');
        console.log('Sender ID:', senderId);
        console.log('Receiver ID:', receiverId);

        if (!receiverId || Number.isNaN(receiverId)) {
            return res.status(400).json({ message: 'Receiver ID is required' });
        }
        
        const existingConnection = await prisma.connection.findFirst({
            where: {
                OR: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId },
                ],
            },
        });

        if (existingConnection) {
            console.log('Connection already exists:', existingConnection);
            return res.status(400).json({ message: 'Connection already exists' });
        }

        const connection = await prisma.connection.create({
            data: {
                sender: {
                    connect: { id: senderId }
                },
                receiver: {
                    connect: { id: receiverId }
                },
                status: 'PENDING'
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        email: true,
                        role: true
                    }
                },
                receiver: {
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
                }
            }
        });

        console.log('Connection created successfully:', connection.id, 'Status:', connection.status);
        console.log('Connection receiver:', connection.receiver);

        await createNotification(
            receiverId,
            'CONNECTION_REQUEST',
            `${req.user.firstname} ${req.user.lastname} sent you a connection request`
        );

        res.json(connection);
    }catch(error){
        console.error('Error sending connection request:', error);
        res.status(500).json({ message: 'Error sending connection request', error: error.message });
    }
}

const acceptConnectionRequest = async(req,res) => {
    try{
        const connectionId = parseInt(req.params.connectionId);
        const userId = req.user.id;

        if (!connectionId) {
            return res.status(400).json({ message: 'Connection ID is required' });
        }

        const existingConnection = await prisma.connection.findFirst({
            where: {
                id: connectionId,
                receiverId: userId,
                status: 'PENDING'
            }
        });

        if (!existingConnection) {
            return res.status(404).json({ message: 'Connection request not found' });
        }

        const connection = await prisma.connection.update({
            where: {
                id: connectionId
            },
            data: {
                status: 'ACCEPTED'
            },
            include: {
                sender: true,
                receiver: true
            }
        });

        await createNotification(
            connection.senderId,
            'CONNECTION_ACCEPTED',
            `${req.user.firstname} ${req.user.lastname} accepted your connection request`
        );

        res.json(connection);
    }catch(error) {
        console.error('Error accepting connection request:', error);
        res.status(500).json({ message: 'Error accepting connection request' });
    }
}
 
const removeConnection = async(req,res) => {
    try{
        const { requestId } = req.params;
        const userId = req.user.id;

        console.log('=== Remove Connection Debug ===');
        console.log('Request params:', req.params);
        console.log('User ID:', userId);

        if (!requestId) {
            console.log('No request ID provided');
            return res.status(400).json({message: "Request ID is required"});
        }

        const requestIdNum = Number(requestId);
        if (isNaN(requestIdNum)) {
            console.log('Invalid request ID format:', requestId);
            return res.status(400).json({message: "Invalid request ID format"});
        }

        const connection = await prisma.connection.findFirst({
            where: {id: requestIdNum}
        });

        console.log('Found connection:', connection);

        if (!connection){
            console.log('No connection found with ID:', requestId);
            return res.status(404).json({message: "Connection not found"});
        }

        const isAuthorized = connection.receiverId.toString() === userId.toString() || 
                           connection.senderId.toString() === userId.toString();

        console.log('Authorization check:', {
            connectionReceiverId: connection.receiverId,
            connectionSenderId: connection.senderId,
            userId: userId,
            isAuthorized
        });

        if (!isAuthorized){
            console.log('User not authorized to remove this connection');
            return res.status(403).json({
                message: "Not authorized to remove this connection",
                details: {
                    connectionReceiverId: connection.receiverId,
                    connectionSenderId: connection.senderId,
                    userId: userId
                }
            });
        }

        const deletedConnection = await prisma.connection.delete({
            where: {id: requestIdNum}
        });

        console.log('Deleted connection:', deletedConnection);

        res.status(200).json({
            message: "Connection removed successfully",
            connection: deletedConnection
        });
    }catch(error) {
        console.error('Error in removeConnection:', error);
        res.status(500).json({ 
            message: "Server error",
            error: error.message 
        });
    }
}

const getConnectionSentRequests = async(req,res) => {
    try{
        const userId = req.user.id;
        console.log('Fetching sent requests for user:', userId);
        
        const requests = await prisma.connection.findMany({
            where: {
                senderId: userId,
                status: 'PENDING'
            },
            select:{
                id: true,
                receiverId: true,
                status: true
            }
        });
        
        console.log('Found sent requests:', requests.length, requests);
        
        const requestsProfile = await Promise.all(requests.map(async(request) => {
            const receiver = await prisma.user.findUnique({
                where: {id: request.receiverId},
                select:{
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
            
            if (!receiver) {
                console.warn('Receiver not found for request:', request.id, 'receiverId:', request.receiverId);
            }
            
            return {
                id: request.id,
                receiverId: request.receiverId,
                Name: receiver?.firstname || 'Unknown User',
                status: request.status,
                receiver: receiver || null
            };
        }));

        console.log('Returning sent requests:', requestsProfile.length);
        console.log('Sent requests data:', JSON.stringify(requestsProfile, null, 2));
        
        res.json({
            message: "Requests Sent", 
            connection: requestsProfile || []
        });
    }catch(error){
        console.error('Error in getConnectionSentRequests:', error);
        res.status(500).json({message: "Server Error", error: error.message});
    }
}

const getConnectionReceivedRequests = async(req,res) => {
    try{
        const userId = req.user.id;
        console.log('Fetching received requests for user:', userId);

        const requests = await prisma.connection.findMany({
            where: {
                receiverId: userId,
                status: "PENDING"
            },
            select: {
                id: true,
                senderId: true,
                status: true
            }
        });

        console.log('Found received requests:', requests);

        const requestsProfile = await Promise.all(requests.map(async(request)=> {
            const sender = await prisma.user.findUnique({
                where: { id: request.senderId},
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

            return {
                id: request.id,
                senderId: request.senderId,
                Name: sender?.firstname || 'Unknown User',
                status: request.status,
                sender: sender
            };
        }));

        console.log('Processed requests profile:', requestsProfile);

        res.json({
            message: "Requests Received", 
            connection: requestsProfile
        });
    }catch(error){
        console.error('Error in getConnectionReceivedRequests:', error);
        res.json({
            message: "Server Error",
            error: error.message
        });
    }
}

const getUserConnections = async(req,res) => {
    try{
        const userId = req.user.id;
        console.log('Fetching connections for user:', userId);

        const connections = await prisma.connection.findMany({
            where: {
                AND:[
                    {status: "ACCEPTED"},
                    {OR:[{senderId: userId},{receiverId: userId}]}
                ]
            },
            select: {
                id: true,
                senderId: true,
                receiverId: true,
                status: true
            }
        });

        console.log('Found connections:', connections);

        const connectionProfiles = await Promise.all(connections.map(async(connection) => {
            const otherUserId = connection.senderId == userId ? connection.receiverId : connection.senderId;
            const user = await prisma.user.findFirst({
                where: { id: otherUserId },
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

            return {
                ...user,
                        connectionId: connection.id
            };
        }));

        console.log('Fetched connection profiles:', connectionProfiles);

        res.status(200).json({
            message: "Connections retrieved successfully",
            connection: connectionProfiles
        });
    }catch(error){
        console.error('Error in getUserConnections:', error);
        res.status(500).json({
            message: "Server Error",
            error: error.message
        });
    }
}

const getConnectionStatus = async(req, res) => {
    try{
        const userId = req.user.id;
        const { checkUser } = req.params;
        console.log(checkUser);
        const connectionStatus = await prisma.connection.findFirst({
            where:{
                OR:[
                    {senderId:userId,receiverId:Number(checkUser)},
                    {senderId:Number(checkUser), receiverId:userId}
                ]
            },
            select:{
                status:true
            }
        });
        if(!connectionStatus){
            res.status(200).json({message: "No connection with this user"});
        }
        res.status(200).json({message: {
            "Connection Status": connectionStatus
        }});
    }catch(error){
        console.log(error);
        res.status(500).json("Server Error");
    }
}

module.exports = {
    sendConnectionRequest,
    acceptConnectionRequest,
    removeConnection,
    getConnectionSentRequests,
    getConnectionReceivedRequests,
    getUserConnections,
    getConnectionStatus
}