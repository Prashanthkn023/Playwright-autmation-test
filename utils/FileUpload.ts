import path from 'path';

export class FileUpload {

    static png() {

        return path.resolve('assets/test.png');

    }

    static jpg() {

        return path.resolve('assets/test.jpg');

    }

    static pdf() {

        return path.resolve('assets/test.pdf');

    }

}