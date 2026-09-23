import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    otherUsers: null,
    authChecked: false,
    selecteduser:null,
    recentConversationIds: [],
    onlineUsers: [],
    incomingMessage: null,
    deletedMessageId: null,
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
    },
    setotherusers: (state, action) => {
      const users = Array.isArray(action.payload) ? action.payload : [];
      const rank = new Map(
        state.recentConversationIds.map((userId, index) => [userId, index]),
      );
      // Keep API order for users without recent activity, while preserving
      // conversations that received or sent the newest message at the top.
      state.otherUsers = [...users].sort((firstUser, secondUser) => {
        const firstRank = rank.get(String(firstUser?._id));
        const secondRank = rank.get(String(secondUser?._id));
        if (firstRank === undefined && secondRank === undefined) return 0;
        if (firstRank === undefined) return 1;
        if (secondRank === undefined) return -1;
        return firstRank - secondRank;
      });
    },
    setAuthChecked: (state, action) => {
      state.authChecked = action.payload;
    },
    setselecteduser: (state, action) => {
      state.selecteduser = action.payload;
    },
    setRecentConversationIds: (state, action) => {
      state.recentConversationIds = Array.isArray(action.payload)
        ? action.payload.map(String)
        : [];
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    setIncomingMessage: (state, action) => {
      state.incomingMessage = action.payload;
    },
    setDeletedMessageId: (state, action) => {
      state.deletedMessageId = action.payload;
    },
    moveUserToTop: (state, action) => {
      const incomingUser = action.payload;
      const incomingUserId = String(incomingUser?._id || incomingUser);
      if (!incomingUserId) return;

      state.recentConversationIds = [
        incomingUserId,
        ...state.recentConversationIds.filter((userId) => userId !== incomingUserId),
      ];

      if (!Array.isArray(state.otherUsers)) return;

      const existingUser = state.otherUsers.find(
        (user) => String(user?._id) === incomingUserId,
      );
      if (!existingUser) return;

      const user = typeof incomingUser === "object"
        ? { ...existingUser, ...incomingUser }
        : existingUser;
      state.otherUsers = [
        user,
        ...state.otherUsers.filter((otherUser) => String(otherUser?._id) !== incomingUserId),
      ];
    },
  },
});

export const { setUserData, setotherusers, setAuthChecked, setselecteduser, setRecentConversationIds, setOnlineUsers, setIncomingMessage, setDeletedMessageId, moveUserToTop } =
  userSlice.actions;
export default userSlice.reducer;
