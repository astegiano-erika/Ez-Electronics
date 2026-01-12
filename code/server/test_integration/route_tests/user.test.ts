import request from 'supertest'
import { app } from '../../index'
import { cleanup } from '../../src/db/cleanup'
import UserDAO from "../../src/dao/userDAO"
import { User, Role } from '../../src/components/user'
import { afterEach, beforeAll, beforeEach, describe, expect, test, jest } from "@jest/globals";

jest.setTimeout(200000);
const baseURL = "/ezelectronics"
let customerCookie: string, managerCookie: string, adminCookie: string
const userDAO = new UserDAO()

async function createAndLoginCustomer() {
    await request(app).post(`${baseURL}/users`)
        .send({
            username: 'customer',
            password: 'customer123',
            name: 'Mer',
            surname: 'Custo',
            role: Role.CUSTOMER
        })

    const response = await request(app)
        .post(`${baseURL}/sessions`)
        .send({ username: 'customer', password: 'customer123' })

    customerCookie = response.headers['set-cookie']
}

async function createAndLoginManager() {
    await request(app).post(`${baseURL}/users`)
        .send({
            username: 'manager',
            password: 'manager123',
            name: 'Ger',
            surname: 'Mana',
            role: Role.MANAGER
        })

    const response = await request(app)
        .post(`${baseURL}/sessions`)
        .send({ username: 'manager', password: 'manager123' })

    managerCookie = response.headers['set-cookie']
}

async function createAndLoginAdmin() {
    await request(app).post(`${baseURL}/users`)
        .send({
            username: 'admin',
            password: 'admin123',
            name: 'Mina',
            surname: 'D',
            role: Role.ADMIN
        })

    const response = await request(app)
        .post(`${baseURL}/sessions`)
        .send({ username: 'admin', password: 'admin123' })

    adminCookie = response.headers['set-cookie']
}

/* Before each test of this suite (three user with createAndLogin, one for each role, plus other four users) */

describe("1. GET ezelectronics/users", () => {
    test("1.1: It should return all users for an Admin", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .get(`${baseURL}/users`)
            .set('Cookie', adminCookie);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(7);   /* those four plus three createAndLogin */
        await cleanup();
    });

    test("1.2: It should return 401 error for a Manager that tries to retrieve all users", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .get(`${baseURL}/users`)
            .set('Cookie', managerCookie);

        expect(response.status).toBe(401);
        await cleanup();
    });

    test("1.3: It should return 401 error for a Customer that tries to retrieve all users", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .get(`${baseURL}/users`)
            .set('Cookie', customerCookie);

        expect(response.status).toBe(401);
        await cleanup();
    });

    test("1.4: It should return 401 error for a not logged in user that tries to retrieve all users", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .get(`${baseURL}/users`);

        expect(response.status).toBe(401);
        await cleanup();
    });
});

describe("2. GET ezelectronics/users/roles/role", () => {
    test("2.1: It should return all users of a specific role for an Admin", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .get(`${baseURL}/users/roles/Customer`)
            .set('Cookie', adminCookie);

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(3);   /* those two plus one of createAndLogin */
        await cleanup();
    });

    test("2.2: It should return 401 error for a Manager that tries to retrieve all users of a specific role", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .get(`${baseURL}/users/roles/Customer`)
            .set('Cookie', managerCookie)

        expect(response.status).toBe(401);
        await cleanup();
    });

    test("2.3: It should return 401 error for a Customer that tries to retrieve all users of a specific role", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .get(`${baseURL}/users/roles/Customer`)
            .set('Cookie', customerCookie);

        expect(response.status).toBe(401);
        await cleanup();
    });

    test("2.4: It should return 401 error for a not logged in user that tries to retrieve all users of a specific role", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .get(`${baseURL}/users/roles/Customer`);

        expect(response.status).toBe(401);
        await cleanup();
    });
});


describe("3. GET ezelectronics/users/username", () => {
    test("3.1: It should return the user with the specific username for an Admin", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .get(`${baseURL}/users/erika.astegiano`)
            .set('Cookie', adminCookie)

        expect(response.status).toBe(200);
        expect(response.body.username).toBe("erika.astegiano");
        await cleanup();
    });

    test("3.2: It should return the user with the specific username for a Customer (own information)", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .get(`${baseURL}/users/customer`)
            .set('Cookie', customerCookie);

        expect(response.status).toBe(200);
        expect(response.body.username).toBe("customer");
        expect(response.body).toHaveProperty("username", "customer");
        await cleanup();
    });

    test("3.3: It should return 401 error for a Customer or Manager that tries to access to other users information", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .get(`${baseURL}/users/erika.astegiano`)
            .set('Cookie', customerCookie);

        expect(response.status).toBe(401);
        await cleanup();
    });

    test("3.4: It should return 401 error for a not logged in user that tries to access to other users information", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .get(`${baseURL}/users/erika.astegiano`);

        expect(response.status).toBe(401);
        await cleanup();
    });

    test("3.5: It should return 404 error if a user with the specific username does not exist", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .get(`${baseURL}/users/notexists`)
            .set('Cookie', adminCookie);

        expect(response.status).toBe(404);
        await cleanup();
    });
});

