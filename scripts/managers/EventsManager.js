export class EventsManager {
    constructor() {
        this.bind = []; // сопоставление клавиш действиям
        this.action = []; // ключ - действие, значение - true/false

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }

    setup(canvas) {
        this.bind[87] = 'up';  // W
        this.bind[65] = 'left'; // A
        this.bind[83] = 'down'; // S
        this.bind[68] = 'right'; // D
        this.bind[32] = 'fire';  // whitespace

        canvas.addEventListener('mousedown', this.onMouseDown);
        canvas.addEventListener('mouseup', this.onMouseUp);

        document.body.addEventListener('keydown', this.onKeyDown);
        document.body.addEventListener('keyup', this.onKeyUp);
    }

    onMouseDown(event) { // нажатие на мышь
        this.action['fire'] = true;
    }

    onMouseUp(event) { // отпустили мышь
        this.action['fire'] = false;
    }

    onKeyDown(event) { // нажатие на клавишу
        let action = this.bind[event.keyCode];
        if (action)
            this.action[action] = true;
    }

    onKeyUp(event) {
        let action = this.bind[event.keyCode];
        if (action) // if == true
            this.action[action] = false;
    }
}
