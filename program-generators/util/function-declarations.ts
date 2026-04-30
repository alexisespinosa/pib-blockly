import {CodeGenerator} from "blockly";

// play-audio-from-speech

export const PLAY_AUDIO_FROM_SPEECH_FUNCTION = (generator: CodeGenerator) => `
def ${generator.FUNCTION_NAME_PLACEHOLDER_}(speech: str, voice: str) -> None:

    logging.info(f"received request to say '{speech}' as '{voice}'.")

    request = PlayAudioFromSpeech.Request()
    request.speech = speech
    request.join = True

    if voice == 'Hannah':
        request.gender = "Female"
        request.language = "German"
    elif voice == 'Daniel':
        request.gender = "Male"
        request.language = "German"
    elif voice == 'Emma':
        request.gender = "Female"
        request.language = "English"
    elif voice == 'Brian':
        request.gender = "Male"
        request.language = "English"
    else:
        logging.error(f"unrecognized voice: '{voice}', aborting...")
        return

    future = play_audio_from_speech_client.call_async(request)

    logging.info(f"now speaking...")
    rclpy.spin_until_future_complete(node, future)
    logging.info("finished speaking.")
`;

// motor

export const GET_JOINT_POSITION_FUNCTION = (generator: CodeGenerator) => `
def ${generator.FUNCTION_NAME_PLACEHOLDER_}(motor_name: str) -> int:

    request = GetJointPosition.Request()
    request.joint_name = motor_name

    future = get_joint_position_client.call_async(request)
    rclpy.spin_until_future_complete(node, future)

    response: GetJointPosition.Response = future.result()
    if response.successful:
        return response.position
    else:
        logging.error(f"getting position of '{motor_name}' failed.")
        return 0
`;

export const APPLY_JOINT_TRAJECTORY_FUNCTION = (generator: CodeGenerator) => `
def ${generator.FUNCTION_NAME_PLACEHOLDER_}(motor_name: str, position: int) -> None:

    logging.info(f"setting position of '{motor_name}' to {position}.")

    request = ApplyJointTrajectory.Request()
    point = JointTrajectoryPoint()
    point.positions.append(position)
    jt = JointTrajectory()
    jt.joint_names = [motor_name]
    jt.points = [point]
    request.joint_trajectory = jt

    future = apply_joint_trajectory_client.call_async(request)
    rclpy.spin_until_future_complete(node, future)

    response: ApplyJointTrajectory.Response = future.result()
    if response.successful:
        logging.info(f"position of '{motor_name}' was successfully set.")
    else:
        logging.error(f"setting position of '{motor_name}' failed.")
`;

// pose

export const APPLY_POSE_FUNCTION = (generator: CodeGenerator) => `
def ${generator.FUNCTION_NAME_PLACEHOLDER_}(poseId: str) -> None:

    logging.info(f"Pose ID: {poseId}")
    logging.info(f"moving to pose..")

    successful, motor_positions = pose_client.get_motor_positions_of_pose(
            poseId
        )
    if not successful:
        logging.error(f"getting motor-positions of pose failed.")
        return

    jt = JointTrajectory()
    jt.joint_names = []

    for motor_position in motor_positions["motorPositions"]:
        motor_name = motor_position["motorName"]
        position = motor_position["position"]

        jt.joint_names.append(motor_name)
        point = JointTrajectoryPoint()
        point.positions.append(position)
        jt.points.append(point)

    request = ApplyJointTrajectory.Request()
    request.joint_trajectory = jt

    future = apply_joint_trajectory_client.call_async(request)
    rclpy.spin_until_future_complete(node, future)

    response: ApplyJointTrajectory.Response = future.result()
    if response.successful:
        logging.info(f"pose was successfully applied.")
    else:
        logging.error(f"applying pose failed.")
`;

// set-solid-state-relay

export const SET_SOLID_STATE_RELAY_FUNCTION = (generator: CodeGenerator) => `

def ${generator.FUNCTION_NAME_PLACEHOLDER_}(status: str) -> None:

    state = status == 'ON'

    logging.info(f"received request to turn solid state relay to '{status}'.")
    request = SetSolidStateRelay.Request()
    request.solid_state_relay_state = SolidStateRelayState(turned_on=state)

    future = set_solid_state_relay_state_client.call_async(request)
    rclpy.spin_until_future_complete(node, future)

    response: SetSolidStateRelay.Response = future.result()
    if response.successful:
        logging.info(f"solid state relay was successfully set to '{status}'.")
    else:
        logging.error(f"setting solid state relay failed.")
`;

