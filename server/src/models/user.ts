export class User {
    public uid: string;

    public firstName: string;
    public lastName: string | null;
    public name: string;
    public dob: Date | null;

    public profilePic: string | null;

    public phone: string;
    public email: string;

    public password: string;

    public createdAt: Date;
    public updatedAt: Date;
}
