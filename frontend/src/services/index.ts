import { mockAdapter } from "./adapters/mock";
import { realAdapter } from "./adapters/real";
import type { ServiceAdapter } from "./adapters/types";

// The real API is the safe default. Mock data is available only when a
// developer explicitly sets VITE_USE_REAL_API=false.
const useRealAPI = import.meta.env.VITE_USE_REAL_API !== "false";

export const services: ServiceAdapter = useRealAPI ? realAdapter : mockAdapter;
export { type ServiceAdapter };

