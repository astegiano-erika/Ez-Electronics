import { test, expect, jest } from "@jest/globals"
import request from 'supertest';
import ReviewController from '../../src/controllers/reviewController';
import Authenticator from '../../src/routers/auth';
import { app } from "../../index"
import {ExistingReviewError , NoReviewProductError} from "../../src/errors/reviewError"
import {ProductNotFoundError} from "../../src/errors/productError"

jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")

const mockReviews = [
    { model: "model", user: "user1", score: 5, date: "2024-06-02", comment: "Great product" },
    { model: "model", user: "user2", score: 4, date: "2024-06-01", comment: "Good product" }
];

/*
422: constraints on request parameters and request body content
401: access constraints
200: success scenarios
*/

describe("Test: Route for adding a review", () => {
    /*
    - correct insertion                             --> V                                                     
    - modello non in db (404)                       --> V
    - controllo su review già esistente (409)       --> V              

    CHIAMANTE
    - logged in                                     --> V
    - customer                                      --> V

    PARAMETRI (RITORNARE 422)
    - model empty                                   --> 
    - model not string                              -->
    - comment empty                                 --> V
    - comment not string                            --> V
    - score>5                                       --> V
    - score<1                                       --> V
    - score float                                   --> V
    */

    test("200: review added", async()=>{
        jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce()
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
        })

        const response = await request(app).post("/ezelectronics/reviews/model").send({ score: 5, comment: "Great product!" })
        expect(response.status).toBe(200)
        expect(response.body).toEqual({})
    })

    test("404: model not in DB", async()=>{
        jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new ProductNotFoundError())
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
        })

        const response = await request(app).post("/ezelectronics/reviews/model3").send({ score: 5, comment: "Great product!" })
        expect(response.status).toBe(404)
        expect(response.body.error).toEqual("Product not found")
    })

    test("409: review already exists", async()=>{
        jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new ExistingReviewError())
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
        })

        const response = await request(app).post("/ezelectronics/reviews/model").send({ score: 5, comment: "Great product!" })
        expect(response.status).toBe(409)
        expect(response.body.error).toEqual("You have already reviewed this product")
    })

    test("401: user not logged in", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not logged in", status: 401 })
        })
        const response = await request(app).post("/ezelectronics/reviews/model")
        expect(response.status).toBe(401)
    })
    

    test("401: user not customer", async()=>{
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not a customer", status: 401 })
        })
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        const response = await request(app).post("/ezelectronics/reviews/model")
        expect(response.status).toBe(401)
    })
    
    test("422: comment is not a string", async()=>{
        jest.spyOn(ReviewController.prototype, "addReview").mockImplementation(()=>new Promise<void>((resolve, reject)=>resolve()))
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
        })
       
        const response = await request(app).post("/ezelectronics/reviews/model").send({ score: 5, comment: 123 })
        expect(response.status).toBe(422)
    })

    test("422: comment empty", async()=>{
        jest.spyOn(ReviewController.prototype, "addReview").mockImplementation(()=>new Promise<void>((resolve, reject)=>resolve()))
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
        })
       
        const response = await request(app).post("/ezelectronics/reviews/model").send({ score: 5, comment: null })
        expect(response.status).toBe(422)
    })

    test("422: score is > 5", async()=>{
        jest.spyOn(ReviewController.prototype, "addReview").mockImplementation(()=>new Promise<void>((resolve, reject)=>resolve()))
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
        })
       
        const response = await request(app).post("/ezelectronics/reviews/model").send({ score: 6, comment: "Great product!" })
        expect(response.status).toBe(422)
    })

    test("422: score is < 1", async()=>{
        jest.spyOn(ReviewController.prototype, "addReview").mockImplementation(()=>new Promise<void>((resolve, reject)=>resolve()))
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
        })
       
        const response = await request(app).post("/ezelectronics/reviews/model").send({ score: 0, comment: "Great product!" })
        expect(response.status).toBe(422)
    })

    test("422: score is float", async()=>{
        jest.spyOn(ReviewController.prototype, "addReview").mockImplementation(()=>new Promise<void>((resolve, reject)=>resolve()))
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
        })
       
        const response = await request(app).post("/ezelectronics/reviews/:model").send({ score: 3.2, comment: "Great product!" })
        expect(response.status).toBe(422)
    })
});

