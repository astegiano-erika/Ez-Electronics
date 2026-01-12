import { describe, test, expect, jest } from "@jest/globals"
import{User, Role} from "../../src/components/user"
import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO"
import { ExistingReviewError, NoReviewProductError} from "../../src/errors/reviewError"
import { ProductNotFoundError  } from "../../src/errors/productError"

jest.mock("../../src/dao/userDAO")

const date = new Date().toISOString().split('T')[0];
const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "1111-11-11")
const testReview = {model: "model", user: testUser, score: 1, comment: "comment"}
const testReviews = [
    {model: "model", user: "user", score: 1, date:"2000-01-01", comment: "comment"},
    {model: "model1", user: "user", score: 1, date:"2000-01-01", comment: "comment"}
]
const testReviewCreate = {model: "model", user: testUser.username, score: 1, date:date, comment: "comment"}

describe("Unit Controller Test: addReview", () => {
    /*
    - correct insertion: no errori dati dal db      --> V                                                  
    - modello non in db (404)                       --> V
    - controllo su review già esistente (409)       --> V           

    PARAMETRI (RITORNARE 422)
    - model empty                                   --> V
    - model not string                              --> V
    - date (order)
    - date (quantity)
    - date (divider)
    - date (letters)
    - date (future)
    */

    test("True: correct creation of review", async () => {
        jest.spyOn(ReviewDAO.prototype, "createReview").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        const response = await controller.addReview(testReview.model, testReview.user, testReview.score, testReview.comment);
    
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.createReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.createReview).toHaveBeenCalledWith(testReviewCreate.model, testReviewCreate.user, testReviewCreate.score, testReviewCreate.date, testReviewCreate.comment);
        expect(response).toBe(undefined); //Check if the response is true
        jest.clearAllMocks();
    });

    test("False: product not found", async () => {
        jest.spyOn(ReviewDAO.prototype, "createReview").mockRejectedValue(new ProductNotFoundError());//Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.addReview("prova", testReview.user, testReview.score, testReview.comment)).rejects.toThrow(ProductNotFoundError)
    
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.createReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.createReview).toHaveBeenCalledWith("prova", testReviewCreate.user, testReviewCreate.score, testReviewCreate.date, testReviewCreate.comment);
        jest.clearAllMocks();
    });

    test("False: review già esistente", async () => {
        jest.spyOn(ReviewDAO.prototype, "createReview").mockRejectedValueOnce(new ExistingReviewError()); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.addReview(testReview.model, testReview.user, testReview.score, testReview.comment)).rejects.toThrow(ExistingReviewError)
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.createReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.createReview).toHaveBeenCalledWith(testReviewCreate.model, testReviewCreate.user, testReviewCreate.score, testReviewCreate.date, testReviewCreate.comment);
        jest.clearAllMocks();
    });

    test("False: generic DAO error", async () => {
        const err= new Error("generic DAO error")
        jest.spyOn(ReviewDAO.prototype, "createReview").mockRejectedValueOnce(err); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.addReview(testReview.model, testReview.user, testReview.score, testReview.comment)).rejects.toThrow(err)

        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.createReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.createReview).toHaveBeenCalledWith(testReviewCreate.model, testReviewCreate.user, testReviewCreate.score, testReviewCreate.date, testReviewCreate.comment);
        jest.clearAllMocks();
    });

    /*test("False: modello vuoto", async () => {
        const err= new Error("model empty")
        jest.spyOn(ReviewDAO.prototype, "createReview").mockRejectedValueOnce(err); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.addReview(null, testReview.user, testReview.score, testReview.comment)).rejects.toThrow(err)

        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.createReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.createReview).toHaveBeenCalledWith(null, testReviewCreate.user, testReviewCreate.score, testReviewCreate.date, testReviewCreate.comment);
        jest.clearAllMocks();
    });

    test("False: modello non stringa", async () => {
        const err= new Error("model not string")
        jest.spyOn(ReviewDAO.prototype, "createReview").mockRejectedValueOnce(err); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.addReview(123, testReview.user, testReview.score, testReview.comment)).rejects.toThrow(err)
    
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.createReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.createReview).toHaveBeenCalledWith(123, testReviewCreate.user, testReviewCreate.score, testReviewCreate.date, testReviewCreate.comment);
        jest.clearAllMocks();
    });*/
});

