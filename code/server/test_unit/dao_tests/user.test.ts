import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"

import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { UnauthorizedUserError, UserIsAdminError, UserNotAdminError, UserNotFoundError } from "../../src/errors/userError"
import { Role, User } from "../../src/components/user"
import exp from "constants"
import { error } from "console"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")

afterEach(() => {
    jest.clearAllMocks();
});

describe("1: getIsUserAuthenticated", () => {
    // Mock the database get method to simulate a successful retrievement of a user, the crypto scrypt and timingSafeEqual method
    test("1.1: It should resolve true - retrievement of a user", async () => {
        const userDAO = new UserDAO();
        const mockUser = {username: "username", password: "password", salt: "salt"};
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, mockUser);
            return {} as Database;
        });
        const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
            return Buffer.from("salt");
        });
        const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation((passwordHex, passwordHashed) => {
            return true;
        });
        const result = await userDAO.getIsUserAuthenticated("username", "password");
        expect(result).toBe(true);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.get).toHaveBeenCalledWith(
            expect.any(String),
            ["username"],
            expect.any(Function)
        );
        mockDBGet.mockRestore();
        mockScrypt.mockRestore();
        mockTimingSafeEqual.mockRestore();
    });

    test("1.2: Generic db error in get - retrievement of a user", async () => {
        const userDAO = new UserDAO();
        const error = new Error("DB error in get");
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(error);
            return {} as Database;
        });

        await expect(userDAO.getIsUserAuthenticated("username", "password")).rejects.toThrow(error);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.get).toHaveBeenCalledWith(
            expect.any(String),
            ["username"],
            expect.any(Function)
        );
        mockDBGet.mockRestore();
    });

    test("1.3: It should reject with error when there is an exception (get user authenticated)", async () => {
        const userDAO = new UserDAO();
        const error = new Error("Unexpected error");
        const mockDBGet = jest.spyOn(db, "get").mockImplementation(() => {
            throw error;    // Simula un'eccezione
        });

        await expect(userDAO.getIsUserAuthenticated("username", "password")).rejects.toThrow(error);
        mockDBGet.mockRestore();
    });
});

// Example of unit test for the createUser method
// It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
// It then calls the createUser method and expects it to resolve true
describe("2: createUser", () => {
    test("2.1: It should resolve true - creation of a user", async () => {
        const userDAO = new UserDAO();
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });
        const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
            return (Buffer.from("salt"))
        })
        const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
            return Buffer.from("hashedPassword")
        })
        const result = await userDAO.createUser("username", "name", "surname", "password", "role")
        expect(result).toBe(true);
        expect(db.run).toHaveBeenCalledTimes(1);
        mockRandomBytes.mockRestore()
        mockDBRun.mockRestore()
        mockScrypt.mockRestore()
    });

    test("2.2: Generic db error in run (creation of a user)", async () => {
        const userDAO = new UserDAO();
        const error = new Error("DB error in run method");
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(error);
            return {} as Database;
        });
        await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow(error);
        expect(db.run).toHaveBeenCalledTimes(1);
        mockDBRun.mockRestore();
    });

    test("2.3: It should reject with error when there is an exception (create user)", async () => {
        const userDAO = new UserDAO();
        const error = new Error("Unexpected error");
        const mockDBRun = jest.spyOn(db, "run").mockImplementation(() => {
            throw error;    // Simula un'eccezione
        });

        await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow(error);
        mockDBRun.mockRestore();
    });
});

