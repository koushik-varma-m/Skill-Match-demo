const {z} = require('zod');

const jobSchema = z.object({
    title: z.string(),
    description: z.string(),
    requirements: z.string()
})

module.exports = {
    jobSchema
}