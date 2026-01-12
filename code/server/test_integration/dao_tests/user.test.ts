import { afterEach, beforeAll, beforeEach, describe, expect, test, jest } from "@jest/globals";
import UserDAO from "../../src/dao/userDAO";
import { UnauthorizedUserError, UserAlreadyExistsError, UserIsAdminError, UserNotAdminError, UserNotFoundError } from "../../src/errors/userError";
import { cleanup } from "../../src/db/cleanup";
import { Role, User } from "../../src/components/user";

jest.setTimeout(200000);
const userDAO = new UserDAO();

describe("1. Create a new user", () => {
    test("1.1: It should create a new user with the provided information", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        const result = await userDAO.createUser("erika.astegiano", "Erika", "Astegiano", "password", "Customer");
        expect(result).toBe(true);

        //Retrieve the newly created user (address and birthdate are null when the user is created)
        const wantedUser = await userDAO.getUserByUsername("erika.astegiano");
        expect(wantedUser).toBeDefined();
        expect(wantedUser.name).toBe("Erika");
        expect(wantedUser.surname).toBe("Astegiano");
        expect(wantedUser.role).toBe("Customer");
        expect(wantedUser.address).toBe(null);
        expect(wantedUser.birthdate).toBe(null);
    });

    test("1.2: It should return a 409 error when username represents a user that is already in the database", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        const result = await userDAO.createUser("erika.astegiano", "Erika", "Astegiano", "password", "Customer");
    
        await expect(userDAO.createUser("erika.astegiano", "Erikaa", "Astegiano", "myPassword", "Customer")).
            rejects.toThrow(UserAlreadyExistsError);
    });
});

describe("2. Return the list of all users", () => {
    test("2.1: It should return the list of all users", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        const user1 = await userDAO.createUser("erika.astegiano", "Erika", "Astegiano", "password", "Customer");
        const user2 = await userDAO.createUser("riccardo.freddolino", "Riccardo", "Freddolino", "password", "Manager");
        const user3 = await userDAO.createUser("emanuelefrisi", "Emanuele", "Frisi", "password", "Manager");
        const user4 = await userDAO.createUser("Agnese_Re", "Agnese", "Re", "password", "Manager");

        //The previous four users must be inserted in the database (check length and content of the result)
        const result = await userDAO.getUsers();
        expect(result).toHaveLength(4);
        expect(result).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    username: "erika.astegiano",
                    address: null,
                    birthdate: null,
                    name: "Erika",
                    surname: "Astegiano",
                    role: "Customer"
                }),
                expect.objectContaining({
                    username: "riccardo.freddolino",
                    name: "Riccardo",
                    surname: "Freddolino",
                    role: "Manager",
                    address: null,
                    birthdate: null
                }),
                expect.objectContaining({
                    username: "emanuelefrisi",
                    name: "Emanuele",
                    surname: "Frisi",
                    address: null,
                    birthdate: null,
                    role: "Manager"
                }),
                expect.objectContaining({
                    username: "Agnese_Re",
                    name: "Agnese",
                    surname: "Re",
                    role: "Manager",
                    address: null,
                    birthdate: null
                })
            ])
        )
    });

    test("2.2: It should return an empty list if no user is registered", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        // No user is created
        const result = await userDAO.getUsers();
        expect(result).toHaveLength(0);
        expect(result).toEqual([]);
    });
});

