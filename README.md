React.js component offering mobile and desktop browser voice and video communication. Wraps [sip.js](https://sipjs.com) with the nitty gritty details required make it work in such environments to help focus on application development.

An example application is [found here](https://github.com/iotcomms/iotcomms-react-webrtc-example)

To get started:

`$ npm install iotcomms-react-webrtc --save`

The component has been tested to work in combinations of the following web browsers updated to latest versions with video and voice calls:

* Safari on iOS
* Chrome on Android
* Safari on Mac
* Chrome on Mac
* Firefox on Mac

It is left as an exercise to the reader to check if it also works with the browsers above also on a Windows computer...

The main objective of the component is to provide a high-level logic providing WebRTC functionality to web applications where the developer should not have to dig into the details of how SIP, Peer connections, Sessions and Video elements interact during the lifecycle of a call.

It provides high level configuration through React.js Component properties. Once the component is mounted it will establish a connection back to the provisioned SIP server via WebSocket connection. From now it is ready to place and receive calls and it provides user interface to interact with the calls.

When the component is mounted it check that the application has been given permissions to use camera and microphone. If that is not the case information to the user is shown. It also informs if the browser is not supporting WebRTC, for example if it is started in a Chrome browser on an iPhone.

Below is an example of how to embed the component in a React.js application

```javascript

  import WebRTCClient from "iotcomms-react-webrtc";


  render() {
    return (
      <div className="App">
        //Video element used for rendering video self-view
        <video width="25%"  id="localVideo" autoPlay playsInline  muted="muted"></video>

        //Video element used for rendering video of remote party
        <video width="50%" id="remoteVideo" autoPlay playsInline ></video>

        <WebRTCClient
          video={true}
          autoRegister = {true}
          autoConnect = {false}
          sipDomain={sipDomain}
          sipServer={sipServer}
          sipUser={sipUser}
          sipPassword={sipPassword}
          destination={destinationUri}
          metaData={metaDataObject}
          alertVideoUrl="alertUrl"
          ringbackVideoUrl="ringbackUrl"
          hideConnectionStatus={false}
          traceSip={false}
          callLabel="Custom call label"
          remoteVideo="remoteVideoElementId"
          localVideo="localVideoElementId"
          jwtAuth="JWTAuthToken"
        />
      </div>
    );
  }
}

```

where

* The video elements must have the id's and attributes as provided in the example
* video property - indicates if video should be enabled for calls. If not, it will use voice only
* autoRegister property - indicates if the component should send a SIP Register to be able to receive calls
* autoConnect property - indicates if the component automatically should place a call ti the configured destination
* sipDomain property - is the SIP domain to be used for registration and calls
* sipServer property - This is an optional property indicating where to connect with the server. If this is not set the value of sipDomain is used.
* sipUser - is the user id to be used for authentication
* destination - is the remote destination to be called
* metaData - is an object to be passed to the remote side in a X-MetaData SIP header. The object is JSON stringified and then URL encoded before inserted as header value.
* alertVideoUrl - is an optional string with an URL pointing to a video file supported by the  <video> element. This file is played when an inbound call is received. If the property is omitted a default file is played.
* ringbackVideoUrl - is an optional string with an URL pointing to a video file supported by the  <video> element. This file is played when an call is placed until it has been answered. If the property is omitted a default file is played.
* hideConnectionStatus - is an optional boolean to indicate if the connection status information should be shown or not.
* traceSip - is an optional boolean to control if SIP messages should be shown in console output
* callLabel - is an optional string of text to be rendered on the call button
* remoteVideo - is an optional string with id of the video element that the remote video will be rendered in
* localVideo - is an optional string with id of the video element that the local video will be rendered in
* jwtAuth - is an optional string holding a JWT authorization token used by the service to authorize requests

When the component has mounted and have connection with the server a "Call" button is rendered. When this is pushed a call is placed to the destination configured in the destination property.

Upon incoming calls an "Answer" button is rendered.

The component will try to play out audio and video feedback when calling and alerting incoming calls. Due to autoplay limitations and logic in different web browsers this may not play.

*This project is sponsored by [iotcomms.io](https://iotcomms.io).*
