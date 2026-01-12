import { test, expect, jest, beforeAll, beforeEach, afterEach, describe} from "@jest/globals"
import request from 'supertest';
import { app } from "../../index"
import { cleanup } from "../../src/db/cleanup"
import seedController from "../../src/controllers/seeder"
import {ProductReview} from "../../src/components/review"
import { Role } from '../../src/components/user'

jest.setTimeout(200000);
const seeder = new seedController();
let customerCookie: string, managerCookie: string, adminCookie: string
let review= new ProductReview('Hp v10', 'agnesee', 3, '2023-06-10', 'Could be better');

async function createAndLoginCustomer() {
    await request(app).post(`/ezelectronics/users`)
    .send({
        username: 'hi',
        password: 'Prova',
        name: 'Agnese',
        surname: 'Verde',
        role: Role.CUSTOMER
    })
  
    const response = await request(app)
      .post(`/ezelectronics/sessions`)
      .send({ username: 'agnesee', password: 'Prova'})
  
    customerCookie = response.headers['set-cookie']
  }
  
  async function createAndLoginManager() {
    await request(app).post(`/ezelectronics/users`)
    .send({
        username: 'riccardoo',
        password: 'Prova',
        name: 'Riccardo',
        surname: 'Blu',
        role: Role.MANAGER
    })
  
    const response = await request(app)
      .post(`/ezelectronics/sessions`)
      .send({ username: 'riccardoo', password: 'Prova'})
  
    managerCookie = response.headers['set-cookie']
  }
  
async function createAndLoginAdmin() {
    await request(app).post(`/ezelectronics/users`)
    .send({
        username: 'lucaa',
        password: 'Prova',
        name: 'Luca',
        surname: 'Rosso',
        role: Role.ADMIN
    })
  
    const response = await request(app)
      .post(`/ezelectronics/sessions`)
      .send({ username: 'lucaa', password: 'Prova'})
  
    adminCookie = response.headers['set-cookie']
}


describe("Integrated Route Test: Route for adding a review", () => {
     /*
    - correct insertion                             --> V                                                     
    - modello non in db (404)                       --> V
    - controllo su review già esistente (409)       --> V              

    CHIAMANTE
    - logged in                                     --> V
    - customer                                      --> V

    PARAMETRI (RITORNARE 422)
    - comment empty                                 --> V
    - comment not string                            --> V
    - score>5                                       --> V
    - score<1                                       --> V
    - score float                                   --> V
    */

    //manca user not logged in
    test("200: review added", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).post("/ezelectronics/reviews/Samsung v11").set('Cookie', customerCookie).send({ score: 5, comment: "Great product!" })
        expect(response.status).toBe(200)
        expect(response.body).toEqual({})
    })

    test("404: model not in DB", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).post("/ezelectronics/reviews/model3").set('Cookie', customerCookie).send({ score: 5, comment: "Great product!" })
        expect(response.status).toBe(404)
        expect(response.body.error).toEqual("Product not found")
    })

    test("409: review already exists", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).post("/ezelectronics/reviews/Hp v10").set('Cookie', customerCookie).send({ score: 5, comment: "Great product!" })
        expect(response.status).toBe(409)
        expect(response.body.error).toEqual("You have already reviewed this product")
    })

    test("401: Manager not customer", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).post("/ezelectronics/reviews/Samsung v11").set('Cookie', managerCookie)
        expect(response.status).toBe(401)
    })

    test("401: Admin not customer", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).post("/ezelectronics/reviews/Samsung v11").set('Cookie', adminCookie)
        expect(response.status).toBe(401)
    })
    
    test("401: user not logged in", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const result = await request(app).post("/ezelectronics/reviews/Samsung v11")
        expect(result.status).toBe(401);
    })

    test("422: comment is not a string", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).post("/ezelectronics/reviews/Samsung v11").set('Cookie', customerCookie).send({ score: 5, comment: 123 })
        expect(response.status).toBe(422)
    })

    test("422: comment null", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).post("/ezelectronics/reviews/Samsung v11").set('Cookie', customerCookie).send({ score: 5, comment: null })
        expect(response.status).toBe(422)
    })

    test("422: comment empty", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).post("/ezelectronics/reviews/Samsung v11").set('Cookie', customerCookie).send({ score: 5, comment: "" })
        expect(response.status).toBe(422)
    })

    test("422: score is > 5", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).post("/ezelectronics/reviews/Samsung v11").set('Cookie', customerCookie).send({ score: 6, comment: "Great product!" })
        expect(response.status).toBe(422)
    })

    test("422: score is < 1", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).post("/ezelectronics/reviews/Samsung v11").set('Cookie', customerCookie).send({ score: 0, comment: "Great product!" })
        expect(response.status).toBe(422)
    })

    test("422: score is float", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).post("/ezelectronics/reviews/Samsung v11").set('Cookie', customerCookie).send({ score: 3.2, comment: "Great product!" })
        expect(response.status).toBe(422)
    })
});

