/**
 * Global teardown — stops the in-memory MongoDB after all test suites finish.
 */
module.exports = async () => {
    if (global.__MONGOD__) {
        await global.__MONGOD__.stop();
    }
};