describe("Unit Controller Test: getProductReviews", () => {
    /*
    - correct insertion: no errori dati dal db      --> V                                                  
    - modello non in db (404)                       --> V          
    - generic DAO error                             --> V
    */
    test("True: correct listing of reviews", async () => {
        jest.spyOn(ReviewDAO.prototype, "getReviews").mockResolvedValueOnce(testReviews); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        const response = await controller.getProductReviews(testReview.model);
    
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.getReviews).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.getReviews).toHaveBeenCalledWith(testReviewCreate.model);
        expect(response).toEqual(testReviews); //Check if the response is true
        jest.clearAllMocks();
    });

    test("False: product not found", async () => {
        jest.spyOn(ReviewDAO.prototype, "getReviews").mockRejectedValue(new ProductNotFoundError());//Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.getProductReviews("prova")).rejects.toThrow(ProductNotFoundError)
    
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.getReviews).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.getReviews).toHaveBeenCalledWith("prova");
        jest.clearAllMocks();
    });

    test("False: generic DAO error", async () => {
        const err= new Error("generic DAO error")
        jest.spyOn(ReviewDAO.prototype, "getReviews").mockRejectedValueOnce(err); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.getProductReviews(testReview.model)).rejects.toThrow(err)

        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.getReviews).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.getReviews).toHaveBeenCalledWith(testReviewCreate.model);
        jest.clearAllMocks();
    });

    /*test("False: modello vuoto", async () => {
        const err= new Error("model empty")
        jest.spyOn(ReviewDAO.prototype, "getReviews").mockRejectedValueOnce(err); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.getProductReviews(null)).rejects.toThrow(err)

        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.getReviews).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.getReviews).toHaveBeenCalledWith(null);
        jest.clearAllMocks();
    });

    test("False: modello non stringa", async () => {
        const err= new Error("model not string")
        jest.spyOn(ReviewDAO.prototype, "getReviews").mockRejectedValueOnce(err); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.getProductReviews(123)).rejects.toThrow(err)
    
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.getReviews).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.getReviews).toHaveBeenCalledWith(123);
        jest.clearAllMocks();
    });*/
});

describe("Unit Controller Test: deleteReview", () => {
    /*
    - correct insertion: no errori dati dal db      --> V                                                   
    - modello non in db (404)                       --> V
    - controllo su review già esistente (404)       --> V            
    - generic DAO error                             --> V
    */
    test("True: correct remoeval of review", async () => {
        jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        const response = await controller.deleteReview(testReview.model, testReview.user);
    
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(testReviewCreate.model, testReviewCreate.user);
        expect(response).toBe(undefined); //Check if the response is true
        jest.clearAllMocks();
    });

    test("False: product not found", async () => {
        jest.spyOn(ReviewDAO.prototype, "deleteReview").mockRejectedValue(new ProductNotFoundError());//Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.deleteReview("prova", testReview.user)).rejects.toThrow(ProductNotFoundError)
    
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith("prova", testReviewCreate.user);
        jest.clearAllMocks();
    });

    test("False: review già esistente", async () => {
        jest.spyOn(ReviewDAO.prototype, "deleteReview").mockRejectedValueOnce(new NoReviewProductError()); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.deleteReview(testReview.model, testReview.user)).rejects.toThrow(NoReviewProductError)
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(testReviewCreate.model, testReviewCreate.user);
        jest.clearAllMocks();
    });

    test("False: generic DAO error", async () => {
        const err= new Error("generic DAO error")
        jest.spyOn(ReviewDAO.prototype, "deleteReview").mockRejectedValueOnce(err); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.deleteReview(testReview.model, testReview.user)).rejects.toThrow(err)

        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(testReviewCreate.model, testReviewCreate.user);
        jest.clearAllMocks();
    });

    /*test("False: modello vuoto", async () => {
        const err= new Error("model empty")
        jest.spyOn(ReviewDAO.prototype, "deleteReview").mockRejectedValueOnce(err); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.deleteReview(null, testReview.user)).rejects.toThrow(err)

        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(null, testReviewCreate.user);
        jest.clearAllMocks();
    });

    test("False: modello non stringa", async () => {
        const err= new Error("model not string")
        jest.spyOn(ReviewDAO.prototype, "deleteReview").mockRejectedValueOnce(err); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.deleteReview(123, testReview.user)).rejects.toThrow(err)
    
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(123, testReviewCreate.user);
        jest.clearAllMocks();
    });*/
});

