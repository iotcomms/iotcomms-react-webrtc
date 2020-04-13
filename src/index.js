//
// Copyright (c) IOT Communications International . All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
//

/*jslint node: true */
/*jslint white:true */
/*jslint for:true */

"use strict";

import React, { Component } from "react";
import Button from "react-bootstrap/Button";
import  {UA}  from "sip.js";
import ringback from "./ringback.mp4";
import alert from "./alert.mp4";
import PropTypes from "prop-types";
const {detect} = require("detect-browser");

// eslint-disable-next-line
const adapter = require('webrtc-adapter');




class WebRTCClient extends Component {



  constructor(props,context) {
    super(props,context);
    var sipServer = props.sipDomain;
    if(props.sipServer) {
      sipServer=props.sipServer;
    }

    var callLabel = "Call";
    if(this.props.callLabel) {
      callLabel = this.props.callLabel;
    }


    var remoteVideo = "remoteVideo";
    if(props.remoteVideo) {
      remoteVideo = props.remoteVideo;
    }

    var localVideo = "localVideo";
    if(props.localVideo) {
      localVideo = props.localVideo;
    }


    this.state = {
      userid:props.sipUser,video:props.video,domain:props.sipDomain, sipServer:sipServer,
      password:props.sipPassword,destination:props.destination,
      metaData:props.metaData,
      jwtAuth: props.jwtAuth,
      autoRegister: props.autoRegister,callState:"Idle",
      enableButtons:true,
      ringbackVideoUrl:props.ringbackVideoUrl,
      alertVideoUrl:props.alertVideoUrl,
      hideConnectionStatus: props.hideConnectionStatus,
      callLabel: callLabel,
      remoteVideo : remoteVideo,
      localVideo: localVideo
    };

  }



  componentDidMount() {
    this.testMedia();




    var traceSip = false;
    if(this.props.traceSip) {
      traceSip = this.props.traceSip;
    }

    var options = {
      uri: this.state.userid +"@" + this.state.domain,
      transportOptions: {
        wsServers: ["wss://"+this.state.sipServer+":7443/ws"],
        traceSip:traceSip
      } ,
      sessionDescriptionHandlerFactoryOptions: {
        peerConnectionOptions :{
          iceCheckingTimeout: 500,
          rtcConfiguration : {
            iceServers : [{urls: "stun:stun.l.google.com:19302"}]
          }
        },

        constraints: {
          audio: true,
          video: this.state.video
        }
      },

      authorizationUser: this.state.userid,
      password: this.state.password,
      autostart: false,
      //hackIpInContact:true,
      hackWssInTransport:true,
      register: false



    };

    this.connectionStateChanged("Disconnected");


    this.sipUa = new  UA(options);

    this.sipUa.once("transportCreated",  (transport) =>  {

      transport.on("transportError", () => {
        this.setState({error:"Network connection error"});
      });

      transport.on("connecting", () => {
        this.connectionStateChanged("Connecting...");
      });

      transport.on("connected", () => {
        console.log("Transport connected, props",this.props);
        this.connectionStateChanged("Connected");
        this.setState({error:""});
        if(this.props.autoRegister) {
          this.register();
        }

        if(this.props.autoConnect) {
          console.log("Auto connecting");
          this.placeCall();
        }
      });

      transport.on("disconnecting", () => {
        this.connectionStateChanged("Disonnecting...");
      });

      transport.on("disconnected", () => {
        this.connectionStateChanged("Disonnected");
      });




    });

    this.sipUa.on("invite", (session)=>{
      this.incomingCall(session);
    });




    this.sipUa.start();






    //this.setState({userid: localStorage.getItem('userid'), domain: localStorage.getItem('domain'),websocket: localStorage.getItem('websocket'),routes: localStorage.getItem('routes'), password: localStorage.getItem('password')},()=>{this.updateSIPSettings()});
  }

  connectionStateChanged(newState) {
    this.setState({connectionState:newState});

  }



