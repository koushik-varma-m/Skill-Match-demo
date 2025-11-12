const jwt = require('jsonwebtoken');

const createToken = (res, userId) => {
    const token = jwt.sign( {userId}, process.env.SECRET_KEY, {
        expiresIn: "30d"
    } );

    const cookieOptions = {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        path: '/',
    };

    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }

    res.cookie("jwt", token, cookieOptions);
    return token;
}

module.exports = createToken;