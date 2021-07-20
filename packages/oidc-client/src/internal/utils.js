"use strict";
exports.__esModule = true;
exports.getApiVersion = exports.createHttpClient = exports.isSuccessStatusCode = void 0;
var http_client_1 = require("@actions/http-client");
var auth_1 = require("@actions/http-client/auth");
var config_variables_1 = require("./config-variables");
function isSuccessStatusCode(statusCode) {
    if (!statusCode) {
        return false;
    }
    return statusCode >= 200 && statusCode < 300;
}
exports.isSuccessStatusCode = isSuccessStatusCode;
function createHttpClient() {
    return new http_client_1.HttpClient('actions/oidc-client', [
        new auth_1.BearerCredentialHandler(config_variables_1.getRuntimeToken())
    ]);
}
exports.createHttpClient = createHttpClient;
function getApiVersion() {
    return '2.0';
}
exports.getApiVersion = getApiVersion;
