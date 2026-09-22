import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../main";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../Redux/userSlice";

export default function SignUp() {
  let navigatte = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setusername] = useState("");
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  let [loading, setloading] = useState(false);
  let [error, seterror] = useState("");
  let dispatch = useDispatch();

  const handlesignup = async (e) => {
    e.preventDefault();

    setloading(true);

    try {
      const result = await axios.post(
        `${serverUrl}/api/user/signup`,
        {
          username,
          email,
          password,
        },
        {
          withCredentials: true,
        },
      );

      setusername("");
      setemail("");
      setpassword("");

      setloading(false);
      seterror("");

      // Go to Login page after successful signup
      navigatte("/Login");
    } catch (error) {
      console.log(error);

      setloading(false);
      seterror(error.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-200 p-4 py-6">
      <div className="flex w-full max-w-[500px] flex-col gap-7 overflow-hidden rounded-lg bg-white py-6 shadow-lg shadow-gray-400 sm:min-h-[600px] sm:gap-[30px] sm:py-0">
        <div className="flex h-36 w-full items-center justify-center rounded-b-[30%] bg-cyan-500 shadow-lg shadow-gray-400 sm:h-[200px]">
          <h1 className="px-4 text-center text-2xl font-bold sm:text-[30px]">
            Welcome to <span className="text-white">Chatly</span>
          </h1>
        </div>
        <form
          onSubmit={handlesignup}
          className="w-full flex flex-col gap-[20px] items-center "
        >
          <input
            type="text"
            className="w-[90%] outline-none border-2 border-sky-400 rounded-lg h-[50px] shadow-lg  shadow-gray-400 px-[20px] py-[10px]"
            placeholder="enter your name"
            onChange={(e) => setusername(e.target.value)}
          />
          <input
            type="email"
            className="w-[90%] outline-none border-2 border-sky-400 rounded-lg h-[50px] shadow-lg  shadow-gray-400 px-[20px] py-[10px]"
            placeholder="enter your email"
            onChange={(e) => setemail(e.target.value)}
          />
          <div className="relative w-[90%]">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full outline-none border-2 border-sky-400 rounded-lg h-[50px] shadow-lg shadow-gray-400 px-[20px] py-[10px] pr-[50px]"
              placeholder="enter your password"
              onChange={(e) => setpassword(e.target.value)}
            />
            {error && <p className="text-red-600">{error}</p>}

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
            {loading ? "loading..." : "Sign Up"}
          </button>
          <p onClick={() => navigatte("/Login")} className="cursor-pointer  ">
            Already have an account ?{" "}
            <span className="text-sky-600 font-bold">Login</span>
          </p>
        </form>
      </div>
    </div>
  );
}
