import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiRes } from "../utils/ApiRes.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { title } from "process"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const pipeline = []

    const givenquery = {}

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    if (query) {
        givenquery.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }

    if (mongoose.isValidObjectId(userId)) {
        givenquery.owner = userId;
    }

    pipeline.push({ $match: givenquery })

    const sort = {}

    if (sortBy) {
        sort[sortBy] = sortType === 'asc' ? 1 : -1
    } else {
        sort["createdAt"] = -1;
    }

    pipeline.push({ $sort: sort })

    pipeline.push({ $skip: skip }, { $limit: limitNum })

    pipeline.push(
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'owner'
            }
        }
    )

    pipeline.push({
        $project: {
            title: 1,
            thumbnail: 1,
            views: 1,
            likes: 1,
            duration: 1,
            createdAt: 1,

            "owner._id": 1,
            "owner.username": 1,
            "owner.avatar": 1
        }
    });

    const data = await Video.aggregate(pipeline)

    return res
    .status(200)
    .json(
        new ApiRes(
            200,
            data,
            'Video fetched successfully'
        )
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    // taking video and thumbnail from frontend 
    // upload it on cloudnary
    // taking url of video and thumbnail and at last duration
    // create video object
    // sent res

    const userId = req.user._id;
    const videoLocalPath = req.files.videoFile[0].path

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file required")
    }

    const thumbnailLocalPath = req.files.thumbnail[0].path

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file required")
    }

    const videoRes = await uploadOnCloudinary(videoLocalPath)
    const thumbRes = await uploadOnCloudinary(thumbnailLocalPath)


    if (!videoRes || !thumbRes) {
        throw new ApiError(400, 'Uploading on cloudnary failed')
    }

    const videoUrl = videoRes.secure_url || videoRes.url;
    const duration = typeof videoRes.duration === "number" ? videoRes.duration : Number(videoRes.duration || 0);
    const thumbnailUrl = thumbRes.secure_url || thumbRes.url;

    const videoFile = await Video.create({
        videoFile: videoUrl,
        thumbnail: thumbnailUrl,
        title: title,
        description: description,
        duration: duration,
        owner: userId
    })

    return res
        .status(200)
        .json(
            new ApiRes(
                200,
                videoFile,
                'Video Uploaded Successfully'
            )
        )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, 'Enter valid video id')
    }
    const video = await Video.findById(videoId);

    if (video == null) {
        throw new ApiError(404, 'Video not found')
    }
    return res
        .status(200)
        .json(
            new ApiRes(
                200,
                video.videoFile,
                'Video fetched successfully'
            )
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description, thumbnail } = req.body

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, 'Enter valid video id')
    }

    const video = await Video.findById(videoId);

    const thumbnailLocalPath = req.file.path

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file required")
    }

    const thumbRes = await uploadOnCloudinary(thumbnailLocalPath)

    const thumbUrl = thumbRes.secure_url || thumbRes.url;
    const updateVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbUrl
            }
        },
        { new: true }
    )

    return res
        .status(200)
        .json(
            new ApiRes(
                200,
                updateVideo,
                'Video updated successfully'
            )
        )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video ID')
    }

    await Video.findByIdAndDelete(videoId)

    return res
        .status(200)
        .json(
            new ApiRes(
                200,
                'Video deleted successfully'
            )
        )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video ID')
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, 'Video not found')
    }

    video.isPublished = !video.isPublished
    await video.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiRes(
                200,
                video.isPublished,
                'Video toggle Successfully'
            )
        )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}