import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { IoCall, IoCallOutline, IoClose, IoMicOff, IoVideocam, IoVideocamOff } from "react-icons/io5";
import { useSelector } from "react-redux";
import dp from "../assets/dp.webp";
import { serverUrl } from "../main";

const CallContext = createContext(null);
const rtcConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

const mediaErrorMessage = (error, type) => {
  if (["NotAllowedError", "PermissionDeniedError"].includes(error?.name)) {
    return `Microphone permission is blocked. Use the lock icon beside the address bar to allow Microphone for this site, then reload and try the ${type} call again.`;
  }
  if (error?.name === "NotFoundError") {
    return `No microphone was found. Connect or enable a microphone, then try the ${type} call again.`;
  }
  if (error?.name === "NotReadableError") {
    return `Your microphone is being used by another app or browser tab. Close the other app, then try the ${type} call again.`;
  }
  return error?.message || `Could not access media for this ${type} call.`;
};

export const useCall = () => useContext(CallContext);

export default function CallProvider({ children }) {
  const { userData, otherUsers } = useSelector((state) => state.user);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidates = useRef([]);
  const usersRef = useRef(otherUsers);
  const callRef = useRef(null);
  const incomingRef = useRef(null);
  const [call, setCall] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const remoteVideo = useRef(null);
  const localVideo = useRef(null);

  useEffect(() => { usersRef.current = otherUsers; }, [otherUsers]);
  useEffect(() => { callRef.current = call; }, [call]);
  useEffect(() => { incomingRef.current = incoming; }, [incoming]);
  useEffect(() => {
    if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
    if (localVideo.current) localVideo.current.srcObject = localStream;
  }, [localStream, remoteStream, call]);

  const userFor = useCallback((id) => (usersRef.current || []).find((user) => String(user._id) === String(id)) || { _id: id, name: "Unknown user" }, []);
  const stopMedia = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    pendingCandidates.current = [];
    setLocalStream(null); setRemoteStream(null); setMuted(false); setCameraOff(false);
  }, []);
  const finishCall = useCallback((notify = true) => {
    const peerId = callRef.current?.peer?._id || incomingRef.current?.peer?._id;
    if (notify && peerId) socketRef.current?.emit("call:end", { to: String(peerId) });
    stopMedia();
    callRef.current = null;
    incomingRef.current = null;
    setCall(null); setIncoming(null);
  }, [stopMedia]);
  const makePeer = useCallback((peerId, stream) => {
    const peer = new RTCPeerConnection(rtcConfig);
    peerRef.current = peer;
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    peer.ontrack = (event) => setRemoteStream(event.streams[0]);
    peer.onicecandidate = ({ candidate }) => candidate && socketRef.current?.emit("call:ice-candidate", { to: String(peerId), candidate });
    peer.onconnectionstatechange = () => {
      // "disconnected" can be a short-lived state while ICE is still
      // reconnecting. Ending the call there made valid calls drop instantly.
      if (["failed", "closed"].includes(peer.connectionState)) finishCall(false);
    };
    return peer;
  }, [finishCall]);
  const getMedia = async (type) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera and microphone access requires HTTPS (or localhost) in a supported browser.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video" ? {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      } : false,
    });
    if (type === "video" && !stream.getVideoTracks().length) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error("No camera was made available. Allow camera permission and close other apps using it.");
    }
    localStreamRef.current = stream; setLocalStream(stream);
    return stream;
  };
  const addPendingCandidates = async (peer) => {
    await Promise.all(pendingCandidates.current.splice(0).map((candidate) => peer.addIceCandidate(candidate)));
  };
  const startCall = async (peer, type) => {
    if (!socketRef.current?.connected) return window.alert("Calling service is not connected yet.");
    try {
      const stream = await getMedia(type);
      const connection = makePeer(peer._id, stream);
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      const nextCall = { peer, type, status: "Calling…" };
      // Socket events can reach the other browser before React commits this
      // render, so keep the ref ready before sending the offer.
      callRef.current = nextCall;
      setCall(nextCall);
      socketRef.current.emit("call:offer", { to: String(peer._id), offer, callType: type });
    } catch (error) { stopMedia(); window.alert(`Could not start ${type} call: ${mediaErrorMessage(error, type)}`); }
  };
  const acceptCall = async () => {
    if (!incoming) return;
    try {
      const stream = await getMedia(incoming.type);
      const connection = makePeer(incoming.peer._id, stream);
      await connection.setRemoteDescription(incoming.offer);
      await addPendingCandidates(connection);
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      socketRef.current.emit("call:answer", { to: String(incoming.peer._id), answer });
      const nextCall = { peer: incoming.peer, type: incoming.type, status: "Connected" };
      callRef.current = nextCall;
      incomingRef.current = null;
      setCall(nextCall); setIncoming(null);
    } catch (error) { socketRef.current?.emit("call:reject", { to: String(incoming.peer._id) }); stopMedia(); setIncoming(null); window.alert(`Could not answer call: ${mediaErrorMessage(error, incoming.type)}`); }
  };
  const rejectCall = () => {
    if (incoming) socketRef.current?.emit("call:reject", { to: String(incoming.peer._id) });
    incomingRef.current = null;
    setIncoming(null);
  };
  const toggleMute = () => { localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !track.enabled; }); setMuted((value) => !value); };
  const toggleCamera = () => { localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = !track.enabled; }); setCameraOff((value) => !value); };

  useEffect(() => {
    if (!userData?._id) return undefined;
    const socket = io(serverUrl, { withCredentials: true }); socketRef.current = socket;
    socket.on("call:offer", ({ from, offer, callType }) => {
      const nextIncoming = { peer: userFor(from), offer, type: callType };
      // Do this synchronously so an ICE candidate received immediately after
      // the offer is not discarded while React schedules the state update.
      incomingRef.current = nextIncoming;
      setIncoming(nextIncoming);
    });
    socket.on("call:answer", async ({ from, answer }) => { if (String(from) !== String(callRef.current?.peer?._id) || !peerRef.current) return; await peerRef.current.setRemoteDescription(answer); await addPendingCandidates(peerRef.current); setCall((value) => value && { ...value, status: "Connected" }); });
    socket.on("call:ice-candidate", async ({ from, candidate }) => { if (String(from) !== String(callRef.current?.peer?._id) && String(from) !== String(incomingRef.current?.peer?._id)) return; if (peerRef.current?.remoteDescription) await peerRef.current.addIceCandidate(candidate); else pendingCandidates.current.push(candidate); });
    socket.on("call:end", () => finishCall(false));
    socket.on("call:reject", () => { window.alert("Call declined."); finishCall(false); });
    return () => { socket.disconnect(); stopMedia(); };
  }, [userData?._id, userFor, finishCall, stopMedia]);

  return <CallContext.Provider value={{ startCall }}>
    {children}
    {incoming && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-5"><div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl"><img src={incoming.peer.image || dp} alt="" className="mx-auto h-20 w-20 rounded-full object-cover" /><h2 className="mt-4 text-xl font-bold">{incoming.peer.name}</h2><p className="mt-1 text-sm text-slate-500">Incoming {incoming.type} call</p><div className="mt-7 flex justify-center gap-8"><button onClick={rejectCall} className="rounded-full bg-red-500 p-4 text-white"><IoClose className="size-7" /></button><button onClick={acceptCall} className="rounded-full bg-green-500 p-4 text-white">{incoming.type === "video" ? <IoVideocam className="size-7" /> : <IoCall className="size-7" />}</button></div></div></div>}
    {call && <div className="fixed inset-0 z-50 bg-slate-950 p-5 text-white"><div className="relative mx-auto h-full max-w-5xl overflow-hidden rounded-3xl bg-slate-900"><video ref={remoteVideo} autoPlay playsInline className="h-full w-full object-cover" /><div className="absolute left-6 top-6"><p className="text-xl font-semibold">{call.peer.name}</p><p className="text-sm text-slate-300">{call.status}</p></div>{call.type === "video" && <video ref={localVideo} autoPlay muted playsInline className="absolute bottom-24 right-5 h-36 w-28 rounded-2xl object-cover shadow-xl" />}<div className="absolute inset-x-0 bottom-5 flex justify-center gap-4"><button onClick={toggleMute} className="rounded-full bg-white/20 p-4">{muted ? <IoMicOff className="size-6" /> : <IoCallOutline className="size-6" />}</button>{call.type === "video" && <button onClick={toggleCamera} className="rounded-full bg-white/20 p-4">{cameraOff ? <IoVideocamOff className="size-6" /> : <IoVideocam className="size-6" />}</button>}<button onClick={() => finishCall()} className="rounded-full bg-red-500 p-4"><IoCall className="size-6 rotate-[135deg]" /></button></div></div></div>}
  </CallContext.Provider>;
}