describe("Unit Controller Test: deleteReviewsOfProduct", () => {
    /*
    - correct insertion: no errori dati dal db      --> V                                                   
    - modello non in db (404)                       --> V        
    - generic DAO error                             --> V
    */
    test("True: correct remoeval of review", async () => {
        jest.spyOn(ReviewDAO.prototype, "deleteReviews").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        const response = await controller.deleteReviewsOfProduct(testReview.model);
    
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.deleteReviews).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReviews).toHaveBeenCalledWith(testReviewCreate.model);
        expect(response).toBe(undefined); //Check if the response is true
        jest.clearAllMocks();
    });

    test("False: product not found", async () => {
        jest.spyOn(ReviewDAO.prototype, "deleteReviews").mockRejectedValue(new ProductNotFoundError());//Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.deleteReviewsOfProduct("prova")).rejects.toThrow(ProductNotFoundError)
    
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.deleteReviews).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReviews).toHaveBeenCalledWith("prova");
        jest.clearAllMocks();
    });

    test("False: generic DAO error", async () => {
        const err= new Error("generic DAO error")
        jest.spyOn(ReviewDAO.prototype, "deleteReviews").mockRejectedValueOnce(err); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.deleteReviewsOfProduct(testReviewCreate.model)).rejects.toThrow(err)

        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.deleteReviews).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReviews).toHaveBeenCalledWith(testReviewCreate.model);
        jest.clearAllMocks();
    });

    /*test("False: modello vuoto", async () => {
        const err= new Error("model empty")
        jest.spyOn(ReviewDAO.prototype, "deleteReviews").mockRejectedValueOnce(err); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.deleteReviewsOfProduct(null)).rejects.toThrow(err)

        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.deleteReviews).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReviews).toHaveBeenCalledWith(null);
        jest.clearAllMocks();
    });

    test("False: modello non stringa", async () => {
        const err= new Error("model not string")
        jest.spyOn(ReviewDAO.prototype, "deleteReviews").mockRejectedValueOnce(err); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.deleteReviewsOfProduct(123)).rejects.toThrow(err)
    
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.deleteReviews).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteReviews).toHaveBeenCalledWith(123);
        jest.clearAllMocks();
    });*/
});

describe("Unit Controller Test: deleteAllReviews", () => {
    /*
    - correct       --> V
    - DAO error     --> V                                                               
    */
    test("True: correct remoeval of review", async () => {
        jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        const response = await controller.deleteAllReviews();
    
        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledWith();
        expect(response).toBe(undefined); //Check if the response is true
        jest.clearAllMocks();
    });

    test("False: generic DAO error", async () => {
        const err= new Error("generic DAO error")
        jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockRejectedValueOnce(err); //Mock the createUser method of the DAO
        const controller = new ReviewController(); //Create a new instance of the controller
        //Call the createUser method of the controller with the test user object
        await expect(controller.deleteAllReviews()).rejects.toThrow(err)

        //Check if the createUser method of the DAO has been called once with the correct parameters
        expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledWith();
        jest.clearAllMocks();
    });
});