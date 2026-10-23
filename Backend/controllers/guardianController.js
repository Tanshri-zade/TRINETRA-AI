import { Guardian } from "../models/guardianModel.js";
import bcrypt from "bcryptjs";


// Sign up guardian
export const signupGuardian = async (req, res) => {

    try {

        const {
            name,
            wearerName,
            wearerType,
            email,
            mobile,
            password
        } = req.body;


        if (
            !name ||
            !wearerName ||
            !wearerType ||
            !email ||
            !mobile ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });

        }


        if (
            !["woman", "child"].includes(
                wearerType
            )
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid wearer type."
            });

        }


        const existingGuardian =
            await Guardian.findOne({
                email: email.toLowerCase().trim()
            });


        if (existingGuardian) {

            return res.status(400).json({
                success: false,
                message: "Account already exists."
            });

        }


        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        const guardian =
            await Guardian.create({

                name: name.trim(),

                email:
                    email.toLowerCase().trim(),

                mobile,

                password:
                    hashedPassword,

                wearers: [
                    {
                        name:
                            wearerName.trim(),

                        type:
                            wearerType
                    }
                ]

            });


        return res.status(201).json({

            success: true,

            message:
                "Guardian account created successfully.",

            guardian: {

                id:
                    guardian._id,

                name:
                    guardian.name,

                email:
                    guardian.email,

                mobile:
                    guardian.mobile,

                wearers:
                    guardian.wearers

            }

        });

    }

    catch (error) {

        console.log(
            "Signup Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to create account."

        });

    }

};


// Login guardian
export const loginGuardian = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required."

            });

        }


        const guardian =
            await Guardian.findOne({

                email:
                    email.toLowerCase().trim()

            });


        if (!guardian) {

            return res.status(404).json({

                success: false,

                message:
                    "Guardian account not found."

            });

        }


        const passwordMatch =
            await bcrypt.compare(

                password,

                guardian.password

            );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Incorrect password."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Login successful.",

            guardian: {

                id:
                    guardian._id,

                name:
                    guardian.name,

                email:
                    guardian.email,

                mobile:
                    guardian.mobile,

                wearers:
                    guardian.wearers

            }

        });

    }

    catch (error) {

        console.log(
            "Login Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to login."

        });

    }

};


// Verify guardian email
export const verifyGuardianEmail = async (req, res) => {

    try {

        const {
            email
        } = req.body;


        if (!email) {

            return res.status(400).json({

                success: false,

                message:
                    "Email is required."

            });

        }


        const guardian =
            await Guardian.findOne({

                email:
                    email.toLowerCase().trim()

            });


        if (!guardian) {

            return res.status(404).json({

                success: false,

                message:
                    "This email is not registered."

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Email verified successfully."

        });

    }

    catch (error) {

        console.log(
            "Email Verification Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to verify email."

        });

    }

};


// Reset guardian password
export const resetGuardianPassword = async (req, res) => {

    try {

        const {
            email,
            newPassword
        } = req.body;


        if (!email || !newPassword) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and new password are required."

            });

        }


        const guardian =
            await Guardian.findOne({

                email:
                    email.toLowerCase().trim()

            });


        if (!guardian) {

            return res.status(404).json({

                success: false,

                message:
                    "Guardian account not found."

            });

        }


        const hashedPassword =
            await bcrypt.hash(

                newPassword,

                10

            );


        guardian.password =
            hashedPassword;


        await guardian.save();


        return res.status(200).json({

            success: true,

            message:
                "Password updated successfully."

        });

    }

    catch (error) {

        console.log(
            "Password Reset Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to reset password."

        });

    }

};


// Add new wearer
export const addWearer = async (req, res) => {

    try {

        const {
            email,
            wearerName,
            wearerType
        } = req.body;


        if (
            !email ||
            !wearerName ||
            !wearerType
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Wearer details are required."

            });

        }


        if (
            !["woman", "child"].includes(
                wearerType
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid wearer type."

            });

        }


        const guardian =
            await Guardian.findOne({

                email:
                    email.toLowerCase().trim()

            });


        if (!guardian) {

            return res.status(404).json({

                success: false,

                message:
                    "Guardian account not found."

            });

        }


        guardian.wearers.push({

            name:
                wearerName.trim(),

            type:
                wearerType

        });


        await guardian.save();


        return res.status(201).json({

            success: true,

            message:
                "New wearer added successfully.",

            wearers:
                guardian.wearers

        });

    }

    catch (error) {

        console.log(
            "Add Wearer Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to add wearer."

        });

    }

};