  testMedia() {
    var usingHttps=false;
    if (window.location.protocol === "https:") {
      usingHttps=true;
    }

    if(navigator.mediaDevices) {

      navigator.mediaDevices.getUserMedia({ audio: true, video: this.state.video })
        .then( () =>  {
          this.setState({mediaTested:true,mediaSupported:true,usingHttps:usingHttps});
        })
        .catch(() => {
          this.setState({mediaTested:true,mediaSupported:false,usingHttps:usingHttps});
        });
    } else {
      var browser = detect();
      this.setState({mediaTested:true,mediaSupported:false,usingHttps:usingHttps,browser:browser.name, os:browser.os});

    }
  }

  hangupCall() {


    try {
      this.currentSession.terminate();
      // eslint-disable-next-line
    } catch (e) {}
  }


  handleCall(session) {
    var localVideo = document.getElementById(this.state.localVideo);
    this.currentSession = session;


    this.currentSession.on("terminated", () => {
      var localVideo = document.getElementById(this.state.localVideo);
      var remoteVideo = document.getElementById(this.state.remoteVideo);
      localVideo.src="";
      localVideo.srcObject = null;
      remoteVideo.pause();
      remoteVideo.src="";
      remoteVideo.srcObject = null;
      remoteVideo.removeAttribute("src");
      remoteVideo.removeAttribute("loop");


      this.setState({callState:"Idle"});
    });

    this.currentSession.on("accepted", () => {
      this.setState({callState:"InCall"});
      this.callConnected();
    });

    this.currentSession.on("cancel", () => {
      this.setState({callState:"Canceling"});
    });

    this.currentSession.on("rejected", (response,cause) => {
      this.setState({error:"Call failed: " + cause});
    });


    this.currentSession.on("SessionDescriptionHandler-created", () => {
      this.currentSession.sessionDescriptionHandler.on("userMediaFailed", ()=> {
      });
    });

    this.currentSession.on("trackAdded", ()=> {
      // We need to check the peer connection to determine which track was added
      if(this.currentSession.sessionDescriptionHandler) {
        if(this.currentSession.sessionDescriptionHandler.peerConnection) {
          var pc = this.currentSession.sessionDescriptionHandler.peerConnection;
          // Gets remote tracks
          var remoteStream = new MediaStream();
          pc.getReceivers().forEach(function(receiver) {
            remoteStream.addTrack(receiver.track);
          });

          this.remoteStream = remoteStream;

          // Gets local tracks
          var localStream = new MediaStream();
          setTimeout(() => {
            pc.getSenders().forEach(function(sender) {
              if(sender.track) {
                localStream.addTrack(sender.track);
              }
            });
            localVideo.srcObject = localStream;
            localVideo.play().catch(()=>{});
          }, 500);
        }
      }
    });



  }

  answerCall() {
    if(this.currentSession) {
      try {
        this.setState({error:""});
        this.currentSession.accept();
        // eslint-disable-next-line
      } catch (e) {}
    }
  }


  incomingCall(session) {
    this.setState({callState:"Alerting"});
    var remoteVideo = document.getElementById(this.state.remoteVideo);

    if(this.state.alertVideoUrl) {
      remoteVideo.src = this.state.alertVideoUrl;
    } else {
      remoteVideo.src = alert;
    }


    remoteVideo.setAttribute("loop",true);
    remoteVideo.play();

    this.handleCall(session);

    var req = session.request;
    var encodedMeta = req.getHeader("X-MetaData");

    this.setState({receivedMeta:JSON.parse(decodeURIComponent(encodedMeta))});



  }

  register() {
    var registerOptions = {};
    registerOptions.extraHeaders = [];
    if(this.state.jwtAuth) {
      registerOptions.extraHeaders.push("X-JWTAuth:"+this.state.jwtAuth);
    }

    this.sipUa.register(registerOptions);


  }

  placeCall() {

    this.setState({callState:"Calling", error:""});
    var inviteOptions = {};
    inviteOptions.extraHeaders = [];
    if(this.state.metaData) {
      var encodedMeta = encodeURIComponent(JSON.stringify(this.state.metaData));
      inviteOptions.extraHeaders.push("X-MetaData:"+encodedMeta);
    }

    if(this.state.jwtAuth) {
      inviteOptions.extraHeaders.push("X-JWTAuth:"+this.state.jwtAuth);
    }

    var session = this.sipUa.invite(this.state.destination,inviteOptions);
    this.handleCall(session);
  }


