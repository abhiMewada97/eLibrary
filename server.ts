import { config } from "./src/config/config";
import app from "./src/app";

console.log("Welcome to ebook APIs");

const startServer = () => {
    const PORT = config.port|| 3000;

    app.listen(PORT, () => {
        console.log(`Listining on port: ${PORT}`);
    });
};

startServer();