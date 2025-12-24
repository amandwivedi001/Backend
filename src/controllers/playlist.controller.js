import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiRes } from "../utils/ApiRes.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    //TODO: create playlist

    const userId = req.user._id;

    if (!name) throw new ApiError(400, "Playlist name is required");

    const playlist = await Playlist.create({
        name: name,
        description: description,
        owner: userId,
        video: []
    })

    return res
        .status(201)
        .json(
            new ApiRes(
                201,
                playlist,
                'Playlist created successfully'
            )
        )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists

    const playlists = await Playlist.aggregate([
        {
            $match: { owner: userId }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'owner',
                foreignField: '_id',
                as: 'ownerInfo',
                pipeline: [{
                    $project: {
                        fullName: 1,
                        userName: 1,
                        avatar: 1
                    }
                }]
            }
        },
        {
            $project: {
                name: 1,
                ownerInfo: 1
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiRes(
                200,
                playlists,
                'User playlist fetched successfully'
            )
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, 'Invalid playlistId')
    }

    const playlist = await Playlist.findOne({ _id: playlistId })

    if (!playlist) {
        throw new ApiError(400, 'Invalid playlist id')
    }

    if (playlist.video.length == 0) {
        return res
            .status(200)
            .json(
                new ApiRes(
                    200,
                    playlist,
                    'Playlist fetched successfully with empty video'
                )
            )
    }
    else {
        const playlistWithVideos = await Playlist.aggregate([
            {
                $match: { _id: playlistId }
            },
            {
                $lookup: {
                    from: 'videos',
                    localField: 'video',
                    foreignField: '_id',
                    as: 'videoInfo',
                    pipeline: [
                        {
                            $project: {
                                title: 1,
                                description: 1,
                                createdAt: 1,
                                duration: 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'ownerInfo',
                    pipeline: [
                        {
                            $project: {
                                fullName: 1,
                                userName: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    name: 1,
                    videoInfo: 1,
                    ownerInfo: 1
                }
            }
        ])

        return res
            .status(200)
            .json(
                new ApiRes(
                    200,
                    playlistWithVideos,
                    'Playlist fetched successfully'
                )
            )
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, 'Invalid playlist Id')
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video Id')
    }

    await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { videos: mongoose.Types.ObjectId(videoId) } },
        { new: true }
    )

    return res
    .status(200)
    .json(
        new ApiRes(
            200,
            'Video added Successfully'
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, 'Invalid playlist Id')
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video Id')
    }

    await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: mongoose.Types.ObjectId(videoId) } },
        { new: true }
    )

    .status(200)
    .json(
        new ApiRes(
            200,
            'Video deleted Successfully'
        )
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.user && req.user._id; // auth middleware must set this

  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist Id");
  }
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(401, "Unauthorized");
  }

  // ensure playlist exists and belongs to requester (owner-only deletion)
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (String(playlist.owner) !== String(userId)) {
    throw new ApiError(403, "Not allowed to delete this playlist");
  }

  await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiRes(200, null, "Playlist deleted successfully"));
});


const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  const userId = req.user && req.user._id;

  if (!mongoose.isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist Id");
  }
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(401, "Unauthorized");
  }

  if (name !== undefined && typeof name === "string" && name.trim().length === 0) {
    throw new ApiError(400, "If provided, name cannot be empty");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (String(playlist.owner) !== String(userId)) {
    throw new ApiError(403, "Not allowed to update this playlist");
  }

  const updated = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {})
      }
    },
    { new: true, runValidators: true }
  ).lean();

  return res
    .status(200)
    .json(new ApiRes(200, updated, "Playlist updated successfully"));
});


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}