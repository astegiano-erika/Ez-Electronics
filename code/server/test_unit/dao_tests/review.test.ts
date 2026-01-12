import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import ReviewDAO from "../../src/dao/reviewDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { ExistingReviewError, NoReviewProductError} from "../../src/errors/reviewError"
import { ProductNotFoundError  } from "../../src/errors/productError"

jest.mock("../../src/db/db.ts")

let mockDBrun: any
let mockDBall: any
let mockDBget: any

const mockFoundProduct= [
    { sellingPrice: 10, model: "model", category: "category", arrivalDate:"yyyy-mm-dd", details:"details", quantity:"quantity"}
];

const mockFoundReview= [
    { model: "model", user: "user1", score: 5, date: "2024-06-02", comment: "Great product" }
];

const mockReviews = [
    { model: "model", user: "user1", score: 5, date: "2024-06-02", comment: "Great product" },
    { model: "model", user: "user2", score: 4, date: "2024-06-01", comment: "Good product" }
];

beforeAll(async () =>{
    mockDBrun = jest.spyOn(db, "run")
    mockDBall = jest.spyOn(db, "all")
    mockDBget = jest.spyOn(db, "get")
})

afterEach(async () => {
    mockDBrun.mockRestore()
    mockDBall.mockRestore()
    mockDBget.mockRestore()
})

describe("Unit Dao Test: createReview", () => {
    /*
    - correct insertion: no errori dati dal db                              --> V
    - failed insertion: errori dati dal db                                  --> V
    - modello non esistente o modello nullo (CONTROLLA CHE RITORNI 404)     --> V
    - controllo su review già esistente (CONTROLLA 409)                     --> V
    */

    test("Correct review insertion", async () => {
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null, mockFoundProduct);  
            return {} as Database;
        });
        mockDBrun.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null);  
            return {} as Database;
        });
    
        const result = await reviewDAO.createReview("model", "user", 1, "2000-01-01", "comment")
        expect(result).toBe(true)
        expect(mockDBget).toHaveBeenCalledTimes(1)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        )
        expect(mockDBrun).toHaveBeenCalledTimes(1)
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String),
            ["model", "user", 1, "2000-01-01", "comment"],
            expect.any(Function)
        )
    })
  
    
    test("Generic DB error in get", async () => {
        const err= new Error("DB error in get")
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(err);  
            return {} as Database;
        });
    
        await expect(reviewDAO.createReview("model", "user2", 1, "2000-01-01", "comment"))
        .rejects.toThrow(err)
        expect(mockDBget).toHaveBeenCalledTimes(1)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        )
    })

    test("Generic DB error in run", async () => {
        const err= new Error("DB error in run")
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null, mockFoundProduct);  
            return {} as Database;
        });
        mockDBrun.mockImplementation((sql: any, params:any, callback:any) => {
            callback(err);  
            return {} as Database;
        });
    
        await expect(reviewDAO.createReview("model", "user2", 1, "2000-01-01", "comment")).rejects.toThrow(err)
        expect(mockDBget).toHaveBeenCalledTimes(1)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        )
        expect(mockDBrun).toHaveBeenCalledTimes(1)
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String),
            ["model", "user2", 1, "2000-01-01", "comment"],
            expect.any(Function)
        )
    })

    test("Review already exists", async () => {
        const err = new ExistingReviewError();
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null, mockFoundProduct);  
            return {} as Database;
        });
        mockDBrun.mockImplementation((sql: any, params:any, callback:any) => {
            callback(err, null);  
            return {} as Database;
        });
    
        await expect(reviewDAO.createReview("model", "user1", 1, "2000-01-01", "comment")).rejects.toThrow(ExistingReviewError)
        expect(mockDBget).toHaveBeenCalledTimes(1)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        )
        expect(mockDBrun).toHaveBeenCalledTimes(1)
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String),
            ["model", "user1", 1, "2000-01-01", "comment"],
            expect.any(Function)
        )
    })

    test("Model not in DB", async () => {
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null, null);  
            return {} as Database;
        });
        mockDBrun.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null);  
            return {} as Database;
        });
    
        await expect(reviewDAO.createReview("model3", "user2", 1, "2000-01-01", "comment")).rejects.toThrow(ProductNotFoundError)
        expect(mockDBget).toHaveBeenCalledTimes(1)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model3"],
            expect.any(Function)
        )
    })
})


