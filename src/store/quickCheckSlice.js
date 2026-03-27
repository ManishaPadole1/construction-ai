import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Structure: { [employee_id]: [ { id, date, summary, fullData } ] }
  records: {},
  // Track last access to manage storage cleanup if needed
  lastAccess: {},
};

const MAX_RECORDS_PER_USER = 5;
const MAX_USERS_STORED = 5; // Prevent storage bloat on shared devices

const quickCheckSlice = createSlice({
  name: "quickCheck",
  initialState,
  reducers: {
    ADD_QUICK_CHECK_RECORD: (state, action) => {
      const { employee_id, record } = action.payload;
      if (!employee_id) return;

      // 1. Initialize user array if not present
      if (!state.records[employee_id]) {
        state.records[employee_id] = [];
      }

      // 2. Add new record to the start (FIFO for display, but array logic is unshift)
      // We want to keep the NEWEST 5. So we add to front, and trim back.
      state.records[employee_id].unshift(record);

      // 3. Enforce limit of 5
      if (state.records[employee_id].length > MAX_RECORDS_PER_USER) {
        state.records[employee_id] = state.records[employee_id].slice(0, MAX_RECORDS_PER_USER);
      }

      // 4. Update access time
      state.lastAccess[employee_id] = Date.now();

      // 5. Cleanup old users if too many stored
      const employeeIds = Object.keys(state.records);
      if (employeeIds.length > MAX_USERS_STORED) {
        // Find user with oldest access time
        const oldestUser = employeeIds.reduce((a, b) => ((state.lastAccess[a] || 0) < (state.lastAccess[b] || 0) ? a : b));
        // Only delete if it's not the current user (sanity check)
        if (oldestUser !== employee_id) {
          delete state.records[oldestUser];
          delete state.lastAccess[oldestUser];
        }
      }
    },

    REMOVE_QUICK_CHECK_RECORD: (state, action) => {
      const { employee_id, recordId } = action.payload;
      if (!employee_id || !state.records[employee_id]) return;

      state.records[employee_id] = state.records[employee_id].filter((rec) => rec.id !== recordId);
    },

    CLEAR_USER_RECORDS: (state, action) => {
      const { employee_id } = action.payload;
      if (employee_id) {
        delete state.records[employee_id];
        delete state.lastAccess[employee_id];
      }
    },
  },
});

export const { ADD_QUICK_CHECK_RECORD, REMOVE_QUICK_CHECK_RECORD, CLEAR_USER_RECORDS } = quickCheckSlice.actions;

// Selector to get current user's records
// Usage: useSelector(state => selectUserQuickChecks(state, auth.user?.employee_id))
export const selectUserQuickChecks = (state, employee_id) => state.quickCheck?.records?.[employee_id] || [];

export default quickCheckSlice.reducer;
