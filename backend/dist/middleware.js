import jwt from "jsonwebtoken";
import { jwt_password } from "./config.js";
export const authMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
        return res.status(401).json({ message: "token not found" });
    }
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;
    try {
        //@ts-ignore
        const decoded = jwt.verify(token, jwt_password);
        req.userId = decoded.id;
        next();
    }
    catch {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};
//# sourceMappingURL=middleware.js.map