const { getInfo } = require('./getInfo.js');
const testHostApi = (arg, callback) => {
    console.log('Test Host Api has been successfully called!', arg);
    callback('From Host: OK!');
};
module.exports = {
    getInfo,
    testHostApi,
};
