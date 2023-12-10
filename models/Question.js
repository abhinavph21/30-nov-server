const questionSchema = new mongoose.Schema({
    user_id: String,
    user_name: String,
    title: String,
    body: String,
    tags: Array,
    votes: Array,
    answers: Array,
  },
    {
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000
      }
    })
  module.exports = mongoose.model("question", questionSchema)