const { z } = require('zod');

const userSignup = z.object({
    firstname: z.string().min(3, { message: "Must be 3 or more characters long" }).max(20, { message: "Must be 20 or fewer characters long" }),
    lastname: z.string().min(3, { message: "Must be 3 or more characters long" }).max(20, { message: "Must be 20 or fewer characters long" }),
    username: z.string().min(3, { message: "Must be 3 or more characters long" }).max(20, { message: "Must be 20 or fewer characters long" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." })
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\|]).*$/, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    }),
    role: z.enum(["CANDIDATE", "RECRUITER"])
});

const userSignin = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." })
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\|]).*$/, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    })
});



module.exports = { userSignin, userSignup}