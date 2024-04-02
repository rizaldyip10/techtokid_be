import db from "../db";


export const genUsername = async (name: string) => {
    let username = name.split(" ")[0];

    const isUsernameExist = await db.user.findFirst({
        where: {
            username
        }
    })

    if (isUsernameExist) {
        username += Math.random().toString(36).substring(2, 6);
    };

    return username;
}