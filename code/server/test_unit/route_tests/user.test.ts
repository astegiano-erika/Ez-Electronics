import { test, expect, jest } from "@jest/globals"
import { afterEach, describe } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import UserController from "../../src/controllers/userController"
import { UnauthorizedUserError, UserAlreadyExistsError, UserNotAdminError, UserNotFoundError } from "../../src/errors/userError"
import { User, Role } from "../../src/components/user";
import Authenticator from "../../src/routers/auth"
const baseURL = "/ezelectronics"

jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")

afterEach(async() => {
    jest.clearAllMocks();
});

//Example of a unit test for the POST ezelectronics/users route
//The test checks if the route returns a 200 success code
//The test also expects the createUser method of the controller to be called once with the correct parameters
describe("1. POST ezelectronics/users", () => {
    test("1.1: It should create a new user", async () => {
        const testUser = { //Define a test user object sent to the route
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        }
        jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
        //Check if the createUser method has been called with the correct parameters
        expect(UserController.prototype.createUser).toHaveBeenCalledWith(testUser.username,
            testUser.name,
            testUser.surname,
            testUser.password,
            testUser.role)
    });

    test("1.2: It should return a 409 error code if username already in db", async () => {
        const testUser = {  // Define a test user object with a username that already exists
            username: "duplicateTest",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        }
        // Mock the createUser method of the controller to simulate a user already existing
        jest.spyOn(UserController.prototype, "createUser").mockImplementation(() => {
            const error = new UserAlreadyExistsError();
            throw error;
        });
        const response = await request(app).post(baseURL + "/users").send(testUser);
        expect(response.status).toBe(409);
        expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1);
        expect(UserController.prototype.createUser).toHaveBeenCalledWith(
            testUser.username,
            testUser.name,
            testUser.surname,
            testUser.password,
            testUser.role);
    });

    test("1.3: It should return an error code if createUser throws an error", async () => {
        const testUser = {  // Define a test user object with a username that already exists
            username: "duplicateTest",
            name: "test",
            surname: "test",
            password: "test",
            role: "Manager"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => { return next(); });
        jest.spyOn(UserController.prototype, "createUser").mockRejectedValueOnce(new Error("Unexpected error"));

        const response = await request(app).post(baseURL + "/users").send(testUser);
        expect(response.status).toBe(503);
        expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1);
    });
});

describe("2. GET ezelectronics/users", () => {
    test("2.1: It should return the entire list of users", async() => {
        const mockUsers = [
            {username: "Mario Rossi", name: "Mario", surname: "Rossi", role: Role.CUSTOMER, address: "Via Adige 5", birthdate: "1970-01-02"},
            {username: "Ernesto Gialli", name: "Ernesto", surname: "Gialli", role: Role.CUSTOMER, address: "Via Po 8", birthdate: "1971-10-20"},
            {username: "Flavio Neri", name: "Flavio", surname: "Neri", role: Role.MANAGER, address: "Via Padova 90", birthdate: "1975-07-01"},
            {username: "Angela Verdi", name: "Angela", surname: "Verdi", role: Role.ADMIN, address: "Via Tanaro 128", birthdate: "1980-05-28"} 
        ];
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => {
            return next();
        });
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementationOnce((req, res, next) => {
            return next();
        });
        jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce(mockUsers);
        const response = await request(app).get(baseURL + "/users");
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockUsers);
        expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(1);
    });

    test("2.2: It should return a 401 error code if the user that tries to retrieve the entire list of users is not logged in", async() => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 })
        });
        const response = await request(app).get(baseURL +"/users");
        expect(response.status).toBe(401);
    });

    test("2.3: It should return a 401 error code if the user that tries to retrieve the entire list of users is not an Admin", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();});
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not an admin", status: 401 });
        });
        const response = await request(app).get(baseURL +"/users");
        expect(response.status).toBe(401);
    });

    test("2.4: It should return an error code if getUsers throws an error", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => { return next(); });
        jest.spyOn(UserController.prototype, "getUsers").mockRejectedValueOnce(new Error("Unexpected error"));

        const response = await request(app).get(baseURL + "/users");
        expect(response.status).toBe(503);
        expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(1);
    });

});

describe("3. GET ezelectronics/users/roles/:role", () => {
    test("3.1: It should return the list of all users with a specific role", async () => {
        const mockUsers = [
            {username: "Mario Rossi", name: "Mario", surname: "Rossi", role: Role.CUSTOMER, address: "Via Adige 5", birthdate: "1970-01-02"},
            {username: "Ernesto Gialli", name: "Ernesto", surname: "Gialli", role: Role.CUSTOMER, address: "Via Po 8", birthdate: "1971-10-20"},
            {username: "Flavio Neri", name: "Flavio", surname: "Neri", role: Role.MANAGER, address: "Via Padova 90", birthdate: "1975-07-01"},
            {username: "Angela Verdi", name: "Angela", surname: "Verdi", role: Role.ADMIN, address: "Via Tanaro 128", birthdate: "1980-05-28"} 
        ];
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next();});
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {return next();});

        const filteredUsers = mockUsers.filter((user) => user.role === Role.CUSTOMER);
        jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce(filteredUsers);
        const response = await request(app).get(baseURL + "/users/roles/Customer");
        expect(response.status).toBe(200);
        expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
    });

    test("3.2: It should return an error code if getUsersByRole throws an error", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => { return next(); });
        jest.spyOn(UserController.prototype, "getUsersByRole").mockRejectedValueOnce(new Error("Unexpected error"));

        const response = await request(app).get(baseURL + "/users/roles/Customer");
        expect(response.status).toBe(503);
        expect(UserController.prototype.getUserByUsername).not.toHaveBeenCalled();
    });
});

