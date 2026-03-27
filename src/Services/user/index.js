import commonRequest from "../ApiManager";

export const GET_ALL_PROJECTS_API = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null && v !== "") acc[k] = v;
      return acc;
    }, {}),
  ).toString();
  const endPoint = `api/v1/user/projects${query ? `?${query}` : ""}`;
  return await commonRequest("GET", endPoint, "");
};

export const CREATE_ANALYSIS_API = async (formData, onProgress) => {
  let endPoint = "api/v1/user/analyses/upload-and-analyze";
  const contentType = {
    "Content-Type": "multipart/form-data",
  };
  return await commonRequest("POST", endPoint, formData, contentType, onProgress);
};

export const GET_ANALYSES_BY_PROJECT_API = async (project_id, authority_type = "", params = {}) => {
  const query = new URLSearchParams();
  if (authority_type) query.set("authority_type", authority_type);

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") query.set(k, v);
  });

  let endPoint = `api/v1/user/analyses/${project_id}?${query.toString()}`;
  return await commonRequest("GET", endPoint, "");
};

export const UPDATE_ANALYSIS_TITLE_API = async (analysis_id, title) => {
  let endPoint = `api/v1/user/analyses/${analysis_id}/title`;
  return await commonRequest("PUT", endPoint, { title });
};

export const DELETE_ANALYSIS_API = async (analysis_id) => {
  let endPoint = `api/v1/user/analyses/${analysis_id}`;
  return await commonRequest("DELETE", endPoint);
};

export const DOWNLOAD_ANALYSIS_REPORT_API = async (analysis_id) => {
  const endPoint = `api/v1/user/analyses/${analysis_id}/download`;
  // Pass 'blob' as the 7th argument for binary response
  return await commonRequest("GET", endPoint, null, null, null, null, "blob");
};

export const GET_SINGLE_PROJECT_API = async (project_id) => {
  let endPoint = `api/v1/user/projects/${project_id}`;
  return await commonRequest("GET", endPoint, "");
};

// Analysis table is preferred now
export const QUICK_CHECK_API = async (formData) => {
  let endPoint = "api/v1/user/analyses/quick-check";
  const contentType = {
    "Content-Type": "multipart/form-data",
  };
  return await commonRequest("POST", endPoint, formData, contentType);
};

export const CREATE_PROJECT_ONLY_API = async (data) => {
  let endPoint = "api/v1/user/projects";
  return await commonRequest("POST", endPoint, data);
};

export const UPDATE_PROJECT_ONLY_API = async (project_id, data) => {
  let endPoint = `api/v1/user/projects/${project_id}`;
  return await commonRequest("PUT", endPoint, data);
};

export const DELETE_PROJECT_API = async (project_id) => {
  let endPoint = `api/v1/user/projects/${project_id}`;
  return await commonRequest("DELETE", endPoint);
};

export const GET_DASHBOARD_STATS_API = async () => {
  let endPoint = "api/v1/dashboard/user/stats";
  return await commonRequest("GET", endPoint);
};
