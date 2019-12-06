//
// Copyright (c) IOT Communications International . All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
//

/*jslint node: true */
/*jslint white:true */
/*jslint for:true */

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _Button = require("react-bootstrap/Button");

var _Button2 = _interopRequireDefault(_Button);

var _sip = require("sip.js");

var _ringback = require("./ringback.mp4");

var _ringback2 = _interopRequireDefault(_ringback);

var _alert = require("./alert.mp4");

var _alert2 = _interopRequireDefault(_alert);

var _propTypes = require("prop-types");

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require("detect-browser"),
    detect = _require.detect;

// eslint-disable-next-line


var adapter = require('webrtc-adapter');

var WebRTCClient = function (_Component) {
  _inherits(WebRTCClient, _Component);

  function WebRTCClient(props, context) {
    _classCallCheck(this, WebRTCClient);

    var _this = _possibleConstructorReturn(this, (WebRTCClient.__proto__ || Object.getPrototypeOf(WebRTCClient)).call(this, props, context));

    var sipServer = props.sipDomain;
    if (props.sipServer) {
      sipServer = props.sipServer;
    }

    var callLabel = "Call";
    if (_this.props.callLabel) {
      callLabel = _this.props.callLabel;
    }

    var remoteVideo = "remoteVideo";
    if (props.remoteVideo) {
      remoteVideo = props.remoteVideo;
    }

    var localVideo = "localVideo";
    if (props.localVideo) {
      localVideo = props.localVideo;
    }

    _this.state = {
      userid: props.sipUser, video: props.video, domain: props.sipDomain, sipServer: sipServer,
      password: props.sipPassword, destination: props.destination,
      metaData: props.metaData,
      autoRegister: props.autoRegister, callState: "Idle",
      enableButtons: true,
      ringbackVideoUrl: props.ringbackVideoUrl,
      alertVideoUrl: props.alertVideoUrl,
      hideConnectionStatus: props.hideConnectionStatus,
      callLabel: callLabel,
      remoteVideo: remoteVideo,
      localVideo: localVideo
    };

    return _this;
  }

  _createClass(WebRTCClient, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;

      this.testMedia();

      var traceSip = false;
      if (this.props.traceSip) {
        traceSip = this.props.traceSip;
      }

      var options = {
        uri: this.state.userid + "@" + this.state.domain,
        transportOptions: {
          wsServers: ["wss://" + this.state.sipServer + ":7443/ws"],
          traceSip: traceSip
        },
        sessionDescriptionHandlerFactoryOptions: {
          peerConnectionOptions: {
            iceCheckingTimeout: 500,
            rtcConfiguration: {
              iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
            }
          },

          constraints: {
            audio: true,
            video: this.state.video
          }
        },

        authorizationUser: this.state.userid,
        password: this.state.password,
        register: this.state.autoRegister,
        autostart: false,
        //hackIpInContact:true,
        hackWssInTransport: true

      };

      this.connectionStateChanged("Disconnected");

      this.sipUa = new _sip.UA(options);

      this.sipUa.once("transportCreated", function (transport) {

        transport.on("transportError", function () {
          _this2.setState({ error: "Network connection error" });
        });

        transport.on("connecting", function () {
          _this2.connectionStateChanged("Connecting...");
        });

        transport.on("connected", function () {
          _this2.connectionStateChanged("Connected");
          _this2.setState({ error: "" });
        });

        transport.on("disconnecting", function () {
          _this2.connectionStateChanged("Disonnecting...");
        });

        transport.on("disconnected", function () {
          _this2.connectionStateChanged("Disonnected");
        });
      });

      this.sipUa.on("invite", function (session) {
        _this2.incomingCall(session);
      });

      this.sipUa.start();

      //this.setState({userid: localStorage.getItem('userid'), domain: localStorage.getItem('domain'),websocket: localStorage.getItem('websocket'),routes: localStorage.getItem('routes'), password: localStorage.getItem('password')},()=>{this.updateSIPSettings()});
    }
  }, {
    key: "connectionStateChanged",
    value: function connectionStateChanged(newState) {
      this.setState({ connectionState: newState });
    }
  }, {
    key: "testMedia",
    value: function testMedia() {
      var _this3 = this;

      var usingHttps = false;
      if (window.location.protocol === "https:") {
        usingHttps = true;
      }

      if (navigator.mediaDevices) {

        navigator.mediaDevices.getUserMedia({ audio: true, video: this.state.video }).then(function () {
          _this3.setState({ mediaTested: true, mediaSupported: true, usingHttps: usingHttps });
        }).catch(function () {
          _this3.setState({ mediaTested: true, mediaSupported: false, usingHttps: usingHttps });
        });
      } else {
        var browser = detect();
        this.setState({ mediaTested: true, mediaSupported: false, usingHttps: usingHttps, browser: browser.name, os: browser.os });
      }
    }
  }, {
    key: "hangupCall",
    value: function hangupCall() {

      try {
        this.currentSession.terminate();
        // eslint-disable-next-line
      } catch (e) {}
    }
  }, {
    key: "handleCall",
    value: function handleCall(session) {
      var _this4 = this;

      var localVideo = document.getElementById(this.state.localVideo);
      this.currentSession = session;

      this.currentSession.on("terminated", function () {
        var localVideo = document.getElementById(_this4.state.localVideo);
        var remoteVideo = document.getElementById(_this4.state.remoteVideo);
        localVideo.src = "";
        localVideo.srcObject = null;
        remoteVideo.pause();
        remoteVideo.src = "";
        remoteVideo.srcObject = null;
        remoteVideo.removeAttribute("src");
        remoteVideo.removeAttribute("loop");

        _this4.setState({ callState: "Idle" });
      });

      this.currentSession.on("accepted", function () {
        _this4.setState({ callState: "InCall" });
        _this4.callConnected();
      });

      this.currentSession.on("cancel", function () {
        _this4.setState({ callState: "Canceling" });
      });

      this.currentSession.on("rejected", function (response, cause) {
        _this4.setState({ error: "Call failed: " + cause });
      });

      this.currentSession.on("SessionDescriptionHandler-created", function () {
        _this4.currentSession.sessionDescriptionHandler.on("userMediaFailed", function () {});
      });

      this.currentSession.on("trackAdded", function () {
        // We need to check the peer connection to determine which track was added
        if (_this4.currentSession.sessionDescriptionHandler) {
          if (_this4.currentSession.sessionDescriptionHandler.peerConnection) {
            var pc = _this4.currentSession.sessionDescriptionHandler.peerConnection;
            // Gets remote tracks
            var remoteStream = new MediaStream();
            pc.getReceivers().forEach(function (receiver) {
              remoteStream.addTrack(receiver.track);
            });

            _this4.remoteStream = remoteStream;

            // Gets local tracks
            var localStream = new MediaStream();
            setTimeout(function () {
              pc.getSenders().forEach(function (sender) {
                if (sender.track) {
                  localStream.addTrack(sender.track);
                }
              });
              localVideo.srcObject = localStream;
              localVideo.play().catch(function () {});
            }, 500);
          }
        }
      });
    }
  }, {
    key: "answerCall",
    value: function answerCall() {
      if (this.currentSession) {
        try {
          this.setState({ error: "" });
          this.currentSession.accept();
          // eslint-disable-next-line
        } catch (e) {}
      }
    }
  }, {
    key: "incomingCall",
    value: function incomingCall(session) {
      this.setState({ callState: "Alerting" });
      var remoteVideo = document.getElementById(this.state.remoteVideo);

      if (this.state.alertVideoUrl) {
        remoteVideo.src = this.state.alertVideoUrl;
      } else {
        remoteVideo.src = _alert2.default;
      }

      remoteVideo.setAttribute("loop", true);
      remoteVideo.play();

      this.handleCall(session);

      var req = session.request;
      var encodedMeta = req.getHeader("X-MetaData");

      this.setState({ receivedMeta: JSON.parse(decodeURIComponent(encodedMeta)) });
    }
  }, {
    key: "placeCall",
    value: function placeCall() {

      this.setState({ callState: "Calling", error: "" });
      var inviteOptions = {};
      if (this.state.metaData) {
        inviteOptions.extraHeaders = [];
        var encodedMeta = encodeURIComponent(JSON.stringify(this.state.metaData));
        inviteOptions.extraHeaders.push("X-MetaData:" + encodedMeta);
      }
      var session = this.sipUa.invite(this.state.destination, inviteOptions);
      this.handleCall(session);
    }
  }, {
    key: "callConnected",
    value: function callConnected() {
      if (this.remoteStream) {
        try {
          var remoteVideo = document.getElementById(this.state.remoteVideo);
          remoteVideo.srcObject = this.remoteStream;
          remoteVideo.play().catch(function () {});
          // eslint-disable-next-line
        } catch (e) {}
      }
    }
  }, {
    key: "renderCallState",
    value: function renderCallState() {
      var stateDescription = "";
      if (this.state.callState === "Calling") {
        stateDescription = "Calling...";
      }

      if (this.state.callState === "InCall") {
        stateDescription = "Call Connected";
      }

      if (this.state.callState === "Canceling") {
        stateDescription = "Canceling call";
      }

      return _react2.default.createElement(
        "div",
        null,
        stateDescription
      );
    }
  }, {
    key: "avoidDoubleTap",
    value: function avoidDoubleTap() {
      var _this5 = this;

      this.setState({ enableButtons: false });
      setTimeout(function () {
        _this5.setState({ enableButtons: true });
      }, 1000);
    }
  }, {
    key: "renderCallButtons",
    value: function renderCallButtons() {
      var _this6 = this;

      if (this.state.callState != "Canceling" && this.state.enableButtons) {
        if (this.state.callState === "Idle") {
          return _react2.default.createElement(
            _Button2.default,
            { color: "primary", onClick: function onClick() {
                _this6.avoidDoubleTap();
                var remoteVideo = document.getElementById(_this6.state.remoteVideo);
                if (_this6.state.ringbackVideoUrl) {
                  remoteVideo.src = _this6.state.ringbackVideoUrl;
                } else {
                  remoteVideo.src = _ringback2.default;
                }
                remoteVideo.setAttribute("loop", true);
                remoteVideo.play();
                _this6.placeCall();
              } },
            this.state.callLabel
          );
        }

        if (this.state.callState === "Alerting") {
          return _react2.default.createElement(
            _Button2.default,
            { color: "primary", onClick: function onClick() {
                _this6.avoidDoubleTap();
                _this6.answerCall();
              } },
            "Answer"
          );
        } else {
          return _react2.default.createElement(
            _Button2.default,
            { color: "primary", onClick: function onClick() {
                _this6.avoidDoubleTap();
                _this6.hangupCall();
              } },
            "Hang up"
          );
        }
      } else {
        return null;
      }
    }
  }, {
    key: "renderPermissionProblems",
    value: function renderPermissionProblems() {
      if (this.state.browser == "crios") {
        return _react2.default.createElement(
          "div",
          null,
          "You are using Chrome on iPhone. It does not support WebRTC. Please test again using Safari."
        );
      } else {
        return [_react2.default.createElement(
          "div",
          { key: "permissionNote1" },
          "You have not permitted use of camera and microphone, or your device is not WebRTC capable."
        ), _react2.default.createElement(
          "div",
          { key: "permissionNote2" },
          "Please verify your settings."
        ), _react2.default.createElement(
          _Button2.default,
          { key: "permissionButton1",
            onClick: function onClick() {
              window.location.reload();
            }
          },
          "Try to reload page"
        ), _react2.default.createElement(
          "div",
          { key: "permissionNote3" },
          !this.state.usingHttps ? "Warning: Page is not loaded via HTTPS. It may cause permission problems accessing camera and microphone!" : null,
          this.state.browser,
          " ",
          this.state.os
        )];
      }
    }
  }, {
    key: "renderCallControl",
    value: function renderCallControl() {
      if (this.state.mediaSupported) {
        return _react2.default.createElement(
          "div",
          null,
          this.state.connectionState === "Connected" ? this.renderCallButtons() : null,
          !this.state.hideConnectionStatus ? _react2.default.createElement(
            "span",
            null,
            _react2.default.createElement(
              "div",
              null,
              this.renderCallState()
            ),
            _react2.default.createElement(
              "div",
              null,
              this.state.error
            ),
            _react2.default.createElement(
              "div",
              null,
              "Server ",
              this.state.connectionState
            )
          ) : null,
          this.state.receivedMeta ? _react2.default.createElement(
            "div",
            null,
            "Received meta data: ",
            JSON.stringify(this.state.receivedMeta)
          ) : null
        );
      } else {
        return _react2.default.createElement(
          "div",
          null,
          this.renderPermissionProblems()
        );
      }
    }
  }, {
    key: "render",
    value: function render() {
      return _react2.default.createElement(
        "div",
        null,
        this.state.mediaTested ? this.renderCallControl() : [_react2.default.createElement(
          "div",
          { key: "requestPermissions1" },
          "Requesting camera and microphone permissions..."
        ), _react2.default.createElement(
          "div",
          { key: "requestPermissions2" },
          "Please allow the application to use microphone and camera."
        )]
      );
    }
  }]);

  return WebRTCClient;
}(_react.Component);

WebRTCClient.propTypes = {
  sipUser: _propTypes2.default.string.isRequired,
  sipDomain: _propTypes2.default.string.isRequired,
  sipServer: _propTypes2.default.string,
  metaData: _propTypes2.default.object,
  sipPassword: _propTypes2.default.string.isRequired,
  video: _propTypes2.default.bool,
  autoRegister: _propTypes2.default.bool,
  destination: _propTypes2.default.string.isRequired,
  alertVideoUrl: _propTypes2.default.string,
  ringbackVideoUrl: _propTypes2.default.string,
  hideConnectionStatus: _propTypes2.default.bool,
  traceSip: _propTypes2.default.bool,
  callLabel: _propTypes2.default.string,
  remoteVideo: _propTypes2.default.string,
  localVideo: _propTypes2.default.string

};

exports.default = WebRTCClient;