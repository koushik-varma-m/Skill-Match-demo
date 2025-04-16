const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sendConnectionRequest = async(req,res) => {
    try{

        const { userId } = req.params;
        const sender = req.user;

        if (userId==sender.id.toString()){
            res.status(400).json({message: "You cannot send connection request to yourself"});
        }

        const existingConnectionsSent = await prisma.connection.findFirst({
            where: {senderId: sender.id,
                receiverId: Number(userId)
            }
        });

        if(existingConnectionsSent){
            if(existingConnectionsSent.status == "ACCEPTED"){
                return res.status(400).json({message: "You were already connected"});
            }else if(existingConnectionsSent.status == "PENDING"){
                return res.status(400).json({message: "You have already sent a connection request"});
            }else{
                return res.status(400).json({message: "Connection Request is rejected"});
            }
        }

        const existingConnectionsReceived = await prisma.connection.findFirst({
            where: {senderId: Number(userId),
                receiverId: sender.id
            }
        });

        if(existingConnectionsReceived){
            if(existingConnectionsReceived.status == "ACCEPTED"){
                return res.status(400).json({message: "You were already connected"});
            }else if(existingConnectionsReceived.status == "PENDING"){
                return res.status(400).json({message: "You have already received a connection request"});
            }else{
                return res.status(400).json({message: "You have rejected the connection request"});
            }
        }
        try{
            const newRequest = await prisma.connection.create({
                data: {
                    senderId: sender.id,
                    receiverId: Number(userId)
                }
            });
        }catch(error){
            return res.json({message: 'error while sending the request'});
        }
        

        return res.json({message: 'Connection request has been sent'});
    }catch(error){
        console.log(error);
        res.status(500).json("Server error");
    }
}

const acceptConnectionRequest = async(req,res) => {
    try{
        const { requestId } = req.params;
        const userId = req.user.id;

        const connectionRequest = await prisma.connection.findFirst({
            where: {id: Number(requestId)}
        })

        if (!connectionRequest){
            return res.status(404).json({message: "Connection request not found"});
        }

        if (connectionRequest.receiverId.toString()!==userId.toString()){
            return res.status(403).json({message: "Not authorised to accept this request"});
        }

        if(connectionRequest.status !== "PENDING"){
            return res.status(400).json({message:"Request already processed"});
        }

        const updatedConnectionRequest = await prisma.connection.update({
            where: { id:Number(requestId)},
            data: { status: "ACCEPTED"}
        });
        res.status(200).json({message: "Request Accepted", connection: updatedConnectionRequest});
    }catch(error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
}
 
const removeConnection = async(req,res) => {
    try{
        const { requestId } = req.params;
        const userId = req.user.id;

        const connectionRequest = await prisma.connection.findFirst({
            where: {id: Number(requestId)}
        })

        if (!connectionRequest){
            return res.status(404).json({message: "Connection request not found"});
        }

        if (connectionRequest.receiverId.toString()!==userId.toString() && connectionRequest.senderId.toString()!==userId.toString()){
            return res.status(403).json({message: "Not authorised to remove this request"});
        }
        await prisma.connection.delete({
            where: {id: Number(requestId)}
        });
        res.status(200).json({message: "Connection removed"});
    }catch(error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
}

const getConnectionSentRequests = async(req,res) => {
    try{
        const userId = req.user.id;
        const requests = await prisma.connection.findMany({
            where: {senderId: userId},
            select:{
                receiverId:true,
                status:true
            }
        });
        const requestsProfile = await Promise.all(requests.map(async(request) => {
            return ({
                Name: (await prisma.user.findUnique({
                    where: {id: request.receiverId},
                    select:{
                        firstname: true
                    }
                })).firstname,
                status:request.status
            });
        }))

        res.json({messasge: "Requests Sent", connection: requestsProfile});
    }catch(error){
        console.log(error);
        res.json({message: "Server Error"});
    }
}

const getConnectionReceivedRequests = async(req,res) => {
    try{
        const userId = req.user.id;
        const requests = await prisma.connection.findMany({
            where: {receiverId: userId},
            select: {
                senderId:true,
                status:true
            }
        })
        const requestsProfile = await Promise.all(requests.map(async(request)=> {
            return({
                Name: (await prisma.user.findUnique({
                    where:{ id: request.senderId},
                    select: {
                        firstname: true
                    }
                })).firstname,
                status: request.status
            })
        }))
        res.json({message: "Requests Received", connection: requestsProfile});
    }catch(error){
        console.log(error);
        res.json({message: "Server Error"});
    }
}

const getUserConnections = async(req,res) => {
    try{
        const userId = req.user.id;
        const connections = await prisma.connection.findMany({
            where: {
                AND:[
                    {status: "ACCEPTED"},
                    {OR:[{senderId: userId},{receiverId: userId}]}
                ]
            },
            select: {
                senderId: true,
                receiverId: true
            }
        });
        const connectionIDs = connections.map(connection=> {
            return connection.senderId==userId? connection.receiverId: connection.senderId
        })
        const connectionProfiles = await Promise.all(connectionIDs.map(async(c) => {
            return await prisma.user.findFirst({
                where:{ id: c},
                select:{
                    firstname:true,
                    profile:{
                        select:{
                            profilePicture:true
                        }
                    }
                }
            })
        }));
        res.status(200).json({message: "Connections", connection:connectionProfiles});
    }catch(error){
        console.log(error);
        res.status(500).json({message: "Server Error"});
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