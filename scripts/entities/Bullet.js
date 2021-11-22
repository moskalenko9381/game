import {Entity} from "./Entity.js";

export class Bullet extends Entity{
    constructor() {
        super();
        this.move_x = 0;
        this.move_y = 0;
        this.speed = 13;
        this.direction = '';
    }

    onTouchMap(obj) {
        if (!(obj === 2 || obj === 1 || obj === 369)) // не трава и не вода
            return 'remove bullet';
    }

    onTouchEntity(obj) {
        if (obj.type === 'enemy1' || obj.type === 'enemy2')
            return 'bullet to enemy';
        if (obj.type === 'bullet')
            return 'another bullet';
        if (obj.type === 'coin1' || obj.type === 'coin2' || obj.type === 'coin3' || obj.type === 'coin4' )
            return 'remove bullet'
    }
}