describe("3: getUsers", () => {
    const userDAO = new UserDAO();

    test("3.1: It should return the list of all users", async() => {
        const mockUsers = [
            {username: "Mario Rossi", name: "Mario", surname: "Rossi", role: "Customer", address: "Via Adige 5", birthdate: "1970-01-02"},
            {username: "Ernesto Gialli", name: "Ermesto", surname: "Gialli", role: "Customer", address: "Via Po 8", birthdate: "1971-10-20"},
            {username: "Flavio Neri", name: "Flavio", surname: "Neri", role: "Manager", address: "Via Padova 90", birthdate: "1975-07-01"},
            {username: "Angela Verdi", name: "Angela", surname: "Verdi", role: "Admin", address: "Via Tanaro 128", birthdate: "1980-05-28"} 
        ];
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, mockUsers);
            return {} as Database;
        });
        // Instead of use the real db.all function, getUsers() use the mock function prevoiusly defined
        const result = await userDAO.getUsers();
        expect(db.all).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockUsers);
        mockDBAll.mockRestore();
    });

    test("3.2: It should return an empty list if no users are registered", async() => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, []);
            return {} as Database;
        });
        const result = await userDAO.getUsers();
        expect(db.all).toHaveBeenCalledTimes(1);
        expect(result).toEqual([]);
        mockDBAll.mockRestore();
    });

    test("3.3: Generic db error in all (retrievement of all users)", async() => {
        const error = new Error("DB error in all method");
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(error);
            return {} as Database;
        });
        await expect(userDAO.getUsers()).rejects.toThrow(error);
        expect(db.all).toHaveBeenCalledTimes(1);
        mockDBAll.mockRestore();
    });

    test("3.4: It should reject with error when there is an exception (get users)", async () => {
        const error = new Error("Unexpected error");
        const mockDBAll = jest.spyOn(db, "all").mockImplementation(() => {
            throw error;    // Simula un'eccezione
        });

        await expect(userDAO.getUsers()).rejects.toThrow(error);
        mockDBAll.mockRestore();
    });
});

describe("4: getUsersByRole", () => {
    const userDAO = new UserDAO();

    test("4.1: It should return the list of all users with a specific role", async() => {
        const roleToTest = "Customer";
        const mockUsers = [
            {username: "Mario Rossi", name: "Mario", surname: "Rossi", role: "Customer", address: "Via Adige 5", birthdate: "1970-01-02"},
            {username: "Ernesto Gialli", name: "Ermesto", surname: "Gialli", role: "Customer", address: "Via Po 8", birthdate: "1971-10-20"},
            {username: "Flavio Neri", name: "Flavio", surname: "Neri", role: "Manager", address: "Via Padova 90", birthdate: "1975-07-01"},
            {username: "Angela Verdi", name: "Angela", surname: "Verdi", role: "Admin", address: "Via Tanaro 128", birthdate: "1980-05-28"} 
        ];
        const filteredMockUsers = mockUsers.filter((user) => user.role === roleToTest);
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, filteredMockUsers);
            return {} as Database;
        });
        // Instead of use the real db.all function, getUsers() use the mock function prevoiusly defined
        const result = await userDAO.getUsersByRole(roleToTest);
        expect(db.all).toHaveBeenCalledTimes(1);
        expect(result).toEqual(filteredMockUsers);
        mockDBAll.mockRestore();
    });

    test("4.2: It should return an empty list. No users with the specific role", async() => {
        const roleToTest = "Customer";
        const mockUsers = [
            {username: "Flavio Neri", name: "Flavio", surname: "Neri", role: "Manager", address: "Via Padova 90", birthdate: "1975-07-01"},
            {username: "Angela Verdi", name: "Angela", surname: "Verdi", role: "Admin", address: "Via Tanaro 128", birthdate: "1980-05-28"} 
        ];
        const filteredMockUsers = mockUsers.filter((user) => user.role === roleToTest);
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, filteredMockUsers);
            return {} as Database;
        });
        const result = await userDAO.getUsersByRole(roleToTest);
        expect(db.all).toHaveBeenCalledTimes(1);
        expect(result).toEqual([]);
        mockDBAll.mockRestore();
    });

    test("4.3: It should return an error if the searched role is not Admin, Customer or Manager", async() => {
        const error = new Error("The searched role does not exist");

        await expect(userDAO.getUsersByRole("notexists"))
            .rejects.toBeUndefined();
    });

    test("4.4: Generic db error in all (retrievement of all users with a specific role)", async() => {
        const error = new Error("DB error in all method");
        const roleToTest = "Customer";
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(error);
            return {} as Database;
        });
        await expect(userDAO.getUsersByRole(roleToTest)).rejects.toThrow(error);
        expect(db.all).toHaveBeenCalledTimes(1);
        mockDBAll.mockRestore();
    });

    test("4.5: It should reject with error when there is an exception (get users by role)", async () => {
        const error = new Error("Unexpected error");
        const roleToTest = "Customer";
        const mockDBAll = jest.spyOn(db, "all").mockImplementation(() => {
            throw error;    // Simula un'eccezione
        });

        await expect(userDAO.getUsersByRole(roleToTest)).rejects.toThrow(error);
        mockDBAll.mockRestore();
    });
});

