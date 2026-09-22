import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../main";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../Redux/userSlice";

export default function Login() {
  let navigatte = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  let [loading, setloading] = useState(false);
  let [error, seterror] = useState("");
  let dispatch = useDispatch();
 

  const handlelogin = async (e) => {
    e.preventDefault();
    setloading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/user/login`,
        { email, password },
        { withCredentials: true },
      );
      dispatch(setUserData(result.data));
      setemail("");
      setpassword("");
      setloading(false);
      seterror("");
      navigatte("/");
    } catch (error) {
      console.log(error);
      setloading(false);
      seterror(
        error.response?.data?.message ||
          "Cannot reach the server. Start the backend, then try again.",
      );
    }
  };
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-200 p-4 py-6">
      <div className="flex min-h-[600px] w-full max-w-[500px] flex-col gap-[30px] rounded-lg bg-white shadow-lg shadow-gray-400">
        <div className="w-full h-[200px] bg-cyan-500 rounded-b-[30%] shadow-lg  shadow-gray-400 flex items-center justify-center">
          <h1 className="font-bold text-[30px]">
            Login to <span className="text-white">Chatly</span>
          </h1>
        </div>
        <form
          className="w-full flex flex-col gap-[20px] items-center "
          onSubmit={handlelogin}
        >
          <input
            type="email"
            className="w-[90%] outline-none border-2 border-sky-400 rounded-lg h-[50px] shadow-lg  shadow-gray-400 px-[20px] py-[10px]"
            placeholder="enter your email"
            onChange={(e) => setemail(e.target.value)}
            value={email}
          />
          <div className="relative w-[90%]">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full outline-none border-2 border-sky-400 rounded-lg h-[50px] shadow-lg shadow-gray-400 px-[20px] py-[10px] pr-[50px]"
              placeholder="enter your password"
              onChange={(e) => setpassword(e.target.value)}
              value={password}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-0 top-0 h-full px-[16px] text-sky-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button
            className="w-[180px] h-[50px]  shadow-lg  shadow-gray-400 font-bold px-[10px]  rounded-lg bg-cyan-500 hover:shadow-inner"
            disabled={loading}
          >
            {loading ? "loading..." : "Login"}
          </button>
          <p onClick={() => navigatte("/SignUp")} className="cursor-pointer  ">
            want to create new account ?{" "}
            <span className="text-sky-600 font-bold">SignUp</span>
          </p>
        </form>
      </div>
    </div>
  );
}
