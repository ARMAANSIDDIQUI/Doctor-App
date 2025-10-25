const mongoose = require("mongoose");
const OrderSchema = new mongoose.Schema(
    {
        serialNo: {
            type: String,
            unique: true,
            required: true,
        },
        name : {
            type : String,
            required : true
        },
        age : {
            type : String,
            required : true
        },
        gender : {
            type : String,
            required : true

        },
        address : {
            type : String,
            required : true
        },
        phoneNo : {
            type : Number,
            required : true,
        },
        referredBy : {
            type: mongoose.Schema.Types.Mixed, // Reference to DoctorDB
            ref: "Doctor", // Target collection
            required: true        
        },
        category:{
            type : String,
            required : true 

        },
        subcategory:{
            type : String,
            required : true 
        },
        fees:{
            type : Number,
            required : true 

        },
        discount:{
            type : Number,
            default:0

        },
        finalPayment:{
            type : Number,
            required : true 

        },
        paymentMode:{
            type : String,
            required : true 
        },


        // extra fields for Online + Cash-Armaan Siddiqui
        online: {
            type: Number,
            default: 0,
        },
        cash: {
            type: Number,
            default: 0,
        },

        referralFee:{
            type : Number,
            required : true 

        },
        placedBy: {
            type: String,
            required: true
        },
    },
    {timestamps:true}
)

// This index fixes the 32MB sorting error and is optimized
// for your filter (referredBy) and sort (createdAt)-Armaan Siddiqui
OrderSchema.index({ referredBy: 1, createdAt: -1 });

const Order = mongoose.model("Order",OrderSchema);

module.exports = Order; 