describe("5: getUserByUsername", () => {
    const userDAO = new UserDAO();

    test("5.1: It should return a single user with a specific username", async () => {
        const usernameToTest = "Mario Rossi";
        const mockUser = {username: usernameToTest, name: "Mario", surname: "Rossi", role: "Customer", address: "Via Adige 5", birthdate: "1970-01-02"};
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            expect(params).toEqual([usernameToTest]);
            callback(null, mockUser);
            return {} as Database;
        });
        const result = await userDAO.getUserByUsername(usernameToTest);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockUser);
        mockDBGet.mockRestore();
    });

    test("5.2: It should return a 404 error when a user with the specific username does not exist", async () => {
        const unexistingUsername = "Not Existing";
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });
        
        await expect(userDAO.getUserByUsername(unexistingUsername)).rejects.toThrow(UserNotFoundError);
        
        expect(db.get).toHaveBeenCalledTimes(1);
        mockDBGet.mockRestore();
    });

    test("5.3: Generic db error in get (user with a given username)", async () => {
        const error = new Error("DB error in get");
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(error);
            return {} as Database;
        });

        await expect(userDAO.getUserByUsername("username")).rejects.toThrow(error);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.get).toHaveBeenCalledWith(
            expect.any(String),
            ["username"],
            expect.any(Function)
        );
        mockDBGet.mockRestore();
    });

    test("5.4: It should reject with error when there is an exception (get user by username)", async () => {
        const error = new Error("Unexpected error");
        const mockDBGet = jest.spyOn(db, "get").mockImplementation(() => {
            throw error;    // Simula un'eccezione
        });

        await expect(userDAO.getUserByUsername("username")).rejects.toThrow(error);
        mockDBGet.mockRestore();
    });
});

describe("6: deleteUser", () => {
    const userDAO = new UserDAO();
    test("6.1: It should delete a specific user, given the username", async () => {
        const usernameToDelete = "Mario Rossi";
        const mockUserToDelete = new User("Mario Rossi", "Mario", "Rossi", Role.CUSTOMER, "Via Adige 5", "1970-01-02");
        const mockUser = new User("Angela Verdi", "Angela", "Verdi", Role.ADMIN, "Via Tanaro 128", "1980-05-28");
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            expect(params).toEqual([usernameToDelete]);
            callback(null, mockUserToDelete);
            return {} as Database;
        });
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            expect(params).toEqual([usernameToDelete]);
            callback(null);
            return {} as Database
        });
        const result = await userDAO.deleteUser(mockUser, usernameToDelete);
        expect(db.run).toHaveBeenCalledTimes(1);
        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test("6.2: It should return an error if the username is an empty string", async() => {
        const error = new Error("Empty username");
        const mockUser = new User("Angela Verdi", "Angela", "Verdi", Role.ADMIN, "Via Tanaro 128", "1980-05-28");

        await expect(userDAO.deleteUser(mockUser, ""))
            .rejects.toBeUndefined();
    });

    test("6.3: It should return an error if a non-admin user tries to delete another user", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Via Verdi 8, Milano", "2000-01-01");
        const error = new Error("Se non si è admin, non è possibile modificare le informazioni di un altro utente");

        await expect(userDAO.deleteUser(userWhoRequests, "username"))
            .rejects.toThrow(UserNotAdminError);
    });

    test("6.4: It should return a 404 error when a user with the specific username does not exist", async () => {
        const unexistingUsername = "Not Existing";
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Via Verdi 8, Milano", "2000-01-01");
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });
        
        await expect(userDAO.deleteUser(userWhoRequests, unexistingUsername)).rejects.toThrow(UserNotFoundError);
        
        expect(db.get).toHaveBeenCalledTimes(1);
        mockDBGet.mockRestore();
    });

    test("6.5: It should return a 401 error if an admin tries to delete another admin", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Via Verdi 8, Milano", "2000-01-01");
        const userToBeUpdated = new User("Angela_Verdi", "Angela", "Verdi", Role.ADMIN, "Via Rossi 8, Torino", "1980-01-01");
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, userToBeUpdated);
            return {} as Database;
        });

        await expect(userDAO.deleteUser(userWhoRequests, "Angela_Verdi")).rejects.toThrow(UserIsAdminError);
    })

    test("6.6: Generic db error in get (retrievement of the user to delete)", async () => {
        const mockUser = new User("Angela Verdi", "Angela", "Verdi", Role.ADMIN, "Via Tanaro 128", "1980-05-28");
        const userDAO = new UserDAO();
        const error = new Error("DB error in get");
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(error);
            return {} as Database;
        });

        await expect(userDAO.deleteUser(mockUser, "username")).rejects.toThrow(error);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.get).toHaveBeenCalledWith(
            expect.any(String),
            ["username"],
            expect.any(Function)
        );
        mockDBGet.mockRestore();
    });

    test("6.7: Generic db error in run (delete of the user)", async () => {
        const userWhoRequests = new User("emanuelefrisi", "Emanuele", "Frisi", Role.ADMIN, "Via Verdi 8, Milano", "2000-01-01");
        const wantedUser = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Via Rossi 8, Torino", "2001-01-02");
        const userDAO = new UserDAO();
        const error = new Error("DB error in run");
        // Mock first db.get
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, wantedUser);
            return {} as Database;
        });
        // Mock second db.run
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(error);
            return {} as Database;
        });

        await expect(userDAO.deleteUser(userWhoRequests, "Agnese_Re")).rejects.toThrow(error);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.get).toHaveBeenCalledWith(
            expect.any(String),
            ["Agnese_Re"],
            expect.any(Function)
        );
        mockDBGet.mockRestore();
        mockDBRun.mockRestore();
    });

    test("6.8: It should reject with error when there is an exception (delete user)", async () => {
        const userWhoRequests = new User("emanuelefrisi", "Emanuele", "Frisi", Role.ADMIN, "Via Verdi 8, Milano", "2000-01-01");
        const error = new Error("Unexpected error");
        const mockDBGet = jest.spyOn(db, "get").mockImplementation(() => {
            throw error;    // Simula un'eccezione
        });

        await expect(userDAO.deleteUser(userWhoRequests, "Agnese_Re")).rejects.toThrow(error);
        mockDBGet.mockRestore();
    });
});

