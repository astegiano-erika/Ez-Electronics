import { test, expect, jest } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import { cleanup } from "../../src/db/cleanup";
import { Role, User } from "../../src/components/user";
import { UnauthorizedUserError, UserIsAdminError, UserNotAdminError, UserNotFoundError } from "../../src/errors/userError";
import { afterEach, describe } from "@jest/globals";
import { mock } from "node:test";

jest.mock("../../src/dao/userDAO")

//Example of a unit test for the createUser method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters

// Some useful objects or arrays
const researchRole = "Manager";

const testUsers = [
    {username: "erika.astegiano", name: "Erika", surname: "Astegiano", role: Role.CUSTOMER, address: "Via Po 9, Pino Torinese", birthdate: "1980-02-03"},
    {username: "riccardo.freddolino", name: "Riccardo", surname: "Freddolino", role: Role.MANAGER, address: "Corso Duca degli Abruzzi 24, Torino", birthdate: "1990-06-10"},
    {username: "emanuelefrisi", name: "Emanuele", surname: "Frisi", role: Role.MANAGER, address: "Via Asti 5, Collegno", birthdate: "1998-06-07"},
    {username: "Agnese_Re", name: "Agnese", surname: "Re", role: Role.ADMIN, address: "Corso Castelfidardo 129, Torino", birthdate: "1970-01-01"}
];

const filteredTestUsers = testUsers.filter((user) => user.role === researchRole);

afterEach(async () => {
    cleanup();
});

// CONTROLLER UNIT TESTS
describe("1. Controller: create a new user", () => {
    test("1.1: It should return true - creation of a new user", async () => {
        const testUser = { //Define a test user object
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        }
        jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
        const controller = new UserController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);
    
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
            testUser.name,
            testUser.surname,
            testUser.password,
            testUser.role);
        expect(response).toBe(true); //Check if the response is true
        jest.clearAllMocks();
    });
});

describe("2. Controller: return the list of all users", () => {
    test("2.1: It should return the list of all users", async () => {
        jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce(testUsers);
        const controller = new UserController();
        const response = await controller.getUsers();

        expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
        expect(response).toEqual(testUsers);
        jest.clearAllMocks();
    });
});

describe("3. Controller: return the list of all users with a specific role", () => {
    test("3.1: It should return the list of users with a specific role", async () => {
        jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValueOnce(filteredTestUsers);
        const controller = new UserController();
        const response = await controller.getUsersByRole(researchRole);

        expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
        expect(response).toEqual(filteredTestUsers);
        jest.clearAllMocks();
    });

    
    test("3.2: It should return an error if the role searched for is neither Customer, Manager or Admin", async () => {
        const error = new Error("Wrong research role");
        jest.spyOn(UserDAO.prototype, "getUsersByRole").mockRejectedValueOnce(error);
        const controller = new UserController();
        const result = await controller.getUsersByRole("wrong role");

        expect(result).toBeUndefined();
        expect(UserDAO.prototype.getUsersByRole).not.toHaveBeenCalled();
        jest.clearAllMocks();
    }); 
});

