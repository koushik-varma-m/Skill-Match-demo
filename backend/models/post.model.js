const {z} = require('zod');

const postSchema = z.object({
    content: z.string(),
    image: z.string().url()
})

module.exports = {
    postSchema
}