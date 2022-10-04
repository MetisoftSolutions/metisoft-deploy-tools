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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUsers = void 0;
const lodash_1 = __importDefault(require("lodash"));
const bluebird_1 = require("bluebird");
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
function __getClient(region, credentials) {
    return new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
        region,
        credentials: {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey
        }
    });
}
function __wrapCanThrowAwsError(fn, fnDestroyClient) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield fn();
        }
        catch (err) {
            const message = (_a = err === null || err === void 0 ? void 0 : err.message) !== null && _a !== void 0 ? _a : "";
            throw message;
        }
        finally {
            fnDestroyClient === null || fnDestroyClient === void 0 ? void 0 : fnDestroyClient();
        }
    });
}
function __listUserIds(client, userPoolId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield __wrapCanThrowAwsError(() => __awaiter(this, void 0, void 0, function* () {
            const userIds = [];
            let page = null;
            do {
                page = yield __listUsersPage(client, userPoolId, page ? page.paginationToken : undefined);
                userIds.push(...page.userIds);
            } while (!!page.paginationToken && page.userIds.length > 0);
            return lodash_1.default.compact(lodash_1.default.uniq(userIds));
        }), () => client.destroy());
    });
}
function __listUsersPage(client, userPoolId, paginationToken) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const command = new client_cognito_identity_provider_1.ListUsersCommand({
            Limit: 20,
            UserPoolId: userPoolId,
            PaginationToken: paginationToken
        });
        const response = yield client.send(command);
        return {
            paginationToken: (_a = response.PaginationToken) !== null && _a !== void 0 ? _a : '',
            userIds: lodash_1.default.map(response.Users, user => { var _a; return (_a = user.Username) !== null && _a !== void 0 ? _a : ''; })
        };
    });
}
function __deleteUser(client, userPoolId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield __wrapCanThrowAwsError(() => __awaiter(this, void 0, void 0, function* () {
            yield client.send(new client_cognito_identity_provider_1.AdminDeleteUserCommand({
                UserPoolId: userPoolId,
                Username: userId
            }));
            console.log(`Deleted user ${userId}.`);
        }), () => client.destroy());
    });
}
function __deleteUsers(client, userPoolId, userIds) {
    return __awaiter(this, void 0, void 0, function* () {
        yield bluebird_1.Promise.each(userIds, (userId) => __awaiter(this, void 0, void 0, function* () { return yield __deleteUser(client, userPoolId, userId); }));
    });
}
function deleteUsers(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = __getClient(args.region, args.credentials);
        const userIds = yield __listUserIds(client, args.userPoolId);
        yield __deleteUsers(client, args.userPoolId, userIds);
    });
}
exports.deleteUsers = deleteUsers;