describe("Integrated Route Test: Route for retrieving all reviews of a product", () => {
    /*
    - correct display                                      --> V                                      
    - modello non in db (404)                              --> V

    CHIAMANTE
    - logged in                                            --> V
    */

    test("200: review list showed (Customer)", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).get("/ezelectronics/reviews/Hp v10").set('Cookie', customerCookie)
        expect(response.status).toBe(200)
        expect(response.body).toEqual([review])
    })

    test("200: review list showed (Manager)", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).get("/ezelectronics/reviews/Hp v10").set('Cookie', managerCookie)
        expect(response.status).toBe(200)
        expect(response.body).toEqual([review])
    })

    test("200: review list showed (Admin)", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).get("/ezelectronics/reviews/Hp v10").set('Cookie', adminCookie)
        expect(response.status).toBe(200)
        expect(response.body).toEqual([review])
    })

    test("401: user not logged in", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).get("/ezelectronics/reviews/Hp v10")
        expect(response.status).toBe(401)
    })
    
    test("404: model not in DB", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).get("/ezelectronics/reviews/model3").set('Cookie', customerCookie)
        expect(response.status).toBe(404)
        expect(response.body.error).toEqual("Product not found")
    })
});

describe("Integrated Route Test: Route for deleting the review made by a user for one product", () => {
    /*
    - correct removal                                   --> V                                      
    - modello non in db (404)                           --> V
    - user non ha una review per quel modello (404)     --> V     

    CHIAMANTE
    - logged in                                         --> V
    - customer                                          --> V
    */

    test("200: review deleted", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).delete("/ezelectronics/reviews/Hp v10").set('Cookie', customerCookie)
        expect(response.status).toBe(200)
        expect(response.body).toEqual({})
    })

    test("404: model not in DB", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).delete("/ezelectronics/reviews/model3").set('Cookie', customerCookie)
        expect(response.status).toBe(404)
        expect(response.body.error).toEqual("Product not found")
    })

    test("404: no review for this user and this product", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).delete("/ezelectronics/reviews/Asus v11").set('Cookie', customerCookie)
        expect(response.status).toBe(404)
        expect(response.body.error).toEqual("You have not reviewed this product")
    })

    test("401: user not logged in", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).delete("/ezelectronics/reviews/Hp v10")
        expect(response.status).toBe(401)
    })

    test("401: user not customer (manager)", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).delete("/ezelectronics/reviews/Hp v10").set('Cookie', managerCookie)
        expect(response.status).toBe(401)
    })

    test("401: user not customer (admin)", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).delete("/ezelectronics/reviews/Hp v10").set('Cookie', adminCookie)
        expect(response.status).toBe(401)
    })
        
});

describe("Integrated Route Test: Route for deleting all reviews of a product", () => {
    /*
    - correct display: no errori dati dal db                           --> V                                             
    - modello non in db(404)                                           --> V

    CHIAMANTE
    - logged in                                                        --> V
    - admin o manager                                                  --> V
    */

    test("200: all reviews (of a product) deleted", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).delete("/ezelectronics/reviews/Hp v10/all").set('Cookie', managerCookie)
        expect(response.status).toBe(200)
        expect(response.body).toEqual({})
    })

    test("200: all reviews (of a product) deleted", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).delete("/ezelectronics/reviews/Hp v10/all").set('Cookie', adminCookie)
        expect(response.status).toBe(200)
        expect(response.body).toEqual({})
    })

    test("401: user not logged in", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const result = await request(app).delete("/ezelectronics/reviews/Hp v10/all");
        expect(result.status).toBe(401);
    })

    test("401: user not Admin or Manager (Customer)", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const result = await request(app).delete("/ezelectronics/reviews/Hp v10/all").set('Cookie', customerCookie)
        expect(result.status).toBe(401);
    })

    test("404: model not in DB", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).delete("/ezelectronics/reviews/model3/all").set('Cookie', managerCookie)
        expect(response.status).toBe(404)
        expect(response.body.error).toEqual("Product not found")
    })
        
});

describe("Integrated Route Test: Route for deleting all reviews", () => {
    /*
    - correct removal           --> V       

    CHIAMANTE
    - logged in                 --> V
    - admin o manager           --> V
    */

    test("200: reviews deleted (manager)", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).delete("/ezelectronics/reviews").set('Cookie', managerCookie)
        expect(response.status).toBe(200);
        expect(response.body).toEqual({});
    });

    test("200: reviews deleted (admin)", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const response = await request(app).delete("/ezelectronics/reviews").set('Cookie', adminCookie)
        expect(response.status).toBe(200);
        expect(response.body).toEqual({});
    });

    test("401: user not logged in", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const result = await request(app).delete("/ezelectronics/reviews");
        expect(result.status).toBe(401);
    })

    test("401: user not Admin or Manager (Customer)", async()=>{
        await cleanup();
        await seeder.seedDatabase();
        await createAndLoginCustomer()
        await createAndLoginManager()
        await createAndLoginAdmin()
        const result = await request(app).delete("/ezelectronics/reviews").set('Cookie', customerCookie)
        expect(result.status).toBe(401);
    })
});