import {Block} from "blockly/core/block";
import {Order, pythonGenerator} from "blockly/python";
import {
    CONFIGURE_LOGGING,
    IMPORT_BOOL,
    IMPORT_STRING,
    IMPORT_COMPRESSED_IMAGE,
    IMPORT_DETECTION_2D_ARRAY,
    IMPORT_DISPLAY_IMAGE,
    IMPORT_DISPLAY_OVERLAY,
    IMPORT_INT32,
    IMPORT_INT32_MULTI_ARRAY,
    IMPORT_LOGGING,
    IMPORT_RCLPY,
    IMPORT_SYS,
    INIT_ROS,
} from "./util/definitions";

// Half-dimensions of `ros-vision`'s raw_frame topic. Used by face_detector_running
// below to translate bbox pixel coords (origin top-left of the frame) into the
// "centered, y-up" convention pib's user programs expect from these blocks
// (compatible with the pre-refactor face detector class output).
// If raw_frame becomes runtime-configurable, this should subscribe to
// /vision/camera_info and use msg.width/2, msg.height/2 instead.
const RAW_FRAME_HALF_WIDTH = "640.0";
const RAW_FRAME_HALF_HEIGHT = "360.0";

export function face_detector_start_stop(
    block: Block,
    generator: typeof pythonGenerator,
) {
    const dropDownSetting = block.getFieldValue("SETTING");

    Object.assign(generator.definitions_, {
        IMPORT_RCLPY,
        IMPORT_SYS,
        IMPORT_LOGGING,
        IMPORT_DETECTION_2D_ARRAY,
        CONFIGURE_LOGGING,
        INIT_ROS,
    });

    if (dropDownSetting === "START") {
        return [
            `_face_detector_latest = []`,
            ``,
            `def _face_detector_on_msg(msg):`,
            `${generator.INDENT}global _face_detector_latest`,
            `${generator.INDENT}_face_detector_latest = msg.detections`,
            ``,
            `_face_detector_subscription = node.create_subscription(`,
            `${generator.INDENT}Detection2DArray, '/vision/face_detections',`,
            `${generator.INDENT}_face_detector_on_msg, 10,`,
            `)`,
            `logging.info("Starting face detector (subscribed to /vision/face_detections)")`,
            ``,
        ].join("\n");
    } else {
        return [
            `node.destroy_subscription(_face_detector_subscription)`,
            `logging.info("Closing face detector")`,
            ``,
        ].join("\n");
    }
}

export function face_detector_running(
    block: Block,
    generator: typeof pythonGenerator,
) {
    const centerX = generator.getVariableName(
        block.getFieldValue("HORIZ_CENTER"),
    );
    const centerY = generator.getVariableName(
        block.getFieldValue("VERT_CENTER"),
    );

    Object.assign(generator.definitions_, {
        IMPORT_RCLPY,
        IMPORT_DETECTION_2D_ARRAY,
        INIT_ROS,
    });

    return [
        `rclpy.spin_once(node, timeout_sec=0.1)`,
        `if _face_detector_latest:`,
        `${generator.INDENT}_largest = max(_face_detector_latest, key=lambda d: d.bbox.size_x * d.bbox.size_y)`,
        `${generator.INDENT}${centerX} = _largest.bbox.center.position.x - ${RAW_FRAME_HALF_WIDTH}`,
        `${generator.INDENT}${centerY} = ${RAW_FRAME_HALF_HEIGHT} - _largest.bbox.center.position.y`,
        `else:`,
        `${generator.INDENT}${centerX} = 0.0`,
        `${generator.INDENT}${centerY} = 0.0`,
        ``,
    ].join("\n");
}

