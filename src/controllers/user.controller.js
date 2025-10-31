import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiRes } from "../utils/ApiRes.js";
import jwt from "jsonwebtoken"

const generateAccessandRefereshToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and referesh token")
    }

}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user exist : email or username
    // check image , check avatar (file chack)
    // upload on cloudnary - again check avatar and image upload from res
    // create user object - create db entry
    // remove password and token feild to send before to frontend
    // check for user creation
    // return res 

    const { fullname, email, username, password } = req.body
    console.log("email :", email);

    if (
        [fullname, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError("400", "All field are required")
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (existedUser) {
        throw new ApiError("409", "User with email or userName already exist")
    }

    const avatarLocalpath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    console.log("Avatar local path:", avatarLocalpath);

    if (!avatarLocalpath) {
        throw new ApiError(400, "Avatar file required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalpath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiRes(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    //take data from req.body that is frontend
    // check user exist with username or emial
    // check password
    // refreshtoken and access token 
    // send cookies

    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (!existedUser) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordCorrect = await existedUser.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessandRefereshToken(
        existedUser._id
    );

    const loggedInUser = await User.findById(existedUser._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiRes({
                user: loggedInUser,
                accessToken,
                refreshToken,
                message: "User logged in successfully",
            })
        );

})

const logOutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiRes(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler ( async (req, res) => {
    const incomingRefrshToken = req.cookies?.refreshToken || req.body.refreshToken

    if(!incomingRefrshToken){
        throw new ApiError(401, "Unauthorised request")
    }

    const decodedToken = jwt.verify(incomingRefrshToken, process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id);

    if(!user){
        throw new ApiError(401, "Invalid refresh token")
    }

    if(user.refreshToken !== decodedToken){
        throw new ApiError(401, "Refresh token is expired or already used")
    }

    const {accessToken, newrefreshToken} = generateAccessandRefereshToken(user._id);

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshToken, options)
    .json(
        new ApiRes(
            200,
            {
                accessToken, 
                refreshToken: newrefreshToken
            },
            "Access token refreshed"
        )
    )
})

export { registerUser, loginUser, logOutUser, refreshAccessToken}