import express from "express";

import {
    signupGuardian,
    loginGuardian,
    verifyGuardianEmail,
    resetGuardianPassword,
    addWearer
} from "../controllers/guardianController.js";


const router = express.Router();


// Sign up
router.post(
    "/signup",
    signupGuardian
);


// Login
router.post(
    "/login",
    loginGuardian
);


// Verify email
router.post(
    "/verify-email",
    verifyGuardianEmail
);


// Reset password
router.put(
    "/reset-password",
    resetGuardianPassword
);


// Add new wearer
router.post(
    "/add-wearer",
    addWearer
);


export default router;