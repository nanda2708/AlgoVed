import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

console.log("first")
const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
  }
}
console.log("last") 

dbConnect();

export default dbConnect;