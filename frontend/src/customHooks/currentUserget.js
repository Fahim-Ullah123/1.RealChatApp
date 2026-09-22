import axios from "axios";
import { useEffect } from "react";
import { serverUrl } from "../main";
import { useDispatch } from "react-redux";
import { setAuthChecked, setUserData } from "../Redux/userSlice";

const useCurrentUserGet = () => {
  let dispatch = useDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        let result = await axios.get(`${serverUrl}/api/auth/current`, {
          withCredentials: true,
          // A request that never completes must not keep the UI on its
          // startup screen forever. After this timeout App sends guests to
          // the visible login page instead.
          timeout: 8000,
        });
        dispatch(setUserData(result.data));
      } catch (error) {
        // A missing/expired session is expected. Clear any stale user data so
        // the protected route can show the login screen.
        dispatch(setUserData(null));
        console.warn("Could not restore the current session", error.message);
      } finally {
        dispatch(setAuthChecked(true));
      }
    };
    fetchUser();
  }, [dispatch]);
};

export default useCurrentUserGet;