describe("3. Returns the list of all users with a specific role", () => {
    test("3.1: It should return the list of users with a specific role", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        const user1 = await userDAO.createUser("erika.astegiano", "Erika", "Astegiano", "password", "Customer");
        const user2 = await userDAO.createUser("riccardo.freddolino", "Riccardo", "Freddolino", "password", "Customer");
        const user3 = await userDAO.createUser("emanuelefrisi", "Emanuele", "Frisi", "password", "Customer");
        const user4 = await userDAO.createUser("Agnese_Re", "Agnese", "Re", "password", "Manager");

        const result = await userDAO.getUsersByRole("Manager");
        expect(result).toHaveLength(1);
        expect(result).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    username: "Agnese_Re",
                    name: "Agnese",
                    surname: "Re",
                    role: "Manager",
                    address: null,
                    birthdate: null
                })
            ])
        )
    });

    test("3.2: It should return an empty list if no users with a specific role exist", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        const user1 = await userDAO.createUser("erika.astegiano", "Erika", "Astegiano", "password", "Customer");
        const user2 = await userDAO.createUser("riccardo.freddolino", "Riccardo", "Freddolino", "password", "Customer");
        const user3 = await userDAO.createUser("emanuelefrisi", "Emanuele", "Frisi", "password", "Customer");
        const user4 = await userDAO.createUser("Agnese_Re", "Agnese", "Re", "password", "Manager");

        const result = await userDAO.getUsersByRole("Admin");
        expect(result).toHaveLength(0);
        expect(result).toEqual([]);
    });
});

describe("4. Return a single user with a specific username", () => {
    test("4.1: It should return a single user, given the username", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        const wantedUser = await userDAO.createUser("fulvio.corno", "Fulvio", "Corno", "passwordddd", "Manager");
        
        const result = await userDAO.getUserByUsername("fulvio.corno");
        expect(result).toBeDefined();
        expect(result.name).toBe("Fulvio");
        expect(result.surname).toBe("Corno");
        expect(result.role).toBe("Manager");
        expect(result.address).toBe(null);
        expect(result.birthdate).toBe(null);
    });

    test("4.2: It should return a 404 error if no user with the given username exists", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        const addUser1 = await userDAO.createUser("fulvio.corno", "Fulvio", "Corno", "passwordddd", "Manager");
        const addUser2 = await userDAO.createUser("luca.mannella", "Luca", "Mannella", "passwordddd", "Customer");

        await expect(userDAO.getUserByUsername("luca.ardito")). 
            rejects.toThrow(UserNotFoundError);
    });
});

describe("5. Delete a specific user, given the username", () => {
    test("5.1: It should delete the user with the specific username - admin deletes a user of type Customer or Manager", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        // The logged in user who wants to delete a specific user, given the username
        const user = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Corso Duca degli Abruzzi, 124, Torino", "1970-01-01");
        // Registered users in the database
        const addUser1 = await userDAO.createUser("fulvio.corno", "Fulvio", "Corno", "passwordddd", "Manager");
        const addUser2 = await userDAO.createUser("luca.mannella", "Luca", "Mannella", "passwordddd", "Customer");

        // An admin can delete any non-admin user
        const result1 = await userDAO.deleteUser(user, "fulvio.corno");
        expect(result1).toBe(true);

        const result2 = await userDAO.getUsers();
        expect(result2).toHaveLength(1);    // a user has been deleted
        expect(result2).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    username: "luca.mannella",
                    name: "Luca",
                    surname: "Mannella",
                    role: "Customer",
                    address: null,
                    birthdate: null
                })
            ])
        )
    });

    test("5.2: It should delete the user with the specific username - Customer or Manager delete themselves", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        const user = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Corso Duca degli Abruzzi, 124, Torino", "1970-01-01");
        
        const addUser1 = await userDAO.createUser("Agnese_Re", "Agnese", "Re", "passwordddd", "Customer");
        const addUser2 = await userDAO.createUser("luca.mannella", "Luca", "Mannella", "passwordddd", "Customer");

        const result1 = await userDAO.deleteUser(user, "Agnese_Re");
        expect(result1).toBe(true);

        const result2 = await userDAO.getUsers();
        expect(result2).toHaveLength(1);
        expect(result2).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    username: "luca.mannella",
                    name: "Luca",
                    surname: "Mannella",
                    role: "Customer",
                    address: null,
                    birthdate: null
                })
            ])
        )
    });

    test("5.3: It should return a 401 error when a user, that is not admin, tries to delete a different user", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        const user = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Corso Duca degli Abruzzi, 124, Torino", "1970-01-01");
        
        const addUser1 = await userDAO.createUser("Agnese_Re", "Agnese", "Re", "passwordddd", "Customer");
        const addUser2 = await userDAO.createUser("luca.mannella", "Luca", "Mannella", "passwordddd", "Customer");

        await expect(userDAO.deleteUser(user, "luca.mannella")).
            rejects.toThrow(UserNotAdminError);
    });

    /*test("5.4: It should return a 404 error when username represents a user that does not exist in the database", async () => {
        const user = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Corso Duca degli Abruzzi, 124, Torino", "1970-01-01");
        
        const addUser1 = await userDAO.createUser("fulvio.corno", "Fulvio", "Corno", "passwordddd", "Manager");
        const addUser2 = await userDAO.createUser("luca.mannella", "Luca", "Mannella", "passwordddd", "Customer");

        await expect(userDAO.deleteUser(user, "lucalamberti")). 
            rejects.toThrow(UserNotFoundError);
    });*/

    test("5.5: It should return a 401 error when an admin tries to delete another admin", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        const user = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Corso Duca degli Abruzzi, 124, Torino", "1970-01-01");
        
        const addUser1 = await userDAO.createUser("fulvio.corno", "Fulvio", "Corno", "passwordddd", "Manager");
        const addUser2 = await userDAO.createUser("luca.mannella", "Luca", "Mannella", "passwordddd", "Admin");

        await expect(userDAO.deleteUser(user, "luca.mannella")).rejects.toThrow(UserIsAdminError);
    });
});

