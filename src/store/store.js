import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import quickCheckReducer from "./quickCheckSlice";
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistReducer, persistStore } from "redux-persist";

import storage from "redux-persist/lib/storage";
import { createStateSyncMiddleware, initStateWithPrevTab } from "redux-state-sync";

const persistConfig = {
  key: "auth",
  storage,
};

const quickCheckPersistConfig = {
  key: "quickCheck",
  storage,
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);
const persistedQuickCheckReducer = persistReducer(quickCheckPersistConfig, quickCheckReducer);

// Create state sync middleware with configuration
const stateSyncConfig = {
  blacklist: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER], // Ignore redux-persist actions
};
const stateSyncMiddleware = createStateSyncMiddleware(stateSyncConfig);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    quickCheck: persistedQuickCheckReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(stateSyncMiddleware),
});

initStateWithPrevTab(store); // Initialize state with previous tab

export const persistor = persistStore(store);
export default store;
