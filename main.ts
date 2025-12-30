
//% color=#ff0011  icon="\uf06d" block="NezhaV2" blockId="NezhaV2"
namespace nezhaV2 {

    export enum MovementDirection {
        //%block="δεξιόστροφα"
        CW = 1,
        //%block="αριστερόστροφα"
        CCW = 2
    }
    export enum ServoMotionMode {
        //%block="δεξιόστροφα"
        CW = 2,
        //%block="αριστερόστροφα"
        CCW = 3,
        //%block="συντομότερη διαδρομή"
        ShortPath = 1
    }

    export enum DelayMode {
        //%block="αυτόματη καθυστέριση"
        AutoDelayStatus = 1,
        //%block="χωρίς καθυστέριση"
        NoDelay = 0
    }
    export enum SportsMode {
        //%block="μοίρες"
        Degree = 2,
        //%block="στροφές"
        Circle = 1,
        //%block="δευτερόλεπτα"
        Second = 3
    }


    export enum VerticallDirection {
        //%block="μπροστά"
        Up = 1,
        //%block="πίσω"
        Down = 2
    }

    export enum Uint {
        //%block="cm"
        cm = 1,
        //%block="inch"
        inch = 2
    }

    export enum DistanceAndAngleUnit {
        //%block="μοίρες"
        Degree = 2,
        //%block="στροφές"
        Circle = 1,
        //%block="δευτερόλεπτα"
        Second = 3,
        //%block="cm"
        cm = 4,
        //%block="inch"
        inch = 5
    }

    export enum MotorPostion {
        //%block="M1"
        M1 = 1,
        //%block="M2"
        M2 = 2,
        //%block="M3"
        M3 = 3,
        //%block="M4"
        M4 = 4
    }

    let i2cAddr: number = 0x10;
    let servoSpeedGlobal = 900
    // 相对角度值(用于相对角度值归零函数)
    let relativeAngularArr = [0, 0, 0, 0];
    // 组合积木块变量
    let motorLeftGlobal = 0
    let motorRightGlobal = 0
    let degreeToDistance = 0

    export function delayMs(ms: number): void {
        let time = input.runningTime() + ms
        while (time >= input.runningTime()) {

        }
    }

    export function motorDelay(value: number, motorFunction: SportsMode) {
        let delayTime = 0;
        if (value == 0 || servoSpeedGlobal == 0) {
            return;
        } else if (motorFunction == SportsMode.Circle) {
            delayTime = value * 360000.0 / servoSpeedGlobal + 500;
        } else if (motorFunction == SportsMode.Second) {
            delayTime = (value * 1000);
        } else if (motorFunction == SportsMode.Degree) {
            delayTime = value * 1000.0 / servoSpeedGlobal + 500;
        }
        basic.pause(delayTime);

    }

    //% group="Basic functions"
    //% block="Όρισε %motor στο %speed\\%to  %direction %value %mode || %isDelay"
    //% inlineInputMode=inline
    //% speed.min=0  speed.max=100
    //% weight=407 
    export function move(motor: MotorPostion, speed: number, direction: MovementDirection, value: number, mode: SportsMode, isDelay: DelayMode = DelayMode.AutoDelayStatus): void {
        if (speed <= 0 || value <= 0) {
            // 速度和运行值不能小于等于0
            return;
        }
        setServoSpeed(speed);
        __move(motor, direction, value, mode);
        if (isDelay) {
            motorDelay(value, mode);
        }
    }

    export function __move(motor: MotorPostion, direction: MovementDirection, value: number, mode: SportsMode): void {

        let buf = pins.createBuffer(8);
        buf[0] = 0xFF;
        buf[1] = 0xF9;
        buf[2] = motor;
        buf[3] = direction;
        buf[4] = 0x70;
        buf[5] = (value >> 8) & 0XFF;
        buf[6] = mode;
        buf[7] = (value >> 0) & 0XFF;
        pins.i2cWriteBuffer(i2cAddr, buf);

    }

    //% group="Basic functions"
    //% weight=406
    //% block="Όρισε %motor σε %turnMode σε γωνία %angle || %isDelay  "
    //% angle.min=0  angle.max=359
    //% inlineInputMode=inline
    export function moveToAbsAngle(motor: MotorPostion, turnMode: ServoMotionMode, angle: number, isDelay: DelayMode = DelayMode.AutoDelayStatus): void {
        while (angle < 0) {
            angle += 360
        }
        angle %= 360
        let buf = pins.createBuffer(8)
        buf[0] = 0xFF;
        buf[1] = 0xF9;
        buf[2] = motor;
        buf[3] = 0x00;
        buf[4] = 0x5D;
        buf[5] = (angle >> 8) & 0XFF;
        buf[6] = turnMode;
        buf[7] = (angle >> 0) & 0XFF;
        pins.i2cWriteBuffer(i2cAddr, buf);
        delayMs(4);// 等待不能删除，且禁止有其他任务插入，否则有BUG
        if (isDelay) {
            motorDelay(0.5, SportsMode.Second)
        }
    }

    //% group="Basic functions"
    //% weight=404
    //% block="Σταμάτησε %motor"
    export function stop(motor: MotorPostion): void {
        let buf = pins.createBuffer(8)
        buf[0] = 0xFF;
        buf[1] = 0xF9;
        buf[2] = motor;
        buf[3] = 0x00;
        buf[4] = 0x5F;
        buf[5] = 0x00;
        buf[6] = 0xF5;
        buf[7] = 0x00;
        pins.i2cWriteBuffer(i2cAddr, buf);
    }

    export function __start(motor: MotorPostion, direction: MovementDirection, speed: number): void {
        let buf = pins.createBuffer(8)
        buf[0] = 0xFF;
        buf[1] = 0xF9;
        buf[2] = motor;
        buf[3] = direction;
        buf[4] = 0x60;
        buf[5] = Math.floor(speed);
        buf[6] = 0xF5;
        buf[7] = 0x00;
        pins.i2cWriteBuffer(i2cAddr, buf);
    }

    //% group="Basic functions"
    //% weight=403
    //% block="Όρισε την ταχύτητα του %motor σε %speed \\% και ξεκίνα"
    //% speed.min=-100  speed.max=100
    export function start(motor: MotorPostion, speed: number): void {
        if (speed < -100) {
            speed = -100
        } else if (speed > 100) {
            speed = 100
        }
        let direction = speed > 0 ? MovementDirection.CW : MovementDirection.CCW
        __start(motor, direction, Math.abs(speed))
    }

    export function readAngle(motor: MotorPostion): number {
        delayMs(4)
        let buf = pins.createBuffer(8);
        buf[0] = 0xFF;
        buf[1] = 0xF9;
        buf[2] = motor;
        buf[3] = 0x00;
        buf[4] = 0x46;
        buf[5] = 0x00;
        buf[6] = 0xF5;
        buf[7] = 0x00;
        pins.i2cWriteBuffer(i2cAddr, buf);
        delayMs(4)
        let arr = pins.i2cReadBuffer(i2cAddr, 4);
        return (arr[3] << 24) | (arr[2] << 16) | (arr[1] << 8) | (arr[0]);
    }

    //% group="Basic functions"
    //% weight=402
    //%block="%motor απόλυτη τιμή γωνίας"
    export function readAbsAngle(motor: MotorPostion): number {
        let position = readAngle(motor)
        while (position < 0) {
            position += 3600;
        }
        return (position % 3600) * 0.1;
    }

    //% group="Basic functions"
    //% weight=402
    //%block="%motor σχετική τιμή γωνίας"
    export function readRelAngle(motor: MotorPostion): number {
        return (readAngle(motor) - relativeAngularArr[motor - 1]) * 0.1;
    }

    //% group="Basic functions"
    //% weight=400
    //%block="%motor ταχύτητα (laps/sec)"
    export function readSpeed(motor: MotorPostion): number {
        delayMs(4)
        let buf = pins.createBuffer(8)
        buf[0] = 0xFF;
        buf[1] = 0xF9;
        buf[2] = motor;
        buf[3] = 0x00;
        buf[4] = 0x47;
        buf[5] = 0x00;
        buf[6] = 0xF5;
        buf[7] = 0x00;
        pins.i2cWriteBuffer(i2cAddr, buf);
        delayMs(4)
        let arr = pins.i2cReadBuffer(i2cAddr, 2);
        let retData = (arr[1] << 8) | (arr[0]);
        return Math.floor(retData / 3.6) * 0.01;
    }

    //% group="Basic functions"
    //% weight=399
    //%block="Όρισε servo %motor σε μηδέν"
    export function reset(motor: MotorPostion): void {
        let buf = pins.createBuffer(8)
        buf[0] = 0xFF;
        buf[1] = 0xF9;
        buf[2] = motor;
        buf[3] = 0x00;
        buf[4] = 0x1D;
        buf[5] = 0x00;
        buf[6] = 0xF5;
        buf[7] = 0x00;
        pins.i2cWriteBuffer(i2cAddr, buf);
        relativeAngularArr[motor - 1] = 0;
        motorDelay(1, SportsMode.Second)
    }

    //% group="Basic functions"
    //% weight=399
    //%block="Όρισε servo %motor γωνία σε με το μηδέν"
    export function resetRelAngleValue(motor: MotorPostion) {
        relativeAngularArr[motor - 1] = readAngle(motor);
    }

    export function setServoSpeed(speed: number): void {
        if (speed < 0) speed = 0;
        speed *= 9;
        servoSpeedGlobal = speed;
        let buf = pins.createBuffer(8)
        buf[0] = 0xFF;
        buf[1] = 0xF9;
        buf[2] = 0x00;
        buf[3] = 0x00;
        buf[4] = 0x77;
        buf[5] = (speed >> 8) & 0XFF;
        buf[6] = 0x00;
        buf[7] = (speed >> 0) & 0XFF;
        pins.i2cWriteBuffer(i2cAddr, buf);

    }

    //% group="Application functions"
    //% weight=410
    //%block="Όρισε ως αριστερό τροχό %motor_l και ως δεξί %motor_r"
    export function setComboMotor(motor_l: MotorPostion, motor_r: MotorPostion): void {
        motorLeftGlobal = motor_l;
        motorRightGlobal = motor_r;
    }

    //% group="Application functions"
    //% weight=409
    //%block="Όρισε %speed\\% ταχύτητα και κατεύθυνση %direction"
    //% speed.min=0  speed.max=100
    export function comboRun(speed: number, direction: VerticallDirection): void {
        if (speed < 0) {
            speed = 0;
        } else if (speed > 100) {
            speed = 100;
        }
        __start(motorLeftGlobal, direction % 2 + 1, speed);
        __start(motorRightGlobal, (direction + 1) % 2 + 1, speed);
    }


    //% group="Application functions"
    //% weight=406
    //%block="Σταμάτησε την κίνηση"
    export function comboStop(): void {
        stop(motorLeftGlobal)
        stop(motorRightGlobal)
    }

    /**
    * The distance length of the motor movement per circle
    */
    //% group="Application functions"
    //% weight=404
    //%block="Όρισε την περιφέρεια του τροχού σε %value %unit"
    export function setWheelPerimeter(value: number, unit: Uint): void {
        if (value < 0) {
            value = 0;
        }
        if (unit == Uint.inch) {
            degreeToDistance = value * 2.54
        } else {
            degreeToDistance = value
        }
    }

    //% group="Application functions"
    //% weight=403
    //%block="Συνδυασμός κινητήρα με ταχύτητα %speed \\%, κατεύθυνση %direction γωνία %value %uint "
    //% speed.min=0  speed.max=100
    //% inlineInputMode=inline
    export function comboMove(speed: number, direction: VerticallDirection, value: number, uint: DistanceAndAngleUnit): void {
        if (speed <= 0) {
            return;
        }
        setServoSpeed(speed)
        let mode;
        switch (uint) {
            case DistanceAndAngleUnit.Circle:
                mode = SportsMode.Circle;
                break;
            case DistanceAndAngleUnit.Degree:
                mode = SportsMode.Degree;
                break;
            case DistanceAndAngleUnit.Second:
                mode = SportsMode.Second;
                break;
            case DistanceAndAngleUnit.cm:
                value = 360 * value / degreeToDistance
                mode = SportsMode.Degree;
                break;
            case DistanceAndAngleUnit.inch:
                value = 360 * value * 2.54 / degreeToDistance
                mode = SportsMode.Degree;
                break;
        }
        if (direction == VerticallDirection.Up) {
            __move(motorLeftGlobal, MovementDirection.CCW, value, mode)
            __move(motorRightGlobal, MovementDirection.CW, value, mode)
        }
        else {
            __move(motorLeftGlobal, MovementDirection.CW, value, mode)
            __move(motorRightGlobal, MovementDirection.CCW, value, mode)
        }
        motorDelay(value, mode);
    }

    //% group="Application functions"
    //% weight=402
    //%block="Όρίστε την ταχύτητα του αριστερού τροχού σε %speed_l \\%, του δεξιού τροχού σε %speed_r \\% και ξεκίνα"
    //% speed_l.min=-100  speed_l.max=100 speed_r.min=-100  speed_r.max=100
    export function comboStart(speed_l: number, speed_r: number): void {
        start(motorLeftGlobal, -speed_l);
        start(motorRightGlobal, speed_r);
    }

    //% group="export functions"
    //% weight=320
    //%block="αριθμός έκδοσης"
    export function readVersion(): string {
        let buf = pins.createBuffer(8);
        buf[0] = 0xFF;
        buf[1] = 0xF9;
        buf[2] = 0x00;
        buf[3] = 0x00;
        buf[4] = 0x88;
        buf[5] = 0x00;
        buf[6] = 0x00;
        buf[7] = 0x00;
        pins.i2cWriteBuffer(i2cAddr, buf);
        let version = pins.i2cReadBuffer(i2cAddr, 3);
        return `V ${version[0]}.${version[1]}.${version[2]}`;
    }
}