describe("6. Delete all non-admin users", () => {
    test("6.1: It should delete all non-admin users (no admins in the database)", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        const user1 = await userDAO.createUser("erika.astegiano", "Erika", "Astegiano", "password", "Customer");
        const user2 = await userDAO.createUser("riccardo.freddolino", "Riccardo", "Freddolino", "password", "Manager");
        const user3 = await userDAO.createUser("emanuelefrisi", "Emanuele", "Frisi", "password", "Customer");
        const user4 = await userDAO.createUser("Agnese_Re", "Agnese", "Re", "password", "Manager");

        const result = await userDAO.deleteAllUsers();
        expect(result).toBe(true);
        const users = await userDAO.getUsers();
        expect(users).toHaveLength(0);
    });

    test("6.2: It should delete all non-admin users (some admins in the database)", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        const user1 = await userDAO.createUser("erika.astegiano", "Erika", "Astegiano", "password", "Customer");
        const user2 = await userDAO.createUser("riccardo.freddolino", "Riccardo", "Freddolino", "password", "Admin");
        const user3 = await userDAO.createUser("emanuelefrisi", "Emanuele", "Frisi", "password", "Admin");
        const user4 = await userDAO.createUser("Agnese_Re", "Agnese", "Re", "password", "Manager");

        const result = await userDAO.deleteAllUsers();
        expect(result).toBe(true);
        const users = await userDAO.getUsers();
        expect(users).toHaveLength(2);
    });
});

