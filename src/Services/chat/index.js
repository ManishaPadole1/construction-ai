import commonRequest from "../ApiManager";

// Get all chats for authenticated user
export const GET_USER_CHATS_API = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null && v !== "") acc[k] = v;
      return acc;
    }, {})
  ).toString();
  const endPoint = `api/v1/user/chats/user${query ? `?${query}` : ""}`;
  return await commonRequest("GET", endPoint, "");
};

// Get user projects for chat selection
export const GET_USER_PROJECTS_API = async (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null && v !== "") acc[k] = v;
      return acc;
    }, {})
  ).toString();
  const endPoint = `api/v1/user/chats/projects${query ? `?${query}` : ""}`;
  return await commonRequest("GET", endPoint, "");
};

// Get single chat by ID
export const GET_CHAT_BY_ID_API = async (chatId) => {
  const endPoint = `api/v1/user/chats/${chatId}`;
  return await commonRequest("GET", endPoint, "");
};

// Create new chat (userId from backend auth)
export const CREATE_CHAT_API = async (data = {}) => {
  const endPoint = "api/v1/user/chats";
  return await commonRequest("POST", endPoint, data);
};

// Add message to chat
export const ADD_MESSAGE_API = async (chatId, messageData) => {
  const endPoint = `api/v1/user/chats/${chatId}/message`;
  return await commonRequest("POST", endPoint, messageData);
};

// Update chat title
export const UPDATE_CHAT_TITLE_API = async (chatId, title) => {
  const endPoint = `api/v1/user/chats/${chatId}/title`;
  return await commonRequest("PATCH", endPoint, { title });
};

// Assign project to chat
export const ASSIGN_PROJECT_TO_CHAT_API = async (chatId, projectId, analysisId) => {
  const endPoint = `api/v1/user/chats/${chatId}/project`;
  return await commonRequest("PATCH", endPoint, { projectId, analysisId });
};

// Delete chat
export const DELETE_CHAT_API = async (chatId) => {
  const endPoint = `api/v1/user/chats/${chatId}`;
  return await commonRequest("DELETE", endPoint);
};
