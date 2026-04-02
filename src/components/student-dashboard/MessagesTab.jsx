import {
  Search,
  Send,
  Paperclip,
  Loader2,
  FileText,
  ImageIcon,
  VideoIcon,
  Edit,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";

export const MessagesTab = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [file, setFile] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedMessageText, setEditedMessageText] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const getSenderId = (message) => {
    if (!message) return "";
    if (message.sender?._id) return message.sender._id;
    if (message.senderId) return message.senderId;
    if (typeof message.sender === "string") return message.sender;
    return "";
  };

  const getMessageText = (message) => {
    if (!message) return "";
    if (typeof message.text === "string") return message.text;
    if (typeof message.message === "string") return message.message;
    if (typeof message.content === "string") return message.content;
    return "";
  };

  const currentUserId = String(user?._id || user?.id || "");

  const getConversationId = (conversation) => {
    if (!conversation) return "";
    return conversation._id || conversation.id || conversation.conversationId || "";
  };

  const ensureInstructorConversations = async (instructorId) => {
    if (!instructorId) return;

    try {
      const res = await api.get(`/api/courses/${instructorId}/courses/progress`);
      const courses = Array.isArray(res?.data?.courses) ? res.data.courses : [];

      const creationRequests = [];

      courses.forEach((course) => {
        const courseId = course?._id;
        const enrolledStudents = Array.isArray(course?.enrolledStudents)
          ? course.enrolledStudents
          : [];

        enrolledStudents.forEach((student) => {
          const studentId =
            student?.studentId?._id ||
            student?.studentId ||
            student?.id ||
            null;

          if (!studentId || !courseId) return;

          creationRequests.push(
            api.post(`/api/chat/conversations`, {
              studentId,
              instructorId,
              courseId,
            })
          );
        });
      });

      if (creationRequests.length > 0) {
        await Promise.allSettled(creationRequests);
      }
    } catch (error) {
      console.error("Failed to auto-create instructor conversations:", error);
    }
  };

  const fetchMessagesByConversationId = async (conversationId) => {
    if (!conversationId) return;
    try {
      setIsLoading(true);
      const response = await api.get(`/api/chat/messages/${conversationId}`);
      const normalized = Array.isArray(response.data)
        ? response.data.map(normalizeIncomingMessage)
        : [];
      setMessages(normalized);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeIncomingMessage = (message) => ({
    ...message,
    text: getMessageText(message),
    senderId: message?.senderId || message?.sender?._id || message?.sender || "",
    sender: message?.sender || message?.senderId || message?.sender?._id || "",
    createdAt: message?.createdAt || new Date().toISOString(),
  });

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        if (!currentUserId) return;

        const role = String(user?.role || "").toLowerCase();
        if (role === "instructor") {
          await ensureInstructorConversations(currentUserId);
        }

        const response = await api.get(`/api/chat/conversations/?userId=${currentUserId}`);
        const fetchedConversations = Array.isArray(response.data) ? response.data : [];
        setConversations(fetchedConversations);
        if (fetchedConversations.length > 0 && !selectedConversation) {
          setSelectedConversation(fetchedConversations[0]);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchConversations();
  }, [user, currentUserId]);

  // Fetch messages
  useEffect(() => {
    if (selectedConversation) {
      fetchMessagesByConversationId(getConversationId(selectedConversation));
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (!conversations.length) {
      setSelectedConversation(null);
      return;
    }

    if (!selectedConversation) {
      setSelectedConversation(conversations[0]);
      return;
    }

    const stillExists = conversations.some(
      (conversationItem) =>
        String(getConversationId(conversationItem)) ===
        String(getConversationId(selectedConversation))
    );

    if (!stillExists) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket.io setup
  useEffect(() => {
    if (!socket || !selectedConversation) return;
    const selectedConversationId = String(getConversationId(selectedConversation));

    const handleNewMessage = (message) => {
      if (String(message?.conversationId || "") === selectedConversationId) {
        const normalized = normalizeIncomingMessage(message);
        setMessages((prev) => [...prev, normalized]);
      }
    };

    const handleMessageUpdated = (updatedMessage) => {
      if (!updatedMessage) return;

      if (updatedMessage._id) {
        const normalized = normalizeIncomingMessage(updatedMessage);
        setMessages((prev) =>
          prev.map((msg) => (msg._id === normalized._id ? normalized : msg))
        );
        return;
      }

      if (updatedMessage.messageId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === updatedMessage.messageId
              ? {
                  ...msg,
                  text: updatedMessage.newText ?? msg.text,
                  updatedAt: new Date().toISOString(),
                }
              : msg
          )
        );
      }
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    };

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageUpdated", handleMessageUpdated);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("onlineUsers", handleOnlineUsers);
    socket.emit("joinConversation", selectedConversationId);
    socket.emit("getOnlineUsers");

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageUpdated", handleMessageUpdated);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("onlineUsers", handleOnlineUsers);
      socket.emit("leaveConversation", selectedConversationId);
    };
  }, [socket, selectedConversation]);

  const handleSendMessage = async (event) => {
    event?.preventDefault?.();

    const conversationToUse = selectedConversation || conversations[0] || null;
    const conversationId = getConversationId(conversationToUse);

    if ((!newMessage.trim() && !file) || isSending) return;
    if (!conversationId) {
      toast.error(t("student.messages.selectConversation"));
      return;
    }

    if (!selectedConversation && conversationToUse) {
      setSelectedConversation(conversationToUse);
    }

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      conversationId,
      senderId: currentUserId,
      sender: currentUserId,
      text: newMessage,
      createdAt: new Date().toISOString(),
      isTemp: true,
    };

    // Show immediately for the sender
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");
    setFile(null);

    try {
      setIsSending(true);
      const formData = new FormData();
      formData.append("conversationId", conversationId);
      formData.append("senderId", currentUserId);
      formData.append("text", tempMessage.text);
      if (file) formData.append("file", file);

      const response = await api.post(`/api/chat/messages`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const saved = {
        ...normalizeIncomingMessage(response.data),
        _id: response.data?._id || tempId,
        conversationId,
      };

      // Replace temp with saved
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? saved : msg))
      );

      socket.emit("sendMessage", {
        ...saved,
        conversationId,
      });

      // Re-sync to guarantee sender sees persisted message state.
      await fetchMessagesByConversationId(conversationId);
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove temp on error
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size <= 10 * 1024 * 1024) {
      setFile(selectedFile);
    } else {
      alert("File size should be less than 10MB");
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessageId(message._id);
    setEditedMessageText(getMessageText(message));
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedMessageText("");
  };

  const handleUpdateMessage = async () => {
    if (!editedMessageText.trim() || !editingMessageId) return;

    try {
      const response = await api.put(`/api/chat/messages/${editingMessageId}`, { text: editedMessageText });
      const normalizedUpdated = normalizeIncomingMessage(response.data);

      setMessages((prev) =>
        prev.map((msg) => (msg._id === editingMessageId ? normalizedUpdated : msg))
      );

      socket.emit("updateMessage", {
        messageId: editingMessageId,
        newText: editedMessageText,
        conversationId: selectedConversation._id,
      });

      setEditingMessageId(null);
      setEditedMessageText("");
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const userConfirmed = await new Promise((resolve) => {
      const confirmationPopup = document.createElement("div");
      confirmationPopup.className =
        "fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50";

      confirmationPopup.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 max-w-sm w-full">
          <h2 class="text-lg font-medium text-slate-900 dark:text-white mb-4">${t("student.messages.confirmTitle")}</h2>
          <p class="text-sm text-slate-600 dark:text-slate-400 mb-6">${t("student.messages.confirmBody")}</p>
          <div class="flex justify-end gap-2">
            <button class="px-4 py-2 text-sm font-medium rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600" id="cancelButton">${t("student.messages.confirmCancel")}</button>
            <button class="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600" id="confirmButton">${t("student.messages.confirmDelete")}</button>
          </div>
        </div>
      `;

      document.body.appendChild(confirmationPopup);

      const confirmButton = confirmationPopup.querySelector("#confirmButton");
      const cancelButton = confirmationPopup.querySelector("#cancelButton");

      confirmButton.addEventListener("click", () => {
        resolve(true);
        document.body.removeChild(confirmationPopup);
      });

      cancelButton.addEventListener("click", () => {
        resolve(false);
        document.body.removeChild(confirmationPopup);
      });
    });

    if (!userConfirmed) return;

    try {
      await api.delete(`/api/chat/messages/${messageId}`);

      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));

      socket.emit("deleteMessage", {
        messageId,
        conversationId: selectedConversation._id,
      });
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };
  

  const isUserOnline = (userId) => {
    return onlineUsers.some((user) => user._id === userId);
  };

  const getOtherParticipant = (conversation) =>
    conversation.members.find((member) => member._id !== user._id);

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = getOtherParticipant(conv);
    return otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const renderFilePreview = (message) => {
    if (!message.fileUrl) return null;

    switch (message.fileType) {
      case "image":
        return (
          <div className="mt-2">
            <img
              src={message.fileUrl}
              alt="Sent image"
              className="rounded-lg max-w-full max-h-64 object-contain cursor-pointer"
              onClick={() => window.open(message.fileUrl, "_blank")}
            />
            <a
              href={message.fileUrl}
              download
              className="block text-blue-500 hover:text-blue-600 text-sm mt-1  text-center"
            >
              Download Image
            </a>
          </div>
        );
      case "pdf":
        return (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-blue-500 hover:text-blue-600"
          >
            <FileText size={16} />
            <span>View PDF</span>
          </a>
        );
      case "video":
        return (
          <video controls className="mt-2 rounded-lg max-w-full max-h-64">
            <source src={message.fileUrl} type="video/mp4" />
          </video>
        );
      default:
        return (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-blue-500 hover:text-blue-600"
          >
            <FileText size={16} />
            <span>Download file</span>
          </a>
        );
    }
  };

  const getFileIcon = () => {
    if (!file) return <Paperclip />;
    const type = file.type.split("/")[0];
    switch (type) {
      case "image":
        return <ImageIcon size={18} />;
      case "video":
        return <VideoIcon size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filter */}
      <div className="flex mb-4 gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder={t("student.messages.search")}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-fidel-500 dark:focus:ring-fidel-400 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700">
          {t("student.messages.filter")}
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex h-[calc(100vh-230px)] bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {/* Conversations Sidebar */}
        <div className="w-72 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t("student.messages.recent")}
            </h3>
          </div>

          {isLoading && !conversations.length ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const otherUser = getOtherParticipant(conversation);
              const lastMessage = conversation.lastMessage;
              const isOnline = isUserOnline(otherUser?._id);
              const isUnread = conversation.unreadCount > 0;

              return (
                <div
                  key={conversation._id}
                  className={cn(
                    "p-3 flex items-start hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors duration-200",
                    selectedConversation?._id === conversation._id
                      ? "bg-slate-50 dark:bg-slate-700"
                      : ""
                  )}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="relative">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                        isUnread
                          ? "bg-fidel-100 dark:bg-fidel-900/30 text-fidel-600 dark:text-fidel-400"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {otherUser?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {otherUser?.name || t("student.messages.unknown")}
                      </h4>
                      {lastMessage && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(lastMessage.createdAt).toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      )}
                    </div>
                    {lastMessage && (
                      <p
                        className={cn(
                          "text-xs mt-1 truncate",
                          isUnread
                            ? "font-medium text-slate-900 dark:text-white"
                            : "text-slate-500 dark:text-slate-400"
                        )}
                      >
                        {lastMessage.text ||
                          (lastMessage.fileType === "image"
                            ? t("student.messages.sentImage")
                            : lastMessage.fileType === "pdf"
                            ? t("student.messages.sentPdf")
                            : t("student.messages.sentFile"))}
                      </p>
                    )}
                  </div>
                  {isUnread && (
                    <div className="ml-2 min-w-[18px] h-[18px] rounded-full bg-fidel-500 text-white text-xs flex items-center justify-center">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-fidel-100 dark:bg-fidel-900/30 flex items-center justify-center text-fidel-600 dark:text-fidel-400 text-sm font-medium">
                    {getOtherParticipant(selectedConversation)
                      ?.name?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  {isUserOnline(
                    getOtherParticipant(selectedConversation)?._id
                  ) && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
                  )}
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                    {getOtherParticipant(selectedConversation)?.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isUserOnline(
                      getOtherParticipant(selectedConversation)?._id
                    )
                      ? ""
                      : ""}
                  </p>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading && messages.length === 0 ? (
                  <div className="flex justify-center">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3">
                    {messages.map((msg) => {
                      const senderId = String(getSenderId(msg) || "");
                      const isOwnMessage = senderId === currentUserId;
                      const messageText = getMessageText(msg);
                      const timestamp = msg?.createdAt || msg?.updatedAt || new Date().toISOString();

                      return (
                      <div
                        key={msg._id}
                        className={cn(
                          "flex flex-col",
                          isOwnMessage ? "items-end" : "items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] px-4 py-2 rounded-lg",
                            isOwnMessage
                              ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-tl-none"
                          )}
                        >
                          {editingMessageId === msg._id ? (
                            <div className="flex flex-col">
                              <textarea
                                value={editedMessageText}
                                onChange={(e) =>
                                  setEditedMessageText(e.target.value)
                                }
                                className="w-full bg-white/20 rounded p-2 mb-2 text-white"
                                rows={3}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-2 py-1 text-xs rounded bg-white/20 hover:bg-white/30"
                                >
                                  {t("student.messages.edit.cancel")}
                                </button>
                                <button
                                  onClick={handleUpdateMessage}
                                  className="px-2 py-1 text-xs rounded bg-white hover:bg-white/90 text-blue-600"
                                >
                                  {t("student.messages.edit.save")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {messageText && (
                                <p className="break-words whitespace-pre-wrap">{messageText}</p>
                              )}
                              {renderFilePreview(msg)}
                              <p className="text-xs opacity-70 mt-1 text-right">
                                {new Date(timestamp).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </>
                          )}
                        </div>
                        {/* Edit/Delete Buttons (only for owner) */}
                        {isOwnMessage && editingMessageId !== msg._id && (
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => handleEditMessage(msg)}
                              className="text-slate-500 hover:text-abugida-500 transition-colors"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg._id)}
                              className="text-slate-500 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400">
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                t("student.messages.selectConversation")
              )}
            </div>
          )}

          {/* Message Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            {file && (
              <div className="mb-2 flex items-center justify-between bg-slate-100 dark:bg-slate-700 rounded-lg p-2">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  {getFileIcon()}
                  <span className="truncate max-w-xs">{file.name}</span>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-red-500 hover:text-red-600"
                  disabled={!selectedConversation}
                >
                  ×
                </button>
              </div>
            )}

            <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedConversation}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  file
                    ? "text-abugida-500"
                    : "text-slate-500 hover:text-abugida-500",
                  !selectedConversation && "opacity-50 cursor-not-allowed"
                )}
              >
                <Paperclip />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*, .pdf, .doc, .docx, .txt, video/*"
              />
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    // Allow form submit to handle Enter send consistently.
                    return;
                  }
                }}
                placeholder={
                  selectedConversation
                    ? t("student.messages.inputPlaceholder")
                    : t("student.messages.selectConversation")
                }
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-fidel-500 dark:focus:ring-fidel-400 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isSending || (!newMessage.trim() && !file)}
                className="inline-flex items-center justify-center min-w-10 h-10 text-white bg-blue-600 hover:bg-blue-700 px-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t("student.messages.inputPlaceholder")}
              >
                {isSending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Send size={18} className="text-white" strokeWidth={2.5} />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};