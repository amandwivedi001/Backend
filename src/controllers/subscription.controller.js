import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiRes } from "../utils/ApiRes.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { lookup } from "dns"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    // taking user id from frontend
    // check weather it is subscribed or not
    // weather the statement return vice-versa

    const userId = req.user._id;
    if (!channelId) {
        return new ApiError(401, 'Enter valid user channel')
    }

    if (channelId.toString() === userId.toString()) {
        return res.status(400).json(new ApiError(400, "You cannot subscribe to yourself"));
    }

    const exists = await Subscription.findOne({ subscriber: userId, channel: channelId })

    if (exists) {
        await Subscription.deleteOne({ subscriber: userId, channel: channelId });
        return res
            .status(200)
            .json(
                new ApiRes(
                    200,
                    exists,
                    'Unsuscribed user'
                )
            )
    }
    else {
        const created = await Subscription.create({ subscriber: userId, channel: channelId });
        return res
            .status(200)
            .json(
                new ApiRes(
                    200,
                    created,
                    'Suscribed user'
                )
            )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!mongoose.isValidObjectId(channelId)) {
        return res.status(400).json(new ApiError(400, "Invalid channelId"));
    }

    const channelObjectId = new mongoose.Types.ObjectId(channelId);
    const list = await Subscription.aggregate([
        {
            $match: {
                channel: channelObjectId
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "UserInfo"
            }
        },
        {
            $unwind: "$UserInfo"
        },
        {
            $project: {
                _id: "$UserInfo._id",
                fullname: "$UserInfo.fullname",
                username: "$UserInfo.username",
                avatar: "$UserInfo.avatar",
                followedAt: "$createdAt"
            }
        }
    ]);



    return res
        .status(200)
        .json(
            new ApiRes(
                200,
                list,
                "subscriber list fetched Successfully"
            )
        )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const subscriberObjectId = new mongoose.Types.ObjectId(subscriberId);
    const list = await Subscription.aggregate([
        {
            $match: {
                subscriber: subscriberObjectId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "ChannelInfoInfo"
            }
        },
        {
            $unwind: "$ChannelInfoInfo"
        },
        {
            $project: {
                _id: "$ChannelInfoInfo._id",
                fullname: "$ChannelInfoInfo.fullname",
                username: "$ChannelInfoInfo.username",
                avatar: "$ChannelInfoInfo.avatar"
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiRes(
                200,
                list,
                "subscribed channel list fetched Successfully"
            )
        )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}