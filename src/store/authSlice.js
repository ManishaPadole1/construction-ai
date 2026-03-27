import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  error: null,
  ////
  employee_id: null,
  isAdmin: false,
  justLoggedIn: false,
  forceLogout: 1,
  hardRefresh: 1,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    LOGIN_REDUX: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isAdmin = action.payload.role === "admin" ? true : false;
      state.employee_id = action.payload.employee_id;
      state.justLoggedIn = true;
    },
    UPDATE_MY_DETAILS_REDUX: (state, action) => {
      state.user = action.payload;
      state.isAdmin = action.payload.role === "admin" ? true : false;
      // state.employee_id = action.payload.employee_id;
    },

    LOGOUT_REDUX: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isAdmin = false;
      state.justLoggedIn = false;
    },
    FORCE_LOGOUT_REDUX: (state, action) => {
      state.forceLogout = action.payload;
    },
    HARD_REFRESH_REDUX: (state, action) => {
      state.hardRefresh = action.payload;
    },
    UPDATE_JUST_LOGGED_IN_REDUX: (state, action) => {
      state.justLoggedIn = action.payload;
    },
  },
});

export const { LOGIN_REDUX, UPDATE_MY_DETAILS_REDUX, LOGOUT_REDUX, FORCE_LOGOUT_REDUX, HARD_REFRESH_REDUX, UPDATE_JUST_LOGGED_IN_REDUX } =
  authSlice.actions;

export default authSlice.reducer;