/**
* Functions to PlanetX sensor by ELECFREAKS Co.,Ltd.
*/
//% color=#00B1ED  icon="\uf005" block="PlanetX_Base" blockId="PlanetX_Base"
//% groups='["Digital", "Analog", "IIC Port"]'
namespace PlanetX_Basic {
    /////////////////////////// BME280 
    let BME280_I2C_ADDR = 0x76
    let dig_T1 = getUInt16LE(0x88)
    let dig_T2 = getInt16LE(0x8A)
    let dig_T3 = getInt16LE(0x8C)
    let dig_P1 = getUInt16LE(0x8E)
    let dig_P2 = getInt16LE(0x90)
    let dig_P3 = getInt16LE(0x92)
    let dig_P4 = getInt16LE(0x94)
    let dig_P5 = getInt16LE(0x96)
    let dig_P6 = getInt16LE(0x98)
    let dig_P7 = getInt16LE(0x9A)
    let dig_P8 = getInt16LE(0x9C)
    let dig_P9 = getInt16LE(0x9E)
    let dig_H1 = getreg(0xA1)
    let dig_H2 = getInt16LE(0xE1)
    let dig_H3 = getreg(0xE3)
    let a = getreg(0xE5)
    let dig_H4 = (getreg(0xE4) << 4) + (a % 16)
    let dig_H5 = (getreg(0xE6) << 4) + (a >> 4)
    let dig_H6 = getInt8LE(0xE7)
    let T = 0
    let P = 0
    let H = 0
    setreg(0xF2, 0x04)
    setreg(0xF4, 0x2F)
    setreg(0xF5, 0x0C)
    setreg(0xF4, 0x2F)
    function setreg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(BME280_I2C_ADDR, buf);
    }
    function getreg(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.UInt8BE);
    }
    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.Int8LE);
    }
    function getUInt16LE(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.UInt16LE);
    }
    function getInt16LE(reg: number): number {
        pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.Int16LE);
    }
    function getBme280Value(): void {
        let adc_T = (getreg(0xFA) << 12) + (getreg(0xFB) << 4) + (getreg(0xFC) >> 4)
        let var1 = (((adc_T >> 3) - (dig_T1 << 1)) * dig_T2) >> 11
        let var2 = (((((adc_T >> 4) - dig_T1) * ((adc_T >> 4) - dig_T1)) >> 12) * dig_T3) >> 14
        let t = var1 + var2
        T = ((t * 5 + 128) >> 8) / 100
        var1 = (t >> 1) - 64000
        var2 = (((var1 >> 2) * (var1 >> 2)) >> 11) * dig_P6
        var2 = var2 + ((var1 * dig_P5) << 1)
        var2 = (var2 >> 2) + (dig_P4 << 16)
        var1 = (((dig_P3 * ((var1 >> 2) * (var1 >> 2)) >> 13) >> 3) + (((dig_P2) * var1) >> 1)) >> 18
        var1 = ((32768 + var1) * dig_P1) >> 15
        if (var1 == 0)
            return; // avoid exception caused by division by zero
        let adc_P = (getreg(0xF7) << 12) + (getreg(0xF8) << 4) + (getreg(0xF9) >> 4)
        let _p = ((1048576 - adc_P) - (var2 >> 12)) * 3125
        _p = (_p / var1) * 2;
        var1 = (dig_P9 * (((_p >> 3) * (_p >> 3)) >> 13)) >> 12
        var2 = (((_p >> 2)) * dig_P8) >> 13
        P = _p + ((var1 + var2 + dig_P7) >> 4)
        let adc_H = (getreg(0xFD) << 8) + getreg(0xFE)
        var1 = t - 76800
        var2 = (((adc_H << 14) - (dig_H4 << 20) - (dig_H5 * var1)) + 16384) >> 15
        var1 = var2 * (((((((var1 * dig_H6) >> 10) * (((var1 * dig_H3) >> 11) + 32768)) >> 10) + 2097152) * dig_H2 + 8192) >> 14)
        var2 = var1 - (((((var1 >> 15) * (var1 >> 15)) >> 7) * dig_H1) >> 4)
        if (var2 < 0) var2 = 0
        if (var2 > 419430400) var2 = 419430400
        H = (var2 >> 12) / 1024
    }
    ////////////////////////paj7620//////////////////////
    let gesture_first_init = true
    const initRegisterArray: number[] = [
        0xEF, 0x00, 0x32, 0x29, 0x33, 0x01, 0x34, 0x00, 0x35, 0x01, 0x36, 0x00, 0x37, 0x07, 0x38, 0x17,
        0x39, 0x06, 0x3A, 0x12, 0x3F, 0x00, 0x40, 0x02, 0x41, 0xFF, 0x42, 0x01, 0x46, 0x2D, 0x47, 0x0F,
        0x48, 0x3C, 0x49, 0x00, 0x4A, 0x1E, 0x4B, 0x00, 0x4C, 0x20, 0x4D, 0x00, 0x4E, 0x1A, 0x4F, 0x14,
        0x50, 0x00, 0x51, 0x10, 0x52, 0x00, 0x5C, 0x02, 0x5D, 0x00, 0x5E, 0x10, 0x5F, 0x3F, 0x60, 0x27,
        0x61, 0x28, 0x62, 0x00, 0x63, 0x03, 0x64, 0xF7, 0x65, 0x03, 0x66, 0xD9, 0x67, 0x03, 0x68, 0x01,
        0x69, 0xC8, 0x6A, 0x40, 0x6D, 0x04, 0x6E, 0x00, 0x6F, 0x00, 0x70, 0x80, 0x71, 0x00, 0x72, 0x00,
        0x73, 0x00, 0x74, 0xF0, 0x75, 0x00, 0x80, 0x42, 0x81, 0x44, 0x82, 0x04, 0x83, 0x20, 0x84, 0x20,
        0x85, 0x00, 0x86, 0x10, 0x87, 0x00, 0x88, 0x05, 0x89, 0x18, 0x8A, 0x10, 0x8B, 0x01, 0x8C, 0x37,
        0x8D, 0x00, 0x8E, 0xF0, 0x8F, 0x81, 0x90, 0x06, 0x91, 0x06, 0x92, 0x1E, 0x93, 0x0D, 0x94, 0x0A,
        0x95, 0x0A, 0x96, 0x0C, 0x97, 0x05, 0x98, 0x0A, 0x99, 0x41, 0x9A, 0x14, 0x9B, 0x0A, 0x9C, 0x3F,
        0x9D, 0x33, 0x9E, 0xAE, 0x9F, 0xF9, 0xA0, 0x48, 0xA1, 0x13, 0xA2, 0x10, 0xA3, 0x08, 0xA4, 0x30,
        0xA5, 0x19, 0xA6, 0x10, 0xA7, 0x08, 0xA8, 0x24, 0xA9, 0x04, 0xAA, 0x1E, 0xAB, 0x1E, 0xCC, 0x19,
        0xCD, 0x0B, 0xCE, 0x13, 0xCF, 0x64, 0xD0, 0x21, 0xD1, 0x0F, 0xD2, 0x88, 0xE0, 0x01, 0xE1, 0x04,
        0xE2, 0x41, 0xE3, 0xD6, 0xE4, 0x00, 0xE5, 0x0C, 0xE6, 0x0A, 0xE7, 0x00, 0xE8, 0x00, 0xE9, 0x00,
        0xEE, 0x07, 0xEF, 0x01, 0x00, 0x1E, 0x01, 0x1E, 0x02, 0x0F, 0x03, 0x10, 0x04, 0x02, 0x05, 0x00,
        0x06, 0xB0, 0x07, 0x04, 0x08, 0x0D, 0x09, 0x0E, 0x0A, 0x9C, 0x0B, 0x04, 0x0C, 0x05, 0x0D, 0x0F,
        0x0E, 0x02, 0x0F, 0x12, 0x10, 0x02, 0x11, 0x02, 0x12, 0x00, 0x13, 0x01, 0x14, 0x05, 0x15, 0x07,
        0x16, 0x05, 0x17, 0x07, 0x18, 0x01, 0x19, 0x04, 0x1A, 0x05, 0x1B, 0x0C, 0x1C, 0x2A, 0x1D, 0x01,
        0x1E, 0x00, 0x21, 0x00, 0x22, 0x00, 0x23, 0x00, 0x25, 0x01, 0x26, 0x00, 0x27, 0x39, 0x28, 0x7F,
        0x29, 0x08, 0x30, 0x03, 0x31, 0x00, 0x32, 0x1A, 0x33, 0x1A, 0x34, 0x07, 0x35, 0x07, 0x36, 0x01,
        0x37, 0xFF, 0x38, 0x36, 0x39, 0x07, 0x3A, 0x00, 0x3E, 0xFF, 0x3F, 0x00, 0x40, 0x77, 0x41, 0x40,
        0x42, 0x00, 0x43, 0x30, 0x44, 0xA0, 0x45, 0x5C, 0x46, 0x00, 0x47, 0x00, 0x48, 0x58, 0x4A, 0x1E,
        0x4B, 0x1E, 0x4C, 0x00, 0x4D, 0x00, 0x4E, 0xA0, 0x4F, 0x80, 0x50, 0x00, 0x51, 0x00, 0x52, 0x00,
        0x53, 0x00, 0x54, 0x00, 0x57, 0x80, 0x59, 0x10, 0x5A, 0x08, 0x5B, 0x94, 0x5C, 0xE8, 0x5D, 0x08,
        0x5E, 0x3D, 0x5F, 0x99, 0x60, 0x45, 0x61, 0x40, 0x63, 0x2D, 0x64, 0x02, 0x65, 0x96, 0x66, 0x00,
        0x67, 0x97, 0x68, 0x01, 0x69, 0xCD, 0x6A, 0x01, 0x6B, 0xB0, 0x6C, 0x04, 0x6D, 0x2C, 0x6E, 0x01,
        0x6F, 0x32, 0x71, 0x00, 0x72, 0x01, 0x73, 0x35, 0x74, 0x00, 0x75, 0x33, 0x76, 0x31, 0x77, 0x01,
        0x7C, 0x84, 0x7D, 0x03, 0x7E, 0x01
    ];
    ////////////////DHT20////////////////////////////////
    let DHT20_Addr = 0x38
    let DHT20WriteBuff = pins.createBuffer(3);
    let DHT20ReadBuff = pins.createBuffer(6);
    /////////////////////////color/////////////////////////
    const APDS9960_ADDR = 0x39
    const APDS9960_ENABLE = 0x80
    const APDS9960_ATIME = 0x81
    const APDS9960_CONTROL = 0x8F
    const APDS9960_STATUS = 0x93
    const APDS9960_CDATAL = 0x94
    const APDS9960_CDATAH = 0x95
    const APDS9960_RDATAL = 0x96
    const APDS9960_RDATAH = 0x97
    const APDS9960_GDATAL = 0x98
    const APDS9960_GDATAH = 0x99
    const APDS9960_BDATAL = 0x9A
    const APDS9960_BDATAH = 0x9B
    const APDS9960_GCONF4 = 0xAB
    const APDS9960_AICLEAR = 0xE7
    let color_first_init = false
    let color_new_init = false

    let __dht11_last_read_time = 0;
    let __temperature: number = 0
    let __humidity: number = 0


    function i2cwrite_color(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(addr, buf)
    }
    function i2cread_color(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }
    function rgb2hsl(color_r: number, color_g: number, color_b: number): number {
        let Hue = 0
        let R = color_r * 100 / 255;
        let G = color_g * 100 / 255;
        let B = color_b * 100 / 255;
        let maxVal = Math.max(R, Math.max(G, B))
        let minVal = Math.min(R, Math.min(G, B))
        let Delta = maxVal - minVal;

        if (Delta < 0) {
            Hue = 0;
        }
        else if (maxVal == R && G >= B) {
            Hue = (60 * ((G - B) * 100 / Delta)) / 100;
        }
        else if (maxVal == R && G < B) {
            Hue = (60 * ((G - B) * 100 / Delta) + 360 * 100) / 100;
        }
        else if (maxVal == G) {
            Hue = (60 * ((B - R) * 100 / Delta) + 120 * 100) / 100;
        }
        else if (maxVal == B) {
            Hue = (60 * ((R - G) * 100 / Delta) + 240 * 100) / 100;
        }
        return Hue
    }
    function initModule(): void {
        i2cwrite_color(APDS9960_ADDR, APDS9960_ATIME, 252)
        i2cwrite_color(APDS9960_ADDR, APDS9960_CONTROL, 0x03)
        i2cwrite_color(APDS9960_ADDR, APDS9960_ENABLE, 0x00)
        i2cwrite_color(APDS9960_ADDR, APDS9960_GCONF4, 0x00)
        i2cwrite_color(APDS9960_ADDR, APDS9960_AICLEAR, 0x00)
        i2cwrite_color(APDS9960_ADDR, APDS9960_ENABLE, 0x01)
        color_first_init = true
    }
    function colorMode(): void {
        let tmp = i2cread_color(APDS9960_ADDR, APDS9960_ENABLE) | 0x2;
        i2cwrite_color(APDS9960_ADDR, APDS9960_ENABLE, tmp);
    }

    ////////////////////////////////////////////real time clock
    let DS1307_I2C_ADDR = 104;
    let DS1307_REG_SECOND = 0
    let DS1307_REG_MINUTE = 1
    let DS1307_REG_HOUR = 2
    let DS1307_REG_WEEKDAY = 3
    let DS1307_REG_DAY = 4
    let DS1307_REG_MONTH = 5
    let DS1307_REG_YEAR = 6
    let DS1307_REG_CTRL = 7
    let DS1307_REG_RAM = 8
    function rtc_setReg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(DS1307_I2C_ADDR, buf);
    }
    function rtc_getReg(reg: number): number {
        pins.i2cWriteNumber(DS1307_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(DS1307_I2C_ADDR, NumberFormat.UInt8BE);
    }
    function HexToDec(dat: number): number {
        return (dat >> 4) * 10 + (dat % 16);
    }
    function DecToHex(dat: number): number {
        return Math.idiv(dat, 10) * 16 + (dat % 10)
    }
    export function start() {
        let t = getSecond()
        setSecond(t & 0x7f)
    }
    export function setSecond(dat: number): void {
        rtc_setReg(DS1307_REG_SECOND, DecToHex(dat % 60))
    }
    export function getSecond(): number {
        return Math.min(HexToDec(rtc_getReg(DS1307_REG_SECOND)), 59)
    }
    //////////////////////////////////////////////////////MLX90615
    const MLX90615Addr = 0x5B
    const humanbody_Addr = 0x27
    const environment_Addr = 0x26

    export enum targetList {
        //% block="Human body"
        human_body,
        //% block="Environment"
        environment
    }

    export enum UnitList {
        //% block="℃"
        Centigrade,
        //% block="℉"
        Fahrenheit
    }
    function readdata(reg: NumberFormat.UInt8BE): number {
        pins.i2cWriteNumber(MLX90615Addr, reg, NumberFormat.UInt8BE, true);
        let temp = pins.i2cReadNumber(MLX90615Addr, NumberFormat.UInt16LE);
        temp *= .02
        temp -= 273.15
        return temp
    }


    ///////////////////////////////////////////////////////MP3
    let Start_Byte = 0x7E
    let Version_Byte = 0xFF
    let Command_Length = 0x06
    let End_Byte = 0xEF
    let Acknowledge = 0x00
    let CMD = 0x00
    let para1 = 0x00
    let para2 = 0x00
    let highByte = 0x00
    let lowByte = 0x00
    let dataArr: number[] = [Start_Byte, Version_Byte, Command_Length, CMD, Acknowledge, para1, para2, highByte, lowByte, End_Byte]
    /*
    * Play status selection button list
    */
    export enum playType {
        //% block="Play"
        Play = 0x0D,
        //% block="Stop"
        Stop = 0x16,
        //% block="PlayNext"
        PlayNext = 0x01,
        //% block="PlayPrevious"
        PlayPrevious = 0x02,
        //% block="Pause"
        Pause = 0x0E
    }
    function mp3_sendData(): void {
        let myBuff = pins.createBuffer(10);
        for (let i = 0; i < 10; i++) {
            myBuff.setNumber(NumberFormat.UInt8BE, i, dataArr[i])
        }
        serial.writeBuffer(myBuff)
        basic.pause(100)
    }
    function mp3_checkSum(): void {
        let total = 0;
        for (let i = 1; i < 7; i++) {
            total += dataArr[i]
        }
        total = 65536 - total
        lowByte = total & 0xFF;
        highByte = total >> 8;
        dataArr[7] = highByte
        dataArr[8] = lowByte
    }
    ////////////////////////////////////////////////////////NFC
    let NFC_I2C_ADDR = (0x48 >> 1);
    let recvBuf = pins.createBuffer(32);
    let recvAck = pins.createBuffer(8);
    let ackBuf = pins.createBuffer(6);
    let uId = pins.createBuffer(4);
    let passwdBuf = pins.createBuffer(6);
    let blockData = pins.createBuffer(16);
    let NFC_ENABLE = 0;
    const block_def = 8;
    ackBuf[0] = 0x00;
    ackBuf[1] = 0x00;
    ackBuf[2] = 0xFF;
    ackBuf[3] = 0x00;
    ackBuf[4] = 0xFF;
    ackBuf[5] = 0x00;
    passwdBuf[0] = 0xFF;
    passwdBuf[1] = 0xFF;
    passwdBuf[2] = 0xFF;
    passwdBuf[3] = 0xFF;
    passwdBuf[4] = 0xFF;
    passwdBuf[5] = 0xFF;
    function writeAndReadBuf(buf: Buffer, len: number) {
        pins.i2cWriteBuffer(NFC_I2C_ADDR, buf);
        basic.pause(100);
        recvAck = pins.i2cReadBuffer(NFC_I2C_ADDR, 8);
        basic.pause(100);
        recvBuf = pins.i2cReadBuffer(NFC_I2C_ADDR, len - 4);
    }
    function checkDcs(len: number): boolean {
        let sum = 0, dcs = 0;
        for (let i = 1; i < len - 2; i++) {
            if ((i === 4) || (i === 5)) {
                continue;
            }
            sum += recvBuf[i];
        }
        dcs = 0xFF - (sum & 0xFF);
        if (dcs != recvBuf[len - 2]) {
            return false;
        }
        return true;
    }
    function passwdCheck(id: Buffer, st: Buffer): boolean {
        let buf: number[] = [];
        buf = [0x00, 0x00, 0xFF, 0x0F, 0xF1, 0xD4, 0x40, 0x01, 0x60, 0x07, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xD1, 0xAA, 0x40, 0xEA, 0xC2, 0x00];
        let cmdPassWord = pins.createBufferFromArray(buf);
        let sum = 0, count = 0;
        cmdPassWord[9] = block_def;
        for (let i = 10; i < 16; i++)
            cmdPassWord[i] = st[i - 10];
        for (let i = 16; i < 20; i++)
            cmdPassWord[i] = id[i - 16];
        for (let i = 0; i < 20; i++) {
            if (i === 3 || i === 4) {
                continue;
            }
            sum += cmdPassWord[i];
        }
        cmdPassWord[20] = 0xff - (sum & 0xff)
        writeAndReadBuf(cmdPassWord, 15);
        for (let i = 0; i < 4; i++) {
            if (recvAck[1 + i] != ackBuf[i]) {
                serial.writeLine("psd ack ERROR!");
                return false;
            }
        }
        if ((recvBuf[6] === 0xD5) && (recvBuf[7] === 0x41) && (recvBuf[8] === 0x00) && (checkDcs(15 - 4))) {
            return true;
        }
        return false;
    }
    function wakeup() {
        basic.pause(100);
        let i = 0;
        let buf: number[] = [];
        buf = [0x00, 0x00, 0xFF, 0x05, 0xFB, 0xD4, 0x14, 0x01, 0x14, 0x01, 0x02, 0x00];
        let cmdWake = pins.createBufferFromArray(buf);
        writeAndReadBuf(cmdWake, 14);
        for (i = 0; i < ackBuf.length; i++) {
            if (recvAck[1 + i] != ackBuf[i]) {
                break;
            }
        }
        if ((i != ackBuf.length) || (recvBuf[6] != 0xD5) || (recvBuf[7] != 0x15) || (!checkDcs(14 - 4))) {
            NFC_ENABLE = 2;
        } else {
            NFC_ENABLE = 1;
        }
        basic.pause(100);
    }

    function writeblock(data: Buffer): void {
        if (!passwdCheck(uId, passwdBuf))
            return;
        let cmdWrite: number[] = [0x00, 0x00, 0xff, 0x15, 0xEB, 0xD4, 0x40, 0x01, 0xA0,
            0x06, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
            0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0xCD,
            0x00];
        let sum = 0, count = 0;
        cmdWrite[9] = block_def;
        for (let i = 10; i < 26; i++)
            cmdWrite[i] = data[i - 10];
        for (let i = 0; i < 26; i++) {
            if ((i === 3) || (i === 4)) {
                continue;
            }
            sum += cmdWrite[i];
        }
        cmdWrite[26] = 0xff - (sum & 0xff);
        let tempbuf = pins.createBufferFromArray(cmdWrite)
        writeAndReadBuf(tempbuf, 16);
    }

    ////////////////////////////////////////////////////////NFC_RFID_WS1850T
    let WS1850_I2CADDR = 0x28; // Set your I2C address for the MFRC522

    //MF522命令字
    let PCD_IDLE = 0x00               //NO action;取消当前命令
    let PCD_AUTHENT = 0x0E               //验证密钥
    let PCD_RECEIVE = 0x08               //接收数据
    let PCD_TRANSMIT = 0x04               //发送数据
    let PCD_TRANSCEIVE = 0x0C               //发送并接收数据
    let PCD_RESETPHASE = 0x0F               //复位
    let PCD_CALCCRC = 0x03               //CRC计算

    //Mifare_One卡片命令字
    let PICC_REQIDL = 0x26               //寻天线区内未进入休眠状态
    let PICC_REQALL = 0x52               //寻天线区内全部卡
    let PICC_ANTICOLL = 0x93               //防冲撞
    let PICC_SElECTTAG = 0x95              //选卡93
    let PICC_AUTHENT1A = 0x60               //验证A密钥
    let PICC_AUTHENT1B = 0x61               //验证B密钥
    let PICC_READ = 0x30               //读块
    let PICC_WRITE = 0xA0               //写块
    let PICC_DECREMENT = 0xC0               //扣款
    let PICC_INCREMENT = 0xC1               //充值
    let PICC_RESTORE = 0xC2               //调块数据到缓冲区
    let PICC_TRANSFER = 0xB0               //保存缓冲区中数据
    let PICC_HALT = 0x50               //休眠


    //和MF522通讯时返回的错误代码
    let MI_OK = 0
    let MI_NOTAGERR = (-1)  //1
    let MI_ERR = (-2)  //2

    //MF522 FIFO长度定义
    /////////////////////////////////////////////////////////////////////
    let DEF_FIFO_LENGTH = 64                 //FIFO size=64byte

    //------------------MFRC522寄存器---------------
    //Page 0:Command and Status
    let Reserved00 = 0x00
    let CommandReg = 0x01
    let CommIEnReg = 0x02
    let DivlEnReg = 0x03
    let CommIrqReg = 0x04
    let DivIrqReg = 0x05
    let ErrorReg = 0x06
    let Status1Reg = 0x07
    let Status2Reg = 0x08
    let FIFODataReg = 0x09
    let FIFOLevelReg = 0x0A
    let WaterLevelReg = 0x0B
    let ControlReg = 0x0C
    let BitFramingReg = 0x0D
    let CollReg = 0x0E
    let Reserved01 = 0x0F
    //Page 1:Command     
    let Reserved10 = 0x10
    let ModeReg = 0x11
    let TxModeReg = 0x12
    let RxModeReg = 0x13
    let TxControlReg = 0x14
    let TxAutoReg = 0x15
    let TxSelReg = 0x16
    let RxSelReg = 0x17
    let RxThresholdReg = 0x18
    let DemodReg = 0x19
    let Reserved11 = 0x1A
    let Reserved12 = 0x1B
    let MifareReg = 0x1C
    let Reserved13 = 0x1D
    let Reserved14 = 0x1E
    let SerialSpeedReg = 0x1F
    //Page 2:CFG    
    let Reserved20 = 0x20
    let CRCResultRegM = 0x21
    let CRCResultRegL = 0x22
    let Reserved21 = 0x23
    let ModWidthReg = 0x24
    let Reserved22 = 0x25
    let RFCfgReg = 0x26
    let GsNReg = 0x27
    let CWGsPReg = 0x28
    let ModGsPReg = 0x29
    let TModeReg = 0x2A
    let TPrescalerReg = 0x2B
    let TReloadRegH = 0x2C
    let TReloadRegL = 0x2D
    let TCounterValueRegH = 0x2E
    let TCounterValueRegL = 0x2F
    //Page 3:TestRegister     
    let Reserved30 = 0x30
    let TestSel1Reg = 0x31
    let TestSel2Reg = 0x32
    let TestPinEnReg = 0x33
    let TestPinValueReg = 0x34
    let TestBusReg = 0x35
    let AutoTestReg = 0x36
    let VersionReg = 0x37
    let AnalogTestReg = 0x38
    let TestDAC1Reg = 0x39
    let TestDAC2Reg = 0x3A
    let TestADCReg = 0x3B
    let Reserved31 = 0x3C
    let Reserved32 = 0x3D
    let Reserved33 = 0x3E
    let Reserved34 = 0x3F
    //-----------------------------------------------
    //变量
    let ws1850Type2 = 0
    let WS1850_MAX_LEN = 16;
    const WS1850BlockAdr: number[] = [8, 9, 10]
    let ws1850tuid: number[] = []
    let ws1850tretLen = 0
    let ws1850retData: number[] = []
    let ws1850status = 0
    let ws1850ChkSerNum = 0
    let ws1850retBits: number = null
    let ws1850recvData: number[] = []
    let ws1850Key = [255, 255, 255, 255, 255, 255]

    function WS1850T_IIC_Read(reg: number): number {
        pins.i2cWriteNumber(WS1850_I2CADDR, reg, NumberFormat.Int8LE);
        return pins.i2cReadNumber(WS1850_I2CADDR, NumberFormat.Int8LE);
    }

    function WS1850T_IIC_Write(reg: number, value: number) {
        let buf = pins.createBuffer(2);
        buf.setNumber(NumberFormat.Int8LE, 0, reg);
        buf.setNumber(NumberFormat.Int8LE, 1, value);
        pins.i2cWriteBuffer(WS1850_I2CADDR, buf);
    }

    //********天线开启函数**************//
    function WS1850_AntennaON() {
        let temp = WS1850T_IIC_Read(TxControlReg)//0x14控制天线驱动器管脚TX1和TX2的寄存器
        if (~(temp & 0x03)) {
            WS1850_SetBits(TxControlReg, 0x03)
        }
    }
    //*******设置使能天线发射载波13.56Mhz寄存器函数*********//
    function WS1850_SetBits(reg: number, mask: number) {
        let tmp = WS1850T_IIC_Read(reg)
        WS1850T_IIC_Write(reg, (tmp | mask))
    }

    //*******设置禁止天线发射载波13.56Mhz寄存器函数*********
    function WS1850_ClearBits(reg: number, mask: number) {
        let tmp = WS1850T_IIC_Read(reg)
        WS1850T_IIC_Write(reg, tmp & (~mask))
    }

    function WS1850_ToCard(command: number, sendData: number[]): [number, number[], number] {
        ws1850retData = []
        ws1850tretLen = 0
        ws1850status = 2
        let irqEN = 0x00
        let waitIRQ = 0x00
        let lastBits = null
        let n = 0

        if (command == PCD_AUTHENT) {
            irqEN = 0x12
            waitIRQ = 0x10
        }

        if (command == PCD_TRANSCEIVE) {
            irqEN = 0x77
            waitIRQ = 0x30
        }

        WS1850T_IIC_Write(0x02, irqEN | 0x80)
        WS1850_ClearBits(CommIrqReg, 0x80)
        WS1850_SetBits(FIFOLevelReg, 0x80)
        WS1850T_IIC_Write(CommandReg, PCD_IDLE)

        for (let o = 0; o < (sendData.length); o++) {
            WS1850T_IIC_Write(FIFODataReg, sendData[o])
        }
        WS1850T_IIC_Write(CommandReg, command)

        if (command == PCD_TRANSCEIVE) {
            WS1850_SetBits(BitFramingReg, 0x80)
        }

        let p = 1000
        while (true) {
            n = WS1850T_IIC_Read(CommIrqReg)
            p--
            if (~(p != 0 && ~(n & 0x01) && ~(n & waitIRQ))) {
                break
            }
        }
        WS1850_ClearBits(BitFramingReg, 0x80)

        if (p != 0) {
            if ((WS1850T_IIC_Read(0x06) & 0x1B) == 0x00) {
                ws1850status = 0
                if (n & irqEN & 0x01) {
                    ws1850status = 1
                }
                if (command == PCD_TRANSCEIVE) {
                    n = WS1850T_IIC_Read(FIFOLevelReg)
                    lastBits = WS1850T_IIC_Read(ControlReg) & 0x07
                    if (lastBits != 0) {
                        ws1850tretLen = (n - 1) * 8 + lastBits
                    }
                    else {
                        ws1850tretLen = n * 8
                    }
                    if (n == 0) {
                        n = 1
                    }
                    if (n > WS1850_MAX_LEN) {
                        n = WS1850_MAX_LEN
                    }
                    for (let q = 0; q < n; q++) {
                        ws1850retData.push(WS1850T_IIC_Read(FIFODataReg))
                    }
                }
            }
            else {
                ws1850status = 2
            }
        }

        return [ws1850status, ws1850retData, ws1850tretLen]
    }

    //---------------readID的第一个函数----寻卡函数-------------//
    function WS1850_Request(reqMode: number): [number, number] {
        let Type: number[] = []
        WS1850T_IIC_Write(BitFramingReg, 0x07)  //0x0d面向位的帧的调节寄存器，0x07
        Type.push(reqMode)
        let [ws1850status, ws1850retData, ws1850retBits] = WS1850_ToCard(PCD_TRANSCEIVE, Type)

        if ((ws1850status != 0) || (ws1850retBits != 16)) {
            ws1850status = 2
        }

        return [ws1850status, ws1850retBits]
    }

    //-----------------readID的第二个函数-------------------//
    function WS1850_AvoidColl(): [number, number[]] {
        let SerNum = []
        ws1850ChkSerNum = 0
        WS1850T_IIC_Write(BitFramingReg, 0)
        SerNum.push(PICC_ANTICOLL)
        SerNum.push(0x20)
        let [ws1850status, ws1850retData, ws1850retBits] = WS1850_ToCard(PCD_TRANSCEIVE, SerNum)

        if (ws1850status == 0) {
            if (ws1850retData.length == 5) {
                for (let k = 0; k <= 3; k++) {
                    ws1850ChkSerNum = ws1850ChkSerNum ^ ws1850retData[k]
                }
                if (ws1850ChkSerNum != ws1850retData[4]) {
                    ws1850status = 2
                }
            }
            else {
                ws1850status = 2
            }
        }
        return [ws1850status, ws1850retData]
    }
    //------------------readID的第三个函数---------------------//
    function WS1850_getIDNum(ws1850tuid: number[]): number {
        let a = 0

        for (let e = 0; e < 5; e++) {
            a = a * 256 + ws1850tuid[e]
        }
        return a
    }

    //---------write卡数据的第一个函数------------------------//
    function WS1850_writeToCard(txt: string): number {
        [ws1850status, ws1850Type2] = WS1850_Request(PICC_REQIDL)

        if (ws1850status != 0) {
            return null
        }
        [ws1850status, ws1850tuid] = WS1850_AvoidColl()

        if (ws1850status != 0) {
            return null
        }

        let id = WS1850_getIDNum(ws1850tuid)
        WS1850_TagSelect(ws1850tuid)
        ws1850status = WS1850_Authent(PICC_AUTHENT1A, 11, ws1850Key, ws1850tuid)
        WS1850_ReadRFID(11)

        if (ws1850status == 0) {
            let data: NumberFormat.UInt8LE[] = []
            for (let i = 0; i < txt.length; i++) {
                data.push(txt.charCodeAt(i))
            }

            for (let j = txt.length; j < 48; j++) {
                data.push(0)
            }
            //写3个块
            // let b = 0
            // for (let BlockNum2 of WS1850BlockAdr) {
            //     WS1850_WriteRFID(BlockNum2, data.slice((b * 16), ((b + 1) * 16)))
            //     b++
            // }
            //写一个块
            WS1850_WriteRFID(WS1850BlockAdr[0], data.slice(0, 16))
        }

        WS1850_Crypto1Stop()
        // serial.writeLine("Written to Card")
        return id
    }

    //---------Read读取卡M1卡数据第二个函数------------------------//
    function WS1850_TagSelect(SerNum: number[]) {
        let buff: number[] = []
        buff.push(0x93)
        buff.push(0x70)
        for (let r = 0; r < 5; r++) {
            buff.push(SerNum[r])
        }

        let pOut = WS1850_CRC_Calculation(buff)
        buff.push(pOut[0])
        buff.push(pOut[1])
        let [ws1850status, ws1850retData, ws1850tretLen] = WS1850_ToCard(PCD_TRANSCEIVE, buff)
        if ((ws1850status == 0) && (ws1850tretLen == 0x18)) {
            return ws1850retData[0]
        }
        else {
            return 0
        }
    }

    //---------Read读取卡M1卡数据第六个函数------------------------//
    function WS1850_CRC_Calculation(DataIn: number[]) {
        WS1850_ClearBits(DivIrqReg, 0x04)
        WS1850_SetBits(FIFOLevelReg, 0x80)
        for (let s = 0; s < (DataIn.length); s++) {
            WS1850T_IIC_Write(FIFODataReg, DataIn[s])
        }
        WS1850T_IIC_Write(CommandReg, 0x03)
        let t = 0xFF

        while (true) {
            let v = WS1850T_IIC_Read(DivIrqReg)
            t--
            if (!(t != 0 && !(v & 0x04))) {
                break
            }
        }

        let DataOut: number[] = []
        DataOut.push(WS1850T_IIC_Read(0x22))
        DataOut.push(WS1850T_IIC_Read(0x21))
        return DataOut
    }

    //---------Read读取卡M1卡数据第三个函数------------------------//
    function WS1850_Authent(authMode: number, WS1850BlockAdr: number, Sectorkey: number[], SerNum: number[]) {
        let buff: number[] = []
        buff.push(authMode)
        buff.push(WS1850BlockAdr)
        for (let l = 0; l < (Sectorkey.length); l++) {
            buff.push(Sectorkey[l])
        }
        for (let m = 0; m < 4; m++) {
            buff.push(SerNum[m])
        }
        [ws1850status, ws1850retData, ws1850tretLen] = WS1850_ToCard(PCD_AUTHENT, buff)
        if (ws1850status != 0) {
            serial.writeLine("AUTH ERROR!")
        }
        if ((WS1850T_IIC_Read(Status2Reg) & 0x08) == 0) {
            serial.writeLine("AUTH ERROR2!")
        }
        return ws1850status
    }

    //---------Read读取卡M1卡数据第四个函数------------------------//
    function WS1850_ReadRFID(blockAdr: number) {
        ws1850recvData = []
        ws1850recvData.push(PICC_READ)
        ws1850recvData.push(blockAdr)
        let pOut2 = []
        pOut2 = WS1850_CRC_Calculation(ws1850recvData)
        ws1850recvData.push(pOut2[0])
        ws1850recvData.push(pOut2[1])
        let [ws1850status, ws1850retData, ws1850tretLen] = WS1850_ToCard(PCD_TRANSCEIVE, ws1850recvData)

        if (ws1850status != 0) {
            serial.writeLine("Error while reading!")
        }

        if (ws1850retData.length != 16) {
            return null
        }
        else {
            return ws1850retData
        }
    }

    //---------write卡数据的第二个函数------------------------//
    function WS1850_WriteRFID(blockAdr: number, writeData: number[]) {
        let buff: number[] = []
        let crc: number[] = []

        buff.push(0xA0)
        buff.push(blockAdr)
        crc = WS1850_CRC_Calculation(buff)
        buff.push(crc[0])
        buff.push(crc[1])
        let [ws1850status, ws1850retData, ws1850tretLen] = WS1850_ToCard(PCD_TRANSCEIVE, buff)
        if ((ws1850status != 0) || (ws1850tretLen != 4) || ((ws1850retData[0] & 0x0F) != 0x0A)) {
            ws1850status = 2
            serial.writeLine("ERROR")
        }

        if (ws1850status == 0) {
            let buff2: number[] = []
            for (let w = 0; w < 16; w++) {
                buff2.push(writeData[w])
            }
            crc = WS1850_CRC_Calculation(buff2)
            buff2.push(crc[0])
            buff2.push(crc[1])
            let [ws1850status, ws1850retData, ws1850tretLen] = WS1850_ToCard(PCD_TRANSCEIVE, buff2)
            if ((ws1850status != 0) || (ws1850tretLen != 4) || ((ws1850retData[0] & 0x0F) != 0x0A)) {
                serial.writeLine("Error while writing")
            }
            else {
                serial.writeLine("Data written")
            }
        }
    }

    //---------Read读取卡M1卡数据第五个函数------------------------//
    function WS1850_Crypto1Stop() {
        WS1850_ClearBits(Status2Reg, 0x08)
    }

    //------------Read读取卡M1卡数据第一个函数------------------//
    function WS1850_readFromCard(): string {
        let [ws1850status, ws1850Type2] = WS1850_Request(PICC_REQIDL)     //寻卡+复位应答
        if (ws1850status != 0) {
            return ""
        }

        [ws1850status, ws1850tuid] = WS1850_AvoidColl()     //防多卡冲突机制

        if (ws1850status != 0) {
            return ""
        }

        let id = WS1850_getIDNum(ws1850tuid)
        WS1850_TagSelect(ws1850tuid)                  //选择卡片
        ws1850status = WS1850_Authent(PICC_AUTHENT1A, 11, ws1850Key, ws1850tuid)  //三次相互验证
        let data: NumberFormat.UInt8LE[] = []
        let text_read = ''
        let block: number[] = []
        if (ws1850status == 0) {
            // for (let BlockNum of WS1850BlockAdr) {//读3个块
            //     block = WS1850_ReadRFID(BlockNum)
            //     if (block) {
            //         data = data.concat(block)
            //     }
            // }
            data = data.concat(WS1850_ReadRFID(8))//读一个块
            if (data) {
                for (let c of data) {
                    text_read = text_read.concat(String.fromCharCode(c))
                }
            }
        }
        WS1850_Crypto1Stop()
        return text_read
    }

    // 初始化
    function WS1850_Init() {
        WS1850T_IIC_Write(CommandReg, PCD_RESETPHASE)//掉电和命令寄存器，0x0F软复位
        WS1850T_IIC_Write(TModeReg, 0x8D)//0x2A内部定时器的设置寄存器，0x8D*****
        WS1850T_IIC_Write(TPrescalerReg, 0x3E)//0x2B内部定时器的设置寄存器，0x3E***
        WS1850T_IIC_Write(TReloadRegL, 0x1E)//0x2D定义16位定时器的重载值寄存器，30***
        WS1850T_IIC_Write(TCounterValueRegH, 0x00)//0x2E 16位定时器的计数值寄存器，0
        WS1850T_IIC_Write(TxAutoReg, 0x40)//0x15控制天线驱动器设置的寄存器，0x40
        WS1850T_IIC_Write(ModeReg, 0x3D)//0x11当以发送和接收通用模式的寄存器，0x3D
        WS1850_AntennaON()
    }

    //扫描ic卡
    function WS1850_scan(): boolean {
        WS1850_Init();

        [ws1850status, ws1850Type2] = WS1850_Request(PICC_REQIDL)  //寻卡+复位应答

        if (ws1850status != 0) {
            return false
        }
        [ws1850status, ws1850tuid] = WS1850_AvoidColl()

        if (ws1850status != 0) {
            return false
        }

        if (WS1850_getIDNum(ws1850tuid) == 0) {
            return false
        }
        else {
            return true
        }
    }

    //**************Read读取卡M1卡数据主函数***********/
    //*****读取的卡数据read()处理函数***********//
    //*****由于卡2扇区数据共48个字节（即48个字符），填入数据后，未填写的数据会自动补字符0（即16进制的0X20）***********//
    //*****仅显示有效字符串，去除补位字符0 *//
    function WS1850_Read(): string {               //数据长度48个字节
        let text = WS1850_readFromCard()
        let i = 1;
        while (!text) {
            text = WS1850_readFromCard();
            if (i-- <= 0) {
                break;
            }
        }
        let strlenth = text.length;
        while (strlenth) {
            if (text[strlenth - 1].charCodeAt(0) == 0x00) {
                strlenth--;
            }
            else {
                break;
            }
        }

        strlenth = strlenth > 16 ? 16 : strlenth

        return text.slice(0, strlenth)


        // let manage_DATA: string
        // let m_DATA_1: string = text
        // manage_DATA = m_DATA_1 != null ? m_DATA_1.trim() : 'NULL'   //.trim()为js语言去除两端空格的函数
        // return text
    }

    /**************write卡数据的主函数*********************/
    export function WS1850_Write(str: string) {
        let id = WS1850_writeToCard(str)

        let flag = 1;
        while (!id && flag <= 2) {
            let id = WS1850_writeToCard(str)

            flag += 1
        }
    }

    ///////////////////////////////////////////////////////RJpin_to_pin
    function RJpin_to_analog(Rjpin: AnalogRJPin): any {
        let pin = AnalogPin.P1
        switch (Rjpin) {
            case AnalogRJPin.J1:
                pin = AnalogPin.P1
                break;
            case AnalogRJPin.J2:
                pin = AnalogPin.P2
                break;
        }
        return pin
    }
    function RJpin_to_digital(Rjpin: DigitalRJPin): any {
        let pin = DigitalPin.P1
        switch (Rjpin) {
            case DigitalRJPin.J1:
                pin = DigitalPin.P8
                break;
            case DigitalRJPin.J2:
                pin = DigitalPin.P12
                break;
            case DigitalRJPin.J3:
                pin = DigitalPin.P14
                break;
            case DigitalRJPin.J4:
                pin = DigitalPin.P16
                break;
        }
        return pin
    }

    //////////////////////////////////////////////////////////////TrackBit
    let TrackBit_state_value: number = 0

    ///////////////////////////////enum
    export enum DigitalRJPin {
        //% block="J1"
        J1,
        //% block="J2"
        J2,
        //% block="J3"
        J3,
        //% block="J4"
        J4
    }
    export enum AnalogRJPin {
        //% block="J1"
        J1,
        //% block="J2"
        J2
    }
    export enum TrackingStateType {
        //% block="● ●" enumval=0
        Tracking_State_0,

        //% block="● ◌" enumval=1
        Tracking_State_1,

        //% block="◌ ●" enumval=2
        Tracking_State_2,

        //% block="◌ ◌" enumval=3
        Tracking_State_3
    }
    export enum TrackbitStateType {
        //% block="◌ ◌ ◌ ◌" 
        Tracking_State_0 = 0,
        //% block="◌ ● ● ◌" 
        Tracking_State_1 = 6,
        //% block="◌ ◌ ● ◌" 
        Tracking_State_2 = 4,
        //% block="◌ ● ◌ ◌" 
        Tracking_State_3 = 2,


        //% block="● ◌ ◌ ●" 
        Tracking_State_4 = 9,
        //% block="● ● ● ●" 
        Tracking_State_5 = 15,
        //% block="● ◌ ● ●" 
        Tracking_State_6 = 13,
        //% block="● ● ◌ ●" 
        Tracking_State_7 = 11,

        //% block="● ◌ ◌ ◌" 
        Tracking_State_8 = 1,
        //% block="● ● ● ◌" 
        Tracking_State_9 = 7,
        //% block="● ◌ ● ◌" 
        Tracking_State_10 = 5,
        //% block="● ● ◌ ◌" 
        Tracking_State_11 = 3,

        //% block="◌ ◌ ◌ ●" 
        Tracking_State_12 = 8,
        //% block="◌ ● ● ●" 
        Tracking_State_13 = 14,
        //% block="◌ ◌ ● ●" 
        Tracking_State_14 = 12,
        //% block="◌ ● ◌ ●" 
        Tracking_State_15 = 10
    }
    export enum TrackbitType {
        //% block="◌" 
        State_0 = 0,
        //% block="●" 
        State_1 = 1
    }
    export enum TrackbitChannel {
        //% block="1"
        One = 0,
        //% block="2"
        Two = 1,
        //% block="3"
        Three = 2,
        //% block="4"
        Four = 3
    }
    export enum TrackBit_gray {
        //% block="γραμμή"
        One = 0,
        //% block="φόντο"
        Two = 4
    }


    export enum Distance_Unit_List {
        //% block="εκατοστά" 
        Distance_Unit_cm,

        //% block="πόδια"
        Distance_Unit_foot,
    }
    export enum ButtonStateList {
        //% block="C"
        C,
        //% block="D"
        D,
        //% block="C+D"
        CD
    }
    export enum RelayStateList {
        //% block="NC|Close NO|Open"
        On,

        //% block="NC|Open NO|Close"
        Off
    }
    export enum BME280_state {
        //% block="Θερμοκρασία(℃)"
        BME280_temperature_C,

        //% block="υγρασία(0~100)"
        BME280_humidity,

        //% block="πίεση(hPa)"
        BME280_pressure,

        //% block="υψόμετρο(M)"
        BME280_altitude,
    }
    export enum DHT11_state {
        //% block="θερμοκρασία(℃)" enumval=0
        DHT11_temperature_C,

        //% block="υγρασία(0~100)" enumval=1
        DHT11_humidity,
    }
    export enum DHT20_state {
        //% block="θερμοκρασία(℃)" enumval=0
        DHT20_temperature_C,

        //% block="υγρασία(0~100)" enumval=1
        DHT20_humidity,
    }

    export enum GestureType {
        //% block="Κανένα"
        None = 0,
        //% block="δεξιά"
        Right = 1,
        //% block="αριστερα"
        Left = 2,
        //% block="πάνω"
        Up = 3,
        //% block="κάτω"
        Down = 4,
        //% block="μπροστά"
        Forward = 5,
        //% block="πίσω"
        Backward = 6,
        //% block="δεξιόστροφα"
        Clockwise = 7,
        //% block="αριστερόστροφα"
        Anticlockwise = 8,
        //% block="κυματιστά"
        Wave = 9
    }
    export enum ColorList {
        //% block="κόκκινο"
        red,
        //% block="πράσινο"
        green,
        //% block="μπλε"
        blue,
        //% block="θαλασσί"
        cyan,
        //% block="μωβ"
        magenta,
        //% block="κίτρινο"
        yellow,
        //% block="λευκό"
        white
    }

    export enum GasList {
        //% block="Co"
        Co,
        //% block="Co2"
        Co2,
        //% block="Καπνός"
        Smoke,
        //% block="Αλκοόλ"
        Alcohol
    }
    export enum DataUnit {
        //% block="Έτος"
        Year,
        //% block="Μήνας"
        Month,
        //% block="Ημέρα"
        Day,
        //% block="Ημέρα εβδομάδας"
        Weekday,
        //% block="Ώρα"
        Hour,
        //% block="Λεπτό"
        Minute,
        //% block="Δευτερόλεπτο"
        Second
    }

    export enum joyvalEnum {
        //% block="x"
        x,
        //% block="y"
        y
    }

    export enum joykeyEnum {
        //% block="πατημένο"
        pressed = 1,
        //% block="απάτητο"
        unpressed = 0
    }



    ///////////////////////////////////blocks/////////////////////////////
    //% blockId="readnoise" block="Τιμή από αισθητήρα θορύβου %Rjpin ένταση(dB)"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% subcategory=Sensor color=#E2C438 group="Analog"
    export function noiseSensor(Rjpin: AnalogRJPin): number {
        let pin = AnalogPin.P1
        pin = RJpin_to_analog(Rjpin)
        let level = 0, voltage = 0, noise = 0, h = 0, l = 0, sumh = 0, suml = 0
        for (let i = 0; i < 1000; i++) {
            level = level + pins.analogReadPin(pin)
        }
        level = level / 1000
        for (let i = 0; i < 1000; i++) {
            voltage = pins.analogReadPin(pin)
            if (voltage >= level) {
                h += 1
                sumh = sumh + voltage
            } else {
                l += 1
                suml = suml + voltage
            }
        }
        if (h == 0) {
            sumh = level
        } else {
            sumh = sumh / h
        }
        if (l == 0) {
            suml = level
        } else {
            suml = suml / l
        }
        noise = sumh - suml
        if (noise <= 4) {
            noise = pins.map(
                noise,
                0,
                4,
                30,
                50
            )
        } else if (noise <= 8) {
            noise = pins.map(
                noise,
                4,
                8,
                50,
                55
            )
        } else if (noise <= 14) {
            noise = pins.map(
                noise,
                9,
                14,
                55,
                60
            )
        } else if (noise <= 32) {
            noise = pins.map(
                noise,
                15,
                32,
                60,
                70
            )
        } else if (noise <= 60) {
            noise = pins.map(
                noise,
                33,
                60,
                70,
                75
            )
        } else if (noise <= 100) {
            noise = pins.map(
                noise,
                61,
                100,
                75,
                80
            )
        } else if (noise <= 150) {
            noise = pins.map(
                noise,
                101,
                150,
                80,
                85
            )
        } else if (noise <= 231) {
            noise = pins.map(
                noise,
                151,
                231,
                85,
                90
            )
        } else {
            noise = pins.map(
                noise,
                231,
                1023,
                90,
                120
            )
        }
        noise = Math.round(noise)
        return Math.round(noise)
    }
    //% blockId="lightSensor" block="Τιμή από αισθητήρα φωτός %Rjpin ένταση(lux)"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% subcategory=Sensor color=#E2C438 group="Analog"
    export function lightSensor(Rjpin: AnalogRJPin): number {
        let pin = AnalogPin.P1
        pin = RJpin_to_analog(Rjpin)
        let voltage = 0, lightintensity = 0;
        for (let index = 0; index < 100; index++) {
            voltage = voltage + pins.analogReadPin(pin)
        }
        voltage = voltage / 100
        if (voltage < 200) {
            voltage = Math.map(voltage, 0, 200, 0, 1600)
        }
        else {
            voltage = Math.map(voltage, 200, 1023, 1600, 14000)
        }
        if (voltage < 0) {
            voltage = 0
        }
        return Math.round(voltage)
    }
    //% blockId="readsoilmoisture" block="Τιμή από αισθητήρα υγρασίας %Rjpin (0~100)"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% subcategory=Sensor color=#E2C438 group="Analog"
    export function soilHumidity(Rjpin: AnalogRJPin): number {
        let voltage = 0, soilmoisture = 0;
        let pin = AnalogPin.P1
        pin = RJpin_to_analog(Rjpin)
        voltage = pins.map(
            pins.analogReadPin(pin),
            0,
            1023,
            0,
            100
        );
        soilmoisture = 100 - voltage;
        return Math.round(soilmoisture);
    }

    //% blockId="readwaterLevel" block="Τιμή από αισθητήρα στάθμης νερού %Rjpin (0~100)"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% subcategory=Sensor color=#E2C438 group="Analog"
    export function waterLevel(Rjpin: AnalogRJPin): number {
        let pin = AnalogPin.P1
        pin = RJpin_to_analog(Rjpin)
        let voltage = 0, waterlevel = 0;
        voltage = pins.map(
            pins.analogReadPin(pin),
            50,
            600,
            0,
            100
        );
        if (voltage < 0) {
            voltage = 0
        }
        waterlevel = voltage;
        return Math.round(waterlevel)
    }

    //% blockId="readUVLevel" block="Αισθητήρας UV %Rjpin επίπεδο(0~15)"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% subcategory=Sensor color=#E2C438 group="Analog"
    export function UVLevel(Rjpin: AnalogRJPin): number {
        let pin = AnalogPin.P1
        pin = RJpin_to_analog(Rjpin)
        let UVlevel = pins.analogReadPin(pin);
        if (UVlevel > 625) {
            UVlevel = 625
        }
        UVlevel = pins.map(
            UVlevel,
            0,
            625,
            0,
            15
        );
        return Math.round(UVlevel)
    }
    //% blockId="gasValue" block="Τιμή συγκέντρωσης %sensor από αισθητήρα αερίου %Rjpin "
    //% Rjpin.fieldEditor="gridpicker" Rjpin.fieldOptions.columns=2
    //% sensor.fieldEditor="gridpicker" sensor.fieldOptions.columns=2
    //% subcategory=Sensor color=#E2C438 group="Analog"
    export function gasValue(sensor: GasList, Rjpin: AnalogRJPin): number {
        let pin = AnalogPin.P1
        pin = RJpin_to_analog(Rjpin)
        if (sensor == GasList.Co2) {
            return 1024 - pins.analogReadPin(pin)
        }
        return pins.analogReadPin(pin)
    }

    //% blockId=Crash block="Πιέζεται ο αισθητήρας σύγκρουσης %Rjpin "
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% subcategory=Sensor group="Digital" color=#EA5532 
    export function Crash(Rjpin: DigitalRJPin): boolean {
        let pin = DigitalPin.P1
        pin = RJpin_to_digital(Rjpin)
        pins.setPull(pin, PinPullMode.PullUp)
        if (pins.digitalReadPin(pin) == 0) {
            return true
        }
        else {
            return false
        }
    }

    let distance_last = 0

    //% blockId=sonarbit block="Τιμή από αισθητήρα απόστασης (Ultrasonic) σε %distance_unit %Rjpin "
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% distance_unit.fieldEditor="gridpicker"
    //% distance_unit.fieldOptions.columns=2
    //% subcategory=Sensor group="Digital" color=#EA5532
    export function ultrasoundSensor(Rjpin: DigitalRJPin, distance_unit: Distance_Unit_List): number {
        let pinT = DigitalPin.P1
        let pinE = DigitalPin.P2
        switch (Rjpin) {
            case DigitalRJPin.J1:
                pinT = DigitalPin.P1
                pinE = DigitalPin.P8
                break;
            case DigitalRJPin.J2:
                pinT = DigitalPin.P2
                pinE = DigitalPin.P12
                break;
            case DigitalRJPin.J3:
                pinT = DigitalPin.P13
                pinE = DigitalPin.P14
                break;
            case DigitalRJPin.J4:
                pinT = DigitalPin.P15
                pinE = DigitalPin.P16
                break;
        }
        pins.setPull(pinT, PinPullMode.PullNone)
        pins.digitalWritePin(pinT, 0)
        control.waitMicros(2)
        pins.digitalWritePin(pinT, 1)
        control.waitMicros(10)
        pins.digitalWritePin(pinT, 0)

        // read pulse
        let d = pins.pulseIn(pinE, PulseValue.High, 25000)
        let version = control.hardwareVersion()
        let distance = d * 34 / 2 / 1000
        if (version == "1") {
            distance = distance * 3 / 2
        }

        if (distance > 430) {
            distance = 0
        }

        if (distance == 0) {
            distance = distance_last
            distance_last = 0
        }
        else {
            distance_last = distance
        }

        switch (distance_unit) {
            case Distance_Unit_List.Distance_Unit_cm:
                return Math.floor(distance)  //cm
                break
            case Distance_Unit_List.Distance_Unit_foot:
                return Math.floor(distance / 30.48)   //foot
                break
            default:
                return 0
        }
    }

    //% blockId="PIR" block="Ανιχνεύει κίνηση ο αισθητήρας PIR %Rjpin "
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% subcategory=Sensor group="Digital"  color=#EA5532
    export function PIR(Rjpin: DigitalRJPin): boolean {
        let pin = DigitalPin.P1
        pin = RJpin_to_digital(Rjpin)
        if (pins.digitalReadPin(pin) == 1) {
            return true
        }
        else {
            return false
        }
    }

    //% blockId="PM25" block="Τιμή από Αισθητήρα PM2.5 %Rjpin  (μg/m³)"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% subcategory=Sensor group="Digital" color=#EA5532
    export function PM25(Rjpin: DigitalRJPin): number {
        let pin = DigitalPin.P1
        let pm25 = 0
        pin = RJpin_to_digital(Rjpin)
        while (pins.digitalReadPin(pin) != 0) {
        }
        while (pins.digitalReadPin(pin) != 1) {
        }
        pm25 = input.runningTime()
        while (pins.digitalReadPin(pin) != 0) {
        }
        pm25 = input.runningTime() - pm25
        return pm25
    }

    //% blockId="readdust" block="Τιμή από αισθητήρα σκόνης %Rjpin (μg/m³)"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% subcategory=Sensor color=#E2C438 group="Analog"
    export function Dust(Rjpin: AnalogRJPin): number {
        let voltage = 0
        let dust = 0
        let vo_pin = AnalogPin.P1
        let vLED_pin = DigitalPin.P2
        switch (Rjpin) {
            case AnalogRJPin.J1:
                vo_pin = AnalogPin.P1
                vLED_pin = DigitalPin.P8
                break;
            case AnalogRJPin.J2:
                vo_pin = AnalogPin.P2
                vLED_pin = DigitalPin.P12
                break;

        }
        pins.digitalWritePin(vLED_pin, 0);
        control.waitMicros(160);
        voltage = pins.analogReadPin(vo_pin);
        control.waitMicros(100);
        pins.digitalWritePin(vLED_pin, 1);
        voltage = pins.map(
            voltage,
            0,
            1023,
            0,
            3100 / 2 * 3
        );
        dust = (voltage - 380) * 5 / 29;
        if (dust < 0) {
            dust = 0
        }
        return Math.round(dust)

    }

    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% subcategory=Sensor group="Digital" color=#EA5532
    //% blockId=tracking_sensor block="Ο αισθητήρας παρακολούθησης γραμμής %Rjpin είναι %state"
    export function trackingSensor(Rjpin: DigitalRJPin, state: TrackingStateType): boolean {
        let lpin = DigitalPin.P1
        let rpin = DigitalPin.P2
        switch (Rjpin) {
            case DigitalRJPin.J1:
                lpin = DigitalPin.P1
                rpin = DigitalPin.P8
                break;
            case DigitalRJPin.J2:
                lpin = DigitalPin.P2
                rpin = DigitalPin.P12
                break;
            case DigitalRJPin.J3:
                lpin = DigitalPin.P13
                rpin = DigitalPin.P14
                break;
            case DigitalRJPin.J4:
                lpin = DigitalPin.P15
                rpin = DigitalPin.P16
                break;
        }
        pins.setPull(lpin, PinPullMode.PullUp)
        pins.setPull(rpin, PinPullMode.PullUp)
        let lsensor = pins.digitalReadPin(lpin)
        let rsensor = pins.digitalReadPin(rpin)
        if (lsensor == 0 && rsensor == 0 && state == TrackingStateType.Tracking_State_0) {
            return true;
        } else if (lsensor == 0 && rsensor == 1 && state == TrackingStateType.Tracking_State_1) {
            return true;
        } else if (lsensor == 1 && rsensor == 0 && state == TrackingStateType.Tracking_State_2) {
            return true;
        } else if (lsensor == 1 && rsensor == 1 && state == TrackingStateType.Tracking_State_3) {
            return true;
        } else return false;
    }






    /**
    * Get gray value.The range is from 0 to 255.
    */
    //% channel.fieldEditor="gridpicker" channel.fieldOptions.columns=4
    //% subcategory=Sensor group="IIC Port"
    //% block="Κανάλι Trackbit %channel τιμή γκρι"
    export function TrackbitgetGray(channel: TrackbitChannel): number {
        pins.i2cWriteNumber(0x1a, channel, NumberFormat.Int8LE)
        return pins.i2cReadNumber(0x1a, NumberFormat.UInt8LE, false)
    }
    //% State.fieldEditor="gridpicker"
    //% State.fieldOptions.columns=4
    //% subcategory=Sensor group="IIC Port"
    //% block="Trackbit is %State"
    export function TrackbitState(State: TrackbitStateType): boolean {
        return TrackBit_state_value == State
    }
    //% state.fieldEditor="gridpicker" state.fieldOptions.columns=2
    //% channel.fieldEditor="gridpicker" channel.fieldOptions.columns=4
    //% subcategory=Sensor group="IIC Port"
    //% block="Trackbit channel %channel is %state"
    export function TrackbitChannelState(channel: TrackbitChannel, state: TrackbitType): boolean {
        let TempVal: number = 0
        pins.i2cWriteNumber(0x1a, 4, NumberFormat.Int8LE)
        TempVal = pins.i2cReadNumber(0x1a, NumberFormat.UInt8LE, false)
        if (state == TrackbitType.State_1)
            if (TempVal & 1 << channel) {
                return true
            }
            else {
                return false
            }
        else {
            if (TempVal & 1 << channel) {
                return false
            }
            else {
                return true
            }
        }
    }

    //% deprecated=true
    //% channel.fieldEditor="gridpicker" channel.fieldOptions.columns=4
    //% detect_target.fieldEditor="gridpicker" detect_target.fieldOptions.columns=2
    //% subcategory=Sensor group="IIC Port"
    //% block="Trackbit Init_Sensor_Val channel %channel detection target %detect_target value"
    export function Trackbit_Init_Sensor_Val(channel: TrackbitChannel, detect_target: TrackBit_gray): number {
        let Init_Sensor_Val = pins.createBuffer(8)
        pins.i2cWriteNumber(0x1a, 5, NumberFormat.Int8LE)
        Init_Sensor_Val = pins.i2cReadBuffer(0x1a, 8)
        return Init_Sensor_Val[channel + detect_target]
    }


    //% deprecated=true
    //% val.min=0 val.max=255
    //% subcategory=Sensor group="IIC Port"
    //% block="Set Trackbit learn fail value %val"
    export function Trackbit_learn_fail_value(val: number) {
        pins.i2cWriteNumber(0x1a, 6, NumberFormat.Int8LE)
        pins.i2cWriteNumber(0x1a, val, NumberFormat.Int8LE)
    }

    /**
    * Gets the position offset.The range is from -3000 to 3000.
    */
    //% sensor_number.fieldEditor="gridpicker" sensor_number.fieldOptions.columns=2
    //% subcategory=Sensor group="IIC Port"
    //% block="Trackbit sensor offset value"
    export function TrackBit_get_offset(): number {
        let offset: number
        pins.i2cWriteNumber(0x1a, 5, NumberFormat.Int8LE)
        const offsetH = pins.i2cReadNumber(0x1a, NumberFormat.UInt8LE, false)
        pins.i2cWriteNumber(0x1a, 6, NumberFormat.Int8LE)
        const offsetL = pins.i2cReadNumber(0x1a, NumberFormat.UInt8LE, false)
        offset = (offsetH << 8) | offsetL
        offset = Math.map(offset, 0, 6000, -3000, 3000)
        return offset;
    }

    //% subcategory=Sensor group="IIC Port"
    //% block="Get a Trackbit state value"
    export function Trackbit_get_state_value() {
        pins.i2cWriteNumber(0x1a, 4, NumberFormat.Int8LE)
        TrackBit_state_value = pins.i2cReadNumber(0x1a, NumberFormat.UInt8LE, false)
        basic.pause(5);
    }

    function waitDigitalReadPin(state: number, timeout: number, pin: DigitalPin) {
        while (pins.digitalReadPin(pin) != state) {
            if (!(--timeout)) {
                return 0
            }
        };
        return 1
    }

    function delay_us(us: number) {
        // control.waitMicros(us)
        let time = input.runningTimeMicros() + us;
        while (input.runningTimeMicros() < time);
    }

    //% blockId="readdht11" block="Τιμή %dht11state από αισθητήρα DHT11 %Rjpin"
    //% Rjpin.fieldEditor="gridpicker" dht11state.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2 dht11state.fieldOptions.columns=1
    //% subcategory=Sensor group="Digital" color=#EA5532
    export function dht11Sensor(Rjpin: DigitalRJPin, dht11state: DHT11_state): number {
        //initialize
        if (__dht11_last_read_time != 0 && __dht11_last_read_time + 1000 > input.runningTime()) {
            switch (dht11state) {
                case DHT11_state.DHT11_temperature_C:
                    return __temperature
                case DHT11_state.DHT11_humidity:
                    return __humidity
            }
        }
        let fail_flag: number = 0
        let pin = DigitalPin.P1
        pin = RJpin_to_digital(Rjpin)
        pins.setPull(pin, PinPullMode.PullUp)
        for (let count = 0; count < (__dht11_last_read_time == 0 ? 50 : 10); count++) {
            if (count != 0) {
                basic.pause(5);
            }
            fail_flag = 0;
            // 拉高1us后拉低代表重置
            pins.digitalWritePin(pin, 1)
            delay_us(1)
            pins.digitalWritePin(pin, 0)
            basic.pause(18)
            // 等待18ms后拉高代表开始
            pins.digitalWritePin(pin, 1) //pull up pin for 18us
            delay_us(30)
            pins.digitalReadPin(pin);
            if (!(waitDigitalReadPin(1, 9999, pin))) continue;
            if (!(waitDigitalReadPin(0, 9999, pin))) continue;
            //read data (5 bytes)
            let data_arr = [0, 0, 0, 0, 0];
            let i, j;
            for (i = 0; i < 5; i++) {
                for (j = 0; j < 8; j++) {
                    if (!(waitDigitalReadPin(0, 9999, pin))) {
                        fail_flag = 1
                        break;
                    }
                    if (!(waitDigitalReadPin(1, 9999, pin))) {
                        fail_flag = 1
                        break;
                    }
                    delay_us(40)
                    //if sensor still pull up data pin after 28 us it means 1, otherwise 0
                    if (pins.digitalReadPin(pin) == 1) {
                        data_arr[i] |= 1 << (7 - j)
                    }
                }
                if (fail_flag) break;
            }
            if (fail_flag) {
                continue;
            };

            if (data_arr[4] == ((data_arr[0] + data_arr[1] + data_arr[2] + data_arr[3]) & 0xFF)) {
                __temperature = data_arr[2] + data_arr[3] / 10
                __humidity = data_arr[0] + data_arr[1] / 10
                __dht11_last_read_time = input.runningTime();
                break;
            }
            fail_flag = 1;
        }
        switch (dht11state) {
            case DHT11_state.DHT11_temperature_C:
                return __temperature
            case DHT11_state.DHT11_humidity:
                return __humidity
        }
        return 0
    }
    //% blockID="set_all_data" block="RTC IIC port set %data | %num"
    //% subcategory=Sensor group="IIC Port"
    export function setData(data: DataUnit, num: number): void {
        switch (data) {
            case DataUnit.Year:
                rtc_setReg(DS1307_REG_YEAR, DecToHex(num % 100));
                break;
            case DataUnit.Month:
                rtc_setReg(DS1307_REG_MONTH, DecToHex(num % 13));
                break;
            case DataUnit.Day:
                rtc_setReg(DS1307_REG_DAY, DecToHex(num % 32));
                break;
            case DataUnit.Weekday:
                rtc_setReg(DS1307_REG_WEEKDAY, DecToHex(num % 8))
                break;
            case DataUnit.Hour:
                rtc_setReg(DS1307_REG_HOUR, DecToHex(num % 24));
                break;
            case DataUnit.Minute:
                rtc_setReg(DS1307_REG_MINUTE, DecToHex(num % 60));
                break;
            case DataUnit.Second:
                rtc_setReg(DS1307_REG_SECOND, DecToHex(num % 60))
                break;
            default:
                break;
        }
        start();
    }
    //% blockID="get_one_data" block="RTC IIC port get %data"
    //% subcategory=Sensor group="IIC Port"
    export function readData(data: DataUnit): number {
        switch (data) {
            case DataUnit.Year:
                return Math.min(HexToDec(rtc_getReg(DS1307_REG_YEAR)), 99) + 2000
                break;
            case DataUnit.Month:
                return Math.max(Math.min(HexToDec(rtc_getReg(DS1307_REG_MONTH)), 12), 1)
                break;
            case DataUnit.Day:
                return Math.max(Math.min(HexToDec(rtc_getReg(DS1307_REG_DAY)), 31), 1)
                break;
            case DataUnit.Weekday:
                return Math.max(Math.min(HexToDec(rtc_getReg(DS1307_REG_WEEKDAY)), 7), 1)
                break;
            case DataUnit.Hour:
                return Math.min(HexToDec(rtc_getReg(DS1307_REG_HOUR)), 23)
                break;
            case DataUnit.Minute:
                return Math.min(HexToDec(rtc_getReg(DS1307_REG_MINUTE)), 59)
                break;
            case DataUnit.Second:
                return Math.min(HexToDec(rtc_getReg(DS1307_REG_SECOND)), 59)
                break;
            default:
                return 0

        }
    }
    //% block="BME280 sensor IIC port value %state"
    //% state.fieldEditor="gridpicker" state.fieldOptions.columns=1
    //% subcategory=Sensor  group="IIC Port"
    export function bme280Sensor(state: BME280_state): number {
        getBme280Value();
        switch (state) {
            case BME280_state.BME280_temperature_C:
                return Math.round(T);
                break;
            case BME280_state.BME280_humidity:
                return Math.round(H);
                break;
            case BME280_state.BME280_pressure:
                return Math.round(P / 100);
                break;
            case BME280_state.BME280_altitude:
                return Math.round(1022 - (P / 100)) * 9
                break;
            default:
                return 0
        }
        return 0;
    }
    export class PAJ7620 {
        private paj7620WriteReg(addr: number, cmd: number) {
            let buf: Buffer = pins.createBuffer(2);
            buf[0] = addr;
            buf[1] = cmd;
            pins.i2cWriteBuffer(0x73, buf, false);
        }
        private paj7620ReadReg(addr: number): number {
            let buf: Buffer = pins.createBuffer(1);
            buf[0] = addr;
            pins.i2cWriteBuffer(0x73, buf, false);
            buf = pins.i2cReadBuffer(0x73, 1, false);
            return buf[0];
        }
        private paj7620SelectBank(bank: number) {
            if (bank == 0) this.paj7620WriteReg(0xEF, 0);
            else if (bank == 1) this.paj7620WriteReg(0xEF, 1);
        }
        private paj7620Init() {
            let temp = 0;
            this.paj7620SelectBank(0);
            temp = this.paj7620ReadReg(0);
            if (temp == 0x20) {
                for (let i = 0; i < 438; i += 2) {
                    this.paj7620WriteReg(initRegisterArray[i], initRegisterArray[i + 1]);
                }
            }
            this.paj7620SelectBank(0);
        }
        init() {
            this.paj7620Init();
            basic.pause(200);
        }
        read(): number {
            let data = 0, result = 0;
            data = this.paj7620ReadReg(0x43);
            switch (data) {
                case 0x01:
                    result = GestureType.Right;
                    break;
                case 0x02:
                    result = GestureType.Left;
                    break;
                case 0x04:
                    result = GestureType.Up;
                    break;
                case 0x08:
                    result = GestureType.Down;
                    break;
                case 0x10:
                    result = GestureType.Forward;
                    break;
                case 0x20:
                    result = GestureType.Backward;
                    break;
                case 0x40:
                    result = GestureType.Clockwise;
                    break;
                case 0x80:
                    result = GestureType.Anticlockwise;
                    break;
                default:
                    data = this.paj7620ReadReg(0x44);
                    if (data == 0x01)
                        result = GestureType.Wave;
                    break;
            }
            return result;
        }
    }
    const gestureEventId = 3100;
    let lastGesture = GestureType.None;
    let paj7620 = new PAJ7620();
    //% blockId= gesture_create_event block="Η θύρα IIC του αισθητήρα χειρονομίας είναι %gesture"
    //% gesture.fieldEditor="gridpicker" gesture.fieldOptions.columns=3
    //% subcategory=Sensor group="IIC Port"
    export function onGesture(gesture: GestureType, handler: () => void) {
        control.onEvent(gestureEventId, gesture, handler);
        if (gesture_first_init) {
            paj7620.init();
            gesture_first_init = false
        }
        control.inBackground(() => {
            while (true) {
                const gesture = paj7620.read();
                if (gesture != lastGesture) {
                    lastGesture = gesture;
                    control.raiseEvent(gestureEventId, lastGesture);
                }
                basic.pause(200);
            }
        })
    }

    //% blockId= gesture_create_event block="Στην έναρξη χειρονομίας"
    //% gesture.fieldEditor="gridpicker" gesture.fieldOptions.columns=3
    //% subcategory=Sensor group="IIC Port"
    function onGestureInit() {
        paj7620.init();
    }

    //% deprecated=true
    //% subcategory=Sensor group="IIC Port"
    //% block="MLX90615 Infra Temp sensor IIC port %target Unit %Unit"
    export function MLX90615tempe(target: targetList, Unit: UnitList): number {
        let retemp = 0
        switch (target) {
            case targetList.human_body:
                retemp = readdata(humanbody_Addr) + 3;
                if (Unit == 1) {
                    retemp = retemp * 9 / 5 + 32
                }
                break;
            case targetList.environment:
                retemp = readdata(environment_Addr) - 5;
                if (Unit == 1) {
                    retemp = retemp * 9 / 5 + 32
                }
                break;
            default:
                retemp = 0;
        }
        return Math.round(retemp * 100) / 100
    }
    //% blockId=apds9960_readcolor block="Χρώμα από αισθητήρα χρώματος στη θύρα IIC HUE(0~360)"
    //% subcategory=Sensor group="IIC Port"
    export function readColor(): number {
        let buf = pins.createBuffer(2)
        let c = 0
        let r = 0
        let g = 0
        let b = 0
        let temp_c = 0
        let temp_r = 0
        let temp_g = 0
        let temp_b = 0
        let temp = 0

        if (color_new_init == false && color_first_init == false) {
            let i = 0;
            while (i++ < 20) {
                buf[0] = 0x81
                buf[1] = 0xCA
                pins.i2cWriteBuffer(0x43, buf)
                buf[0] = 0x80
                buf[1] = 0x17
                pins.i2cWriteBuffer(0x43, buf)
                basic.pause(50);

                if ((i2cread_color(0x43, 0xA4) + i2cread_color(0x43, 0xA5) * 256) != 0) {
                    color_new_init = true
                    break;
                }
            }
        }
        if (color_new_init == true) {
            basic.pause(100);
            c = i2cread_color(0x43, 0xA6) + i2cread_color(0x43, 0xA7) * 256;
            r = i2cread_color(0x43, 0xA0) + i2cread_color(0x43, 0xA1) * 256;
            g = i2cread_color(0x43, 0xA2) + i2cread_color(0x43, 0xA3) * 256;
            b = i2cread_color(0x43, 0xA4) + i2cread_color(0x43, 0xA5) * 256;

            r *= 1.3 * 0.47 * 0.83
            g *= 0.69 * 0.56 * 0.83
            b *= 0.80 * 0.415 * 0.83
            c *= 0.3

            if (r > b && r > g) {
                b *= 1.18;
                g *= 0.95
            }

            temp_c = c
            temp_r = r
            temp_g = g
            temp_b = b

            r = Math.min(r, 4095.9356)
            g = Math.min(g, 4095.9356)
            b = Math.min(b, 4095.9356)
            c = Math.min(c, 4095.9356)

            if (temp_b < temp_g) {
                temp = temp_b
                temp_b = temp_g
                temp_g = temp
            }
        }
        else {
            if (color_first_init == false) {
                initModule()
                colorMode()
            }
            let tmp = i2cread_color(APDS9960_ADDR, APDS9960_STATUS) & 0x1;
            while (!tmp) {
                basic.pause(5);
                tmp = i2cread_color(APDS9960_ADDR, APDS9960_STATUS) & 0x1;
            }
            c = i2cread_color(APDS9960_ADDR, APDS9960_CDATAL) + i2cread_color(APDS9960_ADDR, APDS9960_CDATAH) * 256;
            r = i2cread_color(APDS9960_ADDR, APDS9960_RDATAL) + i2cread_color(APDS9960_ADDR, APDS9960_RDATAH) * 256;
            g = i2cread_color(APDS9960_ADDR, APDS9960_GDATAL) + i2cread_color(APDS9960_ADDR, APDS9960_GDATAH) * 256;
            b = i2cread_color(APDS9960_ADDR, APDS9960_BDATAL) + i2cread_color(APDS9960_ADDR, APDS9960_BDATAH) * 256;
        }

        serial.writeNumber(r)
        serial.writeLine("r")
        serial.writeNumber(g)
        serial.writeLine("g")
        serial.writeNumber(b)
        serial.writeLine("b")
        serial.writeNumber(c)
        serial.writeLine("c")

        // map to rgb based on clear channel
        let avg = c / 3;
        r = r * 255 / avg;
        g = g * 255 / avg;
        b = b * 255 / avg;
        //let hue = rgb2hue(r, g, b);
        let hue = rgb2hsl(r, g, b)
        if (color_new_init == true && hue >= 180 && hue <= 201 && temp_c >= 6000 && (temp_b - temp_g) < 1000 || (temp_r > 4096 && temp_g > 4096 && temp_b > 4096)) {
            temp_c = Math.map(temp_c, 0, 15000, 0, 13000);
            hue = 180 + (13000 - temp_c) / 1000.0;
        }
        return hue
    }
    //% block="Ο αισθητήρας χρώματος στη θύρα IIC ανιχνεύει %color"
    //% subcategory=Sensor group="IIC Port"
    //% color.fieldEditor="gridpicker" color.fieldOptions.columns=3
    export function checkColor(color: ColorList): boolean {
        let hue = readColor()
        switch (color) {
            case ColorList.red:
                if (hue > 330 || hue < 20) {
                    return true
                }
                else {
                    return false
                }
                break
            case ColorList.green:
                if (hue > 120 && 180 > hue) {
                    return true
                }
                else {
                    return false
                }
                break
            case ColorList.blue:
                if (hue > 210 && 270 > hue) {
                    return true
                }
                else {
                    return false
                }
                break
            case ColorList.cyan:
                if (hue > 190 && 210 > hue) {
                    return true
                }
                else {
                    return false
                }
                break
            case ColorList.magenta:
                if (hue > 260 && 330 > hue) {
                    return true
                }
                else {
                    return false
                }
                break
            case ColorList.yellow:
                if (hue > 30 && 120 > hue) {
                    return true
                }
                else {
                    return false
                }
                break
            case ColorList.white:
                if (hue >= 180 && 190 > hue) {
                    return true
                }
                else {
                    return false
                }
                break
        }
    }

    //% block="Ο αισθητήρα; RFID διαβάζει δεδομένα από την κάρτα στη Θύρα IIC"
    //% subcategory=Sensor group="IIC Port"
    export function readDataBlock(): string {
        if (NFC_ENABLE === 0) {
            wakeup();
        }

        if (NFC_ENABLE === 2) {
            return WS1850_Read();
        }

        if (checkCard() === false) {
            serial.writeLine("No NFC Card!")
            return ""
        }
        if (!passwdCheck(uId, passwdBuf)) {
            serial.writeLine("passwd error!")
            return "";
        }
        let cmdRead: number[] = []
        cmdRead = [0x00, 0x00, 0xff, 0x05, 0xfb, 0xD4, 0x40, 0x01, 0x30, 0x07, 0xB4, 0x00];
        let sum = 0, count = 0;
        cmdRead[9] = block_def;
        for (let i = 0; i < cmdRead.length - 2; i++) {
            if ((i === 3) || (i === 4)) {
                continue;
            }
            sum += cmdRead[i];
        }
        cmdRead[cmdRead.length - 2] = 0xff - sum & 0xff;
        let buf = pins.createBufferFromArray(cmdRead)
        writeAndReadBuf(buf, 31);
        let ret = "";
        if ((recvBuf[6] === 0xD5) && (recvBuf[7] === 0x41) && (recvBuf[8] === 0x00) && (checkDcs(31 - 4))) {
            for (let i = 0; i < 16; i++) {
                if (recvBuf[i + 9] >= 0x20 && recvBuf[i + 9] < 0x7f) {
                    ret += String.fromCharCode(recvBuf[i + 9]) // valid ascii
                }
            }
            return ret;
        }
        return ""
    }
    //% block="Εγγραφή %data στην κάρτα"
    //% subcategory=Sensor group="IIC Port"
    export function writeData(data: string): void {
        if (NFC_ENABLE === 0) {
            wakeup();
        }
        if (NFC_ENABLE === 2) {
            WS1850_Write(data);
            return;
        }
        let len = data.length
        if (len > 16) {
            len = 16
        }
        for (let i = 0; i < len; i++) {
            blockData[i] = data.charCodeAt(i)
        }
        writeblock(blockData);
    }
    //% block="RFID sensor IIC port Detect Card"
    //% subcategory=Sensor group="IIC Port"
    export function checkCard(): boolean {
        if (NFC_ENABLE === 0) {
            wakeup();
        }
        if (NFC_ENABLE === 2) {
            return WS1850_scan();
        }

        let buf: number[] = [];
        buf = [0x00, 0x00, 0xFF, 0x04, 0xFC, 0xD4, 0x4A, 0x01, 0x00, 0xE1, 0x00];
        let cmdUid = pins.createBufferFromArray(buf);
        writeAndReadBuf(cmdUid, 24);
        for (let i = 0; i < 4; i++) {
            if (recvAck[1 + i] != ackBuf[i]) {
                return false;
            }
        }
        if ((recvBuf[6] != 0xD5) || (!checkDcs(24 - 4))) {
            return false;
        }
        for (let i = 0; i < uId.length; i++) {
            uId[i] = recvBuf[14 + i];
        }
        if (uId[0] === uId[1] && uId[1] === uId[2] && uId[2] === uId[3] && uId[3] === 0xFF) {
            return false;
        }
        return true;
    }

    //% deprecated=true
    //% blockId="readdht20" block="Τιμή από αισθητήρα DHT20 %dht20state "
    //% dht20state.fieldEditor="gridpicker"
    //% dht20state.fieldOptions.columns=1
    //% subcategory=Sensor group="IIC Port"
    export function dht20Sensor(dht20state: DHT20_state): number {
        let temp, temp1, rawData = 0;
        let temperature, humidity = 0;
        DHT20WriteBuff[0] = 0xAC;
        DHT20WriteBuff[1] = 0x33;
        DHT20WriteBuff[2] = 0x00;
        pins.i2cWriteBuffer(DHT20_Addr, DHT20WriteBuff);
        basic.pause(80)
        DHT20ReadBuff = pins.i2cReadBuffer(DHT20_Addr, 6)

        rawData = 0;
        if (dht20state == DHT20_state.DHT20_temperature_C) {
            temp = DHT20ReadBuff[3] & 0xff;
            temp1 = DHT20ReadBuff[4] & 0xff;
            rawData = ((temp & 0xf) << 16) + (temp1 << 8) + (DHT20ReadBuff[5]);
            temperature = rawData / 5242 - 50;
            temperature = temperature * 100
            return Math.round(temperature) / 100;
        }
        else {
            temp = DHT20ReadBuff[1] & 0xff;
            temp1 = DHT20ReadBuff[2] & 0xff;
            rawData = (temp << 12) + (temp1 << 4) + ((DHT20ReadBuff[3] & 0xf0) >> 4);
            humidity = rawData / 0x100000;
            humidity = humidity * 10000
            return Math.round(humidity) / 100;
        }
    }

    //% deprecated=true
    //% block="Τιμή από joystick %state"
    //% state.fieldEditor="gridpicker"
    //% state.fieldOptions.columns=2
    //% subcategory=Sensor group="IIC Port"
    export function joystickval(state: joyvalEnum): number {
        let buff = pins.createBuffer(3)
        let x_val, y_val
        buff = pins.i2cReadBuffer(0xaa, 3)
        if (state == joyvalEnum.x) {
            x_val = buff[0] * 4 - 512
            if (x_val > -10 && x_val < 10) {
                x_val = 0
            }
            return x_val
        }
        else {
            y_val = buff[1] * 4 - 512
            if (y_val > -10 && y_val < 10) {
                y_val = 0
            }
            return y_val
        }
        return 0
    }

    //% deprecated=true
    //% block="joystick sensor %key key"
    //% key.fieldEditor="gridpicker"
    //% key.fieldOptions.columns=2
    //% subcategory=Sensor group="IIC Port"
    export function joystickkey(key: joykeyEnum): boolean {
        let buff = pins.createBuffer(3)
        buff = pins.i2cReadBuffer(0xaa, 3)
        return key == buff[2]
    }

    //% blockId="potentiometer" block="Trimpot %Rjpin analog value"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% subcategory=Input color=#E2C438 group="Analog"
    export function trimpot(Rjpin: AnalogRJPin): number {
        let pin = AnalogPin.P1
        pin = RJpin_to_analog(Rjpin)
        return pins.analogReadPin(pin)
    }
    //% blockId=buttonab block="Το Button %button στη %Rjpin είναι πατημένο;"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% button.fieldEditor="gridpicker"
    //% button.fieldOptions.columns=1
    //% subcategory=Input group="Digital" color=#EA5532
    export function buttonCD(Rjpin: DigitalRJPin, button: ButtonStateList): boolean {
        let pinC = DigitalPin.P1
        let pinD = DigitalPin.P2
        switch (Rjpin) {
            case DigitalRJPin.J1:
                pinC = DigitalPin.P1
                pinD = DigitalPin.P8
                break;
            case DigitalRJPin.J2:
                pinC = DigitalPin.P2
                pinD = DigitalPin.P12
                break;
            case DigitalRJPin.J3:
                pinC = DigitalPin.P13
                pinD = DigitalPin.P14
                break;
            case DigitalRJPin.J4:
                pinC = DigitalPin.P15
                pinD = DigitalPin.P16
                break;
        }
        pins.setPull(pinC, PinPullMode.PullUp)
        pins.setPull(pinD, PinPullMode.PullUp)
        if (pins.digitalReadPin(pinD) == 0 && pins.digitalReadPin(pinC) == 0 && button == ButtonStateList.CD) {
            return true
        }
        else if (pins.digitalReadPin(pinC) == 0 && pins.digitalReadPin(pinD) == 1 && button == ButtonStateList.C) {
            return true
        }
        else if (pins.digitalReadPin(pinD) == 0 && pins.digitalReadPin(pinC) == 1 && button == ButtonStateList.D) {
            return true
        }
        else {
            return false
        }
    }

    export enum ButtonState {
        //% block="ανοιχτό"
        on = 1,
        //% block="κλειστό"
        off = 2
    }

    const buttonEventSource = 5000
    const buttonEventValue = {
        CD_pressed: ButtonState.on,
        CD_unpressed: ButtonState.off
    }

    //% block="Στο πάτημα του button %button στη %Rjpin"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% button.fieldEditor="gridpicker"
    //% button.fieldOptions.columns=1
    //% subcategory=Input group="Digital" color=#EA5532
    export function buttonEvent(Rjpin: DigitalRJPin, button: ButtonStateList, handler: () => void) {
        let ButtonPin_C = DigitalPin.P1
        let ButtonPin_D = DigitalPin.P2
        let pinEventSource_C = EventBusSource.MICROBIT_ID_IO_P0
        let pinEventSource_D = EventBusSource.MICROBIT_ID_IO_P1
        switch (Rjpin) {
            case DigitalRJPin.J1:
                ButtonPin_C = DigitalPin.P1
                ButtonPin_D = DigitalPin.P8
                pinEventSource_C = EventBusSource.MICROBIT_ID_IO_P1
                pinEventSource_D = EventBusSource.MICROBIT_ID_IO_P8
                break;
            case DigitalRJPin.J2:
                ButtonPin_C = DigitalPin.P2
                ButtonPin_D = DigitalPin.P12
                pinEventSource_C = EventBusSource.MICROBIT_ID_IO_P2
                pinEventSource_D = EventBusSource.MICROBIT_ID_IO_P12
                break;
            case DigitalRJPin.J3:
                ButtonPin_C = DigitalPin.P13
                ButtonPin_D = DigitalPin.P14
                pinEventSource_C = EventBusSource.MICROBIT_ID_IO_P13
                pinEventSource_D = EventBusSource.MICROBIT_ID_IO_P14
                break;
            case DigitalRJPin.J4:
                ButtonPin_C = DigitalPin.P15
                ButtonPin_D = DigitalPin.P16
                pinEventSource_C = EventBusSource.MICROBIT_ID_IO_P15
                pinEventSource_D = EventBusSource.MICROBIT_ID_IO_P16
                break;
        }
        if (button == ButtonStateList.C) {
            pins.setPull(ButtonPin_C, PinPullMode.PullUp)
            pins.setEvents(ButtonPin_C, PinEventType.Edge)
            control.onEvent(pinEventSource_C, EventBusValue.MICROBIT_PIN_EVT_RISE, handler)
        }
        else if (button == ButtonStateList.D) {
            pins.setPull(ButtonPin_D, PinPullMode.PullUp)
            pins.setEvents(ButtonPin_D, PinEventType.Edge)
            control.onEvent(pinEventSource_D, EventBusValue.MICROBIT_PIN_EVT_RISE, handler)
        }
        else if (button == ButtonStateList.CD) {
            loops.everyInterval(50, function () {
                if (pins.digitalReadPin(ButtonPin_C) == 0 && pins.digitalReadPin(ButtonPin_D) == 0) {
                    control.raiseEvent(buttonEventSource, buttonEventValue.CD_pressed)
                }
            })
            control.onEvent(buttonEventSource, buttonEventValue.CD_pressed, handler)
        }
    }

    //% blockId=fans block="Εναλλαγή %Rjpin ανεμιστήρα κινητήρα σε $fanstate || ταχύτητα %speed \\%"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% fanstate.shadow="toggleOnOff"
    //% subcategory=Execute group="Digital" color=#EA5532
    //% speed.min=0 speed.max=100 speed.defl=50
    //% expandableArgumentMode="toggle"
    export function motorFan(Rjpin: DigitalRJPin, fanstate: boolean, speed: number = 100): void {
        let pin = AnalogPin.P1
        switch (Rjpin) {
            case DigitalRJPin.J1:
                pin = AnalogPin.P1
                break;
            case DigitalRJPin.J2:
                pin = AnalogPin.P2
                break;
            case DigitalRJPin.J3:
                pin = AnalogPin.P13
                break;
            case DigitalRJPin.J4:
                pin = AnalogPin.P15
                break;
        }
        if (fanstate) {
            pins.analogSetPeriod(pin, 100)
            pins.analogWritePin(pin, Math.map(speed, 0, 100, 0, 1023))
        }
        else {
            pins.analogWritePin(pin, 0)
            speed = 0
        }
    }

    //% blockId=laserSensor block="Εναλλαγή Laser %Rjpin σε $laserstate"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% laserstate.shadow="toggleOnOff"
    //% subcategory=Execute group="Digital" color=#EA5532
    export function laserSensor(Rjpin: DigitalRJPin, laserstate: boolean): void {
        let pin = DigitalPin.P1
        pin = RJpin_to_digital(Rjpin)
        if (laserstate) {
            pins.digitalWritePin(pin, 1)
        }
        else {
            pins.digitalWritePin(pin, 0)
        }
    }

    //% blockId=magnet block="Εναλλαγή μαγνήτη %Rjpin σε $magnetstate"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% magnetstate.shadow="toggleOnOff"
    //% subcategory=Execute group="Digital" color=#EA5532
    export function magnet(Rjpin: DigitalRJPin, magnetstate: boolean): void {
        let pin = AnalogPin.P1
        switch (Rjpin) {
            case DigitalRJPin.J1:
                pin = AnalogPin.P1
                break;
            case DigitalRJPin.J2:
                pin = AnalogPin.P2
                break;
            case DigitalRJPin.J3:
                pin = AnalogPin.P13
                break;
            case DigitalRJPin.J4:
                pin = AnalogPin.P15
                break;
        }
        if (magnetstate) {
            pins.digitalWritePin(pin, 1)
        }
        else {
            pins.digitalWritePin(pin, 0)
        }
    }

    //% deprecated=true
    //% blockId=Relay block="Εναλλαγή ρελέ %Rjpin σε %Relaystate"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% Relaystate.fieldEditor="gridpicker"
    //% Relaystate.fieldOptions.columns=1
    //% subcategory=Execute group="Digital" color=#EA5532
    export function Relay(Rjpin: DigitalRJPin, Relaystate: RelayStateList): void {
        let pin = DigitalPin.P1
        pin = RJpin_to_digital(Rjpin)
        switch (Relaystate) {
            case RelayStateList.On:
                pins.digitalWritePin(pin, 0)
                break;
            case RelayStateList.Off:
                pins.digitalWritePin(pin, 1)
                break;
        }
    }

    //% blockId="setLoopFolder" block="Αναπαραγωγή όλων των MP3 στον φάκελο:$folderNum"
    //% folderNum.defl="01"
    //% subcategory=Execute group="MP3" color=#EA5532
    export function setLoopFolder(folderNum: string): void {
        CMD = 0x17
        para1 = 0
        para2 = parseInt(folderNum)
        dataArr[3] = CMD
        dataArr[5] = para1
        dataArr[6] = para2
        mp3_checkSum()
        mp3_sendData()
    }

    //% blockId="folderPlay" 
    //% block="Αναπαράγή του mp3 στον φάκελο:$folderNum όνομα αρχείου:$fileNum || repeatList: $myAns"
    //% folderNum.defl="01" fileNum.defl="001"
    //% myAns.shadow="toggleYesNo"
    //% expandableArgumentMode="toggle"
    //% subcategory=Execute group="MP3" color=#EA5532
    export function folderPlay(folderNum: string, fileNum: string, myAns: boolean = false): void {
        CMD = 0x0F
        para1 = parseInt(folderNum)
        para2 = parseInt(fileNum)
        dataArr[3] = CMD
        dataArr[5] = para1
        dataArr[6] = para2
        mp3_checkSum()
        mp3_sendData()
        if (myAns)
            execute(0x19)
    }

    //% blockId="setTracking" 
    //% block="Αναπαραγωγή του mp3 με τη σειρά:%tracking || repeatList: $myAns"
    //% myAns.shadow="toggleYesNo"
    //% tracking.defl=1
    //% expandableArgumentMode="toggle"
    //% subcategory=Execute group="MP3" color=#EA5532
    export function setTracking(tracking: number, myAns: boolean = false): void {
        CMD = 0x03
        para1 = 0x00
        para2 = tracking
        dataArr[3] = CMD
        dataArr[5] = para1
        dataArr[6] = para2
        mp3_checkSum()
        mp3_sendData()
        execute(0x0D)
        if (myAns)
            execute(0x19)
    }
    //% blockId=MP3execute block="Ορισμός διαδικασίας εκτέλεσης MP3:%myType"
    //% myType.fieldEditor="gridpicker"
    //% myType.fieldOptions.columns=2
    //% subcategory=Execute group="MP3" color=#EA5532
    export function execute(myType: playType): void {
        CMD = myType
        para1 = 0x00
        para2 = 0x00
        dataArr[3] = CMD
        dataArr[5] = para1
        dataArr[6] = para2
        mp3_checkSum()
        mp3_sendData()
    }
    //% blockId="setVolume" block="Rύθμιση έντασης ήχου(0~25):%volume"
    //% volume.min=0 volume.max=25
    //% subcategory=Execute group="MP3" color=#EA5532
    export function setVolume(volume: number): void {
        if (volume > 25) {
            volume = 25
        }
        CMD = 0x06
        para1 = 0
        para2 = volume
        dataArr[3] = CMD
        dataArr[5] = para1
        dataArr[6] = para2
        mp3_checkSum()
        mp3_sendData()
    }
    //% blockId=MP3setPort block="Ρυθμίστε τη θύρα MP3 σε %Rjpin"
    //% Rjpin.fieldEditor="gridpicker"
    //% Rjpin.fieldOptions.columns=2
    //% subcategory=Execute group="MP3" color=#EA5532
    export function MP3SetPort(Rjpin: DigitalRJPin): void {
        let pin = SerialPin.USB_TX
        switch (Rjpin) {
            case DigitalRJPin.J1:
                pin = SerialPin.P8
                break;
            case DigitalRJPin.J2:
                pin = SerialPin.P12
                break;
            case DigitalRJPin.J3:
                pin = SerialPin.P14
                break;
            case DigitalRJPin.J4:
                pin = SerialPin.P16
                break;
        }
        serial.redirect(
            pin,
            SerialPin.USB_RX,
            BaudRate.BaudRate9600
        )
        setVolume(25)
    }

    export enum value_level {
        /**
         * Attention greater than 35
         */
        //% block="⬆"
        UP = 5,
        /**
         * Attention greater than 50
         */
        //% block="⬇"
        DOWN = 7,
        /**
         * Attention greater than 65
         */
        //% block="⬅"
        LEFT = 8,
        /**
        * Attention greater than 35
        */
        //% block="➡"
        RIGHT = 6,
        /**
         * Attention greater than 50
         */
        //% block="▷"
        Tri = 13,
        /**
         * Attention greater than 65
         */
        //% block="☐"
        Squ = 16,
        /**
        * Attention greater than 35
        */
        //% block="𐤏"
        Cir = 14,
        /**
         * Attention greater than 50
         */
        //% block="⨉"
        X = 15,
        /**
         * Attention greater than 65
         */
        //% block="L1"
        Left1 = 11,
        /**
        * Attention greater than 35
        */
        //% block="R1"
        Right1 = 12,
        /**
         * Attention greater than 50
         */
        //% block="L2"
        Left2 = 9,
        /**
         * Attention greater than 65
         */
        //% block="R2"
        Right2 = 10,
        /**
        * Attention greater than 35
        */
        //% block="SELECT"
        Sele = 1,
        /**
         * Attention greater than 50
         */
        //% block="START"
        Star = 4,
        /**
         * Attention greater than 50
         */
        //% block="L3"
        L3 = 2,
        /**
         * Attention greater than 50
         */
        //% block="R3"
        R3 = 3,
    }

    export enum LR_value {

        /**
         * Attention greater than L
         */
        //% block="L"
        LEFT = 0,
        /**
         * Attention greater than R
         */
        //% block="R"
        RIGHT = 2,


    }

    export enum value_Analog {
        /**
        * Attention greater than 35
        */
        //% block="↖"
        LUP = 9,
        /**
        * Attention greater than 35
        */
        //% block="⬆"
        UP = 5,
        /**
        * Attention greater than 35
        */
        //% block="↗"
        RUP = 10,
        /**
         * Attention greater than 65
         */
        //% block="⬅"
        LEFT = 7,
        /**
        * 32
        */
        //% block="P"
        P = 13,
        /**
        * Attention greater than 35
        */
        //% block="➡"
        RIGHT = 8,
        /*
        * Attention greater than 35
        */
        //% block="↙"
        LDOWN = 11,
        /**
        * Attention greater than 50
        */
        //% block="⬇"
        DOWN = 6,
        /**
        * Attention greater than 50
        */
        //% block="↘"
        RDOWN = 12,
        // /**
        //  * 33
        //  */
        // //% block="right3"
        // Button_R3 = 33,
        // /**
        //  * Attention greater than 35
        //  */
        // //% block="R⬆"
        // R_UP = 7,
        // /**
        //  * Attention greater than 50
        //  */
        // //% block="R⬇"
        // R_DOWN = 7,
        // /**
        //  * Attention greater than 65
        //  */
        // //% block="R⬅"
        // R_LEFT = 7,
        // /**
        // * Attention greater than 35
        // */
        // //% block="R➡"
        // R_RIGHT = 7,
        // /**
        // * Attention greater than 35
        // */
        // //% block="R↖"
        // R_LUP = 8,
        // /**
        // * Attention greater than 35
        // */
        // //% block="R↗"
        // R_RUP = 8,/**
        // * Attention greater than 35
        // */
        // //% block="R↙"
        // R_LDOWN = 8,
        // /**
        // * Attention greater than 50
        // */
        // //% block="R↘"
        // R_RDOWN = 8,
    }



    export enum ButtonEventSrouse {
        /**
         * 35
         */
        //% block="⬆"
        Button_UP = 35,
        /**
         * 37
         */
        //% block="⬇"
        Button_DOWN = 37,
        /**
         * 38
         */
        //% block="⬅"
        Button_LEFT = 38,
        /**
        * 36
        */
        //% block="➡"
        Button_RIGHT = 36,
        /**
         * 43
         */
        //% block="▷"
        Button_Tri = 43,
        /**
         * 46
         */
        //% block="☐"
        Button_Squ = 46,
        /**
        * 44
        */
        //% block="𐤏"
        Button_Cir = 44,
        /**
         * 45
         */
        //% block="⨉"
        Button_X = 45,
        /**
         * 41
         */
        //% block=" left1"
        Button_Left1 = 41,
        /**
        * 42
        */
        //% block="right1"
        Button_Right1 = 42,
        /**
         * 39
         */
        //% block="left2"
        Button_Left2 = 39,
        /**
         * 40
         */
        //% block="right2"
        Button_Right2 = 40,
        /**
        * 31
        */
        //% block="select"
        Button_Sele = 31,
        /**
         * 34
         */
        //% block="start"
        Button_Star = 34,
        // /**
        //  * 32
        //  */
        // //% block="left3"
        // Button_L3 = 32,
        // /**
        //  * 33
        //  */
        // //% block="right3"
        // Button_R3 = 33,
    }

    export enum ButtonEventState {
        /**
         * Attention greater than 50
         */
        //% block="off"
        Button_off = 0,
        /**
         * Attention greater than 50
         */
        //% block="on"
        Button_on = 1,
    }


    export enum value_A {
        /**
         * Attention greater than 35
         */
        //% block="RX"
        RX = 25,
        /**
         * Attention greater than 50
         */
        //% block="RY"
        RY = 26,
        /**
         * Attention greater than 65
         */
        //% block="LX"
        LX = 27,
        /**
        * Attention greater than 35
        */
        //% block="LY"
        LY = 28,
        /**
         * 32
         */
        //% block="L3"
        Button_L3 = 32,
        /**
         * 33
         */
        //% block="R3"
        Button_R3 = 33,
    }

    export enum Vibration {
        /**
         * Attention greater than 50
         */
        //% block="off"
        Vibration_off = 30,
        /**
         * Attention greater than 50
         */
        //% block="on"
        Vibration_on = 29,
    }

    /**
    * Whether a Button is pressed
    */
    //% subcategory=Input group="IIC Port" color=#00B1ED
    //% block="Joystick button %value_level is pressed" blockId="DigitalButton"
    export function get_Attention_Value(level: value_level): boolean {
        let value = 0
        let digital = 0

        while (pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false) != 0x10);

        switch (level) {
            case value_level.UP:
                digital = value_level.UP
                pins.i2cWriteNumber(0x08, digital, NumberFormat.UInt8LE, false);
                value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (value == 1) {
                    return true
                }
                else if (value == 0) {
                    return false
                }
            case value_level.DOWN:
                digital = value_level.DOWN
                pins.i2cWriteNumber(0x08, digital, NumberFormat.UInt8LE, false);
                value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (value == 1) {
                    return true
                }
                else if (value == 0) {
                    return false
                }
            case value_level.LEFT:
                digital = value_level.LEFT
                pins.i2cWriteNumber(0x08, digital, NumberFormat.UInt8LE, false);
                value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (value == 1) {
                    return true
                }
                else if (value == 0) {
                    return false
                }
            case value_level.RIGHT:
                digital = value_level.RIGHT
                pins.i2cWriteNumber(0x08, digital, NumberFormat.UInt8LE, false);
                value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (value == 1) {
                    return true
                }
                else if (value == 0) {
                    return false
                }
            case value_level.Tri:
                digital = value_level.Tri
                pins.i2cWriteNumber(0x08, digital, NumberFormat.UInt8LE, false);
                value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (value == 1) {
                    return true
                }
                else if (value == 0) {
                    return false
                }
            case value_level.Squ:
                digital = value_level.Squ
                pins.i2cWriteNumber(0x08, digital, NumberFormat.UInt8LE, false);
                value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (value == 1) {
                    return true
                }
                else if (value == 0) {
                    return false
                }
            case value_level.Cir:
                digital = value_level.Cir
                pins.i2cWriteNumber(0x08, digital, NumberFormat.UInt8LE, false);
                value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (value == 1) {
                    return true
                }
                else if (value == 0) {
                    return false
                }
            case value_level.X:
                digital = value_level.X
                pins.i2cWriteNumber(0x08, digital, NumberFormat.UInt8LE, false);
                value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (value == 1) {
                    return true
                }
                else if (value == 0) {
                    return false
                }
            case value_level.Left1:
                digital = value_level.Left1
                pins.i2cWriteNumber(0x08, digital, NumberFormat.UInt8LE, false);
                value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (value == 1) {
                    return true
                }
                else if (value == 0) {
                    return false
                }
            case value_level.Left2:
                digital = value_level.Left2
                pins.i2cWriteNumber(0x08, digital, NumberFormat.UInt8LE, false);
                value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (value == 1) {
                    return true
                }
                else if (value == 0) {
                    return false
                }
            case value_level.Right1:
                digital = value_level.Right1
                pins.i2cWriteNumber(0x08, digital, NumberFormat.UInt8LE, false);
                value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (value == 1) {
                    return true
                }
                else if (value == 0) {
                    return false
                }
            case value_level.Right2:
                digital = value_level.Right2
                pins.i2cWriteNumber(0x08, digital, NumberFormat.UInt8LE, false);
                value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (value == 1) {
                    return true
                }
                else if (value == 0) {
                    return false
                }
            case value_level.Sele:
                digital = value_level.Sele
                pins.i2cWriteNumber(0x08, digital, NumberFormat.UInt8LE, false);
                value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (value == 1) {
                    return true
                }
                else if (value == 0) {
                    return false
                }
            case value_level.Star:
                digital = value_level.Star
                pins.i2cWriteNumber(0x08, digital, NumberFormat.UInt8LE, false);
                value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (value == 1) {
                    return true
                }
                else if (value == 0) {
                    return false
                }
            case value_level.L3:
                digital = value_level.L3
                pins.i2cWriteNumber(0x08, digital, NumberFormat.UInt8LE, false);
                value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (value == 1) {
                    return true
                }
                else if (value == 0) {
                    return false
                }
            case value_level.R3:
                digital = value_level.R3
                pins.i2cWriteNumber(0x08, digital, NumberFormat.UInt8LE, false);
                value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (value == 1) {
                    return true
                }
                else if (value == 0) {
                    return false
                }
            default:
                return false
        }

    }

    /**
     * Get Analog value
    */
    //% subcategory=Input group="IIC Port" color=#00B1ED
    //% blockId="AnlogValue" block="Joystick rocker value of %value_A"
    export function GetAnalogValue(Button: value_A): number {
        let Analog = 0
        let re_value = 128

        while (pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false) != 0x10);

        switch (Button) {
            case value_A.RX:
                Analog = value_A.RX
                pins.i2cWriteNumber(0x08, Analog, NumberFormat.UInt8LE, false);
                re_value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (re_value != 128 && re_value != 0)
                    re_value = re_value + 1;
                break
            case value_A.RY:
                Analog = value_A.RY
                pins.i2cWriteNumber(0x08, Analog, NumberFormat.UInt8LE, false);
                re_value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (re_value != 0)
                    re_value = re_value + 1;
                break
            case value_A.LX:
                Analog = value_A.LX
                pins.i2cWriteNumber(0x08, Analog, NumberFormat.UInt8LE, false);
                re_value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (re_value != 128 && re_value != 0)
                    re_value = re_value + 1;
                break
            case value_A.LY:
                Analog = value_A.LY
                pins.i2cWriteNumber(0x08, Analog, NumberFormat.UInt8LE, false);
                re_value = pins.i2cReadNumber(0x08, NumberFormat.UInt8LE, false);
                if (re_value != 0)
                    re_value = re_value + 1;
                break
            default:
                re_value = 66
                break
        }

        re_value = re_value * 4;
        return re_value
    }

    let sc_byte = 0
    let dat = 0
    let low = 0
    let high = 0
    let temp = 0
    let temperature = 0
    let ack = 0
    let lastTemp = 0

    export enum ValType {
        //% block="Θερμοκρασία (℃)" enumval=0
        DS18B20_temperature_C,

        //% block="Θερμοκρασία (℉)" enumval=1
        DS18B20_temperature_F
    }
    function init_18b20(mpin: DigitalPin) {
        pins.digitalWritePin(mpin, 0)
        control.waitMicros(600)
        pins.digitalWritePin(mpin, 1)
        control.waitMicros(30)
        ack = pins.digitalReadPin(mpin)
        control.waitMicros(600)
        return ack
    }
    function write_18b20(mpin: DigitalPin, data: number) {
        sc_byte = 0x01
        for (let index = 0; index < 8; index++) {
            pins.digitalWritePin(mpin, 0)
            if (data & sc_byte) {
                pins.digitalWritePin(mpin, 1)
                control.waitMicros(60)
            } else {
                pins.digitalWritePin(mpin, 0)
                control.waitMicros(60)
            }
            pins.digitalWritePin(mpin, 1)
            data = data >> 1
        }
    }
    function read_18b20(mpin: DigitalPin) {
        dat = 0x00
        sc_byte = 0x01
        for (let index = 0; index < 8; index++) {
            pins.digitalWritePin(mpin, 0)
            pins.digitalWritePin(mpin, 1)
            if (pins.digitalReadPin(mpin)) {
                dat = dat + sc_byte
            }
            sc_byte = sc_byte << 1
            control.waitMicros(60)
        }
        return dat
    }

    //% subcategory=Sensor group="Digital" color=#EA5532
    //% block="Τιμή από DS18B20 %state στον ακροδέκτη %Rjpin"
    export function Ds18b20Temp(Rjpin: DigitalRJPin, state: ValType): number {
        let pin = RJpin_to_digital(Rjpin);
        let temperature = celsius(pin);
        switch (state) {
            case ValType.DS18B20_temperature_C:
                return temperature
            case ValType.DS18B20_temperature_F:
                temperature = (temperature * 1.8) + 32
                return temperature
            default:
                return 0
        }

    }

    //% shim=dstemp::celsius
    //% parts=dstemp trackArgs=0
    function celsius(pin: DigitalPin): number {
        return 32.6;
    }


}











    /**
* Functions to PlanetX sensor by ELECFREAKS Co.,Ltd.
*/
//% color=#EA5532 icon="\uf110" block="PlanetX_Display" blockId="PlanetX_Display" 
//% groups='["LED", "Digital", "Analog", "IIC Port", "OLED", "8*16 Matrix", "7-Seg 4-Dig LED Nixietube"]'
namespace PlanetX_Display {
    ////////////////////////////////TM 1637/////////////////
    let TM1637_CMD1 = 0x40;
    let TM1637_CMD2 = 0xC0;
    let TM1637_CMD3 = 0x80;
    let _SEGMENTS = [0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F, 0x77, 0x7C, 0x39, 0x5E, 0x79, 0x71];
    /////////////////////OLED///////////////////////////////
    let firstoledinit = true
    const basicFont: string[] = [
        "\x00\x00\x00\x00\x00\x00\x00\x00", // " "
        "\x00\x00\x5F\x00\x00\x00\x00\x00", // "!"
        "\x00\x00\x07\x00\x07\x00\x00\x00", // """
        "\x00\x14\x7F\x14\x7F\x14\x00\x00", // "#"
        "\x00\x24\x2A\x7F\x2A\x12\x00\x00", // "$"
        "\x00\x23\x13\x08\x64\x62\x00\x00", // "%"
        "\x00\x36\x49\x55\x22\x50\x00\x00", // "&"
        "\x00\x00\x05\x03\x00\x00\x00\x00", // "'"
        "\x00\x1C\x22\x41\x00\x00\x00\x00", // "("
        "\x00\x41\x22\x1C\x00\x00\x00\x00", // ")"
        "\x00\x08\x2A\x1C\x2A\x08\x00\x00", // "*"
        "\x00\x08\x08\x3E\x08\x08\x00\x00", // "+"
        "\x00\xA0\x60\x00\x00\x00\x00\x00", // ","
        "\x00\x08\x08\x08\x08\x08\x00\x00", // "-"
        "\x00\x60\x60\x00\x00\x00\x00\x00", // "."
        "\x00\x20\x10\x08\x04\x02\x00\x00", // "/"
        "\x00\x3E\x51\x49\x45\x3E\x00\x00", // "0"
        "\x00\x00\x42\x7F\x40\x00\x00\x00", // "1"
        "\x00\x62\x51\x49\x49\x46\x00\x00", // "2"
        "\x00\x22\x41\x49\x49\x36\x00\x00", // "3"
        "\x00\x18\x14\x12\x7F\x10\x00\x00", // "4"
        "\x00\x27\x45\x45\x45\x39\x00\x00", // "5"
        "\x00\x3C\x4A\x49\x49\x30\x00\x00", // "6"
        "\x00\x01\x71\x09\x05\x03\x00\x00", // "7"
        "\x00\x36\x49\x49\x49\x36\x00\x00", // "8"
        "\x00\x06\x49\x49\x29\x1E\x00\x00", // "9"
        "\x00\x00\x36\x36\x00\x00\x00\x00", // ":"
        "\x00\x00\xAC\x6C\x00\x00\x00\x00", // ";"
        "\x00\x08\x14\x22\x41\x00\x00\x00", // "<"
        "\x00\x14\x14\x14\x14\x14\x00\x00", // "="
        "\x00\x41\x22\x14\x08\x00\x00\x00", // ">"
        "\x00\x02\x01\x51\x09\x06\x00\x00", // "?"
        "\x00\x32\x49\x79\x41\x3E\x00\x00", // "@"
        "\x00\x7E\x09\x09\x09\x7E\x00\x00", // "A"
        "\x00\x7F\x49\x49\x49\x36\x00\x00", // "B"
        "\x00\x3E\x41\x41\x41\x22\x00\x00", // "C"
        "\x00\x7F\x41\x41\x22\x1C\x00\x00", // "D"
        "\x00\x7F\x49\x49\x49\x41\x00\x00", // "E"
        "\x00\x7F\x09\x09\x09\x01\x00\x00", // "F"
        "\x00\x3E\x41\x41\x51\x72\x00\x00", // "G"
        "\x00\x7F\x08\x08\x08\x7F\x00\x00", // "H"
        "\x00\x41\x7F\x41\x00\x00\x00\x00", // "I"
        "\x00\x20\x40\x41\x3F\x01\x00\x00", // "J"
        "\x00\x7F\x08\x14\x22\x41\x00\x00", // "K"
        "\x00\x7F\x40\x40\x40\x40\x00\x00", // "L"
        "\x00\x7F\x02\x0C\x02\x7F\x00\x00", // "M"
        "\x00\x7F\x04\x08\x10\x7F\x00\x00", // "N"
        "\x00\x3E\x41\x41\x41\x3E\x00\x00", // "O"
        "\x00\x7F\x09\x09\x09\x06\x00\x00", // "P"
        "\x00\x3E\x41\x51\x21\x5E\x00\x00", // "Q"
        "\x00\x7F\x09\x19\x29\x46\x00\x00", // "R"
        "\x00\x26\x49\x49\x49\x32\x00\x00", // "S"
        "\x00\x01\x01\x7F\x01\x01\x00\x00", // "T"
        "\x00\x3F\x40\x40\x40\x3F\x00\x00", // "U"
        "\x00\x1F\x20\x40\x20\x1F\x00\x00", // "V"
        "\x00\x3F\x40\x38\x40\x3F\x00\x00", // "W"
        "\x00\x63\x14\x08\x14\x63\x00\x00", // "X"
        "\x00\x03\x04\x78\x04\x03\x00\x00", // "Y"
        "\x00\x61\x51\x49\x45\x43\x00\x00", // "Z"
        "\x00\x7F\x41\x41\x00\x00\x00\x00", // """
        "\x00\x02\x04\x08\x10\x20\x00\x00", // "\"
        "\x00\x41\x41\x7F\x00\x00\x00\x00", // """
        "\x00\x04\x02\x01\x02\x04\x00\x00", // "^"
        "\x00\x80\x80\x80\x80\x80\x00\x00", // "_"
        "\x00\x01\x02\x04\x00\x00\x00\x00", // "`"
        "\x00\x20\x54\x54\x54\x78\x00\x00", // "a"
        "\x00\x7F\x48\x44\x44\x38\x00\x00", // "b"
        "\x00\x38\x44\x44\x28\x00\x00\x00", // "c"
        "\x00\x38\x44\x44\x48\x7F\x00\x00", // "d"
        "\x00\x38\x54\x54\x54\x18\x00\x00", // "e"
        "\x00\x08\x7E\x09\x02\x00\x00\x00", // "f"
        "\x00\x18\xA4\xA4\xA4\x7C\x00\x00", // "g"
        "\x00\x7F\x08\x04\x04\x78\x00\x00", // "h"
        "\x00\x00\x7D\x00\x00\x00\x00\x00", // "i"
        "\x00\x80\x84\x7D\x00\x00\x00\x00", // "j"
        "\x00\x7F\x10\x28\x44\x00\x00\x00", // "k"
        "\x00\x41\x7F\x40\x00\x00\x00\x00", // "l"
        "\x00\x7C\x04\x18\x04\x78\x00\x00", // "m"
        "\x00\x7C\x08\x04\x7C\x00\x00\x00", // "n"
        "\x00\x38\x44\x44\x38\x00\x00\x00", // "o"
        "\x00\xFC\x24\x24\x18\x00\x00\x00", // "p"
        "\x00\x18\x24\x24\xFC\x00\x00\x00", // "q"
        "\x00\x00\x7C\x08\x04\x00\x00\x00", // "r"
        "\x00\x48\x54\x54\x24\x00\x00\x00", // "s"
        "\x00\x04\x7F\x44\x00\x00\x00\x00", // "t"
        "\x00\x3C\x40\x40\x7C\x00\x00\x00", // "u"
        "\x00\x1C\x20\x40\x20\x1C\x00\x00", // "v"
        "\x00\x3C\x40\x30\x40\x3C\x00\x00", // "w"
        "\x00\x44\x28\x10\x28\x44\x00\x00", // "x"
        "\x00\x1C\xA0\xA0\x7C\x00\x00\x00", // "y"
        "\x00\x44\x64\x54\x4C\x44\x00\x00", // "z"
        "\x00\x08\x36\x41\x00\x00\x00\x00", // "{"
        "\x00\x00\x7F\x00\x00\x00\x00\x00", // "|"
        "\x00\x41\x36\x08\x00\x00\x00\x00", // "}"
        "\x00\x02\x01\x01\x02\x01\x00\x00"  // "~"
    ];
    function oledcmd(c: number) {
        pins.i2cWriteNumber(0x3c, c, NumberFormat.UInt16BE);
    }
    function writeData(n: number) {
        let b = n;
        if (n < 0) { n = 0 }
        if (n > 255) { n = 255 }
        pins.i2cWriteNumber(0x3c, 0x4000 + b, NumberFormat.UInt16BE);
    }
    function writeCustomChar(c: string) {
        for (let i = 0; i < 8; i++) {
            writeData(c.charCodeAt(i));
        }
    }
    function setText(row: number, column: number) {
        let r = row;
        let c = column;
        if (row < 0) { r = 0 }
        if (column < 0) { c = 0 }
        if (row > 7) { r = 7 }
        if (column > 15) { c = 15 }
        oledcmd(0xB0 + r);            //set page address
        oledcmd(0x00 + (8 * c & 0x0F));  //set column lower address
        oledcmd(0x10 + ((8 * c >> 4) & 0x0F));   //set column higher address
    }
    function putChar(c: string) {
        let c1 = c.charCodeAt(0);
        writeCustomChar(basicFont[c1 - 32]);
    }
    function oledinit(): void {
        oledcmd(0xAE);  // Set display OFF
        oledcmd(0xD5);  // Set Display Clock Divide Ratio / OSC Frequency 0xD4
        oledcmd(0x80);  // Display Clock Divide Ratio / OSC Frequency 
        oledcmd(0xA8);  // Set Multiplex Ratio
        oledcmd(0x3F);  // Multiplex Ratio for 128x64 (64-1)
        oledcmd(0xD3);  // Set Display Offset
        oledcmd(0x00);  // Display Offset
        oledcmd(0x40);  // Set Display Start Line
        oledcmd(0x8D);  // Set Charge Pump
        oledcmd(0x14);  // Charge Pump (0x10 External, 0x14 Internal DC/DC)
        oledcmd(0xA1);  // Set Segment Re-Map
        oledcmd(0xC8);  // Set Com Output Scan Direction
        oledcmd(0xDA);  // Set COM Hardware Configuration
        oledcmd(0x12);  // COM Hardware Configuration
        oledcmd(0x81);  // Set Contrast
        oledcmd(0xCF);  // Contrast
        oledcmd(0xD9);  // Set Pre-Charge Period
        oledcmd(0xF1);  // Set Pre-Charge Period (0x22 External, 0xF1 Internal)
        oledcmd(0xDB);  // Set VCOMH Deselect Level
        oledcmd(0x40);  // VCOMH Deselect Level
        oledcmd(0xA4);  // Set all pixels OFF
        oledcmd(0xA6);  // Set display not inverted
        oledcmd(0xAF);  // Set display On
        oledClear();
    }
    //////////////////////////////////////////////////////////////Matrix
    let initializedMatrix = false
    const HT16K33_ADDRESS = 0x70
    const HT16K33_BLINK_CMD = 0x80
    const HT16K33_BLINK_DISPLAYON = 0x01
    const HT16K33_CMD_BRIGHTNESS = 0xE0
    let matBuf = pins.createBuffer(17)
    function matrixInit() {
        i2ccmd(HT16K33_ADDRESS, 0x21);// turn on oscillator
        i2ccmd(HT16K33_ADDRESS, HT16K33_BLINK_CMD | HT16K33_BLINK_DISPLAYON | (0 << 1));
        i2ccmd(HT16K33_ADDRESS, HT16K33_CMD_BRIGHTNESS | 0xF);
    }
    function i2ccmd(addr: number, value: number) {
        let buf = pins.createBuffer(1)
        buf[0] = value
        pins.i2cWriteBuffer(addr, buf)
    }
    function matrixShow() {
        matBuf[0] = 0x00;
        pins.i2cWriteBuffer(HT16K33_ADDRESS, matBuf);
    }
    ///////////////////////////////enum
    export enum DigitalRJPin {
        //% block="J1" 
        J1,
        //% block="J2"
        J2,
        //% block="J3"
        J3,
        //% block="J4"
        J4
    }
    export enum AnalogRJPin {
        //% block="J1"
        J1,
        //% block="J2"
        J2
    }
    export enum EmojiList {
        //% block="😆"
        Grinning_Squinting_Face,
        //% block="😐"
        Neutral_Face,
        //% block="😞"
        Sad_Face,
        //% block="🙂"
        Slightly_Smiling_Face,
        //% block="😠"
        Angry_Face
    }
    export enum NeoPixelColors {
        //% block=κόκκινο
        Red = 0xFF0000,
        //% block=πορτοκαλί
        Orange = 0xFFA500,
        //% block=κίτρινο
        Yellow = 0xFFFF00,
        //% block=πράσινο
        Green = 0x00FF00,
        //% block=μπλέ
        Blue = 0x0000FF,
        //% block=indigο
        Indigo = 0x4b0082,
        //% block=βιολετί
        Violet = 0x8a2be2,
        //% block=μωβ
        Purple = 0xFF00FF,
        //% block=λευκό
        White = 0xFFFFFF,
        //% block=μαύρο
        Black = 0x000000
    }