//-------------------------------------------------------------------------------------------------------------------
describe("Unit Dao Test: getReviews", () => {
    /*
    - correct display: no errori dati dal db                                --> V
    - failed display: errori dati dal db                                    --> V
    - modello non esistente o modello nullo (CONTROLLA CHE RITORNI 404)    
    */

    test("Correct listing of all revies for a product", async () => {
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null, mockFoundProduct);  
            return {} as Database;
        });
        mockDBall.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null, mockReviews);  
            return {} as Database;
        });       
        
        const result = await reviewDAO.getReviews("model");
        expect(result).toEqual(expect.arrayContaining(mockReviews));
        expect(mockDBget).toHaveBeenCalledTimes(1)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        )
        expect(mockDBall).toHaveBeenCalledTimes(1);
        expect(mockDBall).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        );
    })

    test("General DB error in all", async () => {
        const err= new Error("DB error in all")
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null, mockFoundProduct);  
            return {} as Database;
        });
        mockDBall.mockImplementation((sql: any, params:any, callback:any) => {
            callback(err);  
            return {} as Database;
        }); 
    
        await expect(reviewDAO.getReviews("model")).rejects.toThrow(err);
        expect(mockDBget).toHaveBeenCalledTimes(1)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        )
        expect(mockDBall).toHaveBeenCalledTimes(1);
        expect(mockDBall).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        );
    })
    
    test("Model not in DB", async () => {
        const err= new ProductNotFoundError();
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(err, null);  
            return {} as Database;
        });
        mockDBall.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null);  
            return {} as Database;
        }); 

        await expect(reviewDAO.getReviews("model3")).rejects.toThrow(ProductNotFoundError)
        expect(mockDBget).toHaveBeenCalledTimes(1)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model3"],
            expect.any(Function)
        )
        expect(mockDBall).toHaveBeenCalledTimes(0);
    })
})

//---------------------------------------------------------------------------------------------------------------------
describe("Unit Dao Test: deleteReview", () => {
    /*
    - correct display: no errori dati dal db                    --> V
    - failed display: errori dati dal db                        --> V
    - modello non esistente o modello nullo (RITORNA 404)       --> V
    - user non ha una reviewper quel modello (RITORNA 404)      --> V
    */

    test("Correct removal of a review", async () => {
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null, mockFoundProduct);  
            return {} as Database;
        });
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null, mockFoundReview);  
            return {} as Database;
        });
        mockDBrun.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null);  
            return {} as Database;
        });
        
        const result = await reviewDAO.deleteReview("model", "user1")
        expect(result).toBe(true)
        expect(mockDBget).toHaveBeenCalledTimes(2);
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        )
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model", "user1"],
            expect.any(Function)
        )
        expect(mockDBrun).toHaveBeenCalledTimes(1);
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String),
            ["model", "user1"],
            expect.any(Function)
        );
    })

    test("Generic DB error in get", async () => {
        const err= new Error("DB error in get")
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(err);  
            return {} as Database;
        });
        
        await expect(reviewDAO.deleteReview("model", "user1")).rejects.toThrow(err)
        expect(mockDBget).toHaveBeenCalledTimes(1);
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        );
    })

    test("Generic DB error in run", async () => {
        const err= new Error("DB error in run");
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null, mockFoundProduct);  
            return {} as Database;
        });
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null, mockFoundReview);  
            return {} as Database;
        });
        mockDBrun.mockImplementation((sql: any, params:any, callback:any) => {
            callback(err);  
            return {} as Database;
        });
        
        await expect(reviewDAO.deleteReview("model", "user1")).rejects.toThrow(err)
        expect(mockDBget).toHaveBeenCalledTimes(2);
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        )
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model", "user1"],
            expect.any(Function)
        )
        expect(mockDBrun).toHaveBeenCalledTimes(1);
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String),
            ["model", "user1"],
            expect.any(Function)
        );
    })

    test("Model not in DB", async () => {
        const err= new ProductNotFoundError()
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(err, null);  
            return {} as Database;
        });
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null);  
            return {} as Database;
        });
        mockDBrun.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null);  
            return {} as Database;
        });
        await expect(reviewDAO.deleteReview("model", "user1")).rejects.toThrow(ProductNotFoundError)
        expect(mockDBget).toHaveBeenCalledTimes(1);
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        );
    })

    test("Review not in DB", async () => {
        const err= new NoReviewProductError()
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
            callback(null, mockFoundProduct);  
            return {} as Database;
        });
        mockDBget.mockImplementationOnce((sql: any, params:any, callback:any) => {
            callback(err);  
            return {} as Database;
        });
        mockDBrun.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null);  
            return {} as Database;
        });
        await expect(reviewDAO.deleteReview("model", "user1")).rejects.toThrow(NoReviewProductError)
        expect(mockDBget).toHaveBeenCalledTimes(2);
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        )
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model", "user1"],
            expect.any(Function)
        )
    })
})