// Unit test for the GET ezelectronics/users/:username route
describe("4. GET ezelectronics/users/:username", () => {
    test("4.1: It should return a single user with a specific username", async () => {
        const testUser = {
            username: "test",
            name: "test",
            surname: "test",
            role: Role.MANAGER,
            address: "Via Verdi 5",
            birthdate: "1970/01/01"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        });
        jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(testUser);
        const response = await request(app).get(baseURL + "/users/test");
        expect(response.status).toBe(200);
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    });

    // Can only be called by a logged in User
    test("4.2: It should return a 401 error code if the user that tries to retrieve a single user with a specific username is not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 });
        });
        const response = await request(app).get(baseURL + "/users/test");
        expect(response.status).toBe(401);
        expect(UserController.prototype.getUserByUsername).not.toHaveBeenCalled();
    });

    test("4.3: It should return a 404 error when username represents a user that is not registered", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
        jest.spyOn(UserController.prototype, "getUserByUsername").mockRejectedValueOnce(new UserNotFoundError());
        const response = await request(app).get(baseURL + "/users/test");
        expect(response.status).toBe(404);
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    });

    test("4.4: It should return a 401 error when the user is not an admin and tries to retrieve other users information", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
        jest.spyOn(UserController.prototype, "getUserByUsername").mockRejectedValueOnce(new UserNotAdminError());
        const response = await request(app).get(baseURL + "/users/test");
        expect(response.status).toBe(401);
        expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    });
});

describe("5. DELETE ezelectronics/users/:username", () => {
    test("5.1: It should delete a specific user, given the username", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
        jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true);
        const response = await request(app).delete(baseURL + "/users/testUser");
        expect(response.status).toBe(200);
        expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1);
    });

    test("5.2: It should return a 401 error code if the user that tries to delete a single user with the specific username is not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
            return res.status(401).json({ error: "Unauthenticated user", status: 401 });
        });
        const response = await request(app).delete(baseURL + "/users/testUser");
        expect(response.status).toBe(401);
        expect(UserController.prototype.deleteUser).not.toHaveBeenCalled();
    });

    test("5.3: It should return a 404 error when username represents a user that is not registered", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
        jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValueOnce(new UserNotFoundError());
        const response = await request(app).delete(baseURL + "/users/testUser");
        expect(response.status).toBe(404);
        expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1);
    });

    test("5.4: It should return a 401 error code when the user is not an admin and the username is not equal to the username of the logged in user", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
        jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValueOnce(new UserNotAdminError());
        const response = await request(app).delete(baseURL + "/users/testUser");
        expect(response.status).toBe(401);
        expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1);
    });

    test("5.5: It should return a 401 error code when an admin tries to edit information of another admin user", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
        jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValueOnce(new UnauthorizedUserError());
        const response = await request(app).delete(baseURL + "/users/testUser");
        expect(response.status).toBe(401);
        expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1);
    });
});

describe("6. DELETE ezelectronics/users", () => {
    test("6.1: It should delete all non-Admin users", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => { return next(); });
        jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true);
        const response = await request(app).delete(baseURL + "/users");
        expect(response.status).toBe(200);
        expect(UserController.prototype.deleteAll).toHaveBeenCalledTimes(1);
    });

    test("6.2: It should return a 401 error code if the user that tries to delete all non-admin users is not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { 
            return res.status(401).json({ error: "Unauthenticated user", status: 401 });
        });
        const response = await request(app).delete(baseURL + "/users");
        expect(response.status).toBe(401);
        expect(UserController.prototype.deleteAll).not.toHaveBeenCalled();
    });

    test("6.3: It should return a 401 error code if the user that tries to delete all non-admin users is not an admin", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => { 
            return res.status(401).json({ error: "User is not an admin", status: 401 });
        });
        const response = await request(app).delete(baseURL + "/users");
        expect(response.status).toBe(401);
        expect(UserController.prototype.deleteAll).not.toHaveBeenCalled();
    });

    test("6.4: It should return an error code if deleteAll throws an error", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
        jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => { return next(); });
        jest.spyOn(UserController.prototype, "deleteAll").mockRejectedValueOnce(new Error("Unexpected error"));

        const response = await request(app).delete(baseURL + "/users");
        expect(response.status).toBe(503);
        expect(UserController.prototype.deleteAll).toHaveBeenCalledTimes(1);
    });
});

