// Firebase temporarily disabled for deployment
export const db = null;
export const firebase = null;

// Mock functions to prevent build errors
export const doc = () => null;
export const onSnapshot = () => () => null;
export const getDoc = () => Promise.resolve(null);
export const query = () => null;
export const orderBy = () => null;
export const limit = () => null;
export const collection = () => null;
