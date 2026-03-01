const mongoose = require("mongoose");
const logger = require("../utils/logger");
const env = require("./env");

let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;

    try {
        const conn = await mongoose.connect(env.MONGODB_URI, {
            maxPoolSize: 10,
        });
        isConnected = true;
        logger.info(`MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        logger.error(`MongoDB connection error: ${err.message}`);
        process.exit(1);
    }
};

const closeDB = async () => {
    if (!isConnected) return;
    await mongoose.connection.close();
    isConnected = false;
    logger.info("MongoDB connection closed");
};


const gracefulShutdown = (signal) => {
    process.on(signal, async () => {
        logger.info(`${signal} received — closing MongoDB connection`);
        await closeDB();
        process.exit(0);
    });
};

gracefulShutdown("SIGINT");
gracefulShutdown("SIGTERM");

module.exports = { connectDB, closeDB };
