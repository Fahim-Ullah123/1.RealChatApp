import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Login from "./pages/Login.jsx";
import SignUp from "./pages/SignUp.jsx";
import useCurrentUserGet from "./customHooks/currentUserget.js";
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import useGetOtherUsers from "./customHooks/getOtherUsers.js";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import { moveUserToTop, setDeletedMessageId, setIncomingMessage, setOnlineUsers, setselecteduser } from "./Redux/userSlice.js";
import dp from "./assets/dp.webp";
import { serverUrl } from "./main.jsx";
import CallProvider from "./components/CallProvider.jsx";

export default function App() {
  const { authChecked, userData, recentConversationIds } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [notification, setNotification] = useState(null);
  useCurrentUserGet();
  useGetOtherUsers(userData?._id);

  useEffect(() => {
    if (!userData?._id || !recentConversationIds.length) return;
    window.localStorage.setItem(
      `chat-recency:${userData._id}`,
      JSON.stringify(recentConversationIds),
    );
  }, [recentConversationIds, userData?._id]);

  useEffect(() => {
    if (!userData?._id) return undefined;
    const socket = io(serverUrl, { withCredentials: true });
    socket.on("onlineUsers", (users) => dispatch(setOnlineUsers(users)));
    socket.on("newMessage", (message) => {
      const sender = message?.sender;
      dispatch(setIncomingMessage(message));
      dispatch(moveUserToTop(sender));
      setNotification({
        sender,
        text: message?.message || (message?.media?.url ? "Sent you an attachment" : "Sent you a new message"),
      });
    });
    socket.on("messageDeleted", (messageId) => dispatch(setDeletedMessageId(messageId)));
    return () => socket.disconnect();
  }, [dispatch, userData?._id]);

  useEffect(() => {
    if (!notification) return undefined;
    const timeout = window.setTimeout(() => setNotification(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [notification]);

  const openNotification = () => {
    if (notification?.sender?._id) dispatch(setselecteduser(notification.sender));
    setNotification(null);
  };

  const protectedPage = (page) => {
    // Do not leave the entire application blank while the saved session is
    // being checked. A slow or unavailable API used to look like the app had
    // disappeared completely.
    if (!authChecked) {
      return (
        <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
          <div className="text-center">
            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-cyan-100 border-t-cyan-500" />
            <h1 className="mt-4 text-xl font-bold text-slate-800">Opening Chatly</h1>
            <p className="mt-1 text-sm text-slate-500">Checking your session…</p>
          </div>
        </main>
      );
    }
    return userData ? page : <Navigate to="/Login" replace />;
  };

  return (
    <CallProvider>
      <Routes>
        <Route path="/" element={protectedPage(<Home />)} />
        <Route path="/Login" element={<Login />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/Profile" element={protectedPage(<Profile />)} />
      </Routes>
      {notification?.sender && (
        <button
          type="button"
          onClick={openNotification}
          className="fixed right-5 top-5 z-50 flex max-w-sm items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-xl ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          <img src={notification.sender.image || dp} alt="" className="h-10 w-10 rounded-full object-cover" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-900">New message from {notification.sender.name || "a user"}</span>
            <span className="block truncate text-xs text-slate-600">{notification.text}</span>
          </span>
        </button>
      )}
    </CallProvider>
  );
}
