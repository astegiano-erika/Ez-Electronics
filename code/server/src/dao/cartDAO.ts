import db from "../db/db"
import { Cart, ProductInCart } from "../components/cart"
import { UserNotFoundError, UserNotCustomerError, UserNotManagerError, UserNotAdminError } from "../errors/userError";
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../errors/productError";
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../errors/cartError";
/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {

    /**
     * Returns the current cart of the logged in user
     * @param username The username of the logged in user
     * @returns A Promise that resolves the information of the current cart of the logged in user.
     */
    getCurrentCart(username: string) : Promise<Cart> {
        return new Promise<Cart>((resolve, reject) => {
            try {
                const sql1 = "SELECT * FROM carts WHERE customer = ? AND paid = false";
                db.get(sql1, [username], (err: Error | null, cartRow: any) => {
                    if(err) {
                        reject(err); return;
                    }
                    // No information about an unpaid cart in the db
                    if(!cartRow) {
                        resolve(new Cart(username, false, null, 0, [])); return;
                    }
                    // An unpaid cart is present in the database
                    const sql2 = "SELECT idCart, productsPerCart.model, productsPerCart.quantity, category, sellingPrice " + 
                        "FROM carts, productsPerCart, products WHERE carts.id = productsPerCart.idCart AND " + 
                        "productsPerCart.model = products.model AND idCart = ?";
                    db.all(sql2, [cartRow.id], (err: Error | null, rows: any) => {
                        if(err) {
                            reject(err); return;
                        }
                        // An unpaid cart with no products
                        if(rows.length == 0) {
                            resolve(new Cart(username, false, null, 0, []));
                            return;
                        }

                        const productsInCart = rows.map(
                            (prod: any) => new ProductInCart(prod.model, prod.quantity, prod.category, prod.sellingPrice)
                        );
                        
                        const cart: Cart = new Cart(cartRow.customer, false, cartRow.paymentDate, cartRow.total, productsInCart);
                        resolve(cart);
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Add a product instance to the current cart of the logged in user
     * @param username The username of the logged in user
     * @param model The model of the product to add
     * @returns A Promise that resolves to `true` if the product was successfully added.
     */
    addProductToCart(username: string, model: string): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {
                // Verify if there is an unpaid cart of the current logged in user
                const sql1 = "SELECT * FROM carts WHERE customer = ? AND paid = false";
                db.get(sql1, [username], (err: Error | null, cartRow: any) => {
                    if(err) {
                        reject(err); return;
                    }

                    // Research the product, identified by the model, to add to the current cart
                    const sql2 = "SELECT sellingPrice, quantity FROM products WHERE model = ?";
                    db.get(sql2, [model], (err: Error | null, productRow: any) => {
                        if(err) {
                            reject(err); return;
                        }
                        // The model does not represent an existing product
                        if(!productRow) {
                            reject(new ProductNotFoundError());
                            return;
                        }
                        // The model represents a product whose available quantity is 0
                        if(productRow.quantity == 0) {
                            reject(new EmptyProductStockError());
                            return;
                        }

                        // Existing product and available. 
                        //  - No information about the unpaid cart
                        if(!cartRow) {
                            const sql3 = "INSERT INTO carts(customer, paid, paymentDate, total) VALUES(?,?,?,?)";
                            db.run(sql3, [username, false, null, productRow.sellingPrice], function(err) {
                                if(err) {
                                    reject(err); return;
                                }
                                const sql4 = "INSERT INTO productsPerCart(idCart, model, quantity) VALUES(?,?,?)";
                                db.run(sql4, [this.lastID, model, 1], function(err) {
                                    if(err) {
                                        reject(err); return;
                                    }
                                });   
                                resolve(true);
                            });
                        } else { //  - An unpaid cart is present
                            const sql5 = "UPDATE carts SET total = ? WHERE id = ?";
                            db.run(sql5, [cartRow.total + productRow.sellingPrice, cartRow.id], function (err) {
                                if(err) {
                                    reject(err); return;
                                }
                                const sql6 = "SELECT quantity FROM productsPerCart WHERE idCart = ? AND model = ?";
                                db.get(sql6, [cartRow.id, model], (err: Error | null, row: any) => {
                                    if(err) {
                                        reject(err); return;
                                    }
                                    // No instance of the product in the cart
                                    if(!row) {
                                        const sql7 = "INSERT INTO productsPerCart(idCart, model, quantity) VALUES(?,?,?)";
                                        db.run(sql7, [cartRow.id, model, 1], function(err) {
                                            if(err) {
                                                reject(err); return;
                                            }
                                            resolve(true);
                                        });
                                    } else { // Already an instance of the product to add in the cart
                                        const sql8 = "UPDATE productsPerCart SET quantity = quantity + 1 WHERE idCart = ? AND model = ?";
                                        db.run(sql8, [cartRow.id, model], function(err) {
                                            if(err) {
                                                reject(err); return;
                                            }
                                            resolve(true);
                                        }); 
                                    }
                                }); 
                            });
                        }
                    });
                });
            } catch(error) {
                reject(error);
            }
        });
    }

    /**
     * Simulate payment for the current cart of the logged in user.
     * @param username The username of the logged in user
     * @returns A Promise that resolves to `true` if the cart was successfully checked out.
     */
    payCurrentCart(username: string, date: string): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {
                const sql1 = "SELECT * FROM carts WHERE customer = ? AND paid = false";
                db.get(sql1, [username], (err: Error | null, cartRow: any) => {
                    if(err) {
                        reject(err); return;
                    }
                    // No information about an unpaid cart in the database
                    if(!cartRow) {
                        reject(new CartNotFoundError());
                        return;
                    } else {
                        // Unpaid cart, but it contains no products
                        const sql2 = "SELECT * FROM productsPerCart WHERE idCart = ?";
                        db.all(sql2, [cartRow.id], (err: Error | null, rows: any) => {
                            if(err) {
                                reject(err); return;
                            }
                            if(rows.length == 0) {
                                reject(new EmptyCartError());
                                return;
                            }
                            
                            const checkProductStock = rows.map((element: any) => {
                                return new Promise<void>((resolve, reject) => {
                                const sql3 = "SELECT products.quantity AS pq, productsPerCart.quantity AS pcq FROM products, productsPerCart " + 
                                "WHERE products.model = productsPerCart.model AND products.model = ? AND idCart = ?";
                                db.get(sql3, [element.model, cartRow.id], (err: Error | null, row: any) => {
                                    if(err) {
                                        reject(err); return;
                                    }
                                    // Available quantity in stock equal to 0
                                    if(row.pq === 0) {
                                        reject(new EmptyProductStockError())
                                        return;
                                    }
                                    // Available quantity in stock not sufficient
                                    if(row.pcq > row.pq) {
                                        reject(new LowProductStockError())
                                        return;
                                        }
                                    resolve();
                                    });
                                });
                            });

                            Promise.all(checkProductStock).then(() => {
                                const sql4 = "UPDATE carts SET paid = true, paymentDate = ? WHERE id = ?";
                                db.run(sql4, [date, cartRow.id], function(err: Error | null) {
                                    if(err) {
                                        reject(err); return;
                                    }
                                    // Update quantity of each product in stock (after cart checkout)
                                    const sql5 = "SELECT * FROM productsPerCart WHERE idCart = ?";
                                    db.all(sql5, [cartRow.id], (err: Error | null, rows: any) => {
                                        if(err) {
                                            reject(err); return;
                                        }
                                        const updateProductQuantityInStock = rows.map((element: any) => {
                                            return new Promise<void>((resolve, reject) => {
                                                const sql6 = "UPDATE products SET quantity = quantity - ? WHERE model = ?";
                                                db.run(sql6, [element.quantity, element.model], function(err) {
                                                    if(err) {
                                                        reject(err); return;
                                                    }
                                                    resolve();  // resolve inner Promise
                                                });
                                            });
                                        });
                                    });
                                    resolve(true);
                                })
                            }).catch(reject);
                        });
                    }
                });
            } catch(error) {
                reject(error);
            }
        });
    }

    /**
     * Return the history of the carts that have been paid by the current user (current cart not included)
     * @param username The username of the logged in user
     * @returns A Promise that resolves to an array of carts belonging to the customer.
     */
    getHistoryCart(username: string): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            try {
                const sqlCarts = "SELECT * FROM carts WHERE customer = ? AND paid = true";
                db.all(sqlCarts, [username], (err: Error | null, cartRows: any) => {
                    if(err) {
                        reject(err); return 
                    }
                        
                    // Initialize an empty array of carts
                    const carts: Cart[] = [];
                    let numCarts = cartRows.length;

                    if(numCarts === 0) {
                        resolve(carts);
                        return;
                    }

                    cartRows.map((cartRow: any) => {
                        const sql2 = "SELECT productsPerCart.model, category, productsPerCart.quantity, sellingPrice " +
                        "FROM productsPerCart, products WHERE idCart = ? AND productsPerCart.model = products.model";
                        db.all(sql2, [cartRow.id], (err: Error | null, productRows: any[]) => {
                            if (err) {
                                reject(err); return;
                            }

                            const productsInCart = productRows.map(productRow => new ProductInCart(
                                productRow.model, productRow.quantity, productRow.category, productRow.sellingPrice ));

                            const cart = new Cart(cartRow.customer, cartRow.paid ? true : false, cartRow.paymentDate, cartRow.total, productsInCart);

                            carts.push(cart);
                            numCarts--;

                            if (numCarts === 0) {
                                resolve(carts);
                            }
                        }); 
                    });
                });
            } catch(error) {
                reject(error);
            }
        });
    }

    /**
     * Remove an instance of a product from the current cart of the logged in user
     * @param username The username of the logged in user
     * @param model The model of the product to add
     * @returns A Promise that resolves to `true` if the product was successfully removed.
     */
    deleteProductFromCart(username: string, model: string): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {
                // Verify if there is an unpaid cart of the current logged in user
                const sql1 = "SELECT * FROM carts WHERE customer = ? AND paid = false";
                db.get(sql1, [username], (err: Error | null, cartRow: any) => {
                    if(err) {
                        reject(err); return;
                    }
                    if(!cartRow) {
                        reject(new CartNotFoundError());
                        return;
                    }

                    // Research the product, identified by the model, to delete from the current cart
                    const sql2 = "SELECT sellingPrice FROM products WHERE model = ?";
                    db.get(sql2, [model], (err: Error | null, productRow: any) => {
                        if(err) {
                            reject(err);
                            return;
                        }
                        // The model does not represent an existing product
                        if(!productRow) {
                            reject(new ProductNotFoundError());
                            return;
                        }
                        // Verify if the product, identified by the model, is contained in the current cart
                        const sql3 = "SELECT * FROM productsPerCart WHERE idCart = ? AND model = ?";
                        db.get(sql3, [cartRow.id, model], (err: Error | null, row: any) => {
                            if(err) {
                                reject(err); return;
                            }
                            if(!row) {
                                reject(new ProductNotInCartError);
                                return;
                            } else {    // product in cart
                                const sql4 = "UPDATE carts SET total = ? WHERE id = ?";
                                db.run(sql4, [cartRow.total - productRow.sellingPrice, cartRow.id], function(err) {
                                    if(err) {
                                        reject(err); return;
                                    }
                                    
                                    // if more than one instance in cart, reduce by 1
                                    if(row.quantity > 1) {
                                        const sql5 = "UPDATE productsPerCart SET quantity = quantity - 1 WHERE idCart = ? AND model = ?";
                                        db.run(sql5, [cartRow.id, model], function(err) {
                                            if(err) {
                                                reject(err); return;
                                            }
                                            resolve(true);
                                        });
                                    } else if(row.quantity === 1) {     // exctaly one instance
                                        const sql6 = "DELETE FROM productsPerCart WHERE idCart = ? AND model = ?";
                                        db.run(sql6, [cartRow.id, model], function(err) {
                                            if(err) {
                                                reject(err); return;
                                            }
                                            resolve(true);
                                        });
                                    }
                                })
                            }
                        });
                    });
                });
            } catch(error) {
                reject(error);
            }
        });
    }

    /**
     * Empty the current cart by deleting all of its products
     * @param username The username of the logged in user
     * @returns A Promise that resolves to `true` if the cart was successfully cleared
     */
    deleteCurrentCart(username: string): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {
                const sql1 = "SELECT * FROM carts WHERE customer = ? AND paid = false";
                db.get(sql1, [username], (err: Error | null, cartRow: any) => {
                    if(err) {
                        reject(err); return;
                    }
                    // No information about an unpaid cart in the database
                    if(!cartRow) {
                        reject(new CartNotFoundError());
                        return;
                    } else {    // An unpaid cart exists
                        const sql2 = "UPDATE carts SET total = 0 WHERE id = ?";
                        db.run(sql2, [cartRow.id], function(err) {
                            if(err) {
                                reject(err); return;
                            }
                            const sql3 = "DELETE FROM productsPerCart WHERE idCart = ?";
                            db.run(sql3, [cartRow.id], function(err) {
                                if(err) {
                                    reject(err); return;
                                }
                                resolve(true);
                            });
                        });
                    }
                });
            } catch(error) {
                reject(error);
            }
        });
    }

    /**
     * Delete all existing carts of all users, both current and past
     * @returns A Promise that resolves to `true` if all carts were successfully deleted
     */
    deleteAllCarts(): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            try {
                const sql1 = "DELETE FROM carts";
                db.run(sql1, [], function(err) {
                    if(err) {
                        reject(err); return;
                    }

                    const sql2 = "DELETE FROM productsPerCart";
                    db.run(sql2, [], function(err) {
                        if(err) {
                            reject(err); return;
                        }
                    resolve(true);
                    });
                });
            } catch(error) {
                reject(error);
            }
        });
    }

    /**
     * Returns all carts carts of all users, both current and past
     * @returns A Promise that resolves to an array of carts
     */
    getAllCarts(): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            try {
                const sql1 = "SELECT * FROM carts";
                db.all(sql1, [], (err: Error | null, cartRows: any) => {
                    if(err) {
                        reject(err); return 
                    }
                    
                    // Initialize an empty array of carts
                    const carts: Cart[] = [];
                    let numCarts = cartRows.length;

                    if(numCarts === 0) {
                        resolve(carts);
                        return;
                    }

                    cartRows.map((cartRow: any) => {
                        const sql2 = "SELECT productsPerCart.model, category, productsPerCart.quantity, sellingPrice " +
                        "FROM productsPerCart, products WHERE idCart = ? AND productsPerCart.model = products.model";
                        db.all(sql2, [cartRow.id], (err: Error | null, productRows: any[]) => {
                            if (err) {
                                reject(err); return;
                            }

                            const productsInCart = productRows.map(productRow => new ProductInCart(
                                productRow.model, productRow.quantity, productRow.category, productRow.sellingPrice ));

                            const cart = new Cart(cartRow.customer, cartRow.paid ? true : false, cartRow.paymentDate, cartRow.total, productsInCart);

                            carts.push(cart);
                            numCarts--;

                            if (numCarts === 0) {
                                resolve(carts);
                            }
                        }); 
                    });
                });
            } catch(error) {
                reject(error);
            }
        });
    }

}

export default CartDAO