describe("4. DELETE ezelectronics/users/:username", () => {
    test("4.1: It should delete the user with the specific username for an Admin", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        let response = await request(app)
            .delete(`${baseURL}/users/erika.astegiano`)
            .set('Cookie', adminCookie)

        expect(response.status).toBe(200);

        response = await request(app)
            .get(`${baseURL}/users/erika.astegiano`)
            .set('Cookie', adminCookie)

        expect(response.status).toBe(404);
        await cleanup();
    });

    test("4.2: It should delete the user with the specific username for a Customer (own profile)", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        let response = await request(app)
            .delete(`${baseURL}/users/customer`)
            .set('Cookie', customerCookie);

        expect(response.status).toBe(200);

        response = await request(app)
            .get(`${baseURL}/users/customer`)
            .set('Cookie', adminCookie)

        expect(response.status).toBe(404);
        await cleanup();
    });

    test("4.3: It should return 401 error for a Customer or Manager that tries to delete another user", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        let response = await request(app)
            .delete(`${baseURL}/users/erika.astegiano`)
            .set('Cookie', customerCookie);

        expect(response.status).toBe(401);
        await cleanup();
    });

    test("4.4: It should return 401 error for a not logged in user that tries to delete another user", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        let response = await request(app)
            .delete(`${baseURL}/users/erika.astegiano`);

        expect(response.status).toBe(401);
        await cleanup();
    });

    test("4.5: It should return 404 error if a user with the specific username does not exist", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .delete(`${baseURL}/users/notexists`)
            .set('Cookie', adminCookie);

        expect(response.status).toBe(404);
        await cleanup();
    });
});

describe("5. DELETE ezelectronics/users", () => {
    test("5.1: It should delete all non-admin users for an Admin", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .delete(`${baseURL}/users`)
            .set('Cookie', adminCookie);

        expect(response.status).toBe(200);
        await cleanup();
    });

    test("5.2: It should return 401 error for a Manager that tries to delete all users", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .delete(`${baseURL}/users`)
            .set('Cookie', managerCookie);

        expect(response.status).toBe(401);
        await cleanup();
    });

    test("5.3: It should return 401 error for a Customer that tries to delete all users", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .delete(`${baseURL}/users`)
            .set('Cookie', customerCookie);

        expect(response.status).toBe(401);
        await cleanup();
    });

    test("5.4: It should return 401 error for a not logged in user that tries to delete all users", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const response = await request(app)
            .delete(`${baseURL}/users`);

        expect(response.status).toBe(401);
        await cleanup();
    });
});

describe("6. PATCH ezelectronics/users/:username", () => {
    test("6.1: It should update the user with the specific username for an Admin", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const update = { name: "Erikaa", surname: "Astegianoo", address: "Via Esempio 5", birthdate: "2001-01-02" }
        const response = await request(app)
            .patch(`${baseURL}/users/erika.astegiano`)
            .set('Cookie', adminCookie)
            .send(update);

        expect(response.status).toBe(200);
        const updatedUser = await userDAO.getUserByUsername("erika.astegiano");
        expect(updatedUser.name).toBe("Erikaa");
        expect(updatedUser.surname).toBe("Astegianoo");
        expect(updatedUser.address).toBe("Via Esempio 5");
        expect(updatedUser.birthdate).toBe("2001-01-02");
        await cleanup();
    });

    test("6.2: It should update the user with the specific username for a Customer (own information)", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const update = { name: "Customer", surname: "Cust", address: "Via Customer 5", birthdate: "2001-01-02" }
        const response = await request(app)
            .patch(`${baseURL}/users/customer`)
            .set('Cookie', customerCookie)
            .send(update);

        expect(response.status).toBe(200);
        const updatedUser = await userDAO.getUserByUsername("customer");
        expect(updatedUser.name).toBe("Customer");
        expect(updatedUser.surname).toBe("Cust");
        expect(updatedUser.address).toBe("Via Customer 5");
        expect(updatedUser.birthdate).toBe("2001-01-02");
        await cleanup();
    });

    test("6.3: It should return 401 error for a Customer or Manager that tries to update another user information", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const update = { name: "Customer", surname: "Cust", address: "Via Customer 5", birthdate: "2001-01-02" }
        const response = await request(app)
            .patch(`${baseURL}/users/erika.astegiano`)
            .set('Cookie', customerCookie)
            .send(update);

        expect(response.status).toBe(401);
        await cleanup();
    });

    test("6.4: It should return 401 error for a not logged in user that tries to update another user information", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const update = { name: "Customer", surname: "Cust", address: "Via Customer 5", birthdate: "2001-01-02" }
        const response = await request(app)
            .get(`${baseURL}/users/erika.astegiano`)
            .send(update);

        expect(response.status).toBe(401);
        await cleanup();
    });

    test("6.5: It should return 404 error if the user to update with the specific username does not exist", async () => {
        await cleanup();
        await createAndLoginAdmin()
        await createAndLoginCustomer()
        await createAndLoginManager()

        await userDAO.createUser(
            "erika.astegiano",
            "Erika",
            "Astegiano",
            "password",
            Role.CUSTOMER
        )

        await userDAO.createUser(
            "emanuelefrisi",
            "Emanuele",
            "Frisi",
            "passworddd",
            Role.MANAGER
        )

        await userDAO.createUser(
            "riccardo.freddolino",
            "Riccardo",
            "Freddolino",
            "passwooord",
            Role.ADMIN
        )

        await userDAO.createUser(
            "Agnese_Re",
            "Agnese",
            "Re",
            "mypassword",
            Role.CUSTOMER
        )
        const update = { name: "Customer", surname: "Cust", address: "Via Customer 5", birthdate: "2001-01-02" }
        const response = await request(app)
            .patch(`${baseURL}/users/notexists`)
            .set('Cookie', adminCookie)
            .send(update);

        expect(response.status).toBe(404);
        await cleanup();
    });
});