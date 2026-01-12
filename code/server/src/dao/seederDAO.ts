import db from "../db/db"
import { User } from "../components/user"
import crypto from "crypto"
import { UserAlreadyExistsError, UserNotFoundError } from "../errors/userError";

class SeederDAO {
    effectiveUpdateUser(name: string, surname: string, address: string, birthdate: string, username: string){
        return new Promise<Boolean>((resolve, reject) => {
            try{
                const sql = "UPDATE users SET name = ?, surname= ?, address= ?, birthdate=?, username=? WHERE username=?"
                db.run(sql, [name, surname, address, birthdate, username, username], (err: any, row: User) => {
                    if (err) {
                        reject(err)
                        return
                    } else {
                        return(true);
                    }
                });

            }catch (error){
                reject(error)
            }

        });
    }

    updateUserSeeder(name: string, surname: string, address: string, birthdate: string, username: string): Promise<User>{
        return new Promise<User>((resolve, reject) => {
            try{
                const query="SELECT * FROM users WHERE username=?";
                db.get(query, [username], (err: Error | null, row: User | null) => {
                    if(err){
                        reject(err);
                        return;
                    }else if(row===null){
                        console.log("Utente cercato non trovato");
                        reject(new UserNotFoundError());
                        return;
                    }else{
                        if(this.effectiveUpdateUser(name, surname, address, birthdate, username)){
                            const query3="SELECT * FROM users WHERE username=?";
                            db.get(query3, [username], (err: Error | null, row: User | null) => {
                                if(err){
                                    reject(err);
                                    return;
                                }else{
                                    resolve(new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate));
                                    return;
                                }
                            });
                        }else{
                            console.log("Update fallito");
                            reject();
                            return;
                        }
                    }
                });
            }catch(error){
                reject(error);
                return;
            }
        });
    }

}

export default SeederDAO