    /**
     * Different modes for RGB or RGB+W NeoPixel strips
     */
    export enum NeoPixelMode {
        //% block="RGB (GRB format)"
        RGB = 0,
        //% block="RGB+W"
        RGBW = 1,
        //% block="RGB (RGB format)"
        RGB_RGB = 2
    }
    ///////////////////////////////////////////////////////RJpin_to_pin
    function RJpin_to_analog(Rjpin: AnalogRJPin): any {
        let pin = AnalogPin.P1
        switch (Rjpin) {
            case AnalogRJPin.J1:
                pin = AnalogPin.P1
                break;
            case AnalogRJPin.J2:
                pin = AnalogPin.P2
                break;
        }
        return pin
    }
    function RJpin_to_digital(Rjpin: DigitalRJPin): any {
        let pin = DigitalPin.P1
        switch (Rjpin) {
            case DigitalRJPin.J1:
                pin = DigitalPin.P8
                break;
            case DigitalRJPin.J2:
                pin = DigitalPin.P12
                break;
            case DigitalRJPin.J3:
                pin = DigitalPin.P14
                break;
            case DigitalRJPin.J4:
                pin = DigitalPin.P16
                break;
        }
        return pin
    }
    /////////////////////////////User_function//////////////////

    /**
    * toggle led
    */
    //% blockId=LED block="LED %Rjpin εναλλαγή σε $ledstate || φωτεινότητα %brightness \\%"
    //% Rjpin.fieldEditor="gridpicker" Rjpin.fieldOptions.columns=2
    //% brightness.min=0 brightness.max=100
    //% ledstate.shadow="toggleOnOff"
    //% subcategory=Display group="LED" color=#EA5532
    //% expandableArgumentMode="toggle"
    export function ledBrightness(Rjpin: DigitalRJPin, ledstate: boolean, brightness: number = 100): void {
        let pin = AnalogPin.P1
        switch (Rjpin) {
            case DigitalRJPin.J1:
                pin = AnalogPin.P1
                break;
            case DigitalRJPin.J2:
                pin = AnalogPin.P2
                break;
            case DigitalRJPin.J3:
                pin = AnalogPin.P13
                break;
            case DigitalRJPin.J4:
                pin = AnalogPin.P15
                break;
        }
        if (ledstate) {
            pins.analogSetPeriod(pin, 100)
            pins.analogWritePin(pin, Math.map(brightness, 0, 100, 0, 1023))
        }
        else {
            pins.analogWritePin(pin, 0)
            brightness = 0
        }
    }
    //% subcategory=Display group="8*16 Matrix" color=#00B1ED
    //% blockId= matrix_refresh block="Επανασχεδιασμός πίνακα" 
    export function matrixRefresh(): void {
        if (!initializedMatrix) {
            matrixInit();
            initializedMatrix = true;
        }
        matrixShow();
    }
    //% subcategory=Display group="8*16 Matrix" color=#00B1ED
    //% blockId= matrix_clear block="Καθαρισμός πίνακα"
    export function matrixClear(): void {
        if (!initializedMatrix) {
            matrixInit();
            initializedMatrix = true;
        }
        for (let i = 0; i < 16; i++) {
            matBuf[i + 1] = 0;
        }
        matrixShow();
    }

