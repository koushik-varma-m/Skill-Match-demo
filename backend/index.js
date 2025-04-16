const express = require('express');
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
app.use(express.json())
app.use(cookieParser());

const authRouter = require('./routes/auth.route');
const connectionRouter = require('./routes/connection.route');
const userRouter = require('./routes/user.route');
const jobsRouter = require('./routes/job.route');
const postRouter = require('./routes/post.route');

app.use('/auth',authRouter);
app.use('/user',userRouter);
app.use('/connection', connectionRouter);
app.use('/job', jobsRouter);
app.use('/post', postRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})