import app from "./src/app";

console.log("Welcome to ebook APIs");

const startServer = () => {
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`Listining on port: ${PORT}`);
    });
};

startServer();