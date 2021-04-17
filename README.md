# webrtc实现多对多视频通话
> webrtc配合websocket实现多对多视频通话

## 项目目录说明
```
index.html // 页面地址
index.js // ws服务端
```

## 多对多实现方案
一个RTCPeerConnection对应一个人，创建多个RTCPeerConnection对接多个人进行链接。