import http from "http";
import app from "./app.js";
import { initws } from "./ws/index.js";
const server = http.createServer(app);
initws(server);
server.listen(3000, () => {
    console.log("Server running on port 3000");
});
//# sourceMappingURL=server.js.map