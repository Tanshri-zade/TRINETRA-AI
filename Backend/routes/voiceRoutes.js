import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import {
    analyzeVoice
} from "../controllers/voiceController.js";


const router =
    express.Router();


const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);


const uploadFolder =
    path.join(
        __dirname,
        "../uploads/voice"
    );


if (
    !fs.existsSync(
        uploadFolder
    )
) {

    fs.mkdirSync(
        uploadFolder,
        {
            recursive: true
        }
    );

}


const storage =
    multer.diskStorage({

        destination:
            function (
                req,
                file,
                cb
            ) {

                cb(
                    null,
                    uploadFolder
                );

            },

        filename:
            function (
                req,
                file,
                cb
            ) {

                const fileName =
                    `voice-${Date.now()}.wav`;


                cb(
                    null,
                    fileName
                );

            }

    });


const fileFilter =
    function (
        req,
        file,
        cb
    ) {

        const extension =
            path.extname(
                file.originalname
            ).toLowerCase();


        if (
            extension === ".wav"
        ) {

            cb(
                null,
                true
            );

        }

        else {

            cb(
                new Error(
                    "Only WAV audio files are allowed."
                ),
                false
            );

        }

    };


const upload =
    multer({

        storage:
            storage,

        fileFilter:
            fileFilter,

        limits: {

            fileSize:
                10 * 1024 * 1024

        }

    });


router.post(
    "/analyze",
    upload.single("audio"),
    analyzeVoice
);


export default router;