import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError"
import { ProductNotFoundError } from "../errors/productError"
import db from "../db/db"
import { ProductReview } from "../components/review"

/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {

    /**
     * Creates a new review and saves its information in the database.
     * @param model The model of the reviewed product
     * @param user The username of the user who wrote the review
     * @param score The score assigned to the product, from 1 to 5
     * @param date The date in which the product was reviewed
     * @param comment The comment left by the customer
     * @returns A Promise that resolves to true if the review has been created.
     */
    createReview(model: string, user: string, score: number, date: string, comment: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {

                let sql = "SELECT * FROM products WHERE model = ?"

                db.get(sql, [model], (err: Error | null, row: any) => {
                    
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!row) {
                        reject(new ProductNotFoundError)
                        return
                    }

                    sql = "INSERT INTO reviews(model, user, score, date, comment) VALUES(?, ?, ?, ?, ?)"

                    db.run(sql, [model, user, score, date, comment], (err: Error | null) => {
                        if (err) {
                            if (err.message.includes("UNIQUE constraint failed: reviews.model, reviews.user"))
                                reject(new ExistingReviewError)
                            reject(err)
                        }
                        resolve(true)
                    })
                })

            } catch (error) {
                reject(error)
            }

        })
    }

    /**
     * Returns an array of ProductReview objects from the database based on the model.
     * @param model The model of the product
     * @returns A Promise that resolves into an array of ProductReview.
     */
    getReviews(model: string): Promise<ProductReview[]> {
        return new Promise<ProductReview[]>((resolve, reject) => {
            try {
                let sql = "SELECT * FROM products WHERE model = ?"
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!row) {
                        reject(new ProductNotFoundError())
                        return
                    }

                    sql = "SELECT * FROM reviews WHERE model = ?"
                    db.all(sql, [model], (err: Error | null, rows: any) => {
                        if (err) {
                            reject(err)
                            return
                        }

                        const reviews = rows.map(
                            (row: any) => new ProductReview(row.model, row.user, row.score, row.date, row.comment)
                        )
                        resolve(reviews)
                    })
                })

            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Deletes the review made by the current user for a specific product.
     * @param model The model of the product
     * @param user The username of the user who wrote the review
     * @returns A Promise that resolves to true if the review has been deleted.
     */
    deleteReview(model: string, user: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            let sql = "SELECT * FROM products WHERE model = ?";
            db.get(sql, [model], (err: Error | null, row: any) => {
                if (err) {
                    reject(err);
                    return
                }
                if (!row) {
                    reject(new ProductNotFoundError);
                    return
                }

                sql = "SELECT * FROM reviews WHERE model = ? AND user = ?";

                db.get(sql, [model, user], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err);
                        return
                    }
                    if (!row) {
                        reject(new NoReviewProductError);
                        return
                    }

                    sql = "DELETE FROM reviews WHERE model = ? AND user = ?";

                    db.run(sql, [model, user], (err: Error | null) => {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(true);
                    });
                });
            });
        });
    }

    /**
     * Deletes all reviews of a specific product.
     * @param model The model of the product
     * @returns A Promise that resolves to true if all reviews of the specific product have been deleted.
     */
    deleteReviews(model: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            let sql = "SELECT * FROM products WHERE model = ?";
            db.get(sql, [model], (err: Error | null, row: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!row) {
                    reject(new ProductNotFoundError());
                    return;
                }

                sql = "DELETE FROM reviews WHERE model = ?";
                db.run(sql, [model], (err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(true);
                });
            });
        });
    }

    /**
     * Deletes all reviews of all existing products.
     * @returns A Promise that resolves to true if all reviews of all products have been deleted.
     */
    deleteAllReviews(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const sql = "DELETE FROM reviews";
            db.run(sql, [], (err: Error | null) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

}

export default ReviewDAO;