    //% x.min=0 x.max=15
    //% y.min=0 y.max=7
    //% blockId= matrix_draw block="Ζωγράφισε στη θέση |X %x|Y %y"
    //% subcategory=Display group="8*16 Matrix" color=#00B1ED
    export function matrixDraw(x: number, y: number): void {
        if (!initializedMatrix) {
            matrixInit();
            initializedMatrix = true;
        }

        if(x > 15)
        {
            x = 15
        }
        if(y > 7)
        {
            y = 7
        }
        if(x < 0)
        {
            x = 0
        }
        if(y < 0)
        {
            y = 0
        }
        x = Math.round(x)
        y = Math.round(y)

        let idx = y * 2 + Math.idiv(x, 8);

        let tmp = matBuf[idx + 1];
        tmp |= (1 << (x % 8));
        matBuf[idx + 1] = tmp;

        matrixShow();
    }
    //% block="Εμφάνισε στον πίνακα το emoji %ID" color=#00B1ED
    //% subcategory=Display group="8*16 Matrix" 
    export function matrixEmoji(ID: EmojiList) {
        matrixClear();
        let point;
        switch (ID) {
            case 0:
                point = [[2, 0], [13, 0],
                [3, 1], [12, 1],
                [4, 2], [11, 2],
                [3, 3], [12, 3],
                [2, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [13, 4],
                [5, 5], [7, 5], [8, 5], [10, 5],
                [5, 6], [10, 6],
                [6, 7], [7, 7], [8, 7], [9, 7]
                ];
                break;
            case 1:
                point = [[2, 1], [3, 1], [13, 1], [12, 1],
                [2, 2], [3, 2], [13, 2], [12, 2],
                [2, 3], [3, 3], [13, 3], [12, 3],
                [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5],
                [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6]
                ];
                break;
            case 2:
                point = [[1, 2], [5, 2], [10, 2], [14, 2],
                [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3],
                [2, 4], [3, 4], [4, 4], [11, 4], [12, 4], [13, 4],
                [6, 6], [7, 6], [8, 6], [9, 6],
                [5, 7], [10, 7]
                ];
                break;
            case 3:
                point = [[2, 1], [3, 1], [13, 1], [12, 1],
                [2, 2], [3, 2], [13, 2], [12, 2],
                [2, 3], [3, 3], [13, 3], [12, 3],
                [5, 5], [10, 5],
                [6, 6], [7, 6], [8, 6], [9, 6]
                ];
                break;
            case 4:
                point = [[2, 0], [13, 0],
                [3, 1], [12, 1],
                [3, 2], [4, 2], [11, 2], [12, 2],
                [3, 3], [4, 3], [11, 3], [12, 3],
                [6, 6], [7, 6], [8, 6], [9, 6],
                [5, 7], [10, 7]
                ];
                break;
        }
        let index_max = point.length
        for (let index = 0; index < index_max; index++) {
            matrixDraw(point[index][0], point[index][1])
        }
        matrixRefresh();
    }
    //% line.min=1 line.max=8 line.defl=1
    //% text.defl="Hello,ELECFREAKS"
    //% block="OLED δείξε στη γραμμή %line| το κείμενο %text"
    //% subcategory=Display group="OLED" color=#00B1ED
    export function showUserText(line: number, text: string) {
        if (firstoledinit) {
            oledinit()
            firstoledinit = false
        }
        if(text.length > 16){
            text=text.substr(0, 16)
        }
        line = line - 1
        setText(line, 0);
        for (let c of text) {
            putChar(c);
        }

        for (let i = text.length; i < 16; i++) {
            setText(line, i);
            putChar(" ");
        }
    }
    //% line.min=1 line.max=8 line.defl=2 
    //% n.defl=20200508
    //% block="OLED δείξε στη γραμμή %line| τον αριθμό %n"
    //% subcategory=Display group="OLED" color=#00B1ED
    export function showUserNumber(line: number, n: number) {
        if (firstoledinit) {
            oledinit()
            firstoledinit = false
        }
        showUserText(line, "" + n)
    }
    //% block="clear display" color=#00B1ED
    //% subcategory=Display group="OLED"
    export function oledClear() {
        //oledcmd(DISPLAY_OFF);   //display off
        for (let j = 0; j < 8; j++) {
            setText(j, 0);
            {
                for (let i = 0; i < 16; i++)  //clear all columns
                {
                    putChar(' ');
                }
            }
        }
        //oledcmd(DISPLAY_ON);    //display on
        setText(0, 0);
    }
   
   
    /**
   * Create a new driver Grove - 4-Digit Display
   * @param clkPin value of clk pin number
   * @param dataPin value of data pin number
   */
    //% blockId=grove_tm1637_create block="Σύνδεση οθόνης τεσσάρων ψηφίων |στο %pin|"
    //% subcategory=Display group="7-Seg 4-Dig LED Nixietube" blockSetVariable=display color=#EA5532
    export function tm1637Create(Rjpin: DigitalRJPin, intensity: number = 7, count: number = 4): TM1637LEDs {
        let display = new TM1637LEDs();
        switch (Rjpin) {
            case DigitalRJPin.J1:
                display.clk = DigitalPin.P1
                display.dio = DigitalPin.P8
                break;
            case DigitalRJPin.J2:
                display.clk = DigitalPin.P2
                display.dio = DigitalPin.P12
                break;
            case DigitalRJPin.J3:
                display.clk = DigitalPin.P13
                display.dio = DigitalPin.P14
                break;
            case DigitalRJPin.J4:
                display.clk = DigitalPin.P15
                display.dio = DigitalPin.P16
                break;
        }
        if ((count < 1) || (count > 5)) count = 4;
        display.count = count;
        display.brightness = intensity;
        display.init();
        return display;
    }
    export class TM1637LEDs {
        buf: Buffer;
        clk: DigitalPin;
        dio: DigitalPin;
        _ON: number;
        brightness: number;
        count: number;  // number of LEDs
        /**
         * initial TM1637
         */
        init(): void {
            pins.digitalWritePin(this.clk, 0);
            pins.digitalWritePin(this.dio, 0);
            this._ON = 8;
            this.buf = pins.createBuffer(this.count);
            this.clear();
        }
        /**
         * Start 
         */
        _start() {
            pins.digitalWritePin(this.dio, 0);
            pins.digitalWritePin(this.clk, 0);
        }
        /**
         * Stop
         */
        _stop() {
            pins.digitalWritePin(this.dio, 0);
            pins.digitalWritePin(this.clk, 1);
            pins.digitalWritePin(this.dio, 1);
        }
        /**
         * send command1
         */
        _write_data_cmd() {
            this._start();
            this._write_byte(TM1637_CMD1);
            this._stop();
        }
        /**
         * send command3
         */
        _write_dsp_ctrl() {
            this._start();
            this._write_byte(TM1637_CMD3 | this._ON | this.brightness);
            this._stop();
        }
        /**
         * send a byte to 2-wire interface
         */
        _write_byte(b: number) {
            for (let i = 0; i < 8; i++) {
                pins.digitalWritePin(this.dio, (b >> i) & 1);
                pins.digitalWritePin(this.clk, 1);
                pins.digitalWritePin(this.clk, 0);
            }
            pins.digitalWritePin(this.clk, 1);
            pins.digitalWritePin(this.clk, 0);
        }
        _intensity(val: number = 7) {
            this._ON = 8;
            this.brightness = val - 1;
            this._write_data_cmd();
            this._write_dsp_ctrl();
        }
        /**
         * set data to TM1637, with given bit
         */
        _dat(bit: number, dat: number) {
            this._write_data_cmd();
            this._start();
            this._write_byte(TM1637_CMD2 | (bit % this.count))
            this._write_byte(dat);
            this._stop();
            this._write_dsp_ctrl();
        }
        /**
         * Show a single number from 0 to 9 at a specified digit of Grove - 4-Digit Display
         * @param dispData value of number
         * @param bitAddr value of bit number
         */
        //% blockId=grove_tm1637_display_bit block="%display|δείξε τον αριθμό |%num|στο digit|%bit"
        //% subcategory=Display group="7-Seg 4-Dig LED Nixietube" color=#EA5532
        //% bit.defl=1 bit.min=0 bit.max=9
        showbit(num: number = 5, bit: number = 0) {
            bit = Math.map(bit, 4, 1, 0, 3)
            this.buf[bit % this.count] = _SEGMENTS[num % 16]
            this._dat(bit, _SEGMENTS[num % 16])
        }
        /**
         * Show a 4 digits number on display
         * @param dispData value of number
         */
        //% blockId=grove_tm1637_display_number block="%display|δείξε αριθμό|%num"
        //% subcategory=Display group="7-Seg 4-Dig LED Nixietube" color=#EA5532
        showNumber(num: number) {
            if (num < 0) {
                num = -num
                this.showbit(Math.idiv(num, 1000) % 10)
                this.showbit(num % 10, 1)
                this.showbit(Math.idiv(num, 10) % 10, 2)
                this.showbit(Math.idiv(num, 100) % 10, 3)
                this._dat(0, 0x40) // '-'
            }
            else {
                this.showbit(Math.idiv(num, 1000) % 10)
                this.showbit(num % 10, 1)
                this.showbit(Math.idiv(num, 10) % 10, 2)
                this.showbit(Math.idiv(num, 100) % 10, 3)
            }
        }
        /**
         * show or hide dot point. 
         * @param bit is the position, eg: 1
         * @param show is show/hide dp, eg: true
         */
        //% blockId="TM1637_showDP" block="%display|Σημείο κουκκίδας στο %bit|εμφάνιση $show"
        //% show.shadow="toggleOnOff"
        //% subcategory=Display group="7-Seg 4-Dig LED Nixietube" color=#EA5532
        showDP(bit: number = 1, show: boolean = true) {
            bit = Math.map(bit, 4, 1, 0, 3)
            bit = bit % this.count
            if (show) this._dat(bit, this.buf[bit] | 0x80)
            else this._dat(bit, this.buf[bit] & 0x7F)
        }
        /**
         * clear LED. 
         */
        //% blockId="TM1637_clear" block="Καθαρισμός προβολής %display"
        //% subcategory=Display group="7-Seg 4-Dig LED Nixietube" color=#EA5532
        clear() {
            for (let i = 0; i < this.count; i++) {
                this._dat(i, 0)
                this.buf[i] = 0
            }
        }
    }
    


    //% shim=light::sendWS2812Buffer
    declare function displaySendBuffer(buf: Buffer, pin: DigitalPin): void;
    
    export class Strip {
        buf:Buffer;
        pin:DigitalPin;
        // TODO: encode as bytes instead of 32bit
        brightness:number;
        start:number; // start offset in LED strip
        _length:number; // number of LEDs
        _mode:NeoPixelMode;
        _matrixWidth:number; // number of leds in a matrix - if any

        /**
         * Shows all LEDs to a given color (range 0-255 for r, g, b).
         * @param rgb RGB color of the LED
         */
        //% blockId="neopixel_set_strip_color" block="%strip|show color %rgb=neopixel_colors"
        //% weight=85 color=#EA5532
        //% parts="neopixel" subcategory=Neopixel
        showColor(rgb: number) {
            rgb = rgb >> 0;
            this.setAllRGB(rgb);
            this.show();
        }

        /**
         * Shows a rainbow pattern on all LEDs.
         * @param startHue the start hue value for the rainbow, eg: 1
         * @param endHue the end hue value for the rainbow, eg: 360
         */
        //% blockId="neopixel_set_strip_rainbow" block="%strip|show rainbow from %startHue|to %endHue"
        //% weight=85 color=#EA5532
        //% parts="neopixel" subcategory=Neopixel
        showRainbow(startHue: number = 1, endHue: number = 360) {
            if (this._length <= 0) return;

            startHue = startHue >> 0;
            endHue = endHue >> 0;
            const saturation = 100;
            const luminance = 50;
            const steps = this._length;
            const direction = HueInterpolationDirection.Clockwise;

            //hue
            const h1 = startHue;
            const h2 = endHue;
            const hDistCW = ((h2 + 360) - h1) % 360;
            const hStepCW = Math.idiv((hDistCW * 100), steps);
            const hDistCCW = ((h1 + 360) - h2) % 360;
            const hStepCCW = Math.idiv(-(hDistCCW * 100), steps);
            let hStep: number;
            if (direction === HueInterpolationDirection.Clockwise) {
                hStep = hStepCW;
            } else if (direction === HueInterpolationDirection.CounterClockwise) {
                hStep = hStepCCW;
            } else {
                hStep = hDistCW < hDistCCW ? hStepCW : hStepCCW;
            }
            const h1_100 = h1 * 100; //we multiply by 100 so we keep more accurate results while doing interpolation

            //sat
            const s1 = saturation;
            const s2 = saturation;
            const sDist = s2 - s1;
            const sStep = Math.idiv(sDist, steps);
            const s1_100 = s1 * 100;

            //lum
            const l1 = luminance;
            const l2 = luminance;
            const lDist = l2 - l1;
            const lStep = Math.idiv(lDist, steps);
            const l1_100 = l1 * 100

            //interpolate
            if (steps === 1) {
                this.setPixelColor(0, hsl(h1 + hStep, s1 + sStep, l1 + lStep))
            } else {
                this.setPixelColor(0, hsl(startHue, saturation, luminance));
                for (let i = 1; i < steps - 1; i++) {
                    const h = Math.idiv((h1_100 + i * hStep), 100) + 360;
                    const s = Math.idiv((s1_100 + i * sStep), 100);
                    const l = Math.idiv((l1_100 + i * lStep), 100);
                    this.setPixelColor(i, hsl(h, s, l));
                }
                this.setPixelColor(steps - 1, hsl(endHue, saturation, luminance));
            }
            this.show();
        }

        /**
         * Set LED to a given color (range 0-255 for r, g, b).
         * You need to call ``show`` to make the changes visible.
         * @param pixeloffset position of the NeoPixel in the strip
         * @param rgb RGB color of the LED
         */
        //% blockId="neopixel_set_pixel_color" block="%strip|set pixel color at %pixeloffset|to %rgb=neopixel_colors"
        //% weight=80 color=#EA5532
        //% parts="neopixel" subcategory=Neopixel
        setPixelColor(pixeloffset: number, rgb: number): void {
            this.setPixelRGB(pixeloffset >> 0, rgb >> 0);
        }

        /**
         * Send all the changes to the strip.
         */
        //% blockId="neopixel_show" block="%strip|show" 
        //% weight=79
        //% parts="neopixel" subcategory=Neopixel
        show() {
            displaySendBuffer(this.buf, this.pin);
        }

        /**
         * Turn off all LEDs.
         * You need to call ``show`` to make the changes visible.
         */
        //% blockId="neopixel_clear" block="%strip|clear"
        //% weight=76 color=#EA5532
        //% parts="neopixel" subcategory=Neopixel
        clear(): void {
            const stride = this._mode === NeoPixelMode.RGBW ? 4 : 3;
            this.buf.fill(0, this.start * stride, this._length * stride);
        }

        /**
         * Set the brightness of the strip. This flag only applies to future operation.
         * @param brightness a measure of LED brightness in 0-255. eg: 255
         */
        //% blockId="neopixel_set_brightness" block="%strip|set brightness %brightness" 
        //% weight=59 color=#EA5532
        //% parts="neopixel" subcategory=Neopixel
        setBrightness(brightness: number): void {
            this.brightness = brightness & 0xff;
        }

        /**
         * Create a range of LEDs.
         * @param start offset in the LED strip to start the range
         * @param length number of LEDs in the range. eg: 4
         */
        //% weight=89 color=#EA5532
        //% blockId="neopixel_range" block="%strip|range from %start|with %length|leds"
        //% parts="neopixel"
        //% blockSetVariable=range subcategory=Neopixel
        range(start: number, length: number): Strip {
            start = start >> 0;
            length = length >> 0;
            let strip = new Strip();
            strip.buf = this.buf;
            strip.pin = this.pin;
            strip.brightness = this.brightness;
            strip.start = this.start + Math.clamp(0, this._length - 1, start);
            strip._length = Math.clamp(0, this._length - (strip.start - this.start), length);
            strip._matrixWidth = 0;
            strip._mode = this._mode;
            return strip;
        }

        /**
         * Shift LEDs forward and clear with zeros.
         * You need to call ``show`` to make the changes visible.
         * @param offset number of pixels to shift forward, eg: 1
         */
        //% blockId="neopixel_shift" block="%strip|shift pixels by %offset" 
        //% weight=40 color=#EA5532
        //% parts="neopixel" subcategory=Neopixel
        shift(offset: number = 1): void {
            offset = offset >> 0;
            const stride = this._mode === NeoPixelMode.RGBW ? 4 : 3;
            this.buf.shift(-offset * stride, this.start * stride, this._length * stride)
        }

        /**
         * Rotate LEDs forward.
         * You need to call ``show`` to make the changes visible.
         * @param offset number of pixels to rotate forward, eg: 1
         */
        //% blockId="neopixel_rotate" block="%strip|rotate pixels by %offset" 
        //% weight=39 color=#EA5532
        //% parts="neopixel" subcategory=Neopixel
        rotate(offset: number = 1): void {
            offset = offset >> 0;
            const stride = this._mode === NeoPixelMode.RGBW ? 4 : 3;
            this.buf.rotate(-offset * stride, this.start * stride, this._length * stride)
        }

        /**
         * Set the pin where the neopixel is connected, defaults to P0.
         */
        //% weight=10 color=#EA5532
        //% parts="neopixel" subcategory=Neopixel
        setPin(pin: DigitalPin): void {
            this.pin = pin;
            pins.digitalWritePin(this.pin, 0);
            // don't yield to avoid races on initialization
        }

        private setBufferRGB(offset: number, red: number, green: number, blue: number): void {
            if (this._mode === NeoPixelMode.RGB_RGB) {
                this.buf[offset + 0] = red;
                this.buf[offset + 1] = green;
            } else {
                this.buf[offset + 0] = green;
                this.buf[offset + 1] = red;
            }
            this.buf[offset + 2] = blue;
        }

        private setAllRGB(rgb: number) {
            let red = unpackR(rgb);
            let green = unpackG(rgb);
            let blue = unpackB(rgb);

            const br = this.brightness;
            if (br < 255) {
                red = (red * br) >> 8;
                green = (green * br) >> 8;
                blue = (blue * br) >> 8;
            }
            const end = this.start + this._length;
            const stride = this._mode === NeoPixelMode.RGBW ? 4 : 3;
            for (let i = this.start; i < end; ++i) {
                this.setBufferRGB(i * stride, red, green, blue)
            }
        }
        private setPixelRGB(pixeloffset: number, rgb: number): void {
            if (pixeloffset < 0
                || pixeloffset >= this._length)
                return;

            let stride = this._mode === NeoPixelMode.RGBW ? 4 : 3;
            pixeloffset = (pixeloffset + this.start) * stride;

            let red = unpackR(rgb);
            let green = unpackG(rgb);
            let blue = unpackB(rgb);

            let br = this.brightness;
            if (br < 255) {
                red = (red * br) >> 8;
                green = (green * br) >> 8;
                blue = (blue * br) >> 8;
            }
            this.setBufferRGB(pixeloffset, red, green, blue)
        }

    }

    /**
     * Create a new NeoPixel driver for `numleds` LEDs.
     * @param pin the pin where the neopixel is connected.
     * @param numleds number of leds in the strip, eg: 24,30,60,64
     */
    //% blockId="neopixel_create" block="NeoPixel at pin %Rjpin|with %numleds|leds as %mode"
    //% weight=90 color=#EA5532
    //% parts="neopixel"
    //% trackArgs=0,2
    //% blockSetVariable=strip subcategory=Neopixel
    export function create(Rjpin: DigitalRJPin, numleds: number, mode: NeoPixelMode): Strip {
        let pin = DigitalPin.P1
        switch (Rjpin) {
            case DigitalRJPin.J1:
                pin = DigitalPin.P8
                break;
            case DigitalRJPin.J2:
                pin = DigitalPin.P12
                break;
            case DigitalRJPin.J3:
                pin = DigitalPin.P14
                break;
            case DigitalRJPin.J4:
                pin = DigitalPin.P16
                break;
        }
        let strip = new Strip();
        let stride = mode === NeoPixelMode.RGBW ? 4 : 3;
        strip.buf = pins.createBuffer(numleds * stride);
        strip.start = 0;
        strip._length = numleds;
        strip._mode = mode;
        strip._matrixWidth = 0;
        strip.setBrightness(50)
        strip.setPin(pin)
        return strip;
    }

    /**
     * Converts red, green, blue channels into a RGB color
     * @param red value of the red channel between 0 and 255. eg: 255
     * @param green value of the green channel between 0 and 255. eg: 255
     * @param blue value of the blue channel between 0 and 255. eg: 255
     */
    //% weight=1 subcategory=Neopixel color=#EA5532
    //% blockId="neopixel_rgb" block="red %red|green %green|blue %blue"
    export function rgb(red: number, green: number, blue: number): number {
        return packRGB(red, green, blue);
    }

    /**
     * Gets the RGB value of a known color
    */
    //% weight=2 subcategory=Neopixel color=#EA5532
    //% blockId="neopixel_colors" block="%color"
    export function colors(color: NeoPixelColors): number {
        return color;
    }

    function packRGB(a: number, b: number, c: number): number {
        return ((a & 0xFF) << 16) | ((b & 0xFF) << 8) | (c & 0xFF);
    }
    function unpackR(rgb: number): number {
        let r = (rgb >> 16) & 0xFF;
        return r;
    }
    function unpackG(rgb: number): number {
        let g = (rgb >> 8) & 0xFF;
        return g;
    }
    function unpackB(rgb: number): number {
        let b = (rgb) & 0xFF;
        return b;
    }

    /**
     * Converts a hue saturation luminosity value into a RGB color
     * @param h hue from 0 to 360
     * @param s saturation from 0 to 99
     * @param l luminosity from 0 to 99
     */
    //% blockId=neopixelHSL block="hue %h|saturation %s|luminosity %l" subcategory=Neopixel color=#EA5532
    export function hsl(h: number, s: number, l: number): number {
        h = Math.round(h);
        s = Math.round(s);
        l = Math.round(l);

        h = h % 360;
        s = Math.clamp(0, 99, s);
        l = Math.clamp(0, 99, l);
        let c = Math.idiv((((100 - Math.abs(2 * l - 100)) * s) << 8), 10000); //chroma, [0,255]
        let h1 = Math.idiv(h, 60);//[0,6]
        let h2 = Math.idiv((h - h1 * 60) * 256, 60);//[0,255]
        let temp = Math.abs((((h1 % 2) << 8) + h2) - 256);
        let x = (c * (256 - (temp))) >> 8;//[0,255], second largest component of this color
        let r$:
            number;
        let g$:
            number;
        let b$:
            number;
        if (h1 == 0) {
            r$ = c;
            g$ = x;
            b$ = 0;
        }
        else if (h1 == 1) {
            r$ = x;
            g$ = c;
            b$ = 0;
        }
        else if (h1 == 2) {
            r$ = 0;
            g$ = c;
            b$ = x;
        }
        else if (h1 == 3) {
            r$ = 0;
            g$ = x;
            b$ = c;
        }
        else if (h1 == 4) {
            r$ = x;
            g$ = 0;
            b$ = c;
        }
        else if (h1 == 5) {
            r$ = c;
            g$ = 0;
            b$ = x;
        }
        let m = Math.idiv((Math.idiv((l * 2 << 8), 100) - c), 2);
        let r = r$ + m;
        let g = g$ + m;
        let b = b$ + m;
        return packRGB(r, g, b);
    }

    export enum HueInterpolationDirection {
        Clockwise,
        CounterClockwise,
        Shortest
    }
}




//% color=#4ca630 icon="\uf1eb" 
//% block="PlanetX_IoT" blockId="PlanetX_IoT"
namespace PlanetX_IOT {

