const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const { ROLES, OAUTH_PROVIDERS } = require("../config/constants");

const signTokens = (payload) => {
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRY,
    });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRY,
    });
    return { accessToken, refreshToken };
};

const cookieOptions = (maxAgeSec) => ({
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: maxAgeSec * 1000,
});

const adminLogin = async (email, password) => {
    const user = await User.findOne({ email, role: ROLES.ADMIN }).select("+passwordHash");
    if (!user) throw new ApiError(401, "Invalid credentials");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ApiError(401, "Invalid credentials");

    const payload = { id: user._id, role: user.role };
    const { accessToken, refreshToken } = signTokens(payload);
    return { accessToken, refreshToken, user };
};

const findOrCreateOAuthUser = async ({ oauthId, oauthProvider, name, email, avatarUrl }) => {
    let user = await User.findOne({ oauthProvider, oauthId });
    if (!user) {
        user = await User.create({
            name,
            email,
            oauthProvider,
            oauthId,
            avatarUrl,
            role: ROLES.CUSTOMER,
        });
    }
    const payload = { id: user._id, role: user.role };
    const { accessToken, refreshToken } = signTokens(payload);
    return { accessToken, refreshToken, user };
};

module.exports = { adminLogin, findOrCreateOAuthUser, signTokens, cookieOptions };
