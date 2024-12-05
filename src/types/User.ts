export interface User {
    id: string;
    firstName: string;
    lastName: string;
    systemRole: 'admin' | 'member';
    email: string;
    disabledAt?: number | null;
    clubs: {
        [key: string]: {
            role: "admin" | "member";
        };
    };
} 