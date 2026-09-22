import axios from "axios";
import { useEffect } from "react";
import { serverUrl } from "../main";
import { useDispatch } from "react-redux";
import { setotherusers, setRecentConversationIds } from "../Redux/userSlice";

const useGetOtherUsers = (userId) => {
  let dispatch = useDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;

      try {
        let result = await axios.get(`${serverUrl}/api/auth/others`, {
          withCredentials: true,
        });
        let savedOrder = [];
        try {
          const savedValue = JSON.parse(
            window.localStorage.getItem(`chat-recency:${userId}`) || "[]",
          );
          savedOrder = Array.isArray(savedValue) ? savedValue : [];
        } catch {
          window.localStorage.removeItem(`chat-recency:${userId}`);
        }
        dispatch(setRecentConversationIds(savedOrder));
        dispatch(setotherusers(result.data));
      } catch (error) {
        console.log(error);
      }
    };
    fetchUser();
  }, [dispatch, userId]);
};

export default useGetOtherUsers;