  callConnected() {
    if(this.remoteStream) {
      try {
        var remoteVideo = document.getElementById(this.state.remoteVideo);
        remoteVideo.srcObject = this.remoteStream;
        remoteVideo.play().catch(()=>{});
        // eslint-disable-next-line
      } catch (e) {}
    }

  }



  renderCallState() {
    var stateDescription = "";
    if(this.state.callState === "Calling") {
      stateDescription="Calling...";
    }

    if(this.state.callState === "InCall") {
      stateDescription="Call Connected";
    }

    if(this.state.callState === "Canceling") {
      stateDescription="Canceling call";
    }

    return(<div>{stateDescription}</div>);
  }

  avoidDoubleTap() {
    this.setState({enableButtons:false});
    setTimeout(()=>{this.setState({enableButtons:true});},1000);
  }

  renderCallButtons() {
    if( this.state.callState != "Canceling" && this.state.enableButtons) {
      if(this.state.callState === "Idle") {
        return(<Button  color="primary"  onClick={()=> {
          this.avoidDoubleTap();
          var remoteVideo = document.getElementById(this.state.remoteVideo);
          if(this.state.ringbackVideoUrl) {
            remoteVideo.src = this.state.ringbackVideoUrl;
          } else {
            remoteVideo.src = ringback;
          }
          remoteVideo.setAttribute("loop",true);
          remoteVideo.play();
          this.placeCall();
        }}>{this.state.callLabel}</Button> );
      }


      if(this.state.callState === "Alerting") {
        return(<Button  color="primary"  onClick={()=> {
          this.avoidDoubleTap();
          this.answerCall();
        }}>Answer</Button> );
      }


      else {
        return(<Button  color="primary"  onClick={()=> {
          this.avoidDoubleTap();
          this.hangupCall();
        }}>Hang up</Button>);
      }
    } else {
      return null;
    }


  }

  renderPermissionProblems() {
    if(this.state.browser=="crios") {
      return(
        <div>You are using Chrome on iPhone. It does not support WebRTC. Please test again using Safari.</div>
      );
    }  else {
      return(
        [<div key="permissionNote1">You have not permitted use of camera and microphone, or your device is not WebRTC capable.</div>,
          <div key="permissionNote2">Please verify your settings.</div>,
          <Button key="permissionButton1"
            onClick={()=>{window.location.reload();}}
          >Try to reload page</Button>,
          <div key="permissionNote3">{!this.state.usingHttps ?
            "Warning: Page is not loaded via HTTPS. It may cause permission problems accessing camera and microphone!"
            : null}
          {this.state.browser} {this.state.os}</div>

        ]
      );
    }
  }


  renderCallControl() {
    if(this.state.mediaSupported) {
      return (
        <div>
          {this.state.connectionState === "Connected" ?
            this.renderCallButtons() : null }
          {!this.state.hideConnectionStatus ?
            <span>
              <div>{this.renderCallState()}</div>
              <div>{this.state.error}</div>
              <div>Server {this.state.connectionState}</div>
            </span> : null }

          {this.state.receivedMeta ?
            <div>Received meta data: {JSON.stringify(this.state.receivedMeta)}</div> : null
          }

        </div>
      );
    } else {
      return(
        <div>{this.renderPermissionProblems()}</div>
      );
    }

  }

  render() {
    return (
      <div>
        {this.state.mediaTested ? this.renderCallControl() :
          [<div key="requestPermissions1">Requesting camera and microphone permissions...</div>,
            <div key="requestPermissions2">Please allow the application to use microphone and camera.</div>]
        }
      </div>
    );
  }
}

WebRTCClient.propTypes = {
  sipUser: PropTypes.string.isRequired,
  sipDomain: PropTypes.string.isRequired,
  sipServer: PropTypes.string,
  metaData: PropTypes.object,
  sipPassword: PropTypes.string.isRequired,
  video: PropTypes.bool,
  autoRegister: PropTypes.bool,
  autoConnect: PropTypes.bool,
  destination: PropTypes.string.isRequired,
  alertVideoUrl: PropTypes.string,
  ringbackVideoUrl: PropTypes.string,
  hideConnectionStatus: PropTypes.bool,
  traceSip: PropTypes.bool,
  callLabel: PropTypes.string,
  remoteVideo: PropTypes.string,
  localVideo: PropTypes.string,
  jwtAuth: PropTypes.object


};

export default WebRTCClient;
