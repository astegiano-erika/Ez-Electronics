import db from "../db/db"
import { User } from "../components/user"
import crypto from "crypto"
import { UserAlreadyExistsError, UserNotFoundError } from "../errors/userError";
import {UnauthorizedUserError, UserNotAdminError, UserIsAdminError }  from "../errors/userError"

/**
 * A class that implements the interaction with the database for all user-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class UserDAO {

    /**
     * Checks whether the information provided during login (username and password) is correct.
     * @param username The username of the user.
     * @param plainPassword The password of the user (in plain text).
     * @returns A Promise that resolves to true if the user is authenticated, false otherwise.
     */
    getIsUserAuthenticated(username: string, plainPassword: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                /**
                 * Example of how to retrieve user information from a table that stores username, encrypted password and salt (encrypted set of 16 random bytes that ensures additional protection against dictionary attacks).
                 * Using the salt is not mandatory (while it is a good practice for security), however passwords MUST be hashed using a secure algorithm (e.g. scrypt, bcrypt, argon2).
                 */
                const sql = "SELECT username, password, salt FROM users WHERE username = ?"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) reject(err)
                    //If there is no user with the given username, or the user salt is not saved in the database, the user is not authenticated.
                    if (!row || row.username !== username || !row.salt) {
                        resolve(false)
                    } else {
                        //Hashes the plain password using the salt and then compares it with the hashed password stored in the database
                        const hashedPassword = crypto.scryptSync(plainPassword, row.salt, 16)
                        const passwordHex = Buffer.from(row.password, "hex")
                        if (!crypto.timingSafeEqual(passwordHex, hashedPassword)) resolve(false)
                        resolve(true)
                    }

                })
            } catch (error) {
                reject(error)
            }

        });
    }

    /**
     * Creates a new user and saves their information in the database
     * @param username The username of the user. It must be unique.
     * @param name The name of the user
     * @param surname The surname of the user
     * @param password The password of the user. It must be encrypted using a secure algorithm (e.g. scrypt, bcrypt, argon2)
     * @param role The role of the user. It must be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    createUser(username: string, name: string, surname: string, password: string, role: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const salt = crypto.randomBytes(16)
                const hashedPassword = crypto.scryptSync(password, salt, 16)
                const sql = "INSERT INTO users(username, name, surname, role, password, salt) VALUES(?, ?, ?, ?, ?, ?)"
                db.run(sql, [username, name, surname, role, hashedPassword, salt], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("UNIQUE constraint failed: users.username")) reject(new UserAlreadyExistsError)
                        reject(err)
                    }
                    resolve(true)
                })
            } catch (error) {
                reject(error)
            }

        })
    }

    /**
     * Returns a user object from the database based on the username.
     * @param username The username of the user to retrieve
     * @returns A Promise that resolves the information of the requested user
     */
    
    getUserByUsername(username: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM users WHERE username = ?"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!row) {
                        reject(new UserNotFoundError())
                        return
                    }
                    const user: User = new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate)
                    resolve(user)
                })
            } catch (error) {
                reject(error)
            }

        })
    }

    getUsers():Promise<User[]>{
        return new Promise<User[]>((resolve, reject) => {
            try{            
                const query="SELECT * from users";
                db.all(query, [], (err: Error | null, rows: User[] | null) => { 
                    if(err){
                        reject(err);
                        return;
                    }else if(rows.length == 0){
                        resolve([]);
                        return;
                    }else{
                        resolve(rows.map(row => new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate)));
                        return;
                    }
                });
            }catch(error){
                reject(error);
                return;
            }
        });
    }

    getUsersByRole(role: string):Promise<User[]>{
        return new Promise<User[]>((resolve, reject) => {
            if(!(role=="Manager"||role=="Customer"||role=="Admin")){
                console.log("Si sta cercendo di ottenere una lista di utenti il cui ruolo non è valido");
                reject();
                return;
            }
            try{
                const query="SELECT * from users WHERE role=?";
                db.all(query, [role], (err: Error | null, rows: User[] | null) => {
                    if(err){
                        reject(err);
                        return;
                    }else if(rows.length == 0){
                        resolve([]);
                        return;
                    }else{
                        resolve(rows.map(row => new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate)));
                        return;
                    }
                });
            }catch(error){
                reject(error);
                return;
            }
        });
    }

    deleteUser(user: User, username: string):Promise<Boolean>{
        return new Promise<Boolean>((resolve, reject) => {
            try{
                if(username===""){
                    console.log("La stringa che indica lo username da cercare è vuota");
                    reject();
                    return;
                }
                if(user.role!="Admin" && user.username!=username){
                    reject(new UserNotAdminError());  
                    return; 
                }
                const query="SELECT * from users WHERE username=?";
                db.get(query, [username], (err: Error | null, row: User | null) => {
                    if(err){
                        reject(err);
                        return;
                    }else if(!row){
                        console.log("Utente cercato non trovato");
                        reject(new UserNotFoundError());
                        return;
                    }else{
                        if(row.role==="Admin" && row.username!==user.username){
                            console.log("Un Admin ha tento di eleminare un altro admin")
                            reject(new UserIsAdminError());
                            return;
                        }else{
                            const query="DELETE FROM users WHERE username=?";
                            db.run(query, [username], (err: Error | null) => {
                                if(err){
                                    reject(err);
                                    return;
                                }else{
                                    resolve(true);
                                    return;                            
                                }
                            });
                        }
                    }
                });
            }catch(error){
                reject(error);
                return;
            }
        });
    }

    deleteAllUsers(): Promise<Boolean>{
        return new Promise<Boolean>((resolve, reject) => {
            try{
                const query="DELETE FROM users WHERE role != 'Admin'";
                db.run(query, [], (err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    } else {
                        resolve(true); 
                        return;                           
                    }
                });

            }catch(error){
                reject(error);
                return;
            }
        });
    }

    async effectiveUpdateUser(name: string, surname: string, address: string, birthdate: string, username: string) : Promise<Boolean>{
        return new Promise<Boolean>((resolve, reject) => {
            try{
                const sql = "UPDATE users SET name = ?, surname= ?, address= ?, birthdate=?, username=? WHERE username=?"
                db.run(sql, [name, surname, address, birthdate, username, username], (err: any, row: User) => {
                    if (err) {
                        reject(err)
                        return
                    } else {
                        resolve(true);
                    }
                });

            }catch (error){
                reject(error)
            }

        });
    }
    
    async updateUser(user: User, name: string, surname: string, address: string, birthdate: string, username: string): Promise<User> {
        return new Promise<User>(async (resolve, reject) => {
            const regex = /^\d{4}-\d{2}-\d{2}$/;
            const currentDate = new Date();
            const birthday = new Date(birthdate);
    
            if (username === "" || name === "" || surname === "" || address === "" || birthdate === "") {
                console.log("Almeno una delle stringhe passate è vuota");
                reject(new Error("Invalid input"));
                return;
            }
            if (!regex.test(birthdate)) {
                console.log("La data non è nel formato yyyy-mm-dd");
                reject(new Error("Invalid date format"));
                return;
            }
            if (birthday > currentDate) {
                console.log("La data di nascità è maggiore della data odierna");
                reject(new Error("Birthdate is in the future"));
                return;
            }
            if (user.role !== "Admin" && user.username !== username) {
                console.log("Ruolo non autorizzato sta tentando di modificare informazioni non proprie");
                reject(new UserNotAdminError());
                return;
            }
    
            try {
                const query = "SELECT * FROM users WHERE username=?";
                db.get(query, [username], async (err: Error | null, row: User | null) => {
                    if (err) {
                        reject(err);
                        return;
                    } else if (!row) {
                        console.log("Utente cercato non trovato");
                        reject(new UserNotFoundError());
                        return;
                    } else {
                        if (row.role === "Admin" && row.username !== user.username) {
                            console.log("Un Admin ha tento di modificare il profilo un altro admin");
                            reject(new UnauthorizedUserError());
                            return;
                        } else {
                            try {
                                const res = await this.effectiveUpdateUser(name, surname, address, birthdate, username);
                                if (res) {
                                    const query3 = "SELECT * FROM users WHERE username=?";
                                    db.get(query3, [username], (err: Error | null, row: User | null) => {
                                        if (err) {
                                            reject(err);
                                            return;
                                        } else {
                                            resolve(new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate));
                                        }
                                    });
                                }
                            } catch (error) {
                                reject(error);
                            }
                        }
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}
export default UserDAO