export class Logger {

    static info(message: string) {

        console.log(`[INFO] ${message}`);

    }

    static pass(message: string) {

        console.log(`✅ ${message}`);

    }

    static fail(message: string) {

        console.log(`❌ ${message}`);

    }

}