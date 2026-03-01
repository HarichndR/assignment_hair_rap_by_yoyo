


const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};


const daysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d;
};


const daysFromNow = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(0, 0, 0, 0);
    return d;
};


const buildDateRangeFilter = (fromDateStr, toDateStr) => {
    if (!fromDateStr && !toDateStr) return null;

    const filter = {};
    if (fromDateStr) {
        const from = new Date(fromDateStr);
        if (!isNaN(from)) filter.$gte = from;
    }
    if (toDateStr) {
        const to = new Date(toDateStr);
        if (!isNaN(to)) {
            to.setDate(to.getDate() + 1);
            filter.$lt = to;
        }
    }
    return Object.keys(filter).length ? filter : null;
};


const toDateString = (date) => {
    if (!date) return "—";
    try { return new Date(date).toISOString().split("T")[0]; }
    catch { return "—"; }
};

module.exports = { startOfToday, daysAgo, daysFromNow, buildDateRangeFilter, toDateString };
