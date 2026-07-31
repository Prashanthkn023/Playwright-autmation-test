export class Helper {

    static generateRandomNumber(length: number): string {

        let number = '';

        for (let i = 0; i < length; i++) {
            number += Math.floor(Math.random() * 10);
        }

        return number;
    }

    static generateRandomMobile() {

        return '9' + this.generateRandomNumber(9);

    }

    static generateRandomName() {

        return 'User' + Math.floor(Math.random() * 10000);

    }

    static currentDate() {

        return new Date().toLocaleDateString();

    }

    static currentTime() {

        return new Date().toLocaleTimeString();

    }

}