import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile: {
        tyoe: String, //cloudinary url
        required: true
    },
    videoFile: {
        tyoe: String, //cloudinary url
        required: true
    },
    thumbnail: {
        tyoe: String, //cloudinary url
        required: true
    },
    title: {
        tyoe: String,
        required: true
    },
    discription: {
        tyoe: String, //cloudinary url
        required: true
    },
    duration: {
        tyoe: String,
        required: true
    },
    views: {
        tyoe: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)