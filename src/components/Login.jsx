import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { LOGIN_REDUX } from "../store/authSlice";
import { Eye, EyeOff, Building2, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { LOGIN_API } from "../Services/Auth";

const currentYear = new Date().getFullYear();

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [employeeId, setEmployeeId] = useState("EMP2056301543619056");
  const [password, setPassword] = useState("Shanu@123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!employeeId || !password) {
        setError("Please fill in all fields");
        setIsLoading(false);
        return;
      }

      if (!employeeId.match(/^[a-zA-Z0-9_-]{3,20}$/)) {
        setError("Please enter a valid employee ID");
        setIsLoading(false);
        return;
      }

      const dataToSend = { employee_id: employeeId, password: password };
      const res = await LOGIN_API(dataToSend);

      const response = res?.response ? res?.response : res;
      const userDetails = response?.data?.payload?.userDetails;

      if (response?.data?.success) {
        dispatch(LOGIN_REDUX(userDetails));

        // Get saved redirect info
        const expiredUserId = sessionStorage.getItem('expiredUserId');
        const savedRedirectPath = sessionStorage.getItem('redirectPath');
        const pathFromState = location.state?.from;

        // Logic for redirecting back to intended path
        if (savedRedirectPath && expiredUserId === userDetails.employee_id) {
          // Scenario: Session expired, same user logged in
          navigate(savedRedirectPath);
        } else if (pathFromState && pathFromState !== '/') {
          // Scenario: Direct link or Different user after session expiry
          if (expiredUserId && expiredUserId !== userDetails.employee_id) {
            // Scenario: Different user logged in after a session expired, go to dashboard
            navigate("/dashboard");
          } else {
            // Scenario: Success redirect to original path (shared links etc)
            navigate(pathFromState);
          }
        } else {
          // Default redirect
          navigate("/dashboard");
        }

        // Cleanup session storage after use
        sessionStorage.removeItem('redirectPath');
        sessionStorage.removeItem('expiredUserId');
      } else {
        setError(response?.data?.payload?.message || "Login failed");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/30 rounded-full blur-[120px] animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl text-white tracking-tight">IntelliApprove</h1>
              <p className="text-sm text-blue-300">AI Construction Approvals</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="relative rounded-[28px] bg-white shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="h-32 bg-gradient-to-br from-[#1A73E8] via-[#4F46E5] to-[#6366f1] flex items-center justify-center">
            <div>
              <h3 className="text-2xl text-white text-center mb-1">Welcome Back</h3>
              <p className="text-blue-100 text-center text-sm">Sign in to your account</p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Employee ID */}
              <div className="space-y-2">
                <Label className="text-gray-700">Employee ID</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter employee ID"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    disabled={isLoading}
                    className="h-14 pl-12 rounded-2xl border-2 border-gray-200 bg-gray-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label className="text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-14 pl-12 pr-12 rounded-2xl border-2 border-gray-200 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#1A73E8] to-[#4F46E5] text-white shadow-lg"
              >
                {isLoading ? "Signing in..." : (
                  <span className="flex items-center justify-center gap-2">
                    Sign in <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-blue-100/70">
          © {currentYear} Aerotive UAE. All rights reserved.
        </p>
      </div>
    </div>
  );
}
