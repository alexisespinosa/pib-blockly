import {Block} from "blockly/core/block";
import {pythonGenerator} from "blockly/python";
import {
    CONFIGURE_LOGGING,
    IMPORT_DETECTION_2D_ARRAY,
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

export {pythonGenerator};
