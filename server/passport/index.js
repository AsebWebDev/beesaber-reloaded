"use strict";
exports.__esModule = true;
var passport_1 = require("passport");
require("./serializers");
require("./localStrategy");
exports["default"] = (function (app) {
    app.use(passport_1["default"].initialize());
    app.use(passport_1["default"].session());
});
