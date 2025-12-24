import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiRes } from "../utils/ApiRes.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    //verify by jwt
    //taking description from frontend 
    // creating object on db
    // sent res 

    const { description } = req.body

    if (!description || !description.toString().trim()) {
        return new ApiError(400, 'Description is required')
    }

    const user = await User.findById(req.user?._id).select(
        "-password -refreshToken"
    );

    if (!user) {
        return new ApiError(401, "User does not found")
    }
    const tweet = await Tweet.create({
        owner: user._id,
        content: description.toString().trim()
    })

    return res
        .status(200)
        .json(
            new ApiRes(
                200,
                tweet,
                'Tweet is posted successfully'
            )
        )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    // firstly verify user 
    const { userId } = req.params;
    console.log(userId);
    console.log(req.user._id);


    const user = await User.findById(userId);

    const tweet = await Tweet.find({ owner: user })
        .sort({
            createdAt: -1
        })
        .select("content createdAt")
        .lean()


    return res
        .status(200)
        .json(
            new ApiRes(
                200,
                tweet,
                'All tweets are fetched successfully'
            )
        )
})

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  let { newTweetDes } = req.body;

  // Validate input
  if (!newTweetDes) {
    return res
      .status(400)
      .json(new ApiError(400, "New tweet content cannot be empty"));
  }

  // Normalize
  newTweetDes = newTweetDes.toString().trim();

  // Fetch tweet
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    return res
      .status(404)
      .json(new ApiError(404, "Tweet not found"));
  }

  // Ownership check
  if (tweet.owner.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json(new ApiError(403, "You cannot update someone else's tweet"));
  }

  // Update
  tweet.content = newTweetDes;
  await tweet.save();

  return res
    .status(200)
    .json(new ApiRes(200, tweet, "Tweet updated successfully"));
});


const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params

    await Tweet.findByIdAndDelete(tweetId);

    return res
        .status(200)
        .json(
            new ApiRes(
                200,
                {},
                "Tweet deleted succesfully"
            )
        )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}