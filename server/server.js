import express from "express";
import bikeRoutes from "./routes/bike.routes.js"
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import cors from "cors";
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/bikes", bikeRoutes);
app.use("/admin", adminRoutes);
app.use("/users", userRoutes);

// Basic route
app.get("/", (req, res) => {
    res.send("Express server is running....");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

