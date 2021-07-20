"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.getIDToken = void 0;
var core = require("@actions/core");
var actions_http_client = require("@actions/http-client");
var utils_1 = require("./internal/utils");
var config_variables_1 = require("./internal/config-variables");
function getIDToken(audience) {
    return __awaiter(this, void 0, void 0, function () {
        var id_token, secondsSinceEpoch, id_token_json, id_token_url, httpclient, additionalHeaders, data, response, body, val, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    id_token = config_variables_1.getIDTokenFromEnv();
                    if (id_token !== undefined) {
                        secondsSinceEpoch = Math.round(Date.now() / 1000);
                        id_token_json = JSON.parse(id_token);
                        if (parseInt(id_token_json['exp']) - secondsSinceEpoch > 120)
                            // Expiry time is more than 2 mins
                            return [2 /*return*/, id_token];
                    }
                    id_token_url = config_variables_1.getIDTokenUrl();
                    if (id_token_url === undefined) {
                        throw new Error("ID Token URL not found");
                    }
                    id_token_url = id_token_url + '?api-version=' + utils_1.getApiVersion();
                    core.debug("ID token url is " + id_token_url);
                    httpclient = utils_1.createHttpClient();
                    if (httpclient === undefined) {
                        throw new Error("Failed to get Httpclient ");
                    }
                    core.debug("Httpclient created " + httpclient + " "); // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
                    additionalHeaders = (_a = {},
                        _a[actions_http_client.Headers.ContentType] = actions_http_client.MediaTypes.ApplicationJson,
                        _a);
                    data = JSON.stringify({ aud: audience });
                    return [4 /*yield*/, httpclient.post(id_token_url, data, additionalHeaders)];
                case 1:
                    response = _b.sent();
                    if (!utils_1.isSuccessStatusCode(response.message.statusCode)) {
                        throw new Error("Failed to get ID Token. Error message  :" + response.message.statusMessage + " ");
                    }
                    return [4 /*yield*/, response.readBody()];
                case 2:
                    body = _b.sent();
                    val = JSON.parse(body);
                    id_token = val['value'];
                    if (id_token === undefined) {
                        throw new Error("Not able to fetch the ID token");
                    }
                    // Save ID Token in Env Variable
                    core.exportVariable('OIDC_TOKEN_ID', id_token);
                    return [2 /*return*/, id_token];
                case 3:
                    error_1 = _b.sent();
                    core.setFailed(error_1.message);
                    return [2 /*return*/, error_1.message];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.getIDToken = getIDToken;
//module.exports.getIDToken = getIDToken
getIDToken('helloworld');
