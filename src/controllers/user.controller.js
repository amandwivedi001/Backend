import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User }from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiRes } from "../utils/ApiRes.js";

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

    if(existedUser){
        throw new ApiError("409", "User with email or userName already exist")
    }

    const avatarLocalpath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    console.log("Avatar local path:", avatarLocalpath);

    if(!avatarLocalpath){
        throw new ApiError(400, "Avatar file required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalpath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username : username.toLowerCase(),
        email,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiRes(200, createdUser, "User registered successfully")
    )
})


export { registerUser }