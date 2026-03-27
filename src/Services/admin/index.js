import commonRequest from "../ApiManager";

//////////////////////////////////////////////////////
export const GET_ALL_EMPLOYEES_API = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null && v !== "") acc[k] = v;
      return acc;
    }, {}),
  ).toString();
  const endPoint = `api/v1/admin/users/get-all-employees${query ? `?${query}` : ""}`;
  return await commonRequest("GET", endPoint, "");
};

export const ADD_EMPLOYEE_API = async (data) => {
  const endPoint = `api/v1/admin/users/add-employee`;
  return await commonRequest("POST", endPoint, data);
};

export const UPDATE_EMPLOYEE_API = async (employee_id, data) => {
  const endPoint = `api/v1/admin/users/update-employee/${employee_id}`;
  return await commonRequest("PUT", endPoint, data);
};

export const DELETE_EMPLOYEE_API = async (employee_id) => {
  const endPoint = `api/v1/admin/users/delete-employee/${employee_id}`;
  return await commonRequest("DELETE", endPoint);
};

export const GET_EMPLOYEE_API = async (employee_id) => {
  const endPoint = `api/v1/admin/users/get-employee/${employee_id}`;
  return await commonRequest("GET", endPoint, "");
};

export const GET_ADMIN_DASHBOARD_STATS_API = async () => {
  let endPoint = "api/v1/dashboard/admin/stats";
  return await commonRequest("GET", endPoint, "");
};
