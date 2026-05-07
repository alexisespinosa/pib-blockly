import {Block} from "blockly/core/block";
import {pythonGenerator} from "blockly/python";
import {
    CONFIGURE_LOGGING,
    IMPORT_COMPRESSED_IMAGE,
    IMPORT_DETECTION_2D_ARRAY,
    IMPORT_DISPLAY_IMAGE,
    IMPORT_DISPLAY_OVERLAY,
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

export {pythonGenerator};
