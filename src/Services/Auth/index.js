import commonRequest from "../../Services/ApiManager";

export const LOGIN_API = async (data) => {
  let endPoint = "api/v1/auth/login";
  return await commonRequest("POST", endPoint, data);
};

export const GET_MY_DETAILS_API = async () => {
  let endPoint = "api/v1/auth/get-my-details";
  return await commonRequest("GET", endPoint, "");
};

export const LOGOUT_API = async (employee_id) => {
  let endPoint = `api/v1/auth/logout?employee_id=${employee_id}`;
  return await commonRequest("GET", endPoint, "");
};








