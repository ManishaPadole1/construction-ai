import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store/store";
import toast, { Toaster } from "react-hot-toast";
import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("New content available. Reload?")) {
      updateSW(true);
    }
  },
});

import "./index.css";
import "./styles/globals.css";



// createRoot(document.getElementById("root")).render(<App />);

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate persistor={persistor}>
      <Toaster position="top-right" containerStyle={{ zIndex: 999999 }} />

      <App />
    </PersistGate>
  </Provider>,
);