export function display_on_face(
    block: Block,
    generator: typeof pythonGenerator,
) {
    const source = block.getFieldValue("SOURCE");
    const setting = block.getFieldValue("SETTING");

    const needsFaceOverlay = source === "CAMERA_FACE_OVERLAY";

    Object.assign(generator.definitions_, {
        IMPORT_RCLPY,
        IMPORT_SYS,
        IMPORT_LOGGING,
        IMPORT_COMPRESSED_IMAGE,
        IMPORT_DISPLAY_IMAGE,
        CONFIGURE_LOGGING,
        INIT_ROS,
    });

    if (needsFaceOverlay) {
        Object.assign(generator.definitions_, {
            IMPORT_DETECTION_2D_ARRAY,
            IMPORT_DISPLAY_OVERLAY,
        });
    }

    if (setting === "START") {
        const lines = [
            `_display_face_latest_frame = None`,
            ``,
            `def _display_face_on_frame(msg):`,
            `${generator.INDENT}global _display_face_latest_frame`,
            `${generator.INDENT}_display_face_latest_frame = bytes(msg.data)`,
            ``,
            `_display_face_frame_sub = node.create_subscription(`,
            `${generator.INDENT}CompressedImage, '/vision/raw_frame',`,
            `${generator.INDENT}_display_face_on_frame, 10,`,
            `)`,
            ``,
            `_display_face_pub = node.create_publisher(DisplayImage, '/display_image', 10)`,
            ``,
        ];

        if (needsFaceOverlay) {
            lines.push(
                `_display_face_latest_detections = []`,
                ``,
                `def _display_face_on_detections(msg):`,
                `${generator.INDENT}global _display_face_latest_detections`,
                `${generator.INDENT}_display_face_latest_detections = msg.detections`,
                ``,
                `_display_face_detections_sub = node.create_subscription(`,
                `${generator.INDENT}Detection2DArray, '/vision/face_detections',`,
                `${generator.INDENT}_display_face_on_detections, 10,`,
                `)`,
                ``,
                `_display_overlay_pub = node.create_publisher(DisplayOverlay, '/display_overlay', 10)`,
                ``,
            );
        }

        lines.push(
            `def _display_face_publish():`,
            `${generator.INDENT}if _display_face_latest_frame is None:`,
            `${generator.INDENT}${generator.INDENT}return`,
            `${generator.INDENT}msg = DisplayImage()`,
            `${generator.INDENT}msg.id.value = ImageId.CUSTOM`,
            `${generator.INDENT}msg.format.value = ImageFormat.JPEG`,
            `${generator.INDENT}msg.data = _display_face_latest_frame`,
            `${generator.INDENT}_display_face_pub.publish(msg)`,
        );

        if (needsFaceOverlay) {
            lines.push(
                `${generator.INDENT}overlay = DisplayOverlay()`,
                `${generator.INDENT}for det in _display_face_latest_detections:`,
                `${generator.INDENT}${generator.INDENT}overlay.x.append(det.bbox.center.position.x / ${RAW_FRAME_HALF_WIDTH} / 2.0)`,
                `${generator.INDENT}${generator.INDENT}overlay.y.append(det.bbox.center.position.y / ${RAW_FRAME_HALF_HEIGHT} / 2.0)`,
                `${generator.INDENT}${generator.INDENT}overlay.width.append(det.bbox.size_x / ${RAW_FRAME_HALF_WIDTH} / 2.0)`,
                `${generator.INDENT}${generator.INDENT}overlay.height.append(det.bbox.size_y / ${RAW_FRAME_HALF_HEIGHT} / 2.0)`,
                `${generator.INDENT}${generator.INDENT}overlay.labels.append("")`,
                `${generator.INDENT}_display_overlay_pub.publish(overlay)`,
            );
        }

        lines.push(
            ``,
            `_display_face_timer = node.create_timer(0.1, _display_face_publish)`,
            `logging.info("Display on pib's face: started")`,
            ``,
        );

        return lines.join("\n");
    } else {
        const lines = [
            `_display_face_timer.cancel()`,
            `node.destroy_subscription(_display_face_frame_sub)`,
        ];

        if (needsFaceOverlay) {
            lines.push(
                `node.destroy_subscription(_display_face_detections_sub)`,
                `_empty_overlay = DisplayOverlay()`,
                `_display_overlay_pub.publish(_empty_overlay)`,
            );
        }

        lines.push(
            `_revert_msg = DisplayImage()`,
            `_revert_msg.id.value = ImageId.PIB_EYES_ANIMATED`,
            `_display_face_pub.publish(_revert_msg)`,
            `rclpy.spin_once(node, timeout_sec=0.5)`,
            `logging.info("Display on pib's face: stopped, reverting to pib eyes")`,
            ``,
        );

        return lines.join("\n");
    }
}

