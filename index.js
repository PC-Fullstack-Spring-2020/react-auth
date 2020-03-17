"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AuthRoute = exports.AuthProvider = exports.AuthContext = exports.api = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.useAuth = useAuth;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactRouterDom = require("react-router-dom");

var _jsonwebtoken = require("jsonwebtoken");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AuthService = function () {
  function AuthService() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, AuthService);

    this.domain = config.domain || "/api";
    this.authPath = config.authPath || "login";
  }

  _createClass(AuthService, [{
    key: "login",
    value: function login(username, password) {
      var _this = this;

      return this.post("/" + this.authPath, { username: username, password: password }).then(function (resp) {
        _this.setToken(resp.token);
        return Promise.resolve(resp);
      }).catch(function (err) {
        return Promise.reject(err);
      });
    }
  }, {
    key: "logout",
    value: function logout() {
      localStorage.removeItem("authtoken");
    }
  }, {
    key: "loggedIn",
    value: function loggedIn() {
      var token = this.getToken();
      return !!token && !this.isTokenExpired(token);
    }
  }, {
    key: "isTokenExpired",
    value: function isTokenExpired(token) {
      try {
        var decoded = (0, _jsonwebtoken.decode)(token);
        return decoded.exp < Date.now() / 1000;
      } catch (err) {
        return false;
      }
    }
  }, {
    key: "setToken",
    value: function setToken(token) {
      return localStorage.setItem("authtoken", token);
    }
  }, {
    key: "getToken",
    value: function getToken() {
      return localStorage.getItem("authtoken");
    }
  }, {
    key: "getProfile",
    value: function getProfile() {
      return (0, _jsonwebtoken.decode)(this.getToken());
    }
  }, {
    key: "_checkStatus",
    value: function _checkStatus(response) {
      if (response.status >= 200 && response.status < 300) {
        return response;
      } else {
        var error = new Error(response.statusText);
        error.response = response;
        throw error;
      }
    }
  }, {
    key: "get",
    value: function get(url) {
      return this.fetch(url, { method: "GET" });
    }
  }, {
    key: "post",
    value: function post(url, data) {
      return this.fetch(url, { method: "POST", body: JSON.stringify(data) });
    }
  }, {
    key: "put",
    value: function put(url, data) {
      return this.fetch(url, { method: "PUT", body: JSON.stringify(data) });
    }
  }, {
    key: "patch",
    value: function patch(url, data) {
      return this.fetch(url, { method: "PATCH", body: JSON.stringify(data) });
    }
  }, {
    key: "delete",
    value: function _delete(url) {
      return this.fetch(url, { method: "DELETE" });
    }
  }, {
    key: "fetch",
    value: function (_fetch) {
      function fetch(_x, _x2) {
        return _fetch.apply(this, arguments);
      }

      fetch.toString = function () {
        return _fetch.toString();
      };

      return fetch;
    }(function (url, options) {
      url = this.domain + url;

      var headers = {
        Accept: "application/json",
        "Content-Type": "application/json"
      };

      if (this.loggedIn()) {
        headers["Authorization"] = "Bearer " + this.getToken();
      }

      return fetch(url, _extends({ headers: headers }, options)).then(this._checkStatus).then(function (resp) {
        return resp.json();
      });
    })
  }]);

  return AuthService;
}();

var api = exports.api = new AuthService();

var AuthContext = exports.AuthContext = (0, _react.createContext)({
  isAuthenticated: false,
  redirectUrl: "/login"
});

var AuthProvider = exports.AuthProvider = function AuthProvider(props) {
  var _useState = (0, _react.useState)(api.loggedIn()),
      _useState2 = _slicedToArray(_useState, 2),
      isAuthenticated = _useState2[0],
      setAuthenticated = _useState2[1];

  function signin(username, password) {
    return new Promise(function (resolve, reject) {
      api.login(username, password).then(function (data) {
        setAuthenticated(true);
        resolve(api.getProfile());
      }).catch(function (err) {
        reject(err);
      });
    });
  }

  function signout() {
    return new Promise(function (resolve, reject) {
      api.logout();
      setAuthenticated(false);
      resolve();
    });
  }

  var value = {
    isAuthenticated: isAuthenticated,
    redirectUrl: props.redirectUrl,
    signin: signin,
    signout: signout
  };

  return _react2.default.createElement(
    AuthContext.Provider,
    { value: value },
    props.children
  );
};

AuthProvider.defaultProps = {
  redirectUrl: "/login"
};

var AuthRoute = function AuthRoute(_ref) {
  var Component = _ref.component,
      rest = _objectWithoutProperties(_ref, ["component"]);

  var auth = (0, _react.useContext)(AuthContext);
  return _react2.default.createElement(_reactRouterDom.Route, _extends({}, rest, {
    render: function render(props) {
      return auth.isAuthenticated ? _react2.default.createElement(Component, props) : _react2.default.createElement(_reactRouterDom.Redirect, { to: auth.redirectUrl });
    }
  }));
};

exports.AuthRoute = AuthRoute;
function useAuth() {
  var _useContext = (0, _react.useContext)(AuthContext),
      signin = _useContext.signin,
      signout = _useContext.signout,
      isAuthenticated = _useContext.isAuthenticated;

  var profile = api.getProfile() || {};

  return { signin: signin, signout: signout, isAuthenticated: isAuthenticated, profile: profile };
}