describe("4. Controller: return a single user with a specific username", () => {
    const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Corso Castelfidardo 129, Torino", "1970-01-01");
    const userRequested = new User("erika.astegiano", "Erika", "Astegiano", Role.CUSTOMER, "Via Po 9, Pino Torinese", "1980-02-03");

    test("4.1: It should return a single user with a given username", async () => {
        jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(userRequested);
        const controller = new UserController();
        const response = await controller.getUserByUsername(userWhoRequests, "erika.astegiano");

        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
        expect(response).toEqual(userRequested);
        jest.clearAllMocks();
    });

    test("4.2: It should return a 404 error, if no user with the given username exists", async () => {
        jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValueOnce(new UserNotFoundError());
        const controller = new UserController();
        await expect(controller.getUserByUsername(userWhoRequests, "fulvio.corno")).rejects.toThrow(UserNotFoundError);
        
        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("fulvio.corno");
        jest.clearAllMocks();
    });

    test("4.3: It should return an error if the given username is empty", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Corso Castelfidardo 129, Torino", "1970-01-01");
        
        const error = new Error("Username empty");
        jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValueOnce(error);
        const controller = new UserController();
        const result = await controller.getUserByUsername(userWhoRequests, "");

        expect(result).toBeUndefined();
        expect(UserDAO.prototype.getUserByUsername).not.toHaveBeenCalled();
        jest.clearAllMocks();
    }); 

    test("4.4: It should return a 401 error when a user, that is not admin, tries to access information of a different user", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Corso Castelfidardo 129, Torino", "1970-01-01");
        const mockUser = new User("erika.astegiano", "Erika", "Astegiano", Role.MANAGER, "Via Torino 7", "2000-01-02");
        
        jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(mockUser);
        const controller = new UserController();
        await expect(controller.getUserByUsername(userWhoRequests, "erika.astegiano")).rejects.toThrow(UnauthorizedUserError);

        expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(0);
        jest.clearAllMocks();
    }); 
});

describe("5. Controller: delete a specific user, given the username", () => {
    test("5.1: It should delete the user with the specific username - admin deletes a user of type Customer or Manager", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Corso Castelfidardo 129, Torino", "1970-01-01");
        const userRequested = new User("erika.astegiano", "Erika", "Astegiano", Role.CUSTOMER, "Via Po 9, Pino Torinese", "1980-02-03");
        
        jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);
        const controller = new UserController();
        const response = await controller.deleteUser(userWhoRequests, "erika.astegiano");

        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith(userWhoRequests, "erika.astegiano");
        jest.clearAllMocks();
    });

    test("5.2: It should delete the user with the specific username - Customer or Manager delete themselves", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Corso Castelfidardo 129, Torino", "1970-01-01");
        const userRequested = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Corso Castelfidardo 129, Torino", "1970-01-01");
        
        jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);
        const controller = new UserController();
        const response = await controller.deleteUser(userWhoRequests, "Agnese_Re");

        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith(userWhoRequests, "Agnese_Re");
        jest.clearAllMocks();
    });

    test("5.3: It should return a 401 error when a user, that is not admin, tries to delete a different user", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Corso Castelfidardo 129, Torino", "1970-01-01");
        const userRequested = new User("erika.astegiano", "Erika", "Astegiano", Role.CUSTOMER, "Via Po 9, Pino Torinese", "1980-02-03");
        
        jest.spyOn(UserDAO.prototype, "deleteUser").mockRejectedValueOnce(new UserNotAdminError());
        const controller = new UserController();
        await expect(controller.deleteUser(userWhoRequests, "erika.astegiano")).rejects.toThrow(UserNotAdminError);

        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith(userWhoRequests, "erika.astegiano");
        jest.clearAllMocks();
    });

    test("5.4: It should return a 404 error when username represents a user that is not registered", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Corso Castelfidardo 129, Torino", "1970-01-01");
        const userRequested = new User("erika.astegiano", "Erika", "Astegiano", Role.CUSTOMER, "Via Po 9, Pino Torinese", "1980-02-03");
        
        jest.spyOn(UserDAO.prototype, "deleteUser").mockRejectedValueOnce(new UserNotFoundError());
        const controller = new UserController();
        await expect(controller.deleteUser(userWhoRequests, "erika.astegiano")).rejects.toThrow(UserNotFoundError);

        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith(userWhoRequests, "erika.astegiano");
        jest.clearAllMocks();
    });

    test("5.5: It should return a 401 error when an admin tries to delete another admin", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Corso Castelfidardo 129, Torino", "1970-01-01");
        const userRequested = new User("erika.astegiano", "Erika", "Astegiano", Role.ADMIN, "Via Po 9, Pino Torinese", "1980-02-03");
        
        jest.spyOn(UserDAO.prototype, "deleteUser").mockRejectedValueOnce(new UserIsAdminError());
        const controller = new UserController();

        await expect(controller.deleteUser(userWhoRequests, "erika.astegiano")).rejects.toThrow(UserIsAdminError);
        
        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith(userWhoRequests, "erika.astegiano");
        jest.clearAllMocks();
    });

    test("5.6: It should return an error if the given username is empty", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Corso Castelfidardo 129, Torino", "1970-01-01");
        
        const error = new Error("Username empty");
        jest.spyOn(UserDAO.prototype, "deleteUser").mockRejectedValueOnce(error);
        const controller = new UserController();
        const result = await controller.deleteUser(userWhoRequests, "");

        expect(result).toBeUndefined();
        expect(UserDAO.prototype.deleteUser).not.toHaveBeenCalled();
        jest.clearAllMocks();
    }); 
});

