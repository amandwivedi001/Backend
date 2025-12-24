import mongoose, { Schema } from "mongoose"

const subscriptionsSchema = Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId, // one who is subscribing
            ref: "User"
        },
        channel: {
            type: Schema.Types.ObjectId, //one whom suscribers are suscribing
            ref: "User"
        }
    },
    { timestamps: true }
)


export const Subscription = mongoose.model("Subscription", subscriptionsSchema);
