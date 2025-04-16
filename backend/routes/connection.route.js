const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
    sendConnectionRequest, 
    acceptConnectionRequest, 
    removeConnection,
    getConnectionSentRequests,
    getConnectionReceivedRequests,
    getUserConnections,
    getConnectionStatus
} = require('../controllers/connection.controller');

router.post('/request/:userId', authMiddleware, sendConnectionRequest);
router.put('/accept/:requestId', authMiddleware, acceptConnectionRequest);
router.put('/remove/:requestId', authMiddleware, removeConnection);

router.get('/requests/sent', authMiddleware, getConnectionSentRequests);
router.get('/requests/received', authMiddleware, getConnectionReceivedRequests)

router.get('/connected', authMiddleware, getUserConnections);
router.get('/status/:checkUser', authMiddleware, getConnectionStatus);

module.exports = router;