export function depth_detector_start_stop(
    block: Block,
    generator: typeof pythonGenerator,
) {
    const dropDownSetting = block.getFieldValue("SETTING");

    Object.assign(generator.definitions_, {
        IMPORT_RCLPY,
        IMPORT_SYS,
        IMPORT_LOGGING,
        IMPORT_INT32,
        IMPORT_INT32_MULTI_ARRAY,
        CONFIGURE_LOGGING,
        INIT_ROS,
    });

    if (dropDownSetting === "START") {
        return [
            `_depth_detector_latest = 0`,
            ``,
            `def _depth_detector_on_result(msg):`,
            `${generator.INDENT}global _depth_detector_latest`,
            `${generator.INDENT}_depth_detector_latest = msg.data`,
            ``,
            `_depth_result_subscription = node.create_subscription(`,
            `${generator.INDENT}Int32, '/vision/depth_result',`,
            `${generator.INDENT}_depth_detector_on_result, 10,`,
            `)`,
            `_depth_query_publisher = node.create_publisher(`,
            `${generator.INDENT}Int32MultiArray, '/vision/depth_query', 10,`,
            `)`,
            `logging.info("Starting depth detector")`,
            ``,
        ].join("\n");
    } else {
        return [
            `node.destroy_subscription(_depth_result_subscription)`,
            `node.destroy_publisher(_depth_query_publisher)`,
            `logging.info("Closing depth detector")`,
            ``,
        ].join("\n");
    }
}

export function depth_detector_get_distance(
    block: Block,
    generator: typeof pythonGenerator,
) {
    const distanceVar = generator.getVariableName(
        block.getFieldValue("DISTANCE"),
    );
    const x = generator.valueToCode(block, "X", 0) || "0";
    const y = generator.valueToCode(block, "Y", 0) || "0";

    Object.assign(generator.definitions_, {
        IMPORT_RCLPY,
        IMPORT_INT32_MULTI_ARRAY,
        INIT_ROS,
    });

    return [
        `_depth_query_msg = Int32MultiArray()`,
        `_depth_query_msg.data = [int(${x} + ${RAW_FRAME_HALF_WIDTH}), int(${RAW_FRAME_HALF_HEIGHT} - ${y})]`,
        `_depth_query_publisher.publish(_depth_query_msg)`,
        `${distanceVar} = _depth_detector_latest`,
        ``,
    ].join("\n");
}

export function sound_detector_start_stop(
    block: Block,
    generator: typeof pythonGenerator,
) {
    const dropDownSetting = block.getFieldValue("SETTING");

    Object.assign(generator.definitions_, {
        IMPORT_RCLPY,
        IMPORT_SYS,
        IMPORT_LOGGING,
        IMPORT_INT32,
        IMPORT_BOOL,
        CONFIGURE_LOGGING,
        INIT_ROS,
    });

    if (dropDownSetting === "START") {
        return [
            `_sound_doa_latest = 0`,
            `_sound_vad_latest = False`,
            ``,
            `def _sound_doa_on_msg(msg):`,
            `${generator.INDENT}global _sound_doa_latest`,
            `${generator.INDENT}_sound_doa_latest = msg.data`,
            ``,
            `def _sound_vad_on_msg(msg):`,
            `${generator.INDENT}global _sound_vad_latest`,
            `${generator.INDENT}_sound_vad_latest = msg.data`,
            ``,
            `_sound_doa_subscription = node.create_subscription(`,
            `${generator.INDENT}Int32, '/hearing/doa',`,
            `${generator.INDENT}_sound_doa_on_msg, 10,`,
            `)`,
            `_sound_vad_subscription = node.create_subscription(`,
            `${generator.INDENT}Bool, '/hearing/voice_activity',`,
            `${generator.INDENT}_sound_vad_on_msg, 10,`,
            `)`,
            `logging.info("Starting sound detector")`,
            ``,
        ].join("\n");
    } else {
        return [
            `node.destroy_subscription(_sound_doa_subscription)`,
            `node.destroy_subscription(_sound_vad_subscription)`,
            `logging.info("Closing sound detector")`,
            ``,
        ].join("\n");
    }
}