describe("7. PATCH ezelectronics/users/:username", () => {
    // Unit test for the PATCH ezelectronics/users/:username. An admin or another user that tries to modify personal information.
    test("7.1: It should update the information of a single user", async () => {
        const callingUser = {
            username: "Admin",
            name: "admin",
            surname: "admin",
            role: Role.ADMIN,
            address: "Corso Castelfidardo 124, Torino",
            birthdate: "1971-09-07"
        }
        const updateUser = {
            username: "Manager",
            name: "manager",
            surname: "manager",
            role: Role.MANAGER,
            address: "Corso Duca degli Abruzzi 129, Torino",
            birthdate: "1970-01-01"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = callingUser;
            return next();
        });
        jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(updateUser);
        const response = await request(app).patch(baseURL + "/users/Manager").send(updateUser);
        expect(response.status).toBe(200);
        expect(UserController.prototype.updateUserInfo).toBeCalledTimes(1);
        expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(callingUser, updateUser.name, 
            updateUser.surname, updateUser.address, updateUser.birthdate, updateUser.username);
    });

    test("7.2: It should return a 401 error if the user that tries to update another user is not logged in", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "Unauthenticated user", status: 401 });
        });
        const response = await request(app).patch(baseURL + "/users/Manager");
        expect(response.status).toBe(401);
        expect(UserController.prototype.updateUserInfo).not.toHaveBeenCalled();
    });

    test("7.3: It should return a 401 error code when an admin tries to edit information of another admin", async () => {
        const callingUser = {
            username: "Admin",
            name: "admin",
            surname: "admin",
            role: Role.ADMIN,
            address: "Corso Castelfidardo 124, Torino",
            birthdate: "1971-09-07"
        }
        const updateUser = {
            username: "Admin2",
            name: "admin2",
            surname: "admin2",
            role: Role.ADMIN,
            address: "Corso Duca degli Abruzzi 129, Torino",
            birthdate: "1970-01-01"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = callingUser;
            return next();
        });
        jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValueOnce(new UserNotAdminError());
        const response = await request(app).patch(baseURL + "/users/Admin2").send(updateUser);
        expect(response.status).toBe(401);
        expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
    });

    test("7.4: It should return a 422 error if date is after the current date", async () => {
        const callingUser = {
            username: "Admin",
            name: "admin",
            surname: "admin",
            role: Role.ADMIN,
            address: "Corso Castelfidardo 124, Torino",
            birthdate: "1971-09-07"
        }
        const updateUser = {
            username: "Manager",
            name: "manager",
            surname: "manager",
            role: Role.MANAGER,
            address: "Corso Duca degli Abruzzi 129, Torino",
            birthdate: "2070-01-01"
        }
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            req.user = callingUser;
            return next();
        });
        jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(updateUser);
        const response = await request(app).patch(baseURL + "/users/Manager").send(updateUser);
        expect(response.status).toBe(422);
    });
});

describe("8. POST ezelectronics/sessions", () => {
    test("8.1 It should return the logged in user", async () => {
        const mockUser = {
            username: "Admin",
            name: "admin",
            surname: "admin",
            role: Role.ADMIN,
            address: "Corso Castelfidardo 124, Torino",
            birthdate: "1971-09-07"
        }
        const loginMock = jest.spyOn(Authenticator.prototype, "login").mockImplementation((req, res, next) => {
            return Promise.resolve(mockUser);
        });
        const response = await request(app).post(baseURL + "/sessions");
        expect(response.status).toBe(200);
        loginMock.mockRestore();
    });

    test("8.2 It should return an error if login fails", async () => {
        const error = new Error("Login failed");
        const loginMock = jest.spyOn(Authenticator.prototype, "login").mockImplementation((req, res, next) => {
            return Promise.reject(error);
        });
        const response = await request(app).post(baseURL + "/sessions");
        expect(response.status).toBe(401);
        loginMock.mockRestore();
    });
});

describe("9. DELETE ezelectronics/current", () => {
    test("9.1 It should logout the logged in user", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
        const logoutMock = jest.spyOn(Authenticator.prototype, "logout").mockImplementation((req, res, next) => {
            return Promise.resolve();
        });
        const response = await request(app).delete(baseURL + "/sessions/current");
        expect(response.status).toBe(200);
        logoutMock.mockRestore();
    });

    test("9.2 It should return an error if logout fails", async () => {
        const error = new Error("Logout failed");
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
        const logoutMock = jest.spyOn(Authenticator.prototype, "logout").mockImplementation((req, res, next) => {
            return Promise.reject(error);
        });
        const response = await request(app).delete(baseURL + "/sessions/current");
        expect(response.status).toBe(503);
        logoutMock.mockRestore();
    });
});

describe("10. GET ezelectronics/sessions/current", () => {
    test("10.1 It should return the logged in user", async () => {
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
        const response = await request(app).get(baseURL + "/sessions/current");
        expect(response.status).toBe(200);
    });
});