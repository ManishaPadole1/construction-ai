import axios from "axios";
import Swal from "sweetalert2";
import { handleLogout } from "./extras/handleLogout";

// .env variable names required:
// VITE_API_URL,  VITE_API_VALUE, VITE_API_KEY
const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;
const API_VALUE = import.meta.env.VITE_API_VALUE;

const getToken = () => {
  const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('token='));
  return tokenCookie ? tokenCookie.split('=')[1] : null;
};
const commonRequest = async (method, endPoint, body, headers, onUploadProgress, params, responseType = 'json') => {


  const token = getToken();

  //API HEADERS
  const API_HEADERS = {
    "Content-Type": "application/json",
    [API_KEY]: API_VALUE,
    // Authorization: `Bearer ${token}`,
  };

  const impersonateId = sessionStorage.getItem('impersonate_employee_id');

  // EXCLUDE identity/auth endpoints AND admin routes from impersonation
  // 1. Identity: We need the REAL Admin session for auth checks.
  // 2. Admin Routes: Admin APIs need Admin privileges. They typically accept employee_id as a parameter if needed, 
  //    so they don't rely on the impersonation header context. Sending it might make the backend treat us as the User (who has no admin access).
  const isExcludedEndpoint =
    endPoint.includes('get-my-details') ||
    endPoint.includes('login') ||
    endPoint.includes('logout') ||
    endPoint.includes('/admin/');

  if (impersonateId && !isExcludedEndpoint) {
    API_HEADERS['x-impersonate-employee-id'] = impersonateId;
  }

  try {
    let config = {
      method: method,
      url: `${API_URL}/${endPoint}`,
      params: params ? params : null,
      headers: headers ? { ...API_HEADERS, ...headers } : API_HEADERS,
      data: body,
      onUploadProgress: onUploadProgress ? onUploadProgress : null,
      withCredentials: true,
      responseType: responseType // Use the passed responseType, default is 'json'
    };

    console.log("🚀 ~ commonRequest ~ API_URL:", API_URL, " endPoint ", endPoint);

    // axios instance
    const response = await axios(config);
    console.log("🚀 ~ commonRequest ~ response:", response?.response);

    if (response?.response?.data?.status === "SESSION_EXPIRED") {
      //handle session expired
      handleSessionExpired();

    }

    return response;
  } catch (error) {
    console.error("Error:", error);

    //handle session expired
    if (error?.response?.data?.status === "SESSION_EXPIRED") {
      handleSessionExpired();
      return;
    }

    // Return other errors as they are
    return error;
    // throw error;
  }
};

export default commonRequest;






const handleSessionExpired = async () => {
  // Trigger custom event for App.jsx to show modal
  window.dispatchEvent(new Event('session-expired'));

  // NOTE: logic to actually log out (clearing redux/storage) happens when user clicks "Sign Out" 
  // or we can force it here if we want immediate kickoff.

  // Return null to indicate session error
  return null;
};