    export enum DigitalRJPin {
        //% block="J1"
        J1,
        //% block="J2"
        J2,
        //% block="J3"
        J3,
        //% block="J4"
        J4
    }

    type MsgHandler = {
        [key: string]: {
            [key: string]: any
        }
    }

    let wifi_connected = false;
    const msgHandlerMap: MsgHandler = {};

    /*
    * on serial received data
    */
    let strBuf = ""
    function serialDataHandler() {
        const str = strBuf + serial.readString();
        let splits = str.split("\n")
        if (str.charCodeAt(str.length - 1) != 10) {
            strBuf = splits.pop()
        } else {
            strBuf = ""
        }
        for (let i = 0; i < splits.length; i++) {
            let res = splits[i]
            Object.keys(msgHandlerMap).forEach(key => {
                if (res.includes(key)) {
                    if (msgHandlerMap[key].type == 0) {
                        msgHandlerMap[key].handler(res)
                    } else {
                        msgHandlerMap[key].msg = res;
                    }
                }
            })
        }
    }

    // write AT command with CR+LF ending
    export function sendAT(command: string, wait: number = 0) {
        serial.writeString(`${command}\u000D\u000A`)
        basic.pause(wait)
    }

    export function registerMsgHandler(key: string, handler: (res: string) => void) {
        msgHandlerMap[key] = {
            type: 0,
            handler
        }
    }

