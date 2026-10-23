import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";


const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);


const voicePython = path.join(
    __dirname,
    "../../voice_model/.venv/Scripts/python.exe"
);


const voiceScript = path.join(
    __dirname,
    "../../voice_model/detect_voice.py"
);


export const analyzeVoice = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Audio file is required."
            });

        }


        const audioPath =
            req.file.path;


        execFile(
            voicePython,
            [
                voiceScript,
                audioPath
            ],
            {
                maxBuffer:
                    1024 * 1024 * 10
            },
            (error, stdout, stderr) => {

                if (error) {

                    console.log(
                        "Voice Analysis Error:",
                        error
                    );


                    if (
                        fs.existsSync(
                            audioPath
                        )
                    ) {

                        fs.unlinkSync(
                            audioPath
                        );

                    }


                    return res.status(500).json({

                        success: false,

                        message:
                            "Unable to analyze voice."

                    });

                }


                const output =
                    stdout.toString();


                let voiceEvent =
                    "Normal";

                let voiceKeyword =
                    "None";

                let voiceStatus =
                    "Normal";


                const eventMatch =
                    output.match(
                        /VOICE_EVENT=(.+)/i
                    );


                const keywordMatch =
                    output.match(
                        /VOICE_KEYWORD=(.+)/i
                    );


                const statusMatch =
                    output.match(
                        /VOICE_STATUS=(.+)/i
                    );


                if (eventMatch) {

                    voiceEvent =
                        eventMatch[1].trim();

                }


                if (keywordMatch) {

                    voiceKeyword =
                        keywordMatch[1].trim();

                }


                if (statusMatch) {

                    voiceStatus =
                        statusMatch[1].trim();

                }


                if (
                    fs.existsSync(
                        audioPath
                    )
                ) {

                    fs.unlinkSync(
                        audioPath
                    );

                }


                return res.status(200).json({

                    success: true,

                    message:
                        "Voice analyzed successfully.",

                    voiceAnalysis: {

                        event:
                            voiceEvent,

                        keyword:
                            voiceKeyword,

                        status:
                            voiceStatus

                    }

                });

            }
        );

    }

    catch (error) {

        console.log(
            "Voice Controller Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Voice analysis failed."

        });

    }

};