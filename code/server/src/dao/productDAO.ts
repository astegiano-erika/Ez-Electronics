import {ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError} from "../errors/productError"
import db from "../db/db"
import {Product, Category} from "../components/product"
import {DateError} from "../utilities"
import CartDAO from "./cartDAO"
import ReviewDAO from "./reviewDAO"

/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {

    // insert a new product in the database
    registerProduct(model: string, category: string, sellingPrice: number, details: string | null, quantity: number, arrivalDate: string | null): Promise<boolean>{
        return new Promise<boolean>((resolve, reject)=>{
            try{
                if (model === "" || (category!==Category.SMARTPHONE && category!==Category.LAPTOP && category!==Category.APPLIANCE) || quantity<=0 || sellingPrice<=0) {
                    reject()
                    return;
                }
                let sql = "INSERT INTO products (sellingPrice, model, category, arrivalDate, details, quantity) VALUES(?, ?, ?, ?, ?, ?)";
                db.get("SELECT * FROM products WHERE model = ?", [model], (err: Error | null, row: any)=>{
                    if (err) {reject(err); return}
                    //model already existing
                    if (row!=null) {reject (new ProductAlreadyExistsError()); return}
                    db.run(sql, [sellingPrice, model, category, arrivalDate, details, quantity], (err: Error | null) => {
                        if (err) {reject (err); return}
                        resolve(true);
                    })
                })
            } catch (err){
                reject(err);
                return
            }
    })
    }

    //increase the quantity of a product, returns the new quantity, or -1 if there has been an error
    increaseQuantity(model: string, quantity: number, arrivalDate: string | null): Promise<number>{
        return new Promise<number>((resolve, reject)=>{
            try{
                let sql1 = "SELECT * FROM products WHERE model = ?";
                db.get(sql1, [model], (err: Error | null, row: any)=>{
                    if (err) {reject(err); return}

                    //product not existing
                    if(!row) {reject (new ProductNotFoundError()); return}
                    if(new Date(row.arrivalDate) > new Date(arrivalDate)){
                        reject(new DateError()); return}
                    let newQuantity = row.quantity+quantity;
                    let sql2 = "UPDATE products SET quantity = ? WHERE model = ?";
                    db.run(sql2, [newQuantity, model], (err: Error | null, row : any)=>{
                        if (err) {reject (err); return}
                        resolve (newQuantity);
                    })
                })
            } catch (err){
                reject(err);
                return
            }
        })
    }

    //sell a product, returns the new quantity, or -1 if there has been an error
    sellProduct(model: string, quantity: number, sellingDate: string): Promise<number>{
        return new Promise<number>((resolve, reject)=>{
            try{
                let sql1 = "SELECT * FROM products WHERE model = ?";
                db.get(sql1, [model], (err: Error | null, row: any)=>{
                    if (err) {reject(err); return}

                    //product not existing
                    if(!row) {reject (new ProductNotFoundError()); return}

                    //product quantity == 0
                    if (row.quantity==0) {reject (new EmptyProductStockError()); return}
                    let newQuantity = row.quantity-quantity;

                    //product quantity < purchase quantity
                    if (newQuantity<0) {reject (new LowProductStockError()); return}
                    if(new Date(row.arrivalDate) > new Date(sellingDate)){reject(new DateError()); return}
                    let sql2 = "UPDATE products SET quantity = ?  WHERE model = ?";
                    db.run(sql2, [newQuantity, model], (err: Error | null, row : any)=>{
                        if (err) {reject (err); return}
                        resolve (newQuantity);
                    })
                })
            } catch (err){
                reject(err);
                return
            }
        })
    }
    
    //get the list of products
    getProducts(): Promise<Product[]>{
        return new Promise<Product[]>((resolve, reject)=>{
            try{
                let sql = "SELECT * FROM products"
                db.all(sql, [], (err: Error | null, rows: any)=>{
                    if (err) {reject(err); return}
                    const products: Product[] = [];
                    rows.map(
                        (row: any) => products.push(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                    )
                    resolve(products);
                })
            }
            catch (err){
                reject(err);
                return
            }
        })
    }

    //get the list of available products
    getAvailableProducts(): Promise<Product[]>{
        return new Promise<Product[]>((resolve, reject)=>{
            try{
                let sql = "SELECT * FROM products WHERE quantity > 0"
                db.all(sql, [], (err: Error | null, rows: any)=>{
                    if (err) {reject(err); return}
                    const products: Product[] = [];
                      rows.map(
                          (row: any) => products.push(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                      )
                    resolve(products);
                })
            }
            catch (err){
                reject(err);
                return
            }
        })
    }

    //get the list of the products with the same category
    getProductsByCategory(category: string): Promise<Product[]>{
       return new Promise<Product[]>((resolve, reject)=>{
        try{
            if (category!= Category.APPLIANCE && category!= Category.LAPTOP && category!= Category.SMARTPHONE) {reject(); return}
            let sql = "SELECT * FROM products WHERE category = ?"
                db.all(sql, [category], (err: Error | null, rows: any)=>{
                    if (err) {reject(err); return}
                    const products = rows.map(
                        (row: any) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity)
                    )
                    resolve(products);
                })
        } catch (err){
            reject(err);
            return
        }
       })
    }

    //get the list of the available products with the same category
    getAvailableProductsByCategory(category: string): Promise<Product[]>{
        return new Promise<Product[]>((resolve, reject)=>{
         try{
             if (category!= Category.APPLIANCE && category!= Category.LAPTOP && category!= Category.SMARTPHONE) {reject(); return}
             let sql = "SELECT * FROM products WHERE category = ? AND quantity > 0"
                 db.all(sql, [category], (err: Error | null, rows: any)=>{
                     if (err) {reject(err); return}
                     const products: Product[] = [];
                      rows.map(
                          (row: any) => products.push(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                      )
                     resolve(products);
                 })
         } catch (err){
             reject(err); 
             return
         }
        })
     }

     //get the list of the products with the same model
    getProductsByModel(model: string): Promise<Product[]>{
        return new Promise<Product[]>((resolve, reject)=>{
         try{
             if (model == "") {reject(); return}
             let sql = "SELECT * FROM products WHERE model = ?"
                 db.all(sql, [model], (err: Error | null, rows: any)=>{
                     if (err) {reject(err); return}
                     
                     //no products with this model
                      if (rows.length===0) {reject(new ProductNotFoundError()); return}
                      const products: Product[] = [];
                      rows.map(
                          (row: any) => products.push(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                      )
                     resolve(products);
                 })
         } catch (err){
            reject(err); 
            return
         }
        })
     }

     //get the list of the available products with the same model
    getAvailableProductsByModel(model: string): Promise<Product[]>{
        return new Promise<Product[]>((resolve, reject)=>{
         try{
             if (model == "") {reject(); return}
            let sql = "SELECT * FROM products WHERE model = ?"
            db.all(sql , [model], (err: Error | null, rows: any)=>{
                if (err) {reject(err); return}
                if (rows.length==0) {reject(new ProductNotFoundError()); return}
                sql = "SELECT * FROM products WHERE model = ? AND quantity > 0"
                 db.all(sql, [model], (err: Error | null, rows: any)=>{
                     if (err) {reject(err); return}      
                      const products: Product[] = [];
                      rows.map(
                          (row: any) => products.push(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                      )
                     resolve(products);
                 })
            })
         } catch (err){
             reject(err); 
             return
         }
        })
     }

     //delete the product with the specified model
     deleteProduct(model: string): Promise<boolean>{
        return new Promise<boolean>((resolve, reject)=>{
            try{
                let sql = "SELECT * FROM products WHERE model = ?"
                db.get(sql, [model], (err: Error | any, row: any)=>{
                    if (err) {reject (err); return}
                    //not existing product
                    if (!row){
                        reject(new ProductNotFoundError());
                        return
                    }
                    sql = "DELETE FROM products WHERE model = ?"
                    db.run(sql, [model], (err: Error | any)=>{
                        if (err) {reject (err); return}
                        sql = "DELETE FROM productsPerCart WHERE model = ?"
                        db.run(sql, [model], (err: Error | any)=>{
                            if (err){reject(err); return}
                            sql = "DELETE FROM reviews WHERE model = ?"
                            db.run(sql, [model], (err: Error | any)=>{
                                if (err){reject(err); return}
                                resolve(true);
                            })
                        })
                })
                })
            }catch (err){
                reject(err);
                return
            }
        })
     }

     //delete all products
     deleteProducts(): Promise<boolean>{
        return new Promise<boolean>((resolve, reject)=>{
            try{
                let sql = "DELETE FROM products"
                db.run(sql, [], (err: Error | any)=>{
                    if (err) {reject (err); return}
                    sql = "DELETE from reviews"
                    db.run(sql, [], (err: Error | any)=>{
                        if (err) {reject (err); return}
                        sql = "DELETE from productsPerCart"
                        db.run(sql, [], (err: Error | any)=>{
                            if (err) {reject (err); return}
                            resolve(true);
                    })
                    })
                    resolve(true);
                })
            }catch(err){
                reject (err);
                return
            }
        })
     }




}

export default ProductDAO