describe("7: deleteUsers", () => {
    const userDAO = new UserDAO();
    test("7.1: It should delete all non-admin users", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database
        });
        const result = await userDAO.deleteAllUsers();
        expect(result).toBe(true);
        expect(db.run).toHaveBeenCalledTimes(1);
        mockDBRun.mockRestore();
    });

    test("7.2: Generic db error in run (delete all non-admin users)", async () => {
        const error = new Error("DB error in run method");
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(error);
            return {} as Database
        });
        await expect(userDAO.deleteAllUsers()).rejects.toThrow(error);
        expect(db.run).toHaveBeenCalledTimes(1);
        mockDBRun.mockRestore();
    });

    test("7.3: It should reject with error when there is an exception (delete all users)", async () => {
        const error = new Error("Unexpected error");
        const mockDBRun = jest.spyOn(db, "run").mockImplementation(() => {
            throw error;    // Simula un'eccezione
        });

        await expect(userDAO.deleteAllUsers()).rejects.toThrow(error);
        mockDBRun.mockRestore();
    });
});

describe("8: effectiveUpdateUser", () => {
    const userDAO = new UserDAO();
    test("8.1: It should update personal information of a single user", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database;
        });
        const result = await userDAO.effectiveUpdateUser("newName", "newSurname", "newAddress", "newBirthdate", "username");
        expect(result).toBe(true);
        expect(db.run).toHaveBeenCalledTimes(1);
        expect(db.run).toHaveBeenCalledWith(
            expect.any(String),
            ["newName",
            "newSurname",
            "newAddress",
            "newBirthdate",
            "username",
            "username"],
            expect.any(Function)
        );
        mockDBRun.mockRestore();
    });

    test("8.2: Generic db error in run (effective update user)", async () => {
        const error = new Error("DB error in run method");
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(error);
            return {} as Database;
        });
        await expect(userDAO.effectiveUpdateUser("newName", "newSurname", "newAddress", "newBirthdate", "username")).rejects.toThrow(error);
        expect(db.run).toHaveBeenCalledTimes(1);
        expect(db.run).toHaveBeenCalledWith(
            expect.any(String),
            ["newName",
            "newSurname",
            "newAddress",
            "newBirthdate",
            "username",
            "username"],
            expect.any(Function)
        );
        mockDBRun.mockRestore();
    });

    test("8.3: It should reject with error when there is an exception (effective update user)", async () => {
        const error = new Error("Unexpected error");
        const mockDBRun = jest.spyOn(db, "run").mockImplementation(() => {
            throw error;    // Simula un'eccezione
        });

        await expect(userDAO.effectiveUpdateUser("name", "surname", "address", "2020-01-01", "username")).rejects.toThrow(error);
        mockDBRun.mockRestore();
    });
}); 

describe("9: updateUser", () => {
    const userDAO = new UserDAO();

    test("9.1: It should return a user representing the updated one", async () => {
        const userWhoRequests = new User("emanuelefrisi", "Emanuele", "Frisi", Role.ADMIN, "Via Verdi 8, Milano", "2000-01-01");
        const wantedUser = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Via Rossi 8, Torino", "2001-01-02");
        const updatedUser = new User("Agnese_Re", "Agnese", "King", Role.CUSTOMER, "Via Edoardo Rossi, 8 Torino", "2001-01-02");
    
        // Mock the first db.get (search for a user with the specified username)
        const mockDBGetStart = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, wantedUser);
            return {} as Database;
        });
    
        // Mock method effectiveUpdateUser that perform the UPDATE in the db
        const mockEffectiveUpdate = jest.spyOn(UserDAO.prototype, "effectiveUpdateUser").mockResolvedValueOnce(true);
    
        // Mock the second db.get (retrieve the user with the updated information)
        const mockDBGetEnd = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, updatedUser);
            return {} as Database;
        });
    
        const result = await userDAO.updateUser(userWhoRequests, "Agnese", "King", "Via Edoardo Rossi, 8 Torino", "2001-01-02", "Agnese_Re");
        expect(result).toEqual(updatedUser);
        expect(db.get).toHaveBeenCalledTimes(2);
    
        // Restore all mocks
        mockDBGetStart.mockRestore();
        mockEffectiveUpdate.mockRestore();
        mockDBGetEnd.mockRestore();
    });

    test("9.2: It should return an error if a parameter is an empty string", async () => {
        const userWhoRequests = new User("emanuelefrisi", "Emanuele", "Frisi", Role.ADMIN, "Via Verdi 8, Milano", "2000-01-01");
        const error = new Error("Campi vuoti. Riempire tutti i campi");

        await expect(userDAO.updateUser(userWhoRequests, "Agnese", "King", "", "2001-01-02", "Agnese_Re"))
            .rejects.toThrow(new Error("Invalid input"));
    });

    test("9.3: It should return an error if date is not in the correct format", async () => {
        const userWhoRequests = new User("emanuelefrisi", "Emanuele", "Frisi", Role.ADMIN, "Via Verdi 8, Milano", "2000-01-01");
        const error = new Error("Formato data non corretto. Richiesta data nel formato YYYY-MM-DD");

        await expect(userDAO.updateUser(userWhoRequests, "Agnese", "King", "Via Edoardo Rossi, 8 Torino", "2001/01/02", "Agnese_Re"))
            .rejects.toThrow(new Error("Invalid date format"));
    });

    test("9.4: It should return an error if date is after the current date", async () => {
        const userWhoRequests = new User("emanuelefrisi", "Emanuele", "Frisi", Role.ADMIN, "Via Verdi 8, Milano", "2000-01-01");
        const error = new Error("Non è possibile selezionare una data postuma a quella odierna");

        await expect(userDAO.updateUser(userWhoRequests, "Agnese", "King", "Via Edoardo Rossi, 8 Torino", "2038-01-01", "Agnese_Re"))
            .rejects.toThrow(new Error("Birthdate is in the future"));
    });

    test("9.5: It should return an error if a non-admin user tries to update information of another user", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Via Verdi 8, Milano", "2000-01-01");
        const error = new Error("Se non si è admin, non è possibile modificare le informazioni di un altro utente");

        await expect(userDAO.updateUser(userWhoRequests, "Riccardo", "Freddo", "Via Edoardo Rossi, 8 Torino", "2001-01-01", "riccardofreddolino"))
            .rejects.toThrow(UserNotAdminError);
    });

    test("9.6: It should return a 404 error if the user to update does not exist", async () => {
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null);
            return {} as Database;
        });
        const userWhoRequests = new User("emanuelefrisi", "Emanuele", "Frisi", Role.ADMIN, "Via Verdi 8, Milano", "2000-01-01");

        await expect(userDAO.updateUser(userWhoRequests, "Agnese", "King", "Via Edoardo Rossi, 8 Torino", "2001-01-02", "Agneseeee"))
            .rejects.toThrow(UserNotFoundError);
        expect(db.get).toHaveBeenCalledTimes(1);
        mockDBGet.mockRestore();
    });

    test("9.7: It should return a 401 error if an admin tries to update information of another admin", async () => {
        const userWhoRequests = new User("emanuelefrisi", "Emanuele", "Frisi", Role.ADMIN, "Via Verdi 8, Milano", "2000-01-01");
        const wantedUser = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Via Rossi 8, Torino", "2001-01-02");
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, wantedUser);
            return {} as Database;
        });

        await expect(userDAO.updateUser(userWhoRequests, "Agnese", "King", "Via Edoardo Rossi, 8 Torino", "2001-01-02", "Agnese_Re"))
            .rejects.toThrow(UnauthorizedUserError);
        expect(db.get).toHaveBeenCalledTimes(1);
        mockDBGet.mockRestore();
    });

    test("9.8: Generic db error in get (user retrievement, given a username)", async () => {
        const userWhoRequests = new User("emanuelefrisi", "Emanuele", "Frisi", Role.ADMIN, "Via Verdi 8, Milano", "2000-01-01");
        const userDAO = new UserDAO();
        const error = new Error("DB error in get");
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(error);
            return {} as Database;
        });

        await expect(userDAO.updateUser(userWhoRequests, "Agnese", "King", "Via Edoardo Rossi, 8 Torino", "2001-01-02", "Agnese_Re")).rejects.toThrow(error);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.get).toHaveBeenCalledWith(
            expect.any(String),
            ["Agnese_Re"],
            expect.any(Function)
        );
        mockDBGet.mockRestore();
    });

    test("9.9: Generic db error in get (updated user retrievement, given a username)", async () => {
        const userWhoRequests = new User("emanuelefrisi", "Emanuele", "Frisi", Role.ADMIN, "Via Verdi 8, Milano", "2000-01-01");
        const wantedUser = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Via Rossi 8, Torino", "2001-01-02");
        const userDAO = new UserDAO();
        const error = new Error("DB error in get");
        // Mock first db.get
        const mockDBGetStart = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, wantedUser);
            return {} as Database;
        });
        // Mock second db.get
        const mockDBGetEnd = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(error);
            return {} as Database;
        });

        await expect(userDAO.updateUser(userWhoRequests, "Agnese", "King", "Via Edoardo Rossi, 8 Torino", "2001-01-02", "Agnese_Re")).rejects.toThrow(error);
        expect(db.get).toHaveBeenCalledTimes(1);
        expect(db.get).toHaveBeenCalledWith(
            expect.any(String),
            ["Agnese_Re"],
            expect.any(Function)
        );
        mockDBGetStart.mockRestore();
        mockDBGetEnd.mockRestore();
    });

    test("9.10: It should reject with error when there is an exception (update user)", async () => {
        const userWhoRequests = new User("emanuelefrisi", "Emanuele", "Frisi", Role.ADMIN, "Via Verdi 8, Milano", "2000-01-01");
        const error = new Error("Unexpected error");
        const mockDBGet = jest.spyOn(db, "get").mockImplementation(() => {
            throw error;    // Simula un'eccezione
        });

        await expect(userDAO.updateUser(userWhoRequests, "name", "surname", "address", "2020-01-01", "username")).rejects.toThrow(error);
        mockDBGet.mockRestore();
    });

    
    test("9.11: It should return an error when the update fails", async () => {
        const userWhoRequests = new User("emanuelefrisi", "Emanuele", "Frisi", Role.ADMIN, "Via Verdi 8, Milano", "2000-01-01");
        const wantedUser = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Via Rossi 8, Torino", "2001-01-02");
        const error = new Error("Update failed");
    
        // Mock the first db.get (search for a user with the specified username)
        const mockDBGetStart = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, wantedUser);
            return {} as Database;
        });
    
        // Mock method effectiveUpdateUser that perform the UPDATE in the db
        const mockEffectiveUpdate = jest.spyOn(UserDAO.prototype, "effectiveUpdateUser").mockRejectedValueOnce(error);
    
        await expect(userDAO.updateUser(userWhoRequests, "Agnese", "King", "Via Edoardo Rossi, 8 Torino", "2001-01-02", "Agnese_Re"))
            .rejects.toThrow(error);
    
        // Restore all mocks
        mockDBGetStart.mockRestore();
        mockEffectiveUpdate.mockRestore();
    });

    
});

