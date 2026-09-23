import React, { Component, useCallback, useEffect, useRef, useState } from "react";
import {
  IoArrowBackSharp,
  IoCall,
  IoClose,
  IoDocumentTextOutline,
  IoImageOutline,
  IoSend,
  IoTrashOutline,
  IoVideocam,
} from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import dp from "../assets/dp.webp";
import { moveUserToTop, setselecteduser } from "../Redux/userSlice";
import { serverUrl } from "../main";
import { useCall } from "./CallProvider";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

class ConversationErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 p-6 lg:w-[68%] lg:border-l-2 lg:border-slate-200">
          <p className="max-w-md rounded-2xl bg-red-50 px-5 py-4 text-center text-sm text-red-700 shadow-sm">
            Could not display this conversation: {this.state.error.message || "Unknown error"}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

function MessagesAreaContent() {
  const { selecteduser, userData, incomingMessage, deletedMessageId, onlineUsers } = useSelector((state) => state.user);
  const selectedUserId = selecteduser?._id;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef(null);
  const messageEnd = useRef(null);
  const dispatch = useDispatch();
  const { startCall } = useCall();

  const loadMessages = useCallback(
    async (showLoading = false) => {
      if (!selectedUserId) return;
      if (showLoading) setLoading(true);
      try {
        const result = await axios.get(`${serverUrl}/api/messages/${selectedUserId}`, {
          withCredentials: true,
        });
        // Keep the view renderable if the API returns an empty body or wraps
        // the messages in an object.
        const fetchedMessages = Array.isArray(result.data)
          ? result.data
          : result.data?.messages;
        setMessages(
          Array.isArray(fetchedMessages)
            ? fetchedMessages.filter((message) => message && typeof message === "object")
            : [],
        );
        setError("");
      } catch (loadError) {
        // Keep an existing conversation on screen, but make failed loading
        // visible instead of silently rendering an empty chat.
        setError(loadError.response?.data?.message || "Could not load messages. Make sure the backend is running and you are still logged in.");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [selectedUserId],
  );

  useEffect(() => {
    if (!selectedUserId) return undefined;

    loadMessages(true);
    const refreshMessages = window.setInterval(() => loadMessages(false), 3000);
    return () => window.clearInterval(refreshMessages);
  }, [loadMessages, selectedUserId]);

  useEffect(() => {
    messageEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (String(incomingMessage?.sender?._id || incomingMessage?.sender) !== String(selectedUserId)) return;
    setMessages((currentMessages) =>
      currentMessages.some((message) => message._id === incomingMessage._id)
        ? currentMessages
        : [...currentMessages, incomingMessage],
    );
  }, [incomingMessage, selectedUserId]);

  useEffect(() => {
    if (!deletedMessageId) return;
    setMessages((currentMessages) =>
      currentMessages.filter((message) => message._id !== deletedMessageId),
    );
  }, [deletedMessageId]);

  const chooseAttachment = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError("Files must be 25 MB or smaller.");
      event.target.value = "";
      return;
    }
    setAttachment(file);
    setError("");
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const openFilePicker = (accept) => {
    if (!fileInput.current) return;
    fileInput.current.accept = accept;
    fileInput.current.click();
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if ((!text.trim() && !attachment) || sending || !selectedUserId) return;

    const formData = new FormData();
    formData.append("message", text.trim());
    if (attachment) formData.append("media", attachment);

    setSending(true);
    setError("");
    try {
      const result = await axios.post(
        `${serverUrl}/api/messages/${selectedUserId}`,
        formData,
        { withCredentials: true },
      );
      setMessages((currentMessages) => [...currentMessages, result.data]);
      dispatch(moveUserToTop(selecteduser));
      setText("");
      removeAttachment();
    } catch (sendError) {
      setError(sendError.response?.data?.message || "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message for everyone?")) return;
    setError("");
    try {
      await axios.delete(`${serverUrl}/api/messages/${messageId}`, {
        withCredentials: true,
      });
      setMessages((currentMessages) =>
        currentMessages.filter((message) => message._id !== messageId),
      );
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Could not delete message.");
    }
  };

  // A message returned by the API may not have a timestamp yet (for example,
  // immediately after it is created). Formatting an invalid date throws a
  // RangeError, which previously caused the whole conversation view to crash.
  const formatTime = (date) => {
    const messageDate = new Date(date);
    if (Number.isNaN(messageDate.getTime())) return "";

    return new Intl.DateTimeFormat([], {
      hour: "numeric",
      minute: "2-digit",
    }).format(messageDate);
  };

  const attachmentIsImage = attachment?.type?.startsWith("image/");
  const isSelectedUserOnline = Array.isArray(onlineUsers) && onlineUsers.includes(String(selectedUserId));

  const closeConversation = () => {
    setMessages([]);
    setText("");
    removeAttachment();
    dispatch(setselecteduser(null));
  };

  return (
    <div className={`h-full min-h-0 w-full flex-col bg-slate-100 lg:w-[68%] lg:border-l-2 lg:border-slate-200 ${selecteduser ? "flex" : "hidden lg:flex"}`}>
      {selecteduser ? (
        <>
          <header className="flex h-[76px] shrink-0 items-center rounded-b-[24px] bg-teal-800 px-2 shadow-lg shadow-gray-400 sm:h-[100px] sm:rounded-b-[30px] sm:px-3">
            <button
              type="button"
              aria-label="Close conversation"
              onClick={closeConversation}
              className="rounded-full p-2 text-gray-200 hover:bg-white/10 lg:hidden"
            >
              <IoArrowBackSharp className="size-6" />
            </button>
            <img
              src={selecteduser.image || dp}
              alt={`${selecteduser.name}'s profile`}
              className="ml-1 h-10 w-10 shrink-0 rounded-full object-cover shadow-lg shadow-gray-500 sm:ml-2"
            />
            <div className="min-w-0 px-2 sm:px-3">
              <h2 className="truncate text-base font-semibold text-white">{selecteduser.name}</h2>
              <p className="flex items-center gap-1 text-xs text-gray-200">
                <span className={`h-2 w-2 rounded-full ${isSelectedUserOnline ? "bg-green-400" : "bg-gray-400"}`} />
                {isSelectedUserOnline ? "Online" : "Offline"}
              </p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-0 sm:gap-1">
              <button type="button" onClick={() => startCall(selecteduser, "voice")} aria-label="Start voice call" className="rounded-full p-2.5 text-white hover:bg-white/10 sm:p-3" title="Voice call"><IoCall className="size-5" /></button>
              <button type="button" onClick={() => startCall(selecteduser, "video")} aria-label="Start video call" className="rounded-full p-2.5 text-white hover:bg-white/10 sm:p-3" title="Video call"><IoVideocam className="size-5 sm:size-6" /></button>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-3 sm:p-4">
            {loading ? (
              <p className="mt-10 text-center text-sm text-gray-500">Loading conversation…</p>
            ) : error && !messages.length ? (
              <p className="mx-auto mt-10 w-fit max-w-md rounded-2xl bg-red-50 px-5 py-3 text-center text-sm text-red-700 shadow-sm">{error}</p>
            ) : messages.length ? (
              messages.map((message, index) => {
                const isMine = String(message.sender?._id || message.sender) === String(userData?._id);
                return (
                  <div key={message._id || `${message.createdAt || "message"}-${index}`} className={`group mb-3 flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`relative max-w-[88%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[82%] sm:px-4 ${isMine ? "rounded-br-sm bg-cyan-600 text-white" : "rounded-bl-sm border border-slate-200 bg-white text-slate-900"}`}>
                      {message.media?.url &&
                        (message.media.type === "video" ? (
                          <video controls className="mb-1 max-h-72 max-w-full rounded-md">
                            <source src={message.media.url} />
                          </video>
                        ) : message.media.type === "document" ? (
                          <a href={message.media.url} target="_blank" rel="noreferrer" className="mb-1 flex min-w-48 items-center gap-3 rounded-lg bg-black/5 p-3 text-gray-800 hover:bg-black/10">
                            <IoDocumentTextOutline className="size-8 shrink-0 text-teal-800" />
                            <span className="truncate text-sm font-medium">{message.media.name || "Document"}</span>
                          </a>
                        ) : (
                          <img src={message.media.url} alt="Shared attachment" className="mb-1 max-h-72 rounded-md object-cover" />
                        ))}
                      {message.message && <p className={`whitespace-pre-wrap break-words pr-9 text-sm ${isMine ? "text-white" : "text-gray-800"}`}>{message.message}</p>}
                      <div className="mt-1 flex items-center justify-end gap-1">
                        <span className={`text-[10px] ${isMine ? "text-cyan-100" : "text-gray-500"}`}>{formatTime(message.createdAt)}</span>
                        {isMine && (
                          <button type="button" aria-label="Delete message" onClick={() => deleteMessage(message._id)} className={`rounded p-1 opacity-100 hover:bg-black/10 hover:text-red-600 lg:opacity-0 lg:group-hover:opacity-100 ${isMine ? "text-cyan-100" : "text-gray-500"}`}>
                            <IoTrashOutline className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="mx-auto mt-10 w-fit rounded-2xl bg-white px-5 py-3 text-center text-sm text-gray-500 shadow-sm">No messages yet. Start a conversation with {selecteduser.name}.</p>
            )}
            <div ref={messageEnd} />
          </main>

          <form onSubmit={sendMessage} className="shrink-0 border-t border-slate-200 bg-white p-2 sm:p-3">
            {error && <p className="mb-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {attachment && (
              <div className="mb-2 flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
                {attachmentIsImage ? <IoImageOutline className="size-6 text-teal-800" /> : <IoDocumentTextOutline className="size-6 text-teal-800" />}
                <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{attachment.name}</span>
                <button type="button" onClick={removeAttachment} aria-label="Remove attachment" className="rounded-full p-1 text-gray-500 hover:bg-gray-100"><IoClose className="size-5" /></button>
              </div>
            )}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <input ref={fileInput} type="file" className="hidden" onChange={chooseAttachment} />
              <button type="button" aria-label="Attach image or video" onClick={() => openFilePicker("image/*,video/*")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-teal-800 shadow-sm transition hover:bg-teal-50 sm:h-11 sm:w-11" title="Photo or video">
                <IoImageOutline className="size-5" />
              </button>
              <button type="button" aria-label="Attach document" onClick={() => openFilePicker(".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-teal-800 shadow-sm transition hover:bg-teal-50 sm:h-11 sm:w-11" title="Document">
                <IoDocumentTextOutline className="size-5" />
              </button>
              <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Write a message" className="min-w-0 flex-1 rounded-full bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500" />
              <button type="submit" aria-label="Send message" disabled={sending || (!text.trim() && !attachment)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg shadow-cyan-700/20 transition hover:scale-105 hover:bg-cyan-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-12"><IoSend className="ml-0.5 size-5" /></button>
            </div>
          </form>
        </>
      ) : (
        <div className="flex h-full flex-1 items-center justify-center p-6"><p className="text-center text-gray-500">Select a user to view your conversation.</p></div>
      )}
    </div>
  );
}

export default function MessagesArea() {
  const selectedUserId = useSelector((state) => state.user.selecteduser?._id);

  return (
    <ConversationErrorBoundary resetKey={selectedUserId}>
      <MessagesAreaContent />
    </ConversationErrorBoundary>
  );
}