describe("7. Update personal information of a single user", () => {
    test("7.1: It should update user information given the specific username - admin updates information of user of type Customer or Manager", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        // The logged in user who wants to update information of a specific user, given the username
        const user = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Corso Duca degli Abruzzi, 124, Torino", "1970-01-01");
        // Registered users in the database
        const addUser1 = await userDAO.createUser("fulvio.corno", "Fulvio", "Corno", "passwordddd", "Manager");
        const addUser2 = await userDAO.createUser("luca.lamberti", "Luca", "Lamberti", "passwordddd", "Customer");

        // An admin can update information of any non-admin user
        const result1 = await userDAO.updateUser(user, "sonoFulvio", "CornodiCognome", 
            "Corso Castelfidardo 129, Torino", "1960-01-03", "fulvio.corno");
        expect(result1).toBeDefined();
        expect(result1.name).toBe("sonoFulvio");
        expect(result1.surname).toBe("CornodiCognome");
        expect(result1.address).toBe("Corso Castelfidardo 129, Torino");
        expect(result1.birthdate).toBe("1960-01-03");
        expect(result1.role).toBe("Manager");   // role cannot be changed (like username and password)

        const result2 = await userDAO.getUsers();
        expect(result2).toHaveLength(2);
        expect(result2).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    username: "fulvio.corno",
                    name: "sonoFulvio",
                    surname: "CornodiCognome",
                    role: "Manager",
                    address: "Corso Castelfidardo 129, Torino",
                    birthdate: "1960-01-03"
                }),
                expect.objectContaining({
                    username: "luca.lamberti",
                    name: "Luca",
                    surname: "Lamberti",
                    role: "Customer",
                    address: null,
                    birthdate: null
                })
            ])
        )
    });

    test("7.2: It should update user information given the specific username - Customer or Manager updates information of themselves", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        const user = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Corso Duca degli Abruzzi, 124, Torino", "1970-01-01");
        
        const addUser1 = await userDAO.createUser("Agnese_Re", "Agnese", "Re", "passwordddd", "Customer");
        const addUser2 = await userDAO.createUser("luca.lamberti", "Luca", "Lamberti", "passwordddd", "Customer");

        const result1 = await userDAO.updateUser(user, "Agnes", "King", 
            "Corso Casale 80, Torino", "1990-01-02", "Agnese_Re");
        expect(result1).toBeDefined();
        expect(result1.name).toBe("Agnes");
        expect(result1.surname).toBe("King");
        expect(result1.address).toBe("Corso Casale 80, Torino");
        expect(result1.birthdate).toBe("1990-01-02");
        expect(result1.role).toBe("Customer");

        const result2 = await userDAO.getUsers();
        expect(result2).toHaveLength(2);
        expect(result2).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    username: "Agnese_Re",
                    name: "Agnes",
                    surname: "King",
                    role: "Customer",
                    address: "Corso Casale 80, Torino",
                    birthdate: "1990-01-02"
                }),
                expect.objectContaining({
                    username: "luca.lamberti",
                    name: "Luca",
                    surname: "Lamberti",
                    role: "Customer",
                    address: null,
                    birthdate: null
                })
            ])
        )
    });

    test("7.3: It should return a 401 error when a user, that is not admin, tries to update information of a different user", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        const user = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Corso Duca degli Abruzzi, 124, Torino", "1970-01-01");
        
        const addUser1 = await userDAO.createUser("Agnese_Re", "Agnese", "Re", "passwordddd", "Customer");
        const addUser2 = await userDAO.createUser("luca.lamberti", "Luca", "Lamberti", "passwordddd", "Customer");

        await expect(userDAO.updateUser(user, "sonoLuca", "LambertidiCognome", 
            "Corso Castelfidardo 24, Torino", "1989-02-04", "luca.lamberti")).
            rejects.toThrow(UserNotAdminError);
    });

    /*test("7.4: It should return a 404 error when username represents a user that does not exist in the database", async () => {
        const user = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Corso Duca degli Abruzzi, 124, Torino", "1970-01-01");
        
        const addUser1 = await userDAO.createUser("fulvio.corno", "Fulvio", "Corno", "passwordddd", "Manager");
        const addUser2 = await userDAO.createUser("luca.lamberti", "Luca", "Lamberti", "passwordddd", "Customer");

        await expect(userDAO.updateUser(user, "Luca", "Lamberti",
            "Via Puccini 8, Pino Torinese", "1975-03-04", "lucalamberti")). //different from luca.lamberti
            rejects.toThrow(UserNotFoundError);
    });*/

    test("7.5: It should return a 401 error when an admin tries to update information of another admin", async () => {
        await cleanup();
        await userDAO.deleteAllUsers();
        const user = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Corso Duca degli Abruzzi, 124, Torino", "1970-01-01");
        
        const addUser1 = await userDAO.createUser("fulvio.corno", "Fulvio", "Corno", "passwordddd", "Manager");
        const addUser2 = await userDAO.createUser("luca.lamberti", "Luca", "Lamberti", "passwordddd", "Admin");

        await expect(userDAO.updateUser(user, "sonoLuca", "LambertidiCognome", 
            "Corso Castelfidardo 24, Torino", "1989-02-04", "luca.lamberti")). 
            rejects.toThrow(UnauthorizedUserError);
    });
});