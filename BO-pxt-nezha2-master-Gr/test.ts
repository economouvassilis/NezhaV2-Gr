// When the logo button is pressed, perform the following actions
input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    // Stop NezhaV2 motor M1
    nezhaV2.stop(nezhaV2.MotorPostion.M1)
    // Reset the position of NezhaV2 motor M1
    nezhaV2.reset(nezhaV2.MotorPostion.M1)
})

// When button A is pressed, perform the following actions
input.onButtonPressed(Button.A, function () {
    // Set the speed of NezhaV2 motor M1 to 0 degrees/second, in clockwise direction, using degrees as the unit
    nezhaV2.move(nezhaV2.MotorPostion.M1, 60, nezhaV2.MovementDirection.CW, 0, nezhaV2.SportsMode.Degree)
    // Move NezhaV2 motor M1 to the absolute position 0, in clockwise direction
    nezhaV2.moveToAbsAngle(nezhaV2.MotorPostion.M1, nezhaV2.ServoMotionMode.CW, 0)
    // Set the speed control output of NezhaV2 motor M1 to 66 (assuming this is a valid value for speed control)
    nezhaV2.start(nezhaV2.MotorPostion.M1, 66)
    // Display the current absolute position of NezhaV2 motor M1
    basic.showNumber(nezhaV2.readAbsAngle(nezhaV2.MotorPostion.M1))
    // Display the current absolute speed of NezhaV2 motor M1
    // Note: The closing parenthesis for the previous line was missing, added it here
    basic.showNumber(nezhaV2.readSpeed(nezhaV2.MotorPostion.M1))
})