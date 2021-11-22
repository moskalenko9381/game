export class DamageManager {
    constructor() {
            this.lavaDamage = -25;
            this.touchEnemyDamage = -30;
            this.bulletEnemyDamage = -25;
            this.playerBulletDamage = -50;

        this.touchLava = this.touchLava.bind(this);
        this.touchEnemy = this.touchEnemy.bind(this);
        this.bulletEnemy = this.bulletEnemy.bind(this);
        this.bulletPlayer = this.bulletPlayer.bind(this);
    }

    touchLava() {
            return this.lavaDamage;
    }

    touchEnemy(){
        return this.touchEnemyDamage;
    }

    bulletEnemy(){
        return this.bulletEnemyDamage;
    }

    bulletPlayer(){
        return this.playerBulletDamage;
    }
}
