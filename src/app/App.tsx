import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext";
import { PrototypeStoreProvider } from "../state/PrototypeStore";
import { AppRoutes } from "./routes";

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <PrototypeStoreProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </PrototypeStoreProvider>
    </BrowserRouter>
  );
}