    export function removeMsgHandler(key: string) {
        delete msgHandlerMap[key]
    }

    export function waitForResponse(key: string, wait: number = 1000): string {
        let timeout = input.runningTime() + wait;
        msgHandlerMap[key] = {
            type: 1,
        }
        while (timeout > input.runningTime()) {
            if (msgHandlerMap[key] == null || msgHandlerMap[key] == undefined) {
                return null;
            } else if (msgHandlerMap[key].msg) {
                let res = msgHandlerMap[key].msg
                delete msgHandlerMap[key]
                return res
            }
            basic.pause(5);
        }
        delete msgHandlerMap[key]
        return null;
    }

    export function sendRequest(command: string, key: string, wait: number = 1000): string {
        serial.writeString(`${command}\u000D\u000A`)
        return waitForResponse(key, wait)
    }

    export function resetEsp8266() {
        sendRequest("AT+RESTORE", "ready", 2000) // restore to factory settings
        sendRequest("AT+RST", "ready", 2000) // rest
        // set to STA mode
        if (sendRequest("AT+CWMODE=1", "OK") == null) {
            sendRequest("AT+CWMODE=1", "OK")
        }
    }

    /**
     * Initialize ESP8266 module
     */
    //% block="set wifi module %Rjpin Baud rate %baudrate"
    //% ssid.defl=your_ssid
    //% pw.defl=your_password weight=100
    //% color=#EA5532
    export function initWIFI(Rjpin: DigitalRJPin, baudrate: BaudRate) {
        let pin_tx = SerialPin.P1
        let pin_rx = SerialPin.P8
        switch (Rjpin) {
            case DigitalRJPin.J1:
                pin_tx = SerialPin.P8
                pin_rx = SerialPin.P1
                break;
            case DigitalRJPin.J2:
                pin_tx = SerialPin.P12
                pin_rx = SerialPin.P2
                break;
            case DigitalRJPin.J3:
                pin_tx = SerialPin.P14
                pin_rx = SerialPin.P13
                break;
            case DigitalRJPin.J4:
                pin_tx = SerialPin.P16
                pin_rx = SerialPin.P15
                break;
        }
        serial.redirect(pin_tx, pin_rx, BaudRate.BaudRate115200)
        serial.setTxBufferSize(128)
        serial.setRxBufferSize(128)
        serial.onDataReceived(serial.delimiters(Delimiters.NewLine), serialDataHandler)
        resetEsp8266()
    }

