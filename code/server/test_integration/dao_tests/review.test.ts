import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import ReviewDAO from "../../src/dao/reviewDAO"
import {ProductReview} from "../../src/components/review"
import db from "../../src/db/db"
import {cleanup} from "../../src/db/cleanup"
import seedController from "../../src/controllers/seeder"
import { ExistingReviewError, NoReviewProductError} from "../../src/errors/reviewError"
import { ProductNotFoundError  } from "../../src/errors/productError"

jest.setTimeout(200000);
const reviewDAO = new ReviewDAO();
const seeder = new seedController();


describe("Integrated Dao Test: createReview", () => {
    /*
    - correct insertion                                                     --> V
    - modello non esistente o modello nullo (CONTROLLA CHE RITORNI 404)     --> V
    - controllo su review già esistente (CONTROLLA 409)                     --> V
    */
    test("Correct review insertion", async () => {
        await cleanup();
        await seeder.seedDatabase();
        const result = await reviewDAO.createReview("Asus v11", "erikaa", 1, "2000-01-01", "comment")
        expect(result).toBe(true)

        const expectedReview = new ProductReview("Asus v11", "erikaa", 1, "2000-01-01", "comment");
        const result2 = await reviewDAO.getReviews("Asus v11")
        expect(result2).toEqual(expect.arrayContaining([expect.objectContaining({
            model: expectedReview.model,
            user: expectedReview.user,
            score: expectedReview.score,
            date: expectedReview.date,
            comment: expectedReview.comment
        })])); 
    });

    
    test("Review already exists", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await expect(reviewDAO.createReview("Huawei v20", "erikaa", 1, "2000-01-01", "comment")).rejects.toThrow(ExistingReviewError);
    });

    test("Model not in DB", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await expect(reviewDAO.createReview("model3", "erikaa", 1, "2000-01-01", "comment")).rejects.toThrow(ProductNotFoundError);
    });
})


//-------------------------------------------------------------------------------------------------------------------
describe("Integrated Dao Test: getReviews", () => {
    /*
    - correct display: no errori dati dal db                                --> V
    - modello non esistente o modello nullo                                 --> V
   */
    test("Correct listing of all reviews for a product", async () => {
        await cleanup();
        await seeder.seedDatabase();
        const result = await reviewDAO.getReviews('Huawei v20');
        const expectedReview = new ProductReview('Huawei v20', 'erikaa', 5, '2023-05-20', 'Amazing!');
        expect(result).toEqual(expect.arrayContaining([expect.objectContaining({
            model: expectedReview.model,
            user: expectedReview.user,
            score: expectedReview.score,
            date: expectedReview.date,
            comment: expectedReview.comment
        })]));
    });

    test("Model not in DB", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await expect(reviewDAO.getReviews("model3")).rejects.toThrow(ProductNotFoundError);
    });

})

//---------------------------------------------------------------------------------------------------------------------
describe("Integrated Dao Test: deleteReview", () => {
    /*
    - correct display: no errori dati dal db                    --> V
    - modello non esistente o modello nullo (RITORNA 404)       --> V
    - user non ha una reviewper quel modello (RITORNA 404)      --> V
    */
    test("Correct removal of a review", async () => {
        await cleanup();
        await seeder.seedDatabase();
        const result = await reviewDAO.deleteReview("Lg v1", "erikaa");
        expect(result).toBe(true)

        /*const result2 = await reviewDAO.getReviews("Asus v11")
        expect(result2).toHaveLength(0);*/
    })

    test("Model not in DB", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await expect(reviewDAO.deleteReview("model3", "erikaa")).rejects.toThrow(ProductNotFoundError);
    })

    test("Review not in DB", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await expect(reviewDAO.deleteReview("Hp v10", "erikaa")).rejects.toThrow(NoReviewProductError);
    })
})

//----------------------------------------------------------------------------------------------------------------------
describe("Integrated Dao Test: deleteReviews", () => {
    /*
    - correct display: no errori dati dal db                        --> V
    - modello non esistente o modello nullo (RITORNA 404)           --> V
    */
    test("Correct removal of all reviews of a product", async () => {
        await cleanup();
        await seeder.seedDatabase();
        const result = await reviewDAO.deleteReviews("Sony v2");
        expect(result).toBe(true)
        
        /*const result2 = await reviewDAO.getReviews("Sony v2")
        expect(result2).toHaveLength(0);*/
    })


    test("Model not in DB", async () => {
        await cleanup();
        await seeder.seedDatabase();
        await expect(reviewDAO.deleteReviews("model3")).rejects.toThrow(ProductNotFoundError);
    })
})


//------------------------------------------------------------------------------------------------------------------------
describe("Integrated Dao Test: deleteAllReviews", () => {
    /*
    - correct display: no errori dati dal db            --> V
*/
    test("Correct removal of all reviews", async () => {
        await cleanup();
        await seeder.seedDatabase();
        const result = await reviewDAO.deleteAllReviews()
        expect(result).toBe(true)
    })
})
