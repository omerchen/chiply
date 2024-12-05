export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    systemRole: 'admin' | 'member';
    disabledAt?: number | null;
    clubs: {
        [key: string]: {
            role: "admin" | "member";
        };
    };
} 