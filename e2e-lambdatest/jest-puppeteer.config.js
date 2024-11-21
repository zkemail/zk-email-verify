const caps_chrome = {
    browserName    : 'Chrome',
    browserVersion : 'latest',
    'LT:Options'   : {
        platform   : 'Windows 10',
        build      : 'ZK Email Puppeteer-Jest',
        name       : 'ZK Email Puppeteer-jest test on Chrome',
        resolution : '1366x768',
        user       : process.env.LT_USERNAME,
        accessKey  : process.env.LT_ACCESS_KEY,
        network    : true
    }
};

const caps_edge = {
    browserName    : 'MicrosoftEdge',
    browserVersion : 'latest',
    'LT:Options'   : {
        platform   : 'Windows 10',
        build      : 'Sample Puppeteer-Jest',
        name       : 'Puppeteer-jest test on Edge',
        resolution : '1366x768',
        user       : process.env.LT_USERNAME,
        accessKey  : process.env.LT_ACCESS_KEY,
        network    : true
    }
};

module.exports = {
    connect : {
        browserWSEndpoint : `wss://cdp.lambdatest.com/puppeteer?capabilities=${encodeURIComponent(
            JSON.stringify(caps_chrome)
        )}`
    }
};
