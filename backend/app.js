const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const env = require("./src/config/env");
const routes = require("./src/routes");
const errorHandler = require("./src/middlewares/errorHandler");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");

const app = express();

app.use(helmet({ contentSecurityPolicy: false })); // Disable CSP for swagger UI
app.use(cors({ origin: env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1", routes);

app.use((req, res) => {
    res.status(404).json({ success: false, statusCode: 404, message: "Route not found" });
});

app.use(errorHandler);

module.exports = app;
