import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import{User, Role} from "../../src/components/user"
import ReviewController from "../../src/controllers/reviewController"
import {ProductReview} from "../../src/components/review"
import { ExistingReviewError, NoReviewProductError} from "../../src/errors/reviewError"
import { ProductNotFoundError  } from "../../src/errors/productError"
import {cleanup} from "../../src/db/cleanup"
import seedController from "../../src/controllers/seeder"

jest.setTimeout(200000);

const seeder = new seedController();

const testUser = new User("erikaa", "Erika", "Giallo", Role.CUSTOMER, "Via 1", "1998-01-01")
const testReview = {model: "Hp v10", user: testUser, score: 1, comment: "bad"}
const existingReview = {model: "Huawei v20", user: testUser, score: 1, comment: "bad"}
const resReview = new ProductReview('Hp v10', 'agnesee', 3, '2023-06-10', 'Could be better')

describe("Integrated Controller Test: addReview", () => {
    /*
    - correct insertion: no errori dati dal db      --> V                                                  
    - modello non in db (404)                       --> V
    - controllo su review già esistente (409)       --> V           
    */

    test("True: correct creation of review", async () => {
        await cleanup();
        await seeder.seedDatabase();
        const controller = new ReviewController(); //Create a new instance of the controller
        const response = await controller.addReview(testReview.model, testReview.user, testReview.score, testReview.comment);
        expect(response).toBe(undefined); //Check if the response is true
    });

    test("False: product not found", async () => {
        await cleanup();
        await seeder.seedDatabase();
        const controller = new ReviewController(); //Create a new instance of the controller
        await expect(controller.addReview("model3", testReview.user, testReview.score, testReview.comment)).rejects.toThrow(ProductNotFoundError)
    });

    test("False: review già esistente", async () => {
        await cleanup();
        await seeder.seedDatabase();
        const controller = new ReviewController(); //Create a new instance of the controller
        await expect(controller.addReview(existingReview.model, existingReview.user, existingReview.score, existingReview.comment)).rejects.toThrow(ExistingReviewError)
    });

});

describe("Integrated Controller Test: getProductReviews", () => {
    /*
    - correct insertion: no errori dati dal db      --> V                                                  
    - modello non in db (404)                       --> V          
    */
    test("True: correct listing of reviews", async () => {
        await cleanup();
        await seeder.seedDatabase();
        const controller = new ReviewController(); //Create a new instance of the controller
        const response = await controller.getProductReviews(testReview.model);
        expect(response).toEqual([resReview]); //Check if the response is true
    });

    test("False: product not found", async () => { 
        await cleanup();
        await seeder.seedDatabase();       
        const controller = new ReviewController(); //Create a new instance of the controller
        await expect(controller.getProductReviews("model3")).rejects.toThrow(ProductNotFoundError)
    });

});

describe("Integrated Controller Test: deleteReview", () => {
    /*
    - correct insertion: no errori dati dal db      --> V                                                   
    - modello non in db (404)                       --> V
    - controllo su review già esistente (404)       --> V            
    */
    test("True: correct remoeval of review", async () => {
        await cleanup();
        await seeder.seedDatabase();
        const controller = new ReviewController(); //Create a new instance of the controller
        const response = await controller.deleteReview(existingReview.model, existingReview.user);
        expect(response).toBe(undefined); //Check if the response is true
    });

    test("False: product not found", async () => {
        await cleanup();
        await seeder.seedDatabase();
        const controller = new ReviewController(); //Create a new instance of the controller
        await expect(controller.deleteReview("prova", existingReview.user)).rejects.toThrow(ProductNotFoundError)
    });

    test("False: non esist review da cancellare", async () => {
        await cleanup();
        await seeder.seedDatabase();
        const controller = new ReviewController(); //Create a new instance of the controller
        await expect(controller.deleteReview(testReview.model, testReview.user)).rejects.toThrow(NoReviewProductError)
    });

});

describe("Integrated Controller  Test: deleteReviewsOfProduct", () => {
    /*
    - correct insertion: no errori dati dal db      --> V                                                   
    - modello non in db (404)                       --> V        
    */
    test("True: correct remoeval of review", async () => {
        await cleanup();
        await seeder.seedDatabase();
        const controller = new ReviewController(); //Create a new instance of the controller
        const response = await controller.deleteReviewsOfProduct(testReview.model);
        expect(response).toBe(undefined); //Check if the response is true
    });

    test("False: product not found", async () => {
        await cleanup();
        await seeder.seedDatabase();
        const controller = new ReviewController(); //Create a new instance of the controller
        await expect(controller.deleteReviewsOfProduct("model3")).rejects.toThrow(ProductNotFoundError)
    });

});

describe("Integrated Controller Test: deleteAllReviews", () => {
    /*
    - correct       --> V                                                           
    */
    test("True: correct remoeval of review", async () => {
        await cleanup();
        await seeder.seedDatabase();
        const controller = new ReviewController(); //Create a new instance of the controller
        const response = await controller.deleteAllReviews();
        expect(response).toBe(undefined); //Check if the response is true
    });

});