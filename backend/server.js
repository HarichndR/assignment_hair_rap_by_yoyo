require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./src/config/db");
const env = require("./src/config/env");
const logger = require("./src/utils/logger");

const start = async () => {
    await connectDB();
    const PORT = env.PORT || 5000;
    app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    });
};

start();
