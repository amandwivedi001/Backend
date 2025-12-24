import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiRes } from "../utils/ApiRes.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    const userId = req.body?._id

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video Id')
    }

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, 'Invalid user Id')
    }

    const isExist = await Like.findOne({ video: videoId, likedBy: userId })

    let action;
    if (isExist) {
        await Like.deleteOne({ _id: isExist._id })
        action = 'unliked'
    }
    else {
        await Like.create({
            video: videoId,
            owner: userId
        })
        action = 'liked'
    }

    return res
        .status(200)
        .json(
            new ApiRes(
                200,
                `Video is ${action} successfully`
            )
        )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    const userId = req.body?._id

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, 'Invalid comment Id')
    }

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, 'Invalid user Id')
    }

    const isExist = await Like.findOne({ comment: commentId, likedBy: userId })

    let action;
    if (isExist) {
        await Like.deleteOne({ _id: isExist._id })
        action = 'unliked'
    }
    else {
        await Like.create({
            comment: commentId,
            owner: userId
        })
        action = 'liked'
    }

    return res
        .status(200)
        .json(
            new ApiRes(
                200,
                `Comment is ${action} successfully`
            )
        )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    const userId = req.body?._id

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, 'Invalid tweet Id')
    }

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, 'Invalid user Id')
    }

    const isExist = await Like.findOne({ comment: commentId, likedBy: userId })

    let action;
    if (isExist) {
        await Like.deleteOne({ _id: isExist._id })
        action = 'unliked'
    }
    else {
        await Like.create({
            tweet: tweetId,
            owner: userId
        })
        action = 'liked'
    }

    return res
        .status(200)
        .json(
            new ApiRes(
                200,
                `Tweet is ${action} successfully`
            )
        )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.body?._id

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, 'Invalid user Id')
    }

    const videos = Like.aggregate([
        {
            $match: { likedBy: userId }
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'video',
                foreignField: '_id',
                as: 'videoInfo',
                pipeline:
                    [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            fullname: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        }

                    ]
            }
        }
    ])


    return res
    .status(200)
    .json(
        new ApiRes(
            200,
            videos,
            'All liked video fetched Successfully'
        )
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}