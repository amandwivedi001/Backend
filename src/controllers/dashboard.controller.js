import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiRes } from "../utils/ApiRes.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { channel } from "diagnostics_channel"

const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user && req.user._id;
  if (!userId || !mongoose.isValidObjectId(userId)) throw new ApiError(401, "Unauthorized");

  const objectUserId = new mongoose.Types.ObjectId(userId);

  const videoStat = await Video.aggregate([
    { $match: { owner: objectUserId } },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: { $ifNull: ["$views", 0] } }
      }
    }
  ]);
  const { totalVideos = 0, totalViews = 0 } = videoStat[0] || {};

  const likesAgg = await Video.aggregate([
    { $match: { owner: objectUserId } },
    {
      $lookup: {
        from: "likes",
        let: { vid: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$video", "$$vid"] } } },
          { $count: "count" }
        ],
        as: "likesAgg"
      }
    },
    {
      $project: {
        likesCount: { $ifNull: [{ $arrayElemAt: ["$likesAgg.count", 0] }, 0] }
      }
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: "$likesCount" }
      }
    }
  ]);
  const totalLikes = (likesAgg[0] && likesAgg[0].totalLikes) || 0;

  const totalSubscribes = await Subscription.countDocuments({ channel: objectUserId });

  const stats = {
    totalLikes,
    totalVideos,
    totalViews,
    totalSubscribes
  };

  return res.status(200).json(new ApiRes(200, stats, "Channel stats fetched successfully"));
});


const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user._id;

    const videoStats = await Video.aggregate([
        { $match: { owner: mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'owner'
            }
        },
        {
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
        }
    ])

    return res
    .status(200)
    .json(
        new ApiRes(
            200,
            videoStats,
            'Video fetched successfully'
        )
    )
})

export {
    getChannelStats,
    getChannelVideos
}