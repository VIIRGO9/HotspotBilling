import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();


router.get(
    "/users",
    authenticate,
    authorize("ADMIN"),
    (req, res) => {

        res.json({
            message: "Admin users page",
            user: req.user
        });

    }
);


export default router;