    /**
     * connect to Wifi router
     */
    //% block="connect Wifi SSID = %ssid|KEY = %pw"
    //% ssid.defl=your_ssid
    //% pw.defl=your_pwd weight=95
    //% color=#EA5532
    export function connectWifi(ssid: string, pw: string) {
        registerMsgHandler("WIFI DISCONNECT", () => wifi_connected = false)
        registerMsgHandler("WIFI GOT IP", () => wifi_connected = true)
        let retryCount = 3;
        while (true) {
            sendAT(`AT+CWJAP="${ssid}","${pw}"`) // connect to Wifi router
            pauseUntil(() => wifi_connected, 3500)
            if (wifi_connected == false && --retryCount > 0) {
                resetEsp8266()
            } else {
                break
            }
        };
    }

    /**
     * Warning: Deprecated.
     * Check if ESP8266 successfully connected to Wifi
     */
    //% block="Wifi connected %State" weight=70
    //% color=#EA5532
    export function wifiState(state: boolean) {
        return wifi_connected === state
    }

}
/************************************************************************
 * MQTT
 ************************************************************************/
namespace PlanetX_IOT {

    export enum SchemeList {
        //% block="TCP"
        TCP = 1,
        //% block="TLS"
        TLS = 2
    }

    export enum QosList {
        //% block="0"
        Qos0 = 0,
        //% block="1"
        Qos1,
        //% block="2"
        Qos2
    }

