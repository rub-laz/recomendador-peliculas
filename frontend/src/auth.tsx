export const login = () => localStorage.setItem('isAuthenticated', 'true');
export const logout = () => localStorage.removeItem('isAuthenticated');
export const isAuthenticated = () => localStorage.getItem('isAuthenticated') === 'true';
