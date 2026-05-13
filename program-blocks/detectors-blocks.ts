import * as Blockly from "blockly";

export const display_on_face_blocks =
    Blockly.common.createBlockDefinitionsFromJsonArray([
        {
            type: "display_on_face",
            message0: "Display on pib's face:  %1  %2",
            args0: [
                {
                    type: "field_dropdown",
                    name: "SOURCE",
                    options: [
                        ["Camera", "CAMERA"],
                        ["Camera with face overlay", "CAMERA_FACE_OVERLAY"],
                    ],
                },
                {
                    type: "field_dropdown",
                    name: "SETTING",
                    options: [
                        ["start", "START"],
                        ["stop", "STOP"],
                    ],
                },
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 200,
            tooltip:
                "Shows the camera feed (optionally with face detection overlay) on pib's face screen",
            helpUrl: "",
        },
    ]);

export const depth_detector_blocks =
    Blockly.common.createBlockDefinitionsFromJsonArray([
        {
            type: "depth_detector_start_stop",
            message0: "Depth Detector:  %1",
            args0: [
                {
                    type: "field_dropdown",
                    name: "SETTING",
                    options: [
                        ["start", "START"],
                        ["stop", "END"],
                    ],
                },
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 200,
            tooltip:
                "Starts or stops the depth detector (subscribes to /vision/depth)",
            helpUrl: "",
        },

        {
            type: "depth_detector_get_distance",
            message0: "Get distance at  x: %1  y: %2  into %3",
            args0: [
                {
                    type: "input_value",
                    name: "X",
                    check: "Number",
                },
                {
                    type: "input_value",
                    name: "Y",
                    check: "Number",
                },
                {
                    type: "field_variable",
                    name: "DISTANCE",
                    variable: "distance_mm",
                    variableTypes: ["Number"],
                    defaultType: "Number",
                },
            ],
            inputsInline: true,
            previousStatement: null,
            nextStatement: null,
            colour: 200,
            tooltip:
                "Reads the depth (in millimeters) at the given pixel coordinates from the latest depth frame",
            helpUrl: "",
        },
    ]);

export const sound_detector_blocks =
    Blockly.common.createBlockDefinitionsFromJsonArray([
        {
            type: "sound_detector_start_stop",
            message0: "Sound Detector:  %1",
            args0: [
                {
                    type: "field_dropdown",
                    name: "SETTING",
                    options: [
                        ["start", "START"],
                        ["stop", "END"],
                    ],
                },
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 160,
            tooltip:
                "Starts or stops the sound detector (subscribes to /hearing/doa and /hearing/voice_activity)",
            helpUrl: "",
        },

        {
            type: "sound_detector_get_direction",
            message0: "Get sound direction into %1",
            args0: [
                {
                    type: "field_variable",
                    name: "DIRECTION",
                    variable: "sound_direction",
                },
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 160,
            tooltip:
                "Reads the latest direction of arrival angle (0-359 degrees) from the microphone array",
            helpUrl: "",
        },

        {
            type: "sound_detector_get_voice_activity",
            message0: "Get voice activity into %1",
            args0: [
                {
                    type: "field_variable",
                    name: "VOICE_ACTIVE",
                    variable: "voice_active",
                },
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 160,
            tooltip:
                "Reads whether voice is currently detected (true/false) from the microphone array",
            helpUrl: "",
        },
    ]);

export const speech_recognition_blocks =
    Blockly.common.createBlockDefinitionsFromJsonArray([
        {
            type: "speech_recognition_start_stop",
            message0: "Speech Recognition:  %1",
            args0: [
                {
                    type: "field_dropdown",
                    name: "SETTING",
                    options: [
                        ["start", "START"],
                        ["stop", "END"],
                    ],
                },
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 160,
            tooltip:
                "Starts or stops speech recognition (subscribes to /hearing/speech)",
            helpUrl: "",
        },

        {
            type: "speech_recognition_get_text",
            message0: "Get recognized speech into %1",
            args0: [
                {
                    type: "field_variable",
                    name: "SPEECH_TEXT",
                    variable: "speech_text",
                },
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 160,
            tooltip:
                "Reads the latest recognized speech text from the microphone",
            helpUrl: "",
        },
    ]);

export const face_detector_blocks =
    Blockly.common.createBlockDefinitionsFromJsonArray([
        {
            type: "face_detector_start_stop",
            message0: "Face Detector:  %1",
            args0: [
                {
                    type: "field_dropdown",
                    name: "SETTING",
                    options: [
                        ["start", "START"],
                        ["stop", "END"],
                    ],
                },
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 200,
            tooltip:
                "Starts or stops the face detector, must be placed before and after 'face detector running'",
            helpUrl: "",
        },

        {
            type: "face_detector_running",
            message0:
                "Run the face detector and get the face coordiantes %1 Horiz-Center: %2  Vert-Center: %3",
            args0: [
                {
                    type: "input_dummy",
                },
                {
                    type: "field_variable",
                    name: "HORIZ_CENTER",
                    variable: "horiz_center",
                    variableTypes: ["Number"],
                    defaultType: "Number",
                },
                {
                    type: "field_variable",
                    name: "VERT_CENTER",
                    variable: "vert_center",
                    variableTypes: ["Number"],
                    defaultType: "Number",
                },
            ],
            previousStatement: null,
            nextStatement: null,
            colour: 200,
            tooltip:
                "Runs the face detector and stores the position of the bounding boxes in the variables",
            helpUrl: "",
        },
    ]);