//----------------------------------------------------------------------------------------------------------------------
describe("Unit Dao Test: deleteReviews", () => {
    /*
    - correct display: no errori dati dal db                        --> V
    - failed display: errori dati dal db                            --> V
    - modello non esistente o modello nullo (RITORNA 404)           --> V
    */
    test("Correct removal of all reviews of a product", async () => {
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null, mockFoundProduct);  
            return {} as Database;
        });
        mockDBrun.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null);  
            return {} as Database;
        });
        
        const result = await reviewDAO.deleteReviews("model")
        expect(result).toBe(true)
        expect(mockDBget).toHaveBeenCalledTimes(1);
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        )
        expect(mockDBrun).toHaveBeenCalledTimes(1);
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        );
    })

    test("Generic DB error in get", async () => {
        const err= new Error("DB error in get")
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(err);  
            return {} as Database;
        });
        
        await expect(reviewDAO.deleteReviews("model")).rejects.toThrow(err)
        expect(mockDBget).toHaveBeenCalledTimes(1);
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        )
    })

    test("Generic DB error in run.", async () => {
        const reviewDAO = new ReviewDAO();
        const err= new Error("DB error in run")
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null, mockFoundProduct);  
            return {} as Database;
        });
        mockDBrun.mockImplementation((sql: any, params:any, callback:any) => {
            callback(err);  
            return {} as Database;
        });
        
        await expect(reviewDAO.deleteReviews("model")).rejects.toThrow(err)
        expect(mockDBget).toHaveBeenCalledTimes(1);
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        )
        expect(mockDBrun).toHaveBeenCalledTimes(1);
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String),
            ["model"],
            expect.any(Function)
        );
    })

    test("Model not in DB", async () => {
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null, null);  
            return {} as Database;
        });
        mockDBrun.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null);  
            return {} as Database;
        });
    
        await expect(reviewDAO.deleteReviews("model3")).rejects.toThrow(ProductNotFoundError)
        expect(mockDBget).toHaveBeenCalledTimes(1)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String),
            ["model3"],
            expect.any(Function)
        )
    })
})


//------------------------------------------------------------------------------------------------------------------------
describe("Unit Dao Test: deleteAllReviews", () => {
    /*
    - correct display: no errori dati dal db            --> V
    - failed display: errori dati dal db                --> v
    */
   
    test("Correct removal of all reviews", async () => {
        const reviewDAO = new ReviewDAO()
        mockDBrun.mockImplementation((sql: any, params:any, callback:any) => {
            callback(null);  
            return {} as Database;
        });

        const result = await reviewDAO.deleteAllReviews()
        expect(result).toBe(true)
        expect(mockDBrun).toHaveBeenCalledTimes(1);
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String),
            [],
            expect.any(Function)
        );
    })

    test("Generic DB error in run.", async () => {
        const reviewDAO = new ReviewDAO();
        const err= new Error("DB error in run")
        mockDBrun.mockImplementation((sql: any, params:any, callback:any) => {
            callback(err);  
            return {} as Database;
        });
        
        await expect(reviewDAO.deleteAllReviews()).rejects.toThrow(err)
        expect(mockDBrun).toHaveBeenCalledTimes(1);
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String),
            [],
            expect.any(Function)
        );
    })
})