    let mqtt_connected: boolean = false
    const mqtt_subHandlers: { [topic: string]: (message: string) => void } = {}
    const mqtt_subQos: { [topic: string]: number } = {}


    /*----------------------------------MQTT-----------------------*/
    /*
     * Set  MQTT client
     */
    //% subcategory=MQTT weight=30
    //% blockId=initMQTT block="Set MQTT client config|scheme: %scheme clientID: %clientID username: %username password: %password path: %path"
    //% color=#EA5532
    export function setMQTT(scheme: SchemeList, clientID: string, username: string, password: string, path: string): void {
        sendAT(`AT+MQTTUSERCFG=0,${scheme},"${clientID}","${username}","${password}",0,0,"${path}"`, 1000)
    }

    /*
     * Connect to MQTT broker
     */
    //% subcategory=MQTT weight=25
    //% blockId=connectMQTT block="connect MQTT broker host: %host port: %port reconnect: $reconnect"
    //% color=#EA5532
    export function connectMQTT(host: string, port: number, reconnect: boolean): void {
        registerMsgHandler("+MQTTDISCONNECTED", () => mqtt_connected = false)
        registerMsgHandler("+MQTTCONNECTED", () => mqtt_connected = true)
        registerMsgHandler("MQTTSUBRECV", (res) => {
            const recvStringSplit = res.split(",", 4)
            const topic = recvStringSplit[1].slice(1, -1)
            const message = recvStringSplit[3].slice(0, -1)
            mqtt_subHandlers[topic] && mqtt_subHandlers[topic](message)
        })
        let retryCount = 3
        do {
            sendAT(`AT+MQTTCONN=0,"${host}",${port},${reconnect ? 0 : 1}`)
            pauseUntil(() => mqtt_connected, 3500)
        } while (mqtt_connected == false && --retryCount > 0);
        Object.keys(mqtt_subQos).forEach(topic => {
            const qos = mqtt_subQos[topic]
            sendAT(`AT+MQTTSUB=0,"${topic}",${qos}`, 1000)
        })
    }

    /*
     * Check if ESP8266 successfully connected to mqtt broker
     */
    //% block="MQTT broker is connected"
    //% subcategory="MQTT" weight=24
    //% color=#EA5532
    export function isMqttBrokerConnected() {
        return mqtt_connected
    }

    /*
     * send message
     */
    //% subcategory=MQTT weight=21
    //% blockId=sendMQTT block="publish %msg to Topic:%topic with Qos:%qos"
    //% msg.defl=hello
    //% topic.defl=topic/1
    //% color=#EA5532
    export function publishMqttMessage(msg: string, topic: string, qos: QosList): void {
        sendAT(`AT+MQTTPUB=0,"${topic}","${msg}",${qos},0`, 1000)
    }

    /*
     * disconnect MQTT broker
     */
    //% subcategory=MQTT weight=15
    //% blockId=breakMQTT block="Disconnect from broker"
    //% color=#EA5532
    export function breakMQTT(): void {
        removeMsgHandler("MQTTSUBRECV")
        removeMsgHandler("+MQTTDISCONNECTED")
        removeMsgHandler("+MQTTCONNECTED")
        sendAT("AT+MQTTCLEAN=0", 500)
    }

    //% block="when Topic: %topic have new $message with Qos: %qos"
    //% subcategory=MQTT weight=10
    //% draggableParameters
    //% topic.defl=topic/1
    //% color=#EA5532
    export function MqttEvent(topic: string, qos: QosList, handler: (message: string) => void) {
        mqtt_subHandlers[topic] = handler
        mqtt_subQos[topic] = qos
    }

}

/************************************************************************
 * thingspeak
 ************************************************************************/
namespace PlanetX_IOT {

    const THINGSPEAK_HOST = "api.thingspeak.com"
    const THINGSPEAK_PORT = 80

    let thingspeak_connected: boolean = false
    let thingSpeakDatatemp = ""

    /**
     * Connect to ThingSpeak
     */
    //% block="connect thingspeak"
    //% write_api_key.defl=your_write_api_key
    //% subcategory="ThingSpeak" weight=90
    //% color=#EA5532
    export function connectThingSpeak() {
        thingspeak_connected = true
    }

    /**
     * Connect to ThingSpeak and set data.
     */
    //% block="set data to send ThingSpeak | Write API key = %write_api_key|Field 1 = %n1||Field 2 = %n2|Field 3 = %n3|Field 4 = %n4|Field 5 = %n5|Field 6 = %n6|Field 7 = %n7|Field 8 = %n8"
    //% write_api_key.defl=your_write_api_key
    //% expandableArgumentMode="enabled"
    //% subcategory="ThingSpeak" weight=85
    //% color=#EA5532
    export function setData(write_api_key: string, n1: number = 0, n2: number = 0, n3: number = 0, n4: number = 0, n5: number = 0, n6: number = 0, n7: number = 0, n8: number = 0) {
        thingSpeakDatatemp = "AT+HTTPCLIENT=2,0,\"http://api.thingspeak.com/update?api_key="
            + write_api_key
            + "&field1="
            + n1
            + "&field2="
            + n2
            + "&field3="
            + n3
            + "&field4="
            + n4
            + "&field5="
            + n5
            + "&field6="
            + n6
            + "&field7="
            + n7
            + "&field8="
            + n8
            + "\",,,1"
    }

    /**
     * upload data. It would not upload anything if it failed to connect to Wifi or ThingSpeak.
     */
    //% block="Upload data to ThingSpeak"
    //% subcategory="ThingSpeak" weight=80
    //% color=#EA5532
    export function uploadData() {
        sendRequest(thingSpeakDatatemp, "http", 2000)
        basic.pause(200)
    }

    /*
     * Check if ESP8266 successfully connected to ThingSpeak
     */
    //% block="ThingSpeak connected %State"
    //% subcategory="ThingSpeak" weight=65
    //% color=#EA5532
    export function thingSpeakState(state: boolean) {
        return thingspeak_connected === state
    }

}


/************************************************************************
 * smart_iot
 ************************************************************************/
namespace PlanetX_IOT {

    export enum SmartIotSwitchState {
        //% block="on"
        on = 1,
        //% block="off"
        off = 2
    }

    let smartiot_connected: boolean = false
    let smartiot_sendMsg: string = ""
    let smartiot_lastSendTime: number = 0
    let smartiot_switchListenFlag: boolean = false
    let smartiot_switchStatus: boolean = false
    let smartiot_host: string = "http://www.smartiot.space"
    let smartiot_port: number = 8080
    let smartiot_token: string = ""
    let smartiot_topic: string = ""

    export function setSmartIotAddr(host: any, port: any) {
        smartiot_host = host
        smartiot_port = port
    }

    function concatReqMsg(queryString: string): string {
        return `AT+HTTPCLIENT=2,0,\"${smartiot_host}:${smartiot_port}${queryString}\",,,1`;
    }

    /* ----------------------------------- smartiot ----------------------------------- */
    /*
     * Connect to smartiot
     */
    //% subcategory=SmartIoT weight=50
    //% blockId=initsmartiot block="Connect SmartIoT with userToken: %userToken topic: %topic"
    //% color=#EA5532
    export function connectSmartiot(userToken: string, topic: string): void {
        smartiot_token = userToken
        smartiot_topic = topic
        for (let i = 0; i < 3; i++) {
            let ret = sendRequest(concatReqMsg(`/iot/iotTopic/getTopicStatus/${userToken}/${topic}`), '"code":200', 2000);
            if (ret != null) {
                smartiot_connected = true
                if (ret.includes('switchOn')) {
                    smartiot_switchStatus = true
                    return
                }
            }
            smartiot_connected = (ret != null)
        }
    }

    /**
     * save the data to be sent to SmartIoT
     */
    //% subcategory=SmartIoT weight=48
    //% blockId=setSmartIotUploadData block="set data to send SmartIoT |Data 1 = %n1||Data 2 = %n2|Data 3 = %n3|Data 4 = %n4|Data 5 = %n5|Data 6 = %n6|Data 7 = %n7|Data 8 = %n8"
    //% color=#EA5532
    export function setSmartIotUploadData(
        n1: number = 0,
        n2: number = 0,
        n3: number = 0,
        n4: number = 0,
        n5: number = 0,
        n6: number = 0,
        n7: number = 0,
        n8: number = 0
    ): void {
        smartiot_sendMsg = concatReqMsg(
            `/iot/iotTopicData/addTopicData?userToken=${smartiot_token}&topicName=${smartiot_topic}`
            + "&data1=" + n1
            + "&data2=" + n2
            + "&data3=" + n3
            + "&data4=" + n4
            + "&data5=" + n5
            + "&data6=" + n6
            + "&data7=" + n7
            + "&data8=" + n8
        )
    }

    /**
     * upload data to smartiot
     */
    //% subcategory=SmartIoT weight=45
    //% blockId=uploadSmartIotData block="Upload data %data to SmartIoT"
    //% color=#EA5532
    export function uploadSmartIotData(): void {
        if (!connectSmartiot) {
            return
        }
        basic.pause(smartiot_lastSendTime + 1000 - input.runningTime())
        sendAT(smartiot_sendMsg)
        smartiot_lastSendTime = input.runningTime();
    }

    /*
     * Check if ESP8266 successfully connected to SmartIot
     */
    //% block="SmartIoT connection %State"
    //% subcategory=SmartIoT weight=35
    //% color=#EA5532
    export function smartiotState(state: boolean) {
        return smartiot_connected == state;
    }

    //% block="When SmartIoT switch %vocabulary"
    //% subcategory=SmartIoT weight=30
    //% state.fieldEditor="gridpicker" state.fieldOptions.columns=2
    //% color=#EA5532
    export function iotSwitchEvent(state: SmartIotSwitchState, handler: () => void) {
        if (state == SmartIotSwitchState.on) {
            registerMsgHandler('{"code":200,"msg":null,"data":"switchOn"}', () => {
                if (smartiot_connected && !smartiot_switchStatus) {
                    handler();
                }
                smartiot_switchStatus = true;
            })
        } else {
            registerMsgHandler('{"code":200,"msg":null,"data":"switchOff"}', () => {
                if (smartiot_connected && smartiot_switchStatus) {
                    handler();
                }
                smartiot_switchStatus = false;
            })
        }

        if (!smartiot_switchListenFlag) {
            basic.forever(() => {
                if (smartiot_connected) {
                    sendAT(concatReqMsg(`/iot/iotTopic/getTopicStatus/${smartiot_token}/${smartiot_topic}`));
                }
                basic.pause(1000)
            })
            smartiot_switchListenFlag = true
        }
    }

}

/************************************************************************
 * IFTTT
 ************************************************************************/
namespace PlanetX_IOT {


    let iftttkey_def = ""
    let iftttevent_def = ""

    /*
     * set ifttt
     */
    //% subcategory=IFTTT weight=9
    //% blockId=setIFTTT block="set IFTTT key:%key event:%event"
    //% color=#EA5532
    export function setIFTTT(key: string, event: string): void {
        iftttkey_def = key
        iftttevent_def = event
    }

    /*
     * post ifttt
     */
    //% subcategory=IFTTT weight=8
    //% blockId=postIFTTT block="post IFTTT with|value1:%value value2:%value2 value3:%value3"
    //% color=#EA5532
    export function postIFTTT(value1: string, value2: string, value3: string): void {
        let sendST1 = "AT+HTTPCLIENT=3,1,\"http://maker.ifttt.com/trigger/" + iftttevent_def + "/with/key/" + iftttkey_def + "\",,,2,"
        let sendST2 = "\"{\\\"value1\\\":\\\"" + value1 + "\\\"\\\,\\\"value2\\\":\\\"" + value2 + "\\\"\\\,\\\"value3\\\":\\\"" + value3 + "\\\"}\""
        let sendST = sendST1 + sendST2
        sendAT(sendST, 1000)
    }
}
