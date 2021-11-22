import {Entity} from "./Entity.js";

export class Player extends Entity{
    constructor() {
        super();
        this.hp = 100;  // жизни
        this.move_x = 0; // координаты вектора движения (-1, 0, 1)
        this.move_y = 0;
        this.speed = 6;   // скорость движения
        this.cooldown = 1000;
        this.isReady = true;
        this.direction = '';
        this.coins = 0;

    }

    onTouchEntity(obj) { // обработка встречи с объектом
        if (obj.type === 'enemy1' || obj.type === 'enemy2' || obj.type === 'enemy3')
            return 'player touch enemy';
        if (obj.type === 'coin1' || obj.type === 'coin2' || obj.type === 'coin3' || obj.type === 'coin4' ) {
            this.coins++;
            console.log("coins: " + this.coins)
            return 'bonus';
        }
    }

    onTouchMap(obj) {
        if (obj === 639 || obj === 593)
            return 'next level';
        if (obj === 7)
            return 'lava';
    }

}
