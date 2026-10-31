import { mockAdapter } from "./adapters/mock";
import { realAdapter } from "./adapters/real";
import type { ServiceAdapter } from "./adapters/types";

// Toggle real API vs Mock: defaults to mock, switches if VITE_USE_REAL_API === 'true'
const useRealAPI = import.meta.env.VITE_USE_REAL_API === "true";

export const services: ServiceAdapter = useRealAPI ? realAdapter : mockAdapter;
export { type ServiceAdapter };