export function sound_detector_get_direction(
    block: Block,
    generator: typeof pythonGenerator,
) {
    const directionVar = generator.getVariableName(
        block.getFieldValue("DIRECTION"),
    );

    Object.assign(generator.definitions_, {
        IMPORT_RCLPY,
        INIT_ROS,
    });

    return [
        `${directionVar} = _sound_doa_latest`,
        ``,
    ].join("\n");
}

export function sound_detector_get_voice_activity(
    block: Block,
    generator: typeof pythonGenerator,
) {
    const voiceActiveVar = generator.getVariableName(
        block.getFieldValue("VOICE_ACTIVE"),
    );

    Object.assign(generator.definitions_, {
        IMPORT_RCLPY,
        INIT_ROS,
    });

    return [
        `${voiceActiveVar} = _sound_vad_latest`,
        ``,
    ].join("\n");
}

export function speech_recognition_start_stop(
    block: Block,
    generator: typeof pythonGenerator,
) {
    const dropDownSetting = block.getFieldValue("SETTING");

    Object.assign(generator.definitions_, {
        IMPORT_RCLPY,
        IMPORT_SYS,
        IMPORT_LOGGING,
        IMPORT_STRING,
        CONFIGURE_LOGGING,
        INIT_ROS,
    });

    if (dropDownSetting === "START") {
        return [
            `_stt_latest = ""`,
            ``,
            `def _stt_on_msg(msg):`,
            `${generator.INDENT}global _stt_latest`,
            `${generator.INDENT}_stt_latest = msg.data`,
            ``,
            `_stt_subscription = node.create_subscription(`,
            `${generator.INDENT}String, '/hearing/speech',`,
            `${generator.INDENT}_stt_on_msg, 10,`,
            `)`,
            `logging.info("Starting speech recognition")`,
            ``,
        ].join("\n");
    } else {
        return [
            `node.destroy_subscription(_stt_subscription)`,
            `logging.info("Closing speech recognition")`,
            ``,
        ].join("\n");
    }
}

export function speech_recognition_get_text(
    block: Block,
    generator: typeof pythonGenerator,
) {
    const speechTextVar = generator.getVariableName(
        block.getFieldValue("SPEECH_TEXT"),
    );

    Object.assign(generator.definitions_, {
        IMPORT_RCLPY,
        INIT_ROS,
    });

    return [
        `${speechTextVar} = _stt_latest`,
        `_stt_latest = ""`,
        ``,
    ].join("\n");
}

export function say_text(
    block: Block,
    generator: typeof pythonGenerator,
) {
    const textInput = generator.valueToCode(block, "TEXT_INPUT", Order.ATOMIC);

    Object.assign(generator.definitions_, {
        IMPORT_RCLPY,
        IMPORT_SYS,
        IMPORT_LOGGING,
        IMPORT_STRING,
        CONFIGURE_LOGGING,
        INIT_ROS,
        INIT_TTS_PUBLISHER: `_tts_publisher = node.create_publisher(String, '/speech/say', 10)`,
    });

    return [
        `_tts_msg = String()`,
        `_tts_msg.data = str(${textInput})`,
        `_tts_publisher.publish(_tts_msg)`,
        `logging.info(f"Say: {${textInput}}")`,
        ``,
    ].join("\n");
}

export function set_emotion(
    block: Block,
    generator: typeof pythonGenerator,
) {
    const emotion = block.getFieldValue("EMOTION");

    Object.assign(generator.definitions_, {
        IMPORT_RCLPY,
        IMPORT_SYS,
        IMPORT_LOGGING,
        IMPORT_STRING,
        CONFIGURE_LOGGING,
        INIT_ROS,
        INIT_EMOTION_PUBLISHER: `_emotion_publisher = node.create_publisher(String, '/display_emotion', 10)`,
    });

    return [
        `_emotion_msg = String()`,
        `_emotion_msg.data = "${emotion}"`,
        `_emotion_publisher.publish(_emotion_msg)`,
        `logging.info(f"Set emotion: ${emotion}")`,
        ``,
    ].join("\n");
}

export {pythonGenerator};