describe("6. Controller: delete all non-admin users", () => {
    test("6.1: It should delete all non-admin users (no admins in the database)", async () => {
        jest.spyOn(UserDAO.prototype, "deleteAllUsers").mockResolvedValueOnce(true);
        const controller = new UserController();
        const response = await controller.deleteAll();
        
        expect(UserDAO.prototype.deleteAllUsers).toHaveBeenCalledTimes(1);
        jest.clearAllMocks();
    });
});

describe("7. Controller: update personal information of a single user", () => {
    test("7.1: It should update user information given the specific username - admin updates information of user of type Customer or Manager", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Corso Castelfidardo 129, Torino", "1970-01-01");
        const userUpdated = new User("erika.astegiano", "Erika", "Astegiano", Role.CUSTOMER, "Via Po 9, Pino Torinese", "1980-02-03");
        
        jest.spyOn(UserDAO.prototype, "updateUser").mockResolvedValueOnce(userUpdated);
        const controller = new UserController();
        const response = await controller.updateUserInfo(userWhoRequests, "Erika", "Astegiano", "Via Po 9, Pino Torinese", "1980-02-03", "erika.astegiano");

        expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.updateUser).toHaveBeenCalledWith(userWhoRequests,
            "Erika",
            "Astegiano",
            "Via Po 9, Pino Torinese", 
            "1980-02-03",
            "erika.astegiano"
        );
        jest.clearAllMocks();
    });

    test("7.2: It should update user information given the specific username - Customer or Manager updates information of themselves", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Corso Castelfidardo 129, Torino", "1970-01-01");
        const userUpdated = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Corso Castelfidardo 129, Torino", "1970-01-01");
        
        jest.spyOn(UserDAO.prototype, "updateUser").mockResolvedValueOnce(userUpdated);
        const controller = new UserController();
        const response = await controller.updateUserInfo(userWhoRequests, "Agnese", "Re", "Corso Castelfidardo 129, Torino", "1970-01-01", "Agnese_Re");

        expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.updateUser).toHaveBeenCalledWith(userWhoRequests, 
            "Agnese", 
            "Re", 
            "Corso Castelfidardo 129, Torino", 
            "1970-01-01", 
            "Agnese_Re"
        );
        jest.clearAllMocks();
    });

    test("7.3: It should return a 401 error when a user, that is not admin, tries to update information of a different user", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Corso Castelfidardo 129, Torino", "1970-01-01");
        const userUpdated = new User("erika.astegiano", "Erika", "Astegiano", Role.CUSTOMER, "Via Po 9, Pino Torinese", "1980-02-03");
        
        jest.spyOn(UserDAO.prototype, "updateUser").mockRejectedValueOnce(new UserNotAdminError());
        const controller = new UserController();
        await expect(controller.updateUserInfo(userWhoRequests, "Erika", "Astegiano", "Via Po 9, Pino Torinese", "1980-02-03", "erika.astegiano"))
            .rejects.toThrow(UserNotAdminError);

        expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.updateUser).toHaveBeenCalledWith(userWhoRequests, 
            "Erika", 
            "Astegiano", 
            "Via Po 9, Pino Torinese", 
            "1980-02-03", 
            "erika.astegiano"
        );
        jest.clearAllMocks();
    });

    test("7.4: It should return a 404 error when username represents a user that is not registered", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.CUSTOMER, "Corso Castelfidardo 129, Torino", "1970-01-01");
        const userUpdated = new User("erika.astegiano", "Erika", "Astegiano", Role.CUSTOMER, "Via Po 9, Pino Torinese", "1980-02-03");
        
        jest.spyOn(UserDAO.prototype, "updateUser").mockRejectedValueOnce(new UserNotFoundError());
        const controller = new UserController();
        await expect(controller.updateUserInfo(userWhoRequests, "Erika", "Astegiano", "Via Po 9, Pino Torinese", "1980-02-03", "erika.astegiano"))
            .rejects.toThrow(UserNotFoundError);

        expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.updateUser).toHaveBeenCalledWith(userWhoRequests, 
            "Erika", 
            "Astegiano", 
            "Via Po 9, Pino Torinese", 
            "1980-02-03", 
            "erika.astegiano"
        );
        jest.clearAllMocks();
    });

    test("7.5: It should return a 401 error when an admin tries to update information of another admin", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Corso Castelfidardo 129, Torino", "1970-01-01");
        const userUpdated = new User("erika.astegiano", "Erika", "Astegiano", Role.ADMIN, "Via Po 9, Pino Torinese", "1980-02-03");
        
        jest.spyOn(UserDAO.prototype, "updateUser").mockRejectedValueOnce(new UserIsAdminError());
        const controller = new UserController();
        await expect(controller.updateUserInfo(userWhoRequests, "Erika", "Astegiano", "Via Po 9, Pino Torinese", "1980-02-03", "erika.astegiano"))
            .rejects.toThrow(UserIsAdminError);

        expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(1);
        expect(UserDAO.prototype.updateUser).toHaveBeenCalledWith(userWhoRequests, 
            "Erika", 
            "Astegiano", 
            "Via Po 9, Pino Torinese", 
            "1980-02-03", 
            "erika.astegiano"
        );
        jest.clearAllMocks();
    });

    test("7.6: It should return an error if one or more parameters are empty", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Corso Castelfidardo 129, Torino", "1970-01-01");
        
        const error = new Error("Empty parameteres");
        jest.spyOn(UserDAO.prototype, "updateUser").mockRejectedValueOnce(error);
        const controller = new UserController();
        const result = await controller.updateUserInfo(userWhoRequests, "Agnese", "Re", "", "2001-01-01", "Agnese_Re");

        expect(result).toBeUndefined();
        expect(UserDAO.prototype.updateUser).not.toHaveBeenCalled();
        jest.clearAllMocks();
    }); 

    test("7.7: It should return an error if the date is not in the correct format", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Corso Castelfidardo 129, Torino", "1970-01-01");
        
        const error = new Error("Date incorrect format");
        jest.spyOn(UserDAO.prototype, "updateUser").mockRejectedValueOnce(error);
        const controller = new UserController();
        const result = await controller.updateUserInfo(userWhoRequests, "Agnese", "Re", "Via Rossi 9, Torino", "2001/01/01", "Agnese_Re");

        expect(result).toBeUndefined();
        expect(UserDAO.prototype.updateUser).not.toHaveBeenCalled();
        jest.clearAllMocks();
    }); 

    test("7.8: It should return an error if the date is after the current date", async () => {
        const userWhoRequests = new User("Agnese_Re", "Agnese", "Re", Role.ADMIN, "Corso Castelfidardo 129, Torino", "1970-01-01");
        
        const error = new Error("Date in the future");
        jest.spyOn(UserDAO.prototype, "updateUser").mockRejectedValueOnce(error);
        const controller = new UserController();
        const result = await controller.updateUserInfo(userWhoRequests, "Agnese", "Re", "Via Rossi 9, Torino", "2040-08-09", "Agnese_Re");

        expect(result).toBeUndefined();
        expect(UserDAO.prototype.updateUser).not.toHaveBeenCalled();
        jest.clearAllMocks();
    });
});