import {DamageManager} from "./DamageManager.js";

export class PhysicManager{
    constructor(gameManager, soundManager, mapManager) {
        this.gameManager = gameManager;
        this.soundManager = soundManager;
        this.mapManager = mapManager;
        this.damageManager = new DamageManager();
        this.isLevelUp = false;
    }

    update(obj) {  // функция обновления
        if (obj.move_x === 0 && obj.move_y === 0)
            return 'stop';   // скорости движения нулевые

        let newX = obj.pos_x + Math.floor(obj.move_x * obj.speed);
        let newY = obj.pos_y + Math.floor(obj.move_y * obj.speed);
        // анализ пространства на карте по направлению движения
        let ts = this.mapManager.getTilesetIndex(newX + obj.size_x/2, newY + obj.size_y/2);
        // середина объекта

        if (obj.type !== 'bullet') {
            if (ts === 369)  // вода
                obj.speed = 2.5;
            else
                obj.speed = 6;
        }


        let objOnPath = this.entityAtXY(obj, newX, newY);  // объект на пути

        let objectType = obj.type.split('_');  // тип объекта

        if (objOnPath !== null && obj.onTouchEntity) { // если есть конфликт
            let answer = obj.onTouchEntity(objOnPath);
            console.log(objOnPath)
            console.log(answer)

            if (answer === 'player touch enemy' || answer === 'enemy touch player') {
                this.gameManager.createEffect(objOnPath.pos_x, objOnPath.pos_y);
                this.gameManager.changeHP(this.damageManager.touchEnemy());
            }


            if (answer === 'bullet to enemy'){
                console.log("bullet to Enemy")
                this.gameManager.createEffect(objOnPath.pos_x, objOnPath.pos_y);
                objOnPath.hp += this.damageManager.bulletPlayer();
                if (objOnPath.hp <= 0) {
                    this.gameManager.kill(objOnPath);
                    this.gameManager.changeScore(100);
                }
                this.gameManager.kill(obj);
            }

            if (answer === 'bonus'){
                this.gameManager.changeHP(objOnPath.getHealth());
                this.soundManager.play("./public/sound/bonus.mp3", {looping: false, volume: 0.1});
                this.gameManager.kill(objOnPath);
            }

            if (answer === 'another bullet') {
                this.gameManager.kill(objOnPath);
                this.gameManager.kill(obj);
            }

            if (answer === 'remove bullet'){
                this.gameManager.kill(obj);
                this.gameManager.createEffect(obj.pos_x, obj.pos_y);
            }
        }

        if (!(ts === 1 || ts === 369 || ((obj.type === 'bullet') && (ts === 7))) && obj.onTouchMap) {
            let answer = obj.onTouchMap(ts);
            if (answer === 'next level' && !this.isLevelUp) {
                this.soundManager.play("./public/sound/nextLevel.mp3", {looping: false, volume: 0.1});

                if ((this.gameManager.currentLevel === 1 && this.gameManager.player.coins >= 2 ||
                    this.gameManager.currentLevel === 2 && this.gameManager.player.coins >= 4) && this.gameManager.score > 0) {
                    this.isLevelUp = true;
                this.gameManager.currentLevel++;
                setTimeout(() => {
                    this.gameManager.nextLevel();
                    this.isLevelUp = false;
                }, 500);
            }

        }

            if (answer === 'lava') {
                this.gameManager.changeHP(this.damageManager.touchLava());
                this.gameManager.createEffect(obj.pos_x, obj.pos_y);
                this.soundManager.play("./public/sound/failTailset.mp3", {looping: false, volume: 0.1});
            }
            if (answer === 'remove bullet') {
                this.gameManager.createEffect(obj.pos_x, obj.pos_y);
                this.gameManager.kill(obj);
                this.soundManager.play("./public/sound/failTailset.mp3", {looping: false, volume: 0.1});
            }
            return;
        }


        if ((ts === 2 || ts === 1 || ts === 639 || ts === 593 || ts === 369) && objOnPath === null) {  // перемещаем объект
            obj.pos_x = newX;
            obj.pos_y = newY;
        } else {
            return 'break';
        }
        return 'move';
    }

    entityAtXY(obj, x, y) {  // поиск объекта по координатам
        for (let i = 0; i < this.gameManager.objects.length; i++) {
            let e = this.gameManager.objects[i];  // все объекты карты
            if (e.name !== obj.name) {
                if (x + obj.size_x < e.pos_x   // не пересекаются
                    || y + obj.size_y < e.pos_y
                    || x > e.pos_x + e.size_x
                    || y > e.pos_y + e.size_y)
                    continue;
              //  console.log(e)
                return e;
            }
        }
        return null;
    }

}