describe("Test: Route for retrieving all reviews of a product", () => {
    /*
    - correct display                                      --> V                                      
    - modello non in db (404)                              --> V

    PARAMETRI (RITORNARE 422)
    - modello non nullo                                    -->

    CHIAMANTE
    - logged in                                            --> V
    */

    test("200: review list showed", async()=>{
        jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValueOnce(mockReviews)
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
        })

        const response = await request(app).get("/ezelectronics/reviews/model")
        expect(response.status).toBe(200)
        expect(response.body).toEqual(mockReviews)
    })

    test("401: user not logged in", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not logged in", status: 401 })
        })
        const response = await request(app).get("/ezelectronics/reviews/model")
        expect(response.status).toBe(401)
    })
    
    test("404: model not in DB", async()=>{
        jest.spyOn(ReviewController.prototype, "getProductReviews").mockRejectedValueOnce(new ProductNotFoundError())
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
        })

        const response = await request(app).get("/ezelectronics/reviews/model3")
        expect(response.status).toBe(404)
        expect(response.body.error).toEqual("Product not found")
    })
});

describe("Test: Route for deleting the review made by a user for one product", () => {
    /*
    - correct removal                                   --> V                                      
    - modello non in db (404)                           --> V
    - user non ha una review per quel modello (404)     --> V     

    PARAMETRI (RITORNARE 422)
    - modello non nullo                                 --> 

    CHIAMANTE
    - logged in                                         --> V
    - customer                                          --> V
    */

    test("200: review deleted", async()=>{
        jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce()
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
        })

        const response = await request(app).delete("/ezelectronics/reviews/model")
        expect(response.status).toBe(200)
        expect(response.body).toEqual({})
    })

    test("404: model not in DB", async()=>{
        jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValueOnce(new ProductNotFoundError())
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
        })

        const response = await request(app).delete("/ezelectronics/reviews/model3")
        expect(response.status).toBe(404)
        expect(response.body.error).toEqual("Product not found")
    })

    test("404: no review for this user and this product", async()=>{
        jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValueOnce(new NoReviewProductError())
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return next();
        })

        const response = await request(app).delete("/ezelectronics/reviews/model")
        expect(response.status).toBe(404)
        expect(response.body.error).toEqual("You have not reviewed this product")
    })

    test("401: user not logged in", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not logged in", status: 401 })
        })
        const response = await request(app).delete("/ezelectronics/reviews/model")
        expect(response.status).toBe(401)
    })

    test("401: user not customer", async()=>{
        jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not a customer", status: 401 })
        })
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        const response = await request(app).delete("/ezelectronics/reviews/model")
        expect(response.status).toBe(401)
    })
});

describe("Test: Route for deleting all reviews of a product", () => {
    /*
    - correct display: no errori dati dal db                           --> V                                             
    - modello non in db(404)                                           --> V

    PARAMETRI (RITORNARE 422)
    - modello non nullo                                                --> 

    CHIAMANTE
    - logged in                                                        --> V
    - admin o manager                                                  --> V
    */

    test("200: all reviews (of a product) deleted", async()=>{
        jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce()
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return next();
        })

        const response = await request(app).delete("/ezelectronics/reviews/model/all")
        expect(response.status).toBe(200)
        expect(response.body).toEqual({})
    })

    test("401: user not logged in", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not logged in", status: 401 })
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValue();
        const result = await request(app).delete("/ezelectronics/reviews/model/all");
        expect(result.status).toBe(401);
    })

    test("401: user not Admin or Manager", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not admin or manager", status: 401 })
        })
        jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValue();
        const result = await request(app).delete("/ezelectronics/reviews/model/all");
        expect(result.status).toBe(401);
    })

    test("404: model not in DB", async()=>{
        jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockRejectedValueOnce(new ProductNotFoundError())
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return next();
        })

        const response = await request(app).delete("/ezelectronics/reviews/model3/all")
        expect(response.status).toBe(404)
        expect(response.body.error).toEqual("Product not found")
    })
});

describe("Test: Route for deleting all reviews", () => {
    /*
    - correct removal           --> V       

    CHIAMANTE
    - logged in                 --> V
    - admin o manager           --> V
    */

    test("200: reviews deleted", async () => {
        jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce();
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        });
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return next();
        });
    
        const response = await request(app).delete("/ezelectronics/reviews");
        expect(response.status).toBe(200);
        expect(response.body).toEqual({});
    });

    test("401: user not logged in", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not logged in", status: 401 })
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValue();
        const result = await request(app).delete("/ezelectronics/reviews");
        expect(result.status).toBe(401);
    })

    test("401: user not Admin or Manager", async()=>{
        jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
        })
        jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return res.status(401).json({ error: "User is not admin or manager", status: 401 })
        })
        jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValue();
        const result = await request(app).delete("/ezelectronics/reviews");
        expect(result.status).toBe(